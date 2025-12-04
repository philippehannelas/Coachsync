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
    role = db.Column(db.Enum('coach', 'customer', 'admin', name='user_roles', create_type=False), nullable=False)
    account_status = db.Column(db.String(20), nullable=False, default='active')
    status_changed_at = db.Column(db.DateTime)
    status_changed_by = db.Column(db.String(36), db.ForeignKey('user.id'))
    status_reason = db.Column(db.Text)
    last_login_at = db.Column(db.DateTime)
    deleted_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    coach_profile = db.relationship('CoachProfile', uselist=False, cascade='all, delete-orphan', lazy='joined')
    customer_profile = db.relationship('CustomerProfile', uselist=False, cascade='all, delete-orphan', lazy='joined')

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
            'account_status': self.account_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_token'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    token_type = db.Column(db.String(50), nullable=False, default='password_reset') # 'password_reset' or 'password_setup'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='reset_tokens')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'token': self.token,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'token_type': self.token_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_log'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    actor_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    target_id = db.Column(db.String(36), nullable=True) # ID of the entity affected (e.g., user.id)
    details = db.Column(db.JSON, nullable=True) # JSON for extra details

    actor = db.relationship('User', foreign_keys=[actor_id], backref='actions_performed', lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'actor_id': self.actor_id,
            'actor_email': self.actor.email if self.actor and self.actor.email else None,
            'action': self.action,
            'target_id': self.target_id,
            'details': self.details
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
    date_specific_availability = db.relationship('DateSpecificAvailability', backref='coach', lazy='dynamic', cascade='all, delete-orphan')

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
    user = db.relationship('User', backref='customer_profile_ref', lazy='joined') # Added to allow customer.user access
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
    rest_seconds = db.Column(db.Integer, default=60)  # Rest between sets
    tempo = db.Column(db.String(20))  # e.g., "3-1-1-0" (eccentric-pause-concentric-pause)
    instructions = db.Column(db.Text)  # Exercise instructions/form cues
    video_url = db.Column(db.String(500))  # Link to demo video
    notes = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)  # For ordering exercises
    day_number = db.Column(db.Integer, default=1)  # Which day in the plan (1-7 for week)

    def to_dict(self):
        return {
            'id': self.id,
            'training_plan_id': self.training_plan_id,
            'name': self.name,
            'sets': self.sets,
            'reps': self.reps,
            'rest_seconds': self.rest_seconds,
            'tempo': self.tempo,
            'instructions': self.instructions,
            'video_url': self.video_url,
            'notes': self.notes,
            'order': self.order,
            'day_number': self.day_number
        }

class Booking(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = db.Column(db.String(36), db.ForeignKey('customer_profile.id'), nullable=True)  # Nullable for personal events
    coach_id = db.Column(db.String(36), db.ForeignKey('coach_profile.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum('confirmed', 'pending', 'cancelled', name='booking_status'), default='confirmed')
    
    # Event type fields
    event_type = db.Column(db.Enum('customer_session', 'personal_event', name='event_type'), default='customer_session')
    event_title = db.Column(db.String(200), nullable=True)  # For personal events (e.g., "Gym Workout")
    
    # Recurring event fields
    is_recurring = db.Column(db.Boolean, default=False)
    recurring_days = db.Column(db.JSON, nullable=True)  # Array of day indices [0,1,2,3,4] for Mon-Fri
    recurring_end_date = db.Column(db.Date, nullable=True)  # When to stop recurring
    parent_event_id = db.Column(db.String(36), nullable=True)  # Links recurring instances to parent
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    # Session notes fields (added after session completion)
    session_summary = db.Column(db.Text, nullable=True)  # What was covered in the session
    performance_rating = db.Column(db.Integer, nullable=True)  # 1-5 star rating
    coach_notes = db.Column(db.Text, nullable=True)  # Private notes for coach only
    action_items = db.Column(db.JSON, nullable=True)  # List of action items for customer
    customer_notes = db.Column(db.Text, nullable=True)  # Customer's reflections
    notes_added_at = db.Column(db.DateTime, nullable=True)  # When coach added notes

    def to_dict(self, include_coach_notes=False):
        result = {
            'id': self.id,
            'customer_id': self.customer_id,
            'coach_id': self.coach_id,
              'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,one,
                  'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'status': self.status,
            'event_type': self.event_type,
            'event_title': self.event_title,
            'is_recurring': self.is_recurring,
            'recurring_days': self.recurring_days or [],
            'recurring_end_date': self.recurring_end_date.isoformat() if self.recurring_end_date else None,
            'parent_event_id': self.parent_event_id,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'session_summary': self.session_summary,
            'performance_rating': self.performance_rating,
            'action_items': self.action_items or [],
            'customer_notes': self.customer_notes,
            'notes_added_at': self.notes_added_at.isoformat() if self.notes_added_at else None,
        }
        if include_coach_notes:
            result['coach_notes'] = self.coach_notes
        return result

class Availability(db.Model):
    __tablename__ = 'availability'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    coach_id = db.Column(db.String(36), db.ForeignKey('coach_profile.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'coach_id': self.coach_id,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None
        }

class DateSpecificAvailability(db.Model):
    __tablename__ = 'date_specific_availability'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    coach_id = db.Column(db.String(36), db.ForeignKey('coach_profile.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    type = db.Column(db.Enum('available', 'unavailable', name='availability_type'), default='available')
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'coach_id': self.coach_id,
            'date': self.date.isoformat() if self.date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'type': self.type,
            'notes': self.notes
        }
