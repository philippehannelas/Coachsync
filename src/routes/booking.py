from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, Booking, CoachProfile, CustomerProfile, User
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
        
        bookings = query.order_by(Booking.start_time).all()
        
        # Enhance bookings with customer information
        enhanced_bookings = []
        for booking in bookings:
            booking_dict = booking.to_dict()
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
        
        # Validate required fields
        required_fields = ['customer_id', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate customer exists and belongs to this coach
        customer_profile = CustomerProfile.query.filter_by(
            id=data['customer_id'],
            coach_id=coach_profile.id
        ).first()
        
        if not customer_profile:
            return jsonify({'message': 'Customer not found or not assigned to you'}), 404
        
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
        
        # Check for conflicts
        conflict = Booking.query.filter_by(coach_id=coach_profile.id).filter(
            Booking.status.in_(['confirmed', 'pending']),
            ((Booking.start_time <= start_time) & (Booking.end_time > start_time)) |
            ((Booking.start_time < end_time) & (Booking.end_time >= end_time)) |
            ((Booking.start_time >= start_time) & (Booking.end_time <= end_time))
        ).first()
        
        if conflict:
            return jsonify({'message': 'Time slot conflicts with existing booking'}), 400
        
        booking = Booking(
            customer_id=data['customer_id'],
            coach_id=coach_profile.id,
            start_time=start_time,
            end_time=end_time,
            status=data.get('status', 'confirmed')
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'message': 'Booking created successfully',
            'booking': booking.to_dict()
        }), 201
        
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
            booking.status = data['status']
        
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

@booking_bp.route('/customer/bookings', methods=['GET'])
@token_required
@customer_required
def get_customer_bookings(current_user):
    try:
        customer_profile = CustomerProfile.query.filter_by(user_id=current_user.id).first()
        if not customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        bookings = Booking.query.filter_by(
            customer_id=customer_profile.id
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
        
        # Check for conflicts with coach's schedule
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
            status='confirmed'  # Auto-confirm for customers with credits
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

