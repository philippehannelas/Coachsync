from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, Booking, CoachProfile, CustomerProfile, User, Availability
from src.routes.auth import token_required
import jwt
from datetime import datetime, timedelta
import functools

booking_bp = Blueprint('booking', __name__)

def coach_required(f):
    @functools.wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'coach':
            return jsonify({'message': 'Coach access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def customer_required(f):
    @functools.wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'customer':
            return jsonify({'message': 'Customer access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@booking_bp.route('/coach/bookings', methods=['GET'])
@token_required
@coach_required
def get_coach_bookings(current_user):
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # Get query parameters for filtering
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status')
        event_type = request.args.get('event_type')  # NEW: Filter by event type
        
        query = Booking.query.filter_by(coach_id=coach_profile.id)
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Booking.start_time >= start_dt)
            except ValueError:
                return jsonify({'message': 'Invalid start_date format'}), 400
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Booking.end_time <= end_dt)
            except ValueError:
                return jsonify({'message': 'Invalid end_date format'}), 400
        
        if status:
            query = query.filter(Booking.status == status)
        
        if event_type:
            query = query.filter(Booking.event_type == event_type)
        
        bookings = query.order_by(Booking.start_time).all()
        
        # Enhance bookings with customer information
        enhanced_bookings = []
        for booking in bookings:
            booking_dict = booking.to_dict()
            
            # Only add customer info for customer sessions
            if booking.event_type == 'customer_session' and booking.customer_id:
                customer_profile = CustomerProfile.query.get(booking.customer_id)
                if customer_profile:
                    customer_user = User.query.get(customer_profile.user_id)
                    if customer_user:
                        booking_dict['customer'] = {
                            'name': f"{customer_user.first_name} {customer_user.last_name}",
                            'email': customer_user.email,
                            'phone': customer_user.phone
                        }
            
            enhanced_bookings.append(booking_dict)
        
        return jsonify(enhanced_bookings), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching bookings: {str(e)}'}), 500

@booking_bp.route('/coach/bookings', methods=['POST'])
@token_required
@coach_required
def create_booking_as_coach(current_user):
    try:
        data = request.json
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # Get event type (default to customer_session for backward compatibility)
        event_type = data.get('event_type', 'customer_session')
        
        # Validate required fields based on event type
        required_fields = ['start_time', 'end_time']
        
        if event_type == 'customer_session':
            required_fields.append('customer_id')
        elif event_type == 'personal_event':
            required_fields.append('event_title')
        
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate customer for customer sessions
        customer_id = None
        if event_type == 'customer_session':
            customer_profile = CustomerProfile.query.filter_by(
                id=data['customer_id'],
                coach_id=coach_profile.id
            ).first()
            
            if not customer_profile:
                return jsonify({'message': 'Customer not found or not assigned to you'}), 404
            
            customer_id = data['customer_id']
        
        # Parse datetime strings
        try:
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'message': 'Invalid datetime format'}), 400
        
        if start_time >= end_time:
            return jsonify({'message': 'Start time must be before end time'}), 400
        
        if start_time < datetime.utcnow():
            return jsonify({'message': 'Cannot book sessions in the past'}), 400
        
        # Validate customer sessions fall within coach's availability
        if event_type == 'customer_session':
            day_of_week = start_time.weekday()  # 0=Monday, 6=Sunday
            start_time_only = start_time.time()
            end_time_only = end_time.time()
            
            # Get coach's availability for this day
            coach_availability = Availability.query.filter_by(
                coach_id=coach_profile.id,
                day_of_week=day_of_week
            ).all()
            
            if not coach_availability:
                return jsonify({'message': 'No availability set for this day. Please set your availability first.'}), 400
            
            # Check if booking falls within any availability slot
            is_within_availability = False
            for slot in coach_availability:
                slot_start = datetime.strptime(slot.start_time, '%H:%M').time()
                slot_end = datetime.strptime(slot.end_time, '%H:%M').time()
                
                # Booking must start and end within the same availability slot
                if slot_start <= start_time_only and end_time_only <= slot_end:
                    is_within_availability = True
                    break
            
            if not is_within_availability:
                return jsonify({'message': 'Selected time is outside your availability hours'}), 400
        
        # Check for conflicts
        conflict = Booking.query.filter_by(coach_id=coach_profile.id).filter(
            Booking.status.in_(['confirmed', 'pending']),
            ((Booking.start_time <= start_time) & (Booking.end_time > start_time)) |
            ((Booking.start_time < end_time) & (Booking.end_time >= end_time)) |
            ((Booking.start_time >= start_time) & (Booking.end_time <= end_time))
        ).first()
        
        if conflict:
            return jsonify({'message': 'Time slot conflicts with existing booking'}), 400
        
        # Handle recurring events
        is_recurring = data.get('is_recurring', False)
        created_bookings = []
        
        if is_recurring and event_type == 'personal_event':
            # Create recurring instances
            recurring_days = data.get('recurring_days', [])
            recurring_end_date_str = data.get('recurring_end_date')
            
            if not recurring_days:
                return jsonify({'message': 'recurring_days is required for recurring events'}), 400
            
            if not recurring_end_date_str:
                return jsonify({'message': 'recurring_end_date is required for recurring events'}), 400
            
            try:
                recurring_end_date = datetime.fromisoformat(recurring_end_date_str.replace('Z', '+00:00')).date()
            except ValueError:
                return jsonify({'message': 'Invalid recurring_end_date format'}), 400
            
            # Create parent event (first occurrence)
            parent_booking = Booking(
                customer_id=None,
                coach_id=coach_profile.id,
                start_time=start_time,
                end_time=end_time,
                status=data.get('status', 'confirmed'),
                event_type=event_type,
                event_title=data.get('event_title'),
                is_recurring=True,
                recurring_days=recurring_days,
                recurring_end_date=recurring_end_date,
                parent_event_id=None,
                notes=data.get('notes')
            )
            
            db.session.add(parent_booking)
            db.session.flush()  # Get the ID
            
            created_bookings.append(parent_booking)
            
            # Create recurring instances
            current_date = start_time.date() + timedelta(days=1)
            duration = end_time - start_time
            
            while current_date <= recurring_end_date:
                # Check if this day is in recurring_days (0=Monday, 6=Sunday)
                day_of_week = (current_date.weekday()) % 7  # Convert to 0=Monday
                
                if day_of_week in recurring_days:
                    instance_start = datetime.combine(current_date, start_time.time())
                    instance_end = instance_start + duration
                    
                    # Check for conflicts
                    conflict = Booking.query.filter_by(coach_id=coach_profile.id).filter(
                        Booking.status.in_(['confirmed', 'pending']),
                        ((Booking.start_time <= instance_start) & (Booking.end_time > instance_start)) |
                        ((Booking.start_time < instance_end) & (Booking.end_time >= instance_end)) |
                        ((Booking.start_time >= instance_start) & (Booking.end_time <= instance_end))
                    ).first()
                    
                    if not conflict:
                        instance_booking = Booking(
                            customer_id=None,
                            coach_id=coach_profile.id,
                            start_time=instance_start,
                            end_time=instance_end,
                            status=data.get('status', 'confirmed'),
                            event_type=event_type,
                            event_title=data.get('event_title'),
                            is_recurring=True,
                            recurring_days=recurring_days,
                            recurring_end_date=recurring_end_date,
                            parent_event_id=parent_booking.id,
                            notes=data.get('notes')
                        )
                        db.session.add(instance_booking)
                        created_bookings.append(instance_booking)
                
                current_date += timedelta(days=1)
            
            db.session.commit()
            
            return jsonify({
                'message': f'Recurring event created successfully. {len(created_bookings)} instances created.',
                'booking': parent_booking.to_dict(),
                'instances_created': len(created_bookings)
            }), 201
            
        else:
            # Create single booking
            booking = Booking(
                customer_id=customer_id,
                coach_id=coach_profile.id,
                start_time=start_time,
                end_time=end_time,
                status=data.get('status', 'confirmed'),
                event_type=event_type,
                event_title=data.get('event_title'),
                is_recurring=False,
                notes=data.get('notes')
            )
            
            # Deduct credit for customer sessions
            if event_type == 'customer_session' and customer_id:
                customer_profile = CustomerProfile.query.get(customer_id)
                if customer_profile:
                    if customer_profile.session_credits <= 0:
                        return jsonify({'message': 'Customer has insufficient session credits'}), 400
                    customer_profile.session_credits -= 1
            
            db.session.add(booking)
            db.session.commit()
            
            response_data = {
                'message': 'Booking created successfully',
                'booking': booking.to_dict()
            }
            
            # Include remaining credits for customer sessions
            if event_type == 'customer_session' and customer_id:
                customer_profile = CustomerProfile.query.get(customer_id)
                if customer_profile:
                    response_data['remaining_credits'] = customer_profile.session_credits
            
            return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating booking: {str(e)}'}), 500

