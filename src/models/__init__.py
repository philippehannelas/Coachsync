# Models package
from src.models.user import db, User, CoachProfile, CustomerProfile, TrainingPlan, Exercise, Booking, Availability, DateSpecificAvailability
from src.models.exercise_template import ExerciseTemplate

__all__ = [
    'db',
    'User',
    'CoachProfile',
    'CustomerProfile',
    'TrainingPlan',
    'Exercise',
    'Booking',
    'Availability',
    'DateSpecificAvailability',
    'ExerciseTemplate'
]
