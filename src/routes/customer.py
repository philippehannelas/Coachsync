from flask import Blueprint, jsonify, request
from src.models.user import User, CoachProfile, CustomerProfile, TrainingPlan, Booking, Availability, db
from src.routes.auth import token_required
from datetime import datetime
from functools import wraps

customer_bp = Blueprint('customer', __name__)

def customer_required(f):
    @wraps(f)
    def customer_decorated(current_user, *args, **kwargs):
        if current_user.role != 'customer':
            return jsonify({'message': 'Customer access required'}), 403
        return f(current_user, *args, **kwargs)
    return customer_decorated

@customer_bp.route('/profile', methods=['GET'])
@token_required
@customer_required
def get_customer_profile(current_user):
    try:
        if not current_user.customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        profile_data = current_user.customer_profile.to_dict()
        
        # Add coach information if assigned
        if current_user.customer_profile.coach:
            coach_data = current_user.customer_profile.coach.to_dict()
            coach_data['user'] = current_user.customer_profile.coach.user.to_dict()
            profile_data['coach'] = coach_data
        
        return jsonify(profile_data), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get customer profile: {str(e)}'}), 500

# Training plans endpoints have been moved to training_plan.py
# These old endpoints are removed to avoid conflicts

@customer_bp.route('/bookings', methods=['GET'])
@token_required
@customer_required
def get_bookings(current_user):
    try:
        if not current_user.customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        bookings = current_user.customer_profile.bookings.all()
        bookings_data = []
        
        for booking in bookings:
            booking_data = booking.to_dict()
            # Add coach information
            coach = CoachProfile.query.get(booking.coach_id)
            if coach:
                booking_data['coach'] = {
                    'id': coach.id,
                    'name': f"{coach.user.first_name} {coach.user.last_name}"
                }
            bookings_data.append(booking_data)
        
        return jsonify(bookings_data), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get bookings: {str(e)}'}), 500

