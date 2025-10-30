from flask import Blueprint, request, jsonify
from src.models.user import db, TrainingPlan, Exercise, WorkoutLog, ExerciseLog, CustomerProfile
from src.middleware.auth import token_required, coach_required, customer_required
from datetime import datetime, date

training_plan_bp = Blueprint('training_plan', __name__)

# ==================== COACH ENDPOINTS ====================

@training_plan_bp.route('/coach/training-plans', methods=['GET'])
@token_required
@coach_required
def get_coach_training_plans(current_user):
    """Get all training plans created by the coach"""
    try:
        plans = TrainingPlan.query.filter_by(coach_id=current_user.id).all()
        return jsonify([plan.to_dict() for plan in plans]), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching training plans: {str(e)}'}), 500


@training_plan_bp.route('/coach/training-plans', methods=['POST'])
@token_required
@coach_required
def create_training_plan(current_user):
    """Create a new training plan"""
    try:
        data = request.json
        
        new_plan = TrainingPlan(
            coach_id=current_user.id,
            name=data.get('name'),
            description=data.get('description'),
            difficulty=data.get('difficulty', 'beginner'),
            duration_weeks=data.get('duration_weeks', 4),
            is_active=True,
            assigned_customer_ids=[]
        )
        
        db.session.add(new_plan)
        db.session.commit()
        
        return jsonify(new_plan.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating training plan: {str(e)}'}), 500


@training_plan_bp.route('/coach/training-plans/<plan_id>', methods=['PUT'])
@token_required
@coach_required
def update_training_plan(current_user, plan_id):
    """Update a training plan"""
    try:
        plan = TrainingPlan.query.filter_by(id=plan_id, coach_id=current_user.id).first()
        if not plan:
            return jsonify({'message': 'Training plan not found'}), 404
        
        data = request.json
        plan.name = data.get('name', plan.name)
        plan.description = data.get('description', plan.description)
        plan.difficulty = data.get('difficulty', plan.difficulty)
        plan.duration_weeks = data.get('duration_weeks', plan.duration_weeks)
        plan.is_active = data.get('is_active', plan.is_active)
        plan.updated_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify(plan.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating training plan: {str(e)}'}), 500


@training_plan_bp.route('/coach/training-plans/<plan_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_training_plan(current_user, plan_id):
    """Delete a training plan"""
    try:
        plan = TrainingPlan.query.filter_by(id=plan_id, coach_id=current_user.id).first()
        if not plan:
            return jsonify({'message': 'Training plan not found'}), 404
        
        # Delete associated exercises
        Exercise.query.filter_by(training_plan_id=plan_id).delete()
        
        db.session.delete(plan)
        db.session.commit()
        return jsonify({'message': 'Training plan deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting training plan: {str(e)}'}), 500


@training_plan_bp.route('/coach/training-plans/<plan_id>/exercises', methods=['GET'])
@token_required
@coach_required
def get_plan_exercises(current_user, plan_id):
    """Get all exercises for a training plan"""
    try:
        plan = TrainingPlan.query.filter_by(id=plan_id, coach_id=current_user.id).first()
        if not plan:
            return jsonify({'message': 'Training plan not found'}), 404
        
        exercises = Exercise.query.filter_by(training_plan_id=plan_id).order_by(Exercise.day_number, Exercise.order).all()
        return jsonify([ex.to_dict() for ex in exercises]), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching exercises: {str(e)}'}), 500


@training_plan_bp.route('/coach/training-plans/<plan_id>/exercises', methods=['POST'])
@token_required
@coach_required
def add_exercise_to_plan(current_user, plan_id):
    """Add an exercise to a training plan"""
    try:
        plan = TrainingPlan.query.filter_by(id=plan_id, coach_id=current_user.id).first()
        if not plan:
            return jsonify({'message': 'Training plan not found'}), 404
        
        data = request.json
        
        new_exercise = Exercise(
            training_plan_id=plan_id,
            name=data.get('name'),
            sets=data.get('sets'),
            reps=data.get('reps'),
            rest_seconds=data.get('rest_seconds', 60),
            tempo=data.get('tempo'),
            instructions=data.get('instructions'),
            video_url=data.get('video_url'),
            notes=data.get('notes'),
            order=data.get('order', 0),
            day_number=data.get('day_number', 1)
        )
        
        db.session.add(new_exercise)
        db.session.commit()
        
        return jsonify(new_exercise.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding exercise: {str(e)}'}), 500


@training_plan_bp.route('/coach/exercises/<exercise_id>', methods=['PUT'])
@token_required
@coach_required
def update_exercise(current_user, exercise_id):
    """Update an exercise"""
    try:
        exercise = Exercise.query.get(exercise_id)
        if not exercise:
            return jsonify({'message': 'Exercise not found'}), 404
        
        # Verify coach owns the training plan
        plan = TrainingPlan.query.filter_by(id=exercise.training_plan_id, coach_id=current_user.id).first()
        if not plan:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.json
        exercise.name = data.get('name', exercise.name)
        exercise.sets = data.get('sets', exercise.sets)
        exercise.reps = data.get('reps', exercise.reps)
        exercise.rest_seconds = data.get('rest_seconds', exercise.rest_seconds)
        exercise.tempo = data.get('tempo', exercise.tempo)
        exercise.instructions = data.get('instructions', exercise.instructions)
        exercise.video_url = data.get('video_url', exercise.video_url)
        exercise.notes = data.get('notes', exercise.notes)
        exercise.order = data.get('order', exercise.order)
        exercise.day_number = data.get('day_number', exercise.day_number)
        
        db.session.commit()
        return jsonify(exercise.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating exercise: {str(e)}'}), 500


@training_plan_bp.route('/coach/exercises/<exercise_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_exercise(current_user, exercise_id):
    """Delete an exercise"""
    try:
        exercise = Exercise.query.get(exercise_id)
        if not exercise:
            return jsonify({'message': 'Exercise not found'}), 404
        
        # Verify coach owns the training plan
        plan = TrainingPlan.query.filter_by(id=exercise.training_plan_id, coach_id=current_user.id).first()
        if not plan:
            return jsonify({'message': 'Unauthorized'}), 403
        
        db.session.delete(exercise)
        db.session.commit()
        return jsonify({'message': 'Exercise deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting exercise: {str(e)}'}), 500


@training_plan_bp.route('/coach/training-plans/<plan_id>/assign', methods=['POST'])
@token_required
@coach_required
def assign_plan_to_customer(current_user, plan_id):
    """Assign a training plan to a customer"""
    try:
        plan = TrainingPlan.query.filter_by(id=plan_id, coach_id=current_user.id).first()
        if not plan:
            return jsonify({'message': 'Training plan not found'}), 404
        
        data = request.json
        customer_id = data.get('customer_id')
        
        # Verify customer exists and belongs to this coach
        customer = CustomerProfile.query.filter_by(id=customer_id, coach_id=current_user.id).first()
        if not customer:
            return jsonify({'message': 'Customer not found'}), 404
        
        # Add customer to assigned list
        assigned_ids = plan.assigned_customer_ids or []
        if customer_id not in assigned_ids:
            assigned_ids.append(customer_id)
            plan.assigned_customer_ids = assigned_ids
            plan.updated_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({'message': 'Training plan assigned successfully', 'plan': plan.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error assigning training plan: {str(e)}'}), 500


@training_plan_bp.route('/coach/training-plans/<plan_id>/unassign', methods=['POST'])
@token_required
@coach_required
def unassign_plan_from_customer(current_user, plan_id):
    """Unassign a training plan from a customer"""
    try:
        plan = TrainingPlan.query.filter_by(id=plan_id, coach_id=current_user.id).first()
        if not plan:
            return jsonify({'message': 'Training plan not found'}), 404
        
        data = request.json
        customer_id = data.get('customer_id')
        
        # Remove customer from assigned list
        assigned_ids = plan.assigned_customer_ids or []
        if customer_id in assigned_ids:
            assigned_ids.remove(customer_id)
            plan.assigned_customer_ids = assigned_ids
            plan.updated_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({'message': 'Training plan unassigned successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error unassigning training plan: {str(e)}'}), 500


# ==================== CUSTOMER ENDPOINTS ====================

@training_plan_bp.route('/customer/training-plans', methods=['GET'])
@token_required
@customer_required
def get_customer_training_plans(current_user):
    """Get all training plans assigned to the customer"""
    try:
        # Find plans where customer is in assigned_customer_ids
        all_plans = TrainingPlan.query.filter_by(coach_id=current_user.coach_id).all()
        assigned_plans = [plan for plan in all_plans if current_user.id in (plan.assigned_customer_ids or [])]
        
        return jsonify([plan.to_dict() for plan in assigned_plans]), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching training plans: {str(e)}'}), 500


@training_plan_bp.route('/customer/training-plans/<plan_id>/exercises', methods=['GET'])
@token_required
@customer_required
def get_customer_plan_exercises(current_user, plan_id):
    """Get all exercises for a training plan"""
    try:
        # Verify customer has access to this plan
        plan = TrainingPlan.query.get(plan_id)
        if not plan or current_user.id not in (plan.assigned_customer_ids or []):
            return jsonify({'message': 'Training plan not found'}), 404
        
        exercises = Exercise.query.filter_by(training_plan_id=plan_id).order_by(Exercise.day_number, Exercise.order).all()
        return jsonify([ex.to_dict() for ex in exercises]), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching exercises: {str(e)}'}), 500


@training_plan_bp.route('/customer/workout-logs', methods=['POST'])
@token_required
@customer_required
def log_workout(current_user):
    """Log a workout completion"""
    try:
        data = request.json
        
        workout_log = WorkoutLog(
            customer_id=current_user.id,
            training_plan_id=data.get('training_plan_id'),
            workout_date=datetime.strptime(data.get('workout_date'), '%Y-%m-%d').date(),
            completed=data.get('completed', True),
            notes=data.get('notes'),
            duration_minutes=data.get('duration_minutes'),
            completed_at=datetime.utcnow() if data.get('completed') else None
        )
        
        db.session.add(workout_log)
        db.session.commit()
        
        return jsonify(workout_log.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error logging workout: {str(e)}'}), 500


@training_plan_bp.route('/customer/exercise-logs', methods=['POST'])
@token_required
@customer_required
def log_exercise(current_user):
    """Log exercise performance"""
    try:
        data = request.json
        
        exercise_log = ExerciseLog(
            workout_log_id=data.get('workout_log_id'),
            exercise_id=data.get('exercise_id'),
            exercise_name=data.get('exercise_name'),
            set_number=data.get('set_number'),
            reps_completed=data.get('reps_completed'),
            weight_used=data.get('weight_used'),
            notes=data.get('notes')
        )
        
        db.session.add(exercise_log)
        db.session.commit()
        
        return jsonify(exercise_log.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error logging exercise: {str(e)}'}), 500


@training_plan_bp.route('/customer/workout-logs', methods=['GET'])
@token_required
@customer_required
def get_workout_logs(current_user):
    """Get customer's workout logs"""
    try:
        logs = WorkoutLog.query.filter_by(customer_id=current_user.id).order_by(WorkoutLog.workout_date.desc()).all()
        return jsonify([log.to_dict() for log in logs]), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching workout logs: {str(e)}'}), 500


@training_plan_bp.route('/customer/workout-logs/<log_id>/exercises', methods=['GET'])
@token_required
@customer_required
def get_exercise_logs(current_user, log_id):
    """Get exercise logs for a specific workout"""
    try:
        # Verify workout log belongs to customer
        workout_log = WorkoutLog.query.filter_by(id=log_id, customer_id=current_user.id).first()
        if not workout_log:
            return jsonify({'message': 'Workout log not found'}), 404
        
        exercise_logs = ExerciseLog.query.filter_by(workout_log_id=log_id).all()
        return jsonify([log.to_dict() for log in exercise_logs]), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching exercise logs: {str(e)}'}), 500

