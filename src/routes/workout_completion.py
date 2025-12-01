from flask import Blueprint, request, jsonify
from src.models import db, WorkoutCompletion, ExerciseCompletion, TrainingPlan, Exercise
from src.routes.auth import token_required
from datetime import datetime, timedelta
from sqlalchemy import func

workout_completion_bp = Blueprint('workout_completion', __name__)

# Customer endpoints

@workout_completion_bp.route('/api/customer/workouts/<training_plan_id>/day/<int:day_number>', methods=['GET'])
@token_required
def get_workout_for_day(current_user, training_plan_id, day_number):
    """Get workout details for a specific day"""
    if current_user.role != 'customer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get training plan
    plan = TrainingPlan.query.filter_by(id=training_plan_id).first()
    if not plan:
        return jsonify({'error': 'Training plan not found'}), 404
    
    # Get exercises for this day
    exercises = Exercise.query.filter_by(
        training_plan_id=training_plan_id,
        day_number=day_number
    ).order_by(Exercise.order).all()
    
    # Check if workout was completed today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    completion = WorkoutCompletion.query.filter_by(
        customer_id=current_user.id,
        training_plan_id=training_plan_id,
        day_number=day_number
    ).filter(WorkoutCompletion.completed_at >= today_start).first()
    
    return jsonify({
        'plan': {
            'id': plan.id,
            'name': plan.name,
            'day_number': day_number
        },
        'exercises': [ex.to_dict() for ex in exercises],
        'completed': completion.to_dict() if completion else None
    })


@workout_completion_bp.route('/api/customer/workouts/complete', methods=['POST'])
@token_required
def complete_workout(current_user):
    """Mark a workout as complete"""
    if current_user.role != 'customer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    
    # Create workout completion
    completion = WorkoutCompletion(
        customer_id=current_user.id,
        training_plan_id=data['training_plan_id'],
        day_number=data['day_number'],
        duration_minutes=data.get('duration_minutes'),
        notes=data.get('notes'),
        rating=data.get('rating')
    )
    
    db.session.add(completion)
    db.session.flush()  # Get the ID
    
    # Add exercise completions
    for ex_data in data.get('exercises', []):
        ex_completion = ExerciseCompletion(
            workout_completion_id=completion.id,
            exercise_id=ex_data['exercise_id'],
            sets_completed=ex_data.get('sets_completed', 0),
            reps_completed=ex_data.get('reps_completed', ''),
            weight_used=ex_data.get('weight_used', ''),
            notes=ex_data.get('notes', ''),
            is_pr=ex_data.get('is_pr', False)
        )
        db.session.add(ex_completion)
    
    db.session.commit()
    
    return jsonify(completion.to_dict()), 201


@workout_completion_bp.route('/api/customer/workouts/history', methods=['GET'])
@token_required
def get_workout_history(current_user):
    """Get customer's workout completion history"""
    if current_user.role != 'customer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get query parameters
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    completions = WorkoutCompletion.query.filter_by(
        customer_id=current_user.id
    ).filter(
        WorkoutCompletion.completed_at >= start_date
    ).order_by(WorkoutCompletion.completed_at.desc()).all()
    
    return jsonify([c.to_dict() for c in completions])


