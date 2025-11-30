from src.models.user import db
from datetime import datetime
import uuid

class ExerciseTemplate(db.Model):
    """
    Global exercise database template that coaches can use when building training plans.
    This is separate from the Exercise model which is specific to individual training plans.
    """
    __tablename__ = 'exercise_template'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False, index=True)
    muscle_group = db.Column(db.String(50), nullable=False, index=True)  # Chest, Back, Legs, Shoulders, Arms, Core, Cardio
    category = db.Column(db.String(50), nullable=False)  # Barbell, Dumbbell, Bodyweight, Machine, Cable, Other
    equipment = db.Column(db.String(200))  # Comma-separated list: "Barbell, Bench"
    
    # Default values that coaches can customize when adding to plans
    default_sets = db.Column(db.Integer, default=3)
    default_reps = db.Column(db.String(50), default="10-12")  # Can be "10-12" or "to failure" or "30 seconds"
    default_rest_seconds = db.Column(db.Integer, default=60)
    default_tempo = db.Column(db.String(20))  # e.g., "3-1-1-0" (eccentric-pause-concentric-pause)
    
    # Exercise information
    instructions = db.Column(db.Text)  # How to perform the exercise
    tips = db.Column(db.Text)  # Form tips and common mistakes to avoid
    video_url = db.Column(db.String(500))  # Link to demo video (to be added later)
    
    # Metadata
    difficulty = db.Column(db.String(20), default='intermediate')  # beginner, intermediate, advanced
    is_active = db.Column(db.Boolean, default=True)  # Allow hiding exercises
    is_custom = db.Column(db.Boolean, default=False)  # True if created by a coach, False for system defaults
    created_by_coach_id = db.Column(db.String(36), db.ForeignKey('coach_profile.id'), nullable=True)  # NULL for system exercises
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'muscle_group': self.muscle_group,
            'category': self.category,
            'equipment': self.equipment,
            'default_sets': self.default_sets,
            'default_reps': self.default_reps,
            'default_rest_seconds': self.default_rest_seconds,
            'default_tempo': self.default_tempo,
            'instructions': self.instructions,
            'tips': self.tips,
            'video_url': self.video_url,
            'difficulty': self.difficulty,
            'is_active': self.is_active,
            'is_custom': self.is_custom,
            'created_by_coach_id': self.created_by_coach_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<ExerciseTemplate {self.name} ({self.muscle_group})>'