@booking_bp.route('/coach/bookings/<booking_id>', methods=['PUT'])
@token_required
@coach_required
def update_booking_as_coach(current_user, booking_id):
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        booking = Booking.query.filter_by(
            id=booking_id,
            coach_id=coach_profile.id
        ).first()
        
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        data = request.json
        
        # Update status
        if 'status' in data:
            if data['status'] not in ['confirmed', 'pending', 'cancelled']:
                return jsonify({'message': 'Invalid status'}), 400
            
            # Refund credit if cancelling a customer session
            if data['status'] == 'cancelled' and booking.status != 'cancelled':
                if booking.event_type == 'customer_session' and booking.customer_id:
                    customer_profile = CustomerProfile.query.get(booking.customer_id)
                    if customer_profile:
                        customer_profile.session_credits += 1
            
            booking.status = data['status']
        
        # Update notes
        if 'notes' in data:
            booking.notes = data['notes']
        
        # Update event title for personal events
        if 'event_title' in data and booking.event_type == 'personal_event':
            booking.event_title = data['event_title']
        
        # Update times if provided
        if 'start_time' in data:
            try:
                booking.start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'message': 'Invalid start_time format'}), 400
        
        if 'end_time' in data:
            try:
                booking.end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'message': 'Invalid end_time format'}), 400
        
        # Validate time order
        if booking.start_time >= booking.end_time:
            return jsonify({'message': 'Start time must be before end time'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking updated successfully',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating booking: {str(e)}'}), 500