@workout_completion_bp.route('/api/customer/stats', methods=['GET'])
@token_required
def get_customer_stats(current_user):
    """Get customer's workout statistics"""
    if current_user.role != 'customer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Total workouts completed
    total_workouts = WorkoutCompletion.query.filter_by(
        customer_id=current_user.id
    ).count()
    
    # Workouts this week
    week_start = datetime.utcnow() - timedelta(days=7)
    workouts_this_week = WorkoutCompletion.query.filter_by(
        customer_id=current_user.id
    ).filter(WorkoutCompletion.completed_at >= week_start).count()
    
    # Workouts this month
    month_start = datetime.utcnow() - timedelta(days=30)
    workouts_this_month = WorkoutCompletion.query.filter_by(
        customer_id=current_user.id
    ).filter(WorkoutCompletion.completed_at >= month_start).count()
    
    # Current streak (consecutive days with workouts)
    streak = calculate_streak(current_user.id)
    
    # Average workout duration
    avg_duration = db.session.query(func.avg(WorkoutCompletion.duration_minutes)).filter_by(
        customer_id=current_user.id
    ).filter(WorkoutCompletion.duration_minutes.isnot(None)).scalar() or 0
    
    # Personal records count
    pr_count = ExerciseCompletion.query.join(WorkoutCompletion).filter(
        WorkoutCompletion.customer_id == current_user.id,
        ExerciseCompletion.is_pr == True
    ).count()
    
    return jsonify({
        'total_workouts': total_workouts,
        'workouts_this_week': workouts_this_week,
        'workouts_this_month': workouts_this_month,
        'current_streak': streak,
        'average_duration_minutes': round(avg_duration, 1),
        'personal_records': pr_count
    })


def calculate_streak(customer_id):
    """Calculate consecutive days with completed workouts"""
    completions = WorkoutCompletion.query.filter_by(
        customer_id=customer_id
    ).order_by(WorkoutCompletion.completed_at.desc()).all()
    
    if not completions:
        return 0
    
    streak = 0
    current_date = datetime.utcnow().date()
    
    # Group completions by date
    completion_dates = set()
    for c in completions:
        completion_dates.add(c.completed_at.date())
    
    # Check consecutive days
    while current_date in completion_dates:
        streak += 1
        current_date -= timedelta(days=1)
    
    return streak


# Coach endpoints

@workout_completion_bp.route('/api/coach/customers/<customer_id>/workout-history', methods=['GET'])
@token_required
def get_customer_workout_history(current_user, customer_id):
    """Get a customer's workout history (coach view)"""
    if current_user.role != 'coach':
        return jsonify({'error': 'Unauthorized'}), 403
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    completions = WorkoutCompletion.query.filter_by(
        customer_id=customer_id
    ).filter(
        WorkoutCompletion.completed_at >= start_date
    ).order_by(WorkoutCompletion.completed_at.desc()).all()
    
    return jsonify([c.to_dict() for c in completions])


@workout_completion_bp.route('/api/coach/customers/<customer_id>/stats', methods=['GET'])
@token_required
def get_customer_stats_coach(current_user, customer_id):
    """Get a customer's stats (coach view)"""
    if current_user.role != 'coach':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Reuse the stats calculation logic
    total_workouts = WorkoutCompletion.query.filter_by(
        customer_id=customer_id
    ).count()
    
    week_start = datetime.utcnow() - timedelta(days=7)
    workouts_this_week = WorkoutCompletion.query.filter_by(
        customer_id=customer_id
    ).filter(WorkoutCompletion.completed_at >= week_start).count()
    
    month_start = datetime.utcnow() - timedelta(days=30)
    workouts_this_month = WorkoutCompletion.query.filter_by(
        customer_id=customer_id
    ).filter(WorkoutCompletion.completed_at >= month_start).count()
    
    streak = calculate_streak(customer_id)
    
    avg_duration = db.session.query(func.avg(WorkoutCompletion.duration_minutes)).filter_by(
        customer_id=customer_id
    ).filter(WorkoutCompletion.duration_minutes.isnot(None)).scalar() or 0
    
    pr_count = ExerciseCompletion.query.join(WorkoutCompletion).filter(
        WorkoutCompletion.customer_id == customer_id,
        ExerciseCompletion.is_pr == True
    ).count()
    
    return jsonify({
        'total_workouts': total_workouts,
        'workouts_this_week': workouts_this_week,
        'workouts_this_month': workouts_this_month,
        'current_streak': streak,
        'average_duration_minutes': round(avg_duration, 1),
        'personal_records': pr_count
    })
