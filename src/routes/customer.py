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
# Add this to src/routes/customer.py

@customer_bp.route('/coach-branding', methods=['GET'])
@token_required
@customer_required
def get_coach_branding(current_user):
    """Get the coach's branding settings for display on customer dashboard"""
    try:
        if not current_user.customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        coach_profile = current_user.customer_profile.coach
        if not coach_profile:
            return jsonify({'message': 'No coach assigned'}), 404
        
        branding = {
            'logo_url': coach_profile.logo_url,
            'profile_photo_url': coach_profile.profile_photo_url,
            'business_name': coach_profile.business_name,
            'motto': coach_profile.motto,
            'description': coach_profile.description,
            'brand_color_primary': coach_profile.brand_color_primary or '#8B5CF6'
        }
        
        return jsonify(branding), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get coach branding: {str(e)}'}), 500



@customer_bp.route('/profile', methods=['PUT'])
@token_required
@customer_required
def update_customer_profile(current_user):
    """Update customer profile information"""
    try:
        data = request.json
        
        if not current_user.customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        # Update user fields (email, phone, name)
        if 'email' in data:
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != current_user.id:
                return jsonify({'message': 'Email already in use'}), 400
            current_user.email = data['email']
        
        if 'phone' in data:
            current_user.phone = data['phone']
        
        if 'first_name' in data:
            current_user.first_name = data['first_name']
        
        if 'last_name' in data:
            current_user.last_name = data['last_name']
        
        # Update customer profile fields if needed
        customer_profile = current_user.customer_profile
        if 'emergency_contact' in data:
            customer_profile.emergency_contact = data['emergency_contact']
        
        if 'medical_notes' in data:
            customer_profile.medical_notes = data['medical_notes']
        
        db.session.commit()
        
        # Return updated profile
        profile_data = customer_profile.to_dict()
        if customer_profile.coach:
            coach_data = customer_profile.coach.to_dict()
            coach_data['user'] = customer_profile.coach.user.to_dict()
            profile_data['coach'] = coach_data
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': profile_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update profile: {str(e)}'}), 500


@customer_bp.route('/change-password', methods=['POST'])
@token_required
@customer_required
def change_password(current_user):
    """Change customer password"""
    try:
        data = request.json
        
        # Validate required fields
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({'message': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not current_user.check_password(data['current_password']):
            return jsonify({'message': 'Current password is incorrect'}), 401
        
        # Validate new password strength
        new_password = data['new_password']
        if len(new_password) < 8:
            return jsonify({'message': 'New password must be at least 8 characters long'}), 400
        
        # Update password
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to change password: {str(e)}'}), 500
