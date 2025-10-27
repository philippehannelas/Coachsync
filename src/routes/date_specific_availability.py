from flask import Blueprint, request, jsonify
from src.models.user import db, DateSpecificAvailability, CoachProfile
from src.routes.auth import token_required
from datetime import datetime, date
import functools

date_specific_bp = Blueprint('date_specific', __name__)

def coach_required(f):
    @functools.wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'coach':
            return jsonify({'message': 'Coach access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@date_specific_bp.route('/coach/date-specific-availability', methods=['GET'])
@token_required
@coach_required
def get_date_specific_availability(current_user):
    """
    Get all date-specific availability for the coach
    Optional query params:
    - start_date: Filter from this date (YYYY-MM-DD)
    - end_date: Filter to this date (YYYY-MM-DD)
    - type: Filter by type ('override' or 'blocked')
    """
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        query = DateSpecificAvailability.query.filter_by(coach_id=coach_profile.id)
        
        # Apply filters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        type_filter = request.args.get('type')
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            query = query.filter(DateSpecificAvailability.date >= start_date)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(DateSpecificAvailability.date <= end_date)
        
        if type_filter and type_filter in ['override', 'blocked']:
            query = query.filter(DateSpecificAvailability.type == type_filter)
        
        date_specific = query.order_by(DateSpecificAvailability.date).all()
        
        return jsonify([item.to_dict() for item in date_specific]), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching date-specific availability: {str(e)}'}), 500

@date_specific_bp.route('/coach/date-specific-availability', methods=['POST'])
@token_required
@coach_required
def create_date_specific_availability(current_user):
    """
    Create date-specific availability
    
    Request body:
    {
        "date": "2025-12-25",
        "type": "blocked",  // or "override"
        "start_time": "10:00",  // required if type='override'
        "end_time": "14:00",    // required if type='override'
        "reason": "Christmas"   // optional
    }
    """
    try:
        data = request.json
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # Validate required fields
        if 'date' not in data or 'type' not in data:
            return jsonify({'message': 'date and type are required'}), 400
        
        if data['type'] not in ['override', 'blocked']:
            return jsonify({'message': 'type must be "override" or "blocked"'}), 400
        
        # Parse date
        try:
            specific_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Validate date is not in the past
        if specific_date < date.today():
            return jsonify({'message': 'Cannot set availability for past dates'}), 400
        
        # For override type, start_time and end_time are required
        start_time = None
        end_time = None
        
        if data['type'] == 'override':
            if 'start_time' not in data or 'end_time' not in data:
                return jsonify({'message': 'start_time and end_time are required for override type'}), 400
            
            try:
                start_time = datetime.strptime(data['start_time'], '%H:%M').time()
                end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'message': 'Invalid time format. Use HH:MM'}), 400
            
            if start_time >= end_time:
                return jsonify({'message': 'start_time must be before end_time'}), 400
        
        # Check if entry already exists for this date
        existing = DateSpecificAvailability.query.filter_by(
            coach_id=coach_profile.id,
            date=specific_date
        ).first()
        
        if existing:
            return jsonify({'message': f'Date-specific availability already exists for {specific_date}. Use PUT to update.'}), 400
        
        # Create new entry
        date_specific = DateSpecificAvailability(
            coach_id=coach_profile.id,
            date=specific_date,
            type=data['type'],
            start_time=start_time,
            end_time=end_time,
            reason=data.get('reason')
        )
        
        db.session.add(date_specific)
        db.session.commit()
        
        return jsonify({
            'message': 'Date-specific availability created successfully',
            'availability': date_specific.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating date-specific availability: {str(e)}'}), 500

@date_specific_bp.route('/coach/date-specific-availability/<availability_id>', methods=['PUT'])
@token_required
@coach_required
def update_date_specific_availability(current_user, availability_id):
    """Update an existing date-specific availability entry"""
    try:
        data = request.json
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        date_specific = DateSpecificAvailability.query.filter_by(
            id=availability_id,
            coach_id=coach_profile.id
        ).first()
        
        if not date_specific:
            return jsonify({'message': 'Date-specific availability not found'}), 404
        
        # Update type if provided
        if 'type' in data:
            if data['type'] not in ['override', 'blocked']:
                return jsonify({'message': 'type must be "override" or "blocked"'}), 400
            date_specific.type = data['type']
        
        # Update times if provided (for override type)
        if date_specific.type == 'override':
            if 'start_time' in data:
                try:
                    date_specific.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
                except ValueError:
                    return jsonify({'message': 'Invalid start_time format. Use HH:MM'}), 400
            
            if 'end_time' in data:
                try:
                    date_specific.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
                except ValueError:
                    return jsonify({'message': 'Invalid end_time format. Use HH:MM'}), 400
            
            if date_specific.start_time and date_specific.end_time:
                if date_specific.start_time >= date_specific.end_time:
                    return jsonify({'message': 'start_time must be before end_time'}), 400
        else:
            # If type is blocked, clear times
            date_specific.start_time = None
            date_specific.end_time = None
        
        # Update reason if provided
        if 'reason' in data:
            date_specific.reason = data['reason']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Date-specific availability updated successfully',
            'availability': date_specific.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating date-specific availability: {str(e)}'}), 500

@date_specific_bp.route('/coach/date-specific-availability/<availability_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_date_specific_availability(current_user, availability_id):
    """Delete a date-specific availability entry"""
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        date_specific = DateSpecificAvailability.query.filter_by(
            id=availability_id,
            coach_id=coach_profile.id
        ).first()
        
        if not date_specific:
            return jsonify({'message': 'Date-specific availability not found'}), 404
        
        db.session.delete(date_specific)
        db.session.commit()
        
        return jsonify({'message': 'Date-specific availability deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting date-specific availability: {str(e)}'}), 500

@date_specific_bp.route('/coach/date-specific-availability/bulk', methods=['POST'])
@token_required
@coach_required
def create_bulk_date_specific(current_user):
    """
    Create multiple date-specific entries at once (useful for vacation periods)
    
    Request body:
    {
        "start_date": "2025-07-01",
        "end_date": "2025-07-15",
        "type": "blocked",
        "reason": "Summer Vacation"
    }
    """
    try:
        data = request.json
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # Validate required fields
        required_fields = ['start_date', 'end_date', 'type']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        if data['type'] not in ['override', 'blocked']:
            return jsonify({'message': 'type must be "override" or "blocked"'}), 400
        
        # Parse dates
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if start_date > end_date:
            return jsonify({'message': 'start_date must be before or equal to end_date'}), 400
        
        if start_date < date.today():
            return jsonify({'message': 'Cannot set availability for past dates'}), 400
        
        # Parse times if override type
        start_time = None
        end_time = None
        
        if data['type'] == 'override':
            if 'start_time' not in data or 'end_time' not in data:
                return jsonify({'message': 'start_time and end_time are required for override type'}), 400
            
            try:
                start_time = datetime.strptime(data['start_time'], '%H:%M').time()
                end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'message': 'Invalid time format. Use HH:MM'}), 400
        
        # Create entries for each date in range
        created_entries = []
        current_date = start_date
        
        while current_date <= end_date:
            # Check if entry already exists
            existing = DateSpecificAvailability.query.filter_by(
                coach_id=coach_profile.id,
                date=current_date
            ).first()
            
            if not existing:
                date_specific = DateSpecificAvailability(
                    coach_id=coach_profile.id,
                    date=current_date,
                    type=data['type'],
                    start_time=start_time,
                    end_time=end_time,
                    reason=data.get('reason')
                )
                db.session.add(date_specific)
                created_entries.append(date_specific)
            
            # Move to next day
            from datetime import timedelta
            current_date += timedelta(days=1)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Created {len(created_entries)} date-specific availability entries',
            'entries': [entry.to_dict() for entry in created_entries]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating bulk date-specific availability: {str(e)}'}), 500


