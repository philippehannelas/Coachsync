from datetime import datetime
from .user import db
import uuid

class WorkoutCompletion(db.Model):
    __tablename__ = 'workout_completions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    training_plan_id = db.Column(db.String(36), db.ForeignKey('training_plan.id'), nullable=False)
    day_number = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    duration_minutes = db.Column(db.Integer)  # How long the workout took
    notes = db.Column(db.Text)  # Customer notes about the workout
    rating = db.Column(db.Integer)  # 1-5 rating of workout difficulty/satisfaction
    
    # Relationships
    customer = db.relationship('User', foreign_keys=[customer_id], backref='workout_completions')
    training_plan = db.relationship('TrainingPlan', backref='completions')
    exercise_completions = db.relationship('ExerciseCompletion', backref='workout', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'training_plan_id': self.training_plan_id,
            'day_number': self.day_number,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration_minutes': self.duration_minutes,
            'notes': self.notes,
            'rating': self.rating,
            'exercise_completions': [ec.to_dict() for ec in self.exercise_completions]
        }


class ExerciseCompletion(db.Model):
    __tablename__ = 'exercise_completions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workout_completion_id = db.Column(db.String(36), db.ForeignKey('workout_completions.id'), nullable=False)
    exercise_id = db.Column(db.String(36), db.ForeignKey('exercise.id'), nullable=False)
    sets_completed = db.Column(db.Integer, default=0)
    reps_completed = db.Column(db.String(100))  # e.g., "10,12,10" for 3 sets
    weight_used = db.Column(db.String(100))  # e.g., "50,50,55" for 3 sets with different weights
    notes = db.Column(db.Text)  # Notes about this specific exercise
    is_pr = db.Column(db.Boolean, default=False)  # Did they hit a personal record?
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    exercise = db.relationship('Exercise', backref='completions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'workout_completion_id': self.workout_completion_id,
            'exercise_id': self.exercise_id,
            'exercise_name': self.exercise.name if self.exercise else None,
            'sets_completed': self.sets_completed,
            'reps_completed': self.reps_completed,
            'weight_used': self.weight_used,
            'notes': self.notes,
            'is_pr': self.is_pr,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