@booking_bp.route('/coach/bookings/<booking_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_booking_as_coach(current_user, booking_id):
    """Delete a booking or recurring event series"""
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        booking = Booking.query.filter_by(
            id=booking_id,
            coach_id=coach_profile.id
        ).first()
        
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        # Refund credit if deleting a customer session that's not already cancelled
        if booking.event_type == 'customer_session' and booking.customer_id and booking.status != 'cancelled':
            customer_profile = CustomerProfile.query.get(booking.customer_id)
            if customer_profile:
                customer_profile.session_credits += 1
        
        # Check if this is a recurring event
        if booking.is_recurring and booking.parent_event_id is None:
            # This is the parent - delete all instances
            Booking.query.filter_by(parent_event_id=booking.id).delete()
            db.session.delete(booking)
            db.session.commit()
            return jsonify({'message': 'Recurring event series deleted successfully'}), 200
        else:
            # Single booking or instance
            db.session.delete(booking)
            db.session.commit()
            return jsonify({'message': 'Booking deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting booking: {str(e)}'}), 500

# Customer endpoints remain the same...
@booking_bp.route('/customer/bookings', methods=['GET'])
@token_required
@customer_required
def get_customer_bookings(current_user):
    try:
        customer_profile = CustomerProfile.query.filter_by(user_id=current_user.id).first()
        if not customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        # Only show customer sessions, not coach's personal events
        bookings = Booking.query.filter_by(
            customer_id=customer_profile.id,
            event_type='customer_session'
        ).order_by(Booking.start_time.desc()).all()
        
        return jsonify([booking.to_dict() for booking in bookings]), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching bookings: {str(e)}'}), 500

@booking_bp.route('/customer/bookings', methods=['POST'])
@token_required
@customer_required
def create_booking_as_customer(current_user):
    try:
        data = request.json
        customer_profile = CustomerProfile.query.filter_by(user_id=current_user.id).first()
        
        if not customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        if not customer_profile.is_active:
            return jsonify({'message': 'Your account is not active. Contact your coach.'}), 403
        
        if customer_profile.session_credits <= 0:
            return jsonify({'message': 'Insufficient session credits'}), 400
        
        if not customer_profile.coach_id:
            return jsonify({'message': 'No coach assigned'}), 400
        
        # Validate required fields
        required_fields = ['start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Parse datetime strings
        try:
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'message': 'Invalid datetime format'}), 400
        
        if start_time >= end_time:
            return jsonify({'message': 'Start time must be before end time'}), 400
        
        if start_time < datetime.utcnow():
            return jsonify({'message': 'Cannot book sessions in the past'}), 400
        
        # Validate that booking falls within coach's availability
        day_of_week = start_time.weekday()  # 0=Monday, 6=Sunday
        start_time_only = start_time.time()
        end_time_only = end_time.time()
        
        print(f"\n=== AVAILABILITY VALIDATION ===")
        print(f"Booking request: {start_time} to {end_time}")
        print(f"Day of week: {day_of_week} (0=Mon, 4=Fri)")
        print(f"Start time only: {start_time_only}")
        print(f"End time only: {end_time_only}")
        
        # Get coach's availability for this day
        coach_availability = Availability.query.filter_by(
            coach_id=customer_profile.coach_id,
            day_of_week=day_of_week
        ).all()
        
        print(f"Found {len(coach_availability)} availability slots for day {day_of_week}")
        
        if not coach_availability:
            print("No availability found - REJECTING")
            return jsonify({'message': 'Coach is not available on this day'}), 400
        
        # Check if booking falls within any availability slot
        is_within_availability = False
        for slot in coach_availability:
            slot_start = datetime.strptime(slot.start_time, '%H:%M').time()
            slot_end = datetime.strptime(slot.end_time, '%H:%M').time()
            
            print(f"Checking slot: {slot_start} - {slot_end}")
            print(f"  Start check: {slot_start} <= {start_time_only} = {slot_start <= start_time_only}")
            print(f"  End check: {end_time_only} <= {slot_end} = {end_time_only <= slot_end}")
            
            # Booking must start and end within the same availability slot
            if slot_start <= start_time_only and end_time_only <= slot_end:
                print(f"  ✅ FITS IN THIS SLOT")
                is_within_availability = True
                break
            else:
                print(f"  ❌ Does not fit")
        
        if not is_within_availability:
            print("No matching slot found - REJECTING")
            return jsonify({'message': 'Selected time is outside coach availability hours'}), 400
        
        print("Validation passed - ALLOWING booking")
        print("=== END VALIDATION ===\n")
        
        # Check for conflicts with coach's schedule (including personal events)
        conflict = Booking.query.filter_by(coach_id=customer_profile.coach_id).filter(
            Booking.status.in_(['confirmed', 'pending']),
            ((Booking.start_time <= start_time) & (Booking.end_time > start_time)) |
            ((Booking.start_time < end_time) & (Booking.end_time >= end_time)) |
            ((Booking.start_time >= start_time) & (Booking.end_time <= end_time))
        ).first()
        
        if conflict:
            return jsonify({'message': 'Time slot is not available'}), 400
        
        booking = Booking(
            customer_id=customer_profile.id,
            coach_id=customer_profile.coach_id,
            start_time=start_time,
            end_time=end_time,
            status='confirmed',
            event_type='customer_session'  # Always customer_session for customer bookings
        )
        
        # Deduct session credit
        customer_profile.session_credits -= 1
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'message': 'Booking created successfully',
            'booking': booking.to_dict(),
            'remaining_credits': customer_profile.session_credits
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating booking: {str(e)}'}), 500

@booking_bp.route('/customer/bookings/<booking_id>', methods=['PUT'])
@token_required
@customer_required
def update_booking_as_customer(current_user, booking_id):
    try:
        customer_profile = CustomerProfile.query.filter_by(user_id=current_user.id).first()
        if not customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        booking = Booking.query.filter_by(
            id=booking_id,
            customer_id=customer_profile.id
        ).first()
        
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        data = request.json
        
        # Customers can only cancel their bookings or request changes
        if 'status' in data:
            if data['status'] == 'cancelled':
                booking.status = 'cancelled'
                # Refund session credit if cancelled more than 24 hours in advance
                if booking.start_time > datetime.utcnow() + timedelta(hours=24):
                    customer_profile.session_credits += 1
            else:
                return jsonify({'message': 'Customers can only cancel bookings'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking updated successfully',
            'booking': booking.to_dict(),
            'remaining_credits': customer_profile.session_credits
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating booking: {str(e)}'}), 500

