from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, Availability, CoachProfile
from src.routes.auth import token_required
import jwt
from datetime import datetime, time
import functools

availability_bp = Blueprint('availability', __name__)

def coach_required(f):
    @functools.wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'coach':
            return jsonify({'message': 'Coach access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@availability_bp.route('/coach/availability', methods=['GET'])
@token_required
@coach_required
def get_coach_availability(current_user):
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        availability_slots = Availability.query.filter_by(
            coach_id=coach_profile.id,
            is_active=True
        ).order_by(Availability.day_of_week, Availability.start_time).all()
        
        return jsonify([slot.to_dict() for slot in availability_slots]), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching availability: {str(e)}'}), 500

@availability_bp.route('/coach/availability', methods=['POST'])
@token_required
@coach_required
def create_availability(current_user):
    try:
        data = request.json
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # ✅ FIX: Check if data is an array or single object
        if not isinstance(data, list):
            data = [data]  # Convert single object to array for uniform processing
        
        # Delete existing availability for this coach (replace all slots)
        Availability.query.filter_by(coach_id=coach_profile.id).delete()
        
        # Create new availability slots
        created_slots = []
        for slot in data:
            # Validate required fields
            required_fields = ['day_of_week', 'start_time', 'end_time']
            for field in required_fields:
                if field not in slot:
                    return jsonify({'message': f'{field} is required'}), 400
            
            # ✅ FIX v3: Handle day_of_week - accept numbers, string numbers, or day names
            day_of_week = slot['day_of_week']
            
            # Day name mapping
            day_map = {
                'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
                'Friday': 4, 'Saturday': 5, 'Sunday': 6
            }
            
            # Try to convert to integer first (handles both int and string numbers like "0", "1", etc.)
            try:
                day_of_week = int(day_of_week)
            except (ValueError, TypeError):
                # If conversion fails, check if it's a day name
                if isinstance(day_of_week, str) and day_of_week in day_map:
                    day_of_week = day_map[day_of_week]
                else:
                    return jsonify({
                        'message': f'Invalid day_of_week: {slot["day_of_week"]}. Must be 0-6 or day name (Monday-Sunday)'
                    }), 400
            
            # Validate range
            if not (0 <= day_of_week <= 6):
                return jsonify({
                    'message': f'day_of_week must be between 0 (Monday) and 6 (Sunday), got {day_of_week}'
                }), 400
            
            # Parse time strings
            try:
                start_time = datetime.strptime(slot['start_time'], '%H:%M').time()
                end_time = datetime.strptime(slot['end_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'message': 'Invalid time format. Use HH:MM'}), 400
            
            if start_time >= end_time:
                return jsonify({'message': 'Start time must be before end time'}), 400
            
            # Create availability slot
            availability = Availability(
                coach_id=coach_profile.id,
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time
            )
            
            db.session.add(availability)
            created_slots.append(availability)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Availability created successfully',
            'slots': [slot.to_dict() for slot in created_slots]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating availability: {str(e)}'}), 500

@availability_bp.route('/coach/availability/<availability_id>', methods=['PUT'])
@token_required
@coach_required
def update_availability(current_user, availability_id):
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        availability = Availability.query.filter_by(
            id=availability_id,
            coach_id=coach_profile.id
        ).first()
        
        if not availability:
            return jsonify({'message': 'Availability slot not found'}), 404
        
        data = request.json
        
        # Update fields if provided
        if 'day_of_week' in data:
            if not (0 <= data['day_of_week'] <= 6):
                return jsonify({'message': 'day_of_week must be between 0 and 6'}), 400
            availability.day_of_week = data['day_of_week']
        
        if 'start_time' in data:
            try:
                availability.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'message': 'Invalid start_time format. Use HH:MM'}), 400
        
        if 'end_time' in data:
            try:
                availability.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'message': 'Invalid end_time format. Use HH:MM'}), 400
        
        if 'is_active' in data:
            availability.is_active = bool(data['is_active'])
        
        # Validate time order
        if availability.start_time >= availability.end_time:
            return jsonify({'message': 'Start time must be before end time'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Availability updated successfully',
            'availability': availability.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating availability: {str(e)}'}), 500

@availability_bp.route('/coach/availability/<availability_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_availability(current_user, availability_id):
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        availability = Availability.query.filter_by(
            id=availability_id,
            coach_id=coach_profile.id
        ).first()
        
        if not availability:
            return jsonify({'message': 'Availability slot not found'}), 404
        
        db.session.delete(availability)
        db.session.commit()
        
        return jsonify({'message': 'Availability deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting availability: {str(e)}'}), 500

@availability_bp.route('/customer/coach/availability', methods=['GET'])
@token_required
def get_coach_availability_for_customer(current_user):
    try:
        # Get customer's coach
        from src.models.user import CustomerProfile
        customer_profile = CustomerProfile.query.filter_by(user_id=current_user.id).first()
        
        if not customer_profile or not customer_profile.coach_id:
            return jsonify({'message': 'No coach assigned'}), 404
        
        availability_slots = Availability.query.filter_by(
            coach_id=customer_profile.coach_id,
            is_active=True
        ).order_by(Availability.day_of_week, Availability.start_time).all()
        
        return jsonify([slot.to_dict() for slot in availability_slots]), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching coach availability: {str(e)}'}), 500


