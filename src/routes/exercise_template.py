from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.exercise_template import ExerciseTemplate
from functools import wraps
import jwt
import os

exercise_template_bp = Blueprint('exercise_template', __name__)

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT'), algorithms=['HS256'])
            kwargs['current_user_id'] = data['user_id']
            kwargs['current_user_role'] = data.get('role')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated

# Coach-only decorator
def coach_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if kwargs.get('current_user_role') != 'coach':
            return jsonify({'error': 'Coach access required'}), 403
        return f(*args, **kwargs)
    return decorated


@exercise_template_bp.route('/exercise-templates', methods=['GET'])
@token_required
def get_exercise_templates(current_user_id, current_user_role):
    """
    Get all exercise templates with optional filtering
    Query params:
    - muscle_group: Filter by muscle group (Chest, Back, Legs, etc.)
    - category: Filter by category (Barbell, Dumbbell, Bodyweight, etc.)
    - difficulty: Filter by difficulty (beginner, intermediate, advanced)
    - search: Search by name
    """
    try:
        query = ExerciseTemplate.query.filter_by(is_active=True)
        
        # Apply filters
        muscle_group = request.args.get('muscle_group')
        if muscle_group:
            query = query.filter_by(muscle_group=muscle_group)
        
        category = request.args.get('category')
        if category:
            query = query.filter_by(category=category)
        
        difficulty = request.args.get('difficulty')
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        
        search = request.args.get('search')
        if search:
            query = query.filter(ExerciseTemplate.name.ilike(f'%{search}%'))
        
        # Order by muscle group and name
        exercises = query.order_by(ExerciseTemplate.muscle_group, ExerciseTemplate.name).all()
        
        return jsonify({
            'exercises': [exercise.to_dict() for exercise in exercises],
            'count': len(exercises)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@exercise_template_bp.route('/exercise-templates/<exercise_id>', methods=['GET'])
@token_required
def get_exercise_template(exercise_id, current_user_id, current_user_role):
    """Get a specific exercise template by ID"""
    try:
        exercise = ExerciseTemplate.query.get(exercise_id)
        if not exercise:
            return jsonify({'error': 'Exercise not found'}), 404
        
        return jsonify(exercise.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@exercise_template_bp.route('/exercise-templates', methods=['POST'])
@token_required
@coach_required
def create_exercise_template(current_user_id, current_user_role):
    """Create a new custom exercise template (coaches only)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'muscle_group', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get coach profile
        from src.models.user import CoachProfile, User
        user = User.query.get(current_user_id)
        if not user or not user.coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Create new exercise template
        exercise = ExerciseTemplate(
            name=data['name'],
            muscle_group=data['muscle_group'],
            category=data['category'],
            equipment=data.get('equipment'),
            default_sets=data.get('default_sets', 3),
            default_reps=data.get('default_reps', '10-12'),
            default_rest_seconds=data.get('default_rest_seconds', 60),
            default_tempo=data.get('default_tempo'),
            instructions=data.get('instructions'),
            tips=data.get('tips'),
            video_url=data.get('video_url'),
            difficulty=data.get('difficulty', 'intermediate'),
            is_custom=True,
            created_by_coach_id=user.coach_profile.id
        )
        
        db.session.add(exercise)
        db.session.commit()
        
        return jsonify({
            'message': 'Exercise template created successfully',
            'exercise': exercise.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@exercise_template_bp.route('/exercise-templates/<exercise_id>', methods=['PUT'])
@token_required
@coach_required
def update_exercise_template(exercise_id, current_user_id, current_user_role):
    """Update an exercise template (coaches can only update their own custom exercises)"""
    try:
        exercise = ExerciseTemplate.query.get(exercise_id)
        if not exercise:
            return jsonify({'error': 'Exercise not found'}), 404
        
        # Get coach profile
        from src.models.user import CoachProfile, User
        user = User.query.get(current_user_id)
        if not user or not user.coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Only allow updating custom exercises created by this coach or system exercises
        if exercise.is_custom and exercise.created_by_coach_id != user.coach_profile.id:
            return jsonify({'error': 'You can only update your own custom exercises'}), 403
        
        # System exercises (is_custom=False) cannot be updated by coaches
        if not exercise.is_custom:
            return jsonify({'error': 'System exercises cannot be modified'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            exercise.name = data['name']
        if 'muscle_group' in data:
            exercise.muscle_group = data['muscle_group']
        if 'category' in data:
            exercise.category = data['category']
        if 'equipment' in data:
            exercise.equipment = data['equipment']
        if 'default_sets' in data:
            exercise.default_sets = data['default_sets']
        if 'default_reps' in data:
            exercise.default_reps = data['default_reps']
        if 'default_rest_seconds' in data:
            exercise.default_rest_seconds = data['default_rest_seconds']
        if 'default_tempo' in data:
            exercise.default_tempo = data['default_tempo']
        if 'instructions' in data:
            exercise.instructions = data['instructions']
        if 'tips' in data:
            exercise.tips = data['tips']
        if 'video_url' in data:
            exercise.video_url = data['video_url']
        if 'difficulty' in data:
            exercise.difficulty = data['difficulty']
        if 'is_active' in data:
            exercise.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Exercise template updated successfully',
            'exercise': exercise.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@exercise_template_bp.route('/exercise-templates/<exercise_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_exercise_template(exercise_id, current_user_id, current_user_role):
    """Delete an exercise template (coaches can only delete their own custom exercises)"""
    try:
        exercise = ExerciseTemplate.query.get(exercise_id)
        if not exercise:
            return jsonify({'error': 'Exercise not found'}), 404
        
        # Get coach profile
        from src.models.user import CoachProfile, User
        user = User.query.get(current_user_id)
        if not user or not user.coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Only allow deleting custom exercises created by this coach
        if not exercise.is_custom or exercise.created_by_coach_id != user.coach_profile.id:
            return jsonify({'error': 'You can only delete your own custom exercises'}), 403
        
        # Soft delete by setting is_active to False
        exercise.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Exercise template deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@exercise_template_bp.route('/exercise-templates/categories', methods=['GET'])
@token_required
def get_categories(current_user_id, current_user_role):
    """Get available categories and muscle groups"""
    return jsonify({
        'muscle_groups': [
            'Chest',
            'Back',
            'Legs',
            'Shoulders',
            'Arms',
            'Core',
            'Cardio'
        ],
        'categories': [
            'Barbell',
            'Dumbbell',
            'Bodyweight',
            'Machine',
            'Cable',
            'Other'
        ],
        'difficulties': [
            'beginner',
            'intermediate',
            'advanced'
        ]
    }), 200
