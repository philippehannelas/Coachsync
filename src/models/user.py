from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone = db.Column(db.String(8), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.Enum('coach', 'customer', name='user_roles'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    coach_profile = db.relationship('CoachProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    customer_profile = db.relationship('CustomerProfile', backref='user', uselist=False, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email or self.phone}>'

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class CoachProfile(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    bio = db.Column(db.Text)
    qualifications = db.Column(db.JSON)  # Store as JSON array
    cycle_weeks = db.Column(db.Integer, default=6)  # Customizable cycle length
    
    # Relationships
    customers = db.relationship('CustomerProfile', backref='coach', lazy='dynamic')
    bookings = db.relationship('Booking', backref='coach', lazy='dynamic')
    availability = db.relationship('Availability', backref='coach', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bio': self.bio,
            'qualifications': self.qualifications or [],
            'cycle_weeks': self.cycle_weeks
        }

class CustomerProfile(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    coach_id = db.Column(db.String(36), db.ForeignKey('coach_profile.id'), nullable=True)
    session_credits = db.Column(db.Integer, default=0)
    sessions_per_renewal = db.Column(db.Integer, default=8)  # Configurable by coach
    is_active = db.Column(db.Boolean, default=True)  # Coach can revoke access
    notes = db.Column(db.Text)  # Coach notes about the customer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - Remove the training_plans relationship since TrainingPlan now belongs to coach
    bookings = db.relationship('Booking', backref='customer', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'coach_id': self.coach_id,
            'session_credits': self.session_credits,
            'sessions_per_renewal': self.sessions_per_renewal,
            'is_active': self.is_active,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class TrainingPlan(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    coach_id = db.Column(db.String(36), db.ForeignKey('coach_profile.id'), nullable=False)  # Changed from customer_id
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    difficulty = db.Column(db.String(20), default='beginner')  # beginner, intermediate, advanced
    duration_weeks = db.Column(db.Integer, default=4)
    is_active = db.Column(db.Boolean, default=True)
    exercises = db.Column(db.JSON)  # Store exercises as JSON array
    assigned_customer_ids = db.Column(db.JSON)  # Store customer IDs as JSON array
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'coach_id': self.coach_id,
            'name': self.name,
            'description': self.description,
            'difficulty': self.difficulty,
            'duration_weeks': self.duration_weeks,
            'is_active': self.is_active,
            'exercises': self.exercises or [],
            'assigned_customer_ids': self.assigned_customer_ids or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Exercise(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    training_plan_id = db.Column(db.String(36), db.ForeignKey('training_plan.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    sets = db.Column(db.Integer)
    reps = db.Column(db.String(50))  # Can be "10-12" or "to failure"
    notes = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)  # For ordering exercises

    def to_dict(self):
        return {
            'id': self.id,
            'training_plan_id': self.training_plan_id,
            'name': self.name,
            'sets': self.sets,
            'reps': self.reps,
            'notes': self.notes,
            'order': self.order
        }

class Booking(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = db.Column(db.String(36), db.ForeignKey('customer_profile.id'), nullable=False)
    coach_id = db.Column(db.String(36), db.ForeignKey('coach_profile.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum('confirmed', 'pending', 'cancelled', name='booking_status'), default='confirmed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'coach_id': self.coach_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Availability(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    coach_id = db.Column(db.String(36), db.ForeignKey('coach_profile.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'coach_id': self.coach_id,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