@customer_bp.route('/bookings', methods=['POST'])
@token_required
@customer_required
def create_booking(current_user):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        customer_profile = current_user.customer_profile
        if not customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        # Check if customer has a coach assigned
        if not customer_profile.coach_id:
            return jsonify({'message': 'No coach assigned'}), 400
        
        # Check if customer is active
        if not customer_profile.is_active:
            return jsonify({'message': 'Account access has been revoked'}), 403
        
        # Check if customer has enough credits
        if customer_profile.session_credits <= 0:
            return jsonify({'message': 'Insufficient session credits'}), 400
        
        # Parse datetime strings
        try:
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'message': 'Invalid datetime format'}), 400
        
        # Validate that booking falls within coach's availability
        day_of_week = start_time.weekday()  # 0=Monday, 6=Sunday
        start_time_only = start_time.time()
        end_time_only = end_time.time()
        
        # Get coach's availability for this day
        coach_availability = Availability.query.filter_by(
            coach_id=customer_profile.coach_id,
            day_of_week=day_of_week
        ).all()
        
        if not coach_availability:
            return jsonify({'message': 'Coach is not available on this day'}), 400
        
        # Check if booking falls within any availability slot
        is_within_availability = False
        for slot in coach_availability:
            # Handle both string and time object formats
            if isinstance(slot.start_time, str):
                slot_start = datetime.strptime(slot.start_time, '%H:%M').time()
                slot_end = datetime.strptime(slot.end_time, '%H:%M').time()
            else:
                slot_start = slot.start_time
                slot_end = slot.end_time
            
            # Booking must start and end within the same availability slot
            if slot_start <= start_time_only and end_time_only <= slot_end:
                is_within_availability = True
                break
        
        if not is_within_availability:
            return jsonify({'message': 'Selected time is outside coach availability hours'}), 400
        
        # Check for conflicting bookings
        conflicting_booking = Booking.query.filter(
            Booking.coach_id == customer_profile.coach_id,
            Booking.status.in_(['confirmed', 'pending']),
            Booking.start_time < end_time,
            Booking.end_time > start_time
        ).first()
        
        if conflicting_booking:
            return jsonify({'message': 'Time slot is not available'}), 409
        
        # Create booking
        booking = Booking(
            customer_id=customer_profile.id,
            coach_id=customer_profile.coach_id,
            start_time=start_time,
            end_time=end_time,
            status='confirmed'
        )
        
        # Deduct session credit
        customer_profile.session_credits -= 1
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify(booking.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create booking: {str(e)}'}), 500

@customer_bp.route('/bookings/<booking_id>', methods=['PUT'])
@token_required
@customer_required
def update_booking(current_user, booking_id):
    try:
        data = request.json
        
        booking = Booking.query.filter_by(
            id=booking_id,
            customer_id=current_user.customer_profile.id
        ).first()
        
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        # Only allow updates to pending or confirmed bookings
        if booking.status == 'cancelled':
            return jsonify({'message': 'Cannot modify cancelled booking'}), 400
        
        # Handle cancellation
        if data.get('status') == 'cancelled':
            booking.status = 'cancelled'
            # Refund session credit
            current_user.customer_profile.session_credits += 1
            db.session.commit()
            return jsonify(booking.to_dict()), 200
        
        # Handle time changes
        if 'start_time' in data or 'end_time' in data:
            try:
                start_time = datetime.fromisoformat(data.get('start_time', booking.start_time.isoformat()).replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(data.get('end_time', booking.end_time.isoformat()).replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'message': 'Invalid datetime format'}), 400
            
            # Check for conflicts (excluding current booking)
            conflicting_booking = Booking.query.filter(
                Booking.coach_id == booking.coach_id,
                Booking.id != booking.id,
                Booking.status.in_(['confirmed', 'pending']),
                Booking.start_time < end_time,
                Booking.end_time > start_time
            ).first()
            
            if conflicting_booking:
                return jsonify({'message': 'Time slot is not available'}), 409
            
            booking.start_time = start_time
            booking.end_time = end_time
            booking.status = 'pending'  # Require coach approval for changes
        
        db.session.commit()
        return jsonify(booking.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update booking: {str(e)}'}), 500

@customer_bp.route('/coach/availability', methods=['GET'])
@token_required
@customer_required
def get_coach_availability(current_user):
    try:
        customer_profile = current_user.customer_profile
        if not customer_profile or not customer_profile.coach_id:
            return jsonify({'message': 'No coach assigned'}), 400
        
        # Get query parameters for date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'message': 'start_date and end_date parameters are required'}), 400
        
        try:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
        except ValueError:
            return jsonify({'message': 'Invalid date format'}), 400
        
        # Get coach's recurring availability schedule
        availability_slots = Availability.query.filter_by(
            coach_id=customer_profile.coach_id
        ).all()
        
        # Get existing bookings for the coach in the date range
        bookings = Booking.query.filter(
            Booking.coach_id == customer_profile.coach_id,
            Booking.status.in_(['confirmed', 'pending']),
            Booking.start_time >= start_dt,
            Booking.end_time <= end_dt
        ).all()
        
        availability_data = [slot.to_dict() for slot in availability_slots]
        booked_slots = [booking.to_dict() for booking in bookings]
        
        return jsonify({
            'coach_id': customer_profile.coach_id,
            'start_date': start_date,
            'end_date': end_date,
            'availability': availability_data,
            'booked_slots': booked_slots
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get availability: {str(e)}'}), 500



# ========================================
# SESSION NOTES ENDPOINTS (Customer View)
# ========================================

@customer_bp.route('/bookings/<booking_id>/session-notes', methods=['GET'])
@token_required
@customer_required
def get_customer_session_notes(current_user, booking_id):
    """
    Get session notes for a specific booking (customer view - excludes private coach notes)
    """
    try:
        booking = Booking.query.filter_by(
            id=booking_id,
            customer_id=current_user.customer_profile.id
        ).first()
        
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        # Return booking without coach's private notes
        return jsonify(booking.to_dict(include_coach_notes=False)), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get session notes: {str(e)}'}), 500


@customer_bp.route('/bookings/<booking_id>/customer-notes', methods=['PUT'])
@token_required
@customer_required
def update_customer_notes(current_user, booking_id):
    """
    Customer adds their own reflections/notes to a session
    """
    try:
        data = request.json
        
        booking = Booking.query.filter_by(
            id=booking_id,
            customer_id=current_user.customer_profile.id
        ).first()
        
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        # Update customer notes
        booking.customer_notes = data.get('customer_notes')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Notes updated successfully',
            'booking': booking.to_dict(include_coach_notes=False)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update notes: {str(e)}'}), 500


@customer_bp.route('/bookings/<booking_id>/action-items', methods=['PUT'])
@token_required
@customer_required
def update_action_items(current_user, booking_id):
    """
    Customer updates action items (marks as complete/incomplete)
    """
    try:
        data = request.json
        
        booking = Booking.query.filter_by(
            id=booking_id,
            customer_id=current_user.customer_profile.id
        ).first()
        
        if not booking:
            return jsonify({'message': 'Booking not found'}), 404
        
        # Update action items
        booking.action_items = data.get('action_items', [])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Action items updated successfully',
            'booking': booking.to_dict(include_coach_notes=False)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update action items: {str(e)}'}), 500

