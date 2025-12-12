from src.models.user import db
from datetime import datetime

class CoachConnection(db.Model):
    """
    Model for managing professional connections between coaches
    Enables coaches to build their network for collaboration and substitute assignments
    """
    __tablename__ = 'coach_connections'
    
    id = db.Column(db.Integer, primary_key=True)
    requester_coach_id = db.Column(db.Integer, db.ForeignKey('coach_profile.id', ondelete='CASCADE'), nullable=False)
    receiver_coach_id = db.Column(db.Integer, db.ForeignKey('coach_profile.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime)
    request_message = db.Column(db.Text)
    decline_reason = db.Column(db.Text)
    notes = db.Column(db.Text)  # Private notes (only visible to requester)
    tags = db.Column(db.String(255))  # Comma-separated tags
    
    # Relationships
    requester = db.relationship('CoachProfile', foreign_keys=[requester_coach_id], backref='sent_connections')
    receiver = db.relationship('CoachProfile', foreign_keys=[receiver_coach_id], backref='received_connections')
    
    def to_dict(self, perspective='requester'):
        """
        Convert to dictionary for API responses
        
        Args:
            perspective: 'requester' or 'receiver' - determines which coach's view
        """
        base_dict = {
            'id': self.id,
            'status': self.status,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'request_message': self.request_message
        }
        
        if perspective == 'requester':
            # Requester sees their notes and the other coach's info
            base_dict.update({
                'coach_id': self.receiver_coach_id,
                'notes': self.notes,
                'tags': self.tags.split(',') if self.tags else []
            })
        else:  # receiver
            # Receiver sees the requester's info but not notes
            base_dict.update({
                'coach_id': self.requester_coach_id,
                'decline_reason': self.decline_reason if self.status == 'declined' else None
            })
        
        return base_dict
    
    @property
    def is_active(self):
        """Check if connection is active (accepted)"""
        return self.status == 'accepted'
    
    @property
    def is_pending(self):
        """Check if connection is pending"""
        return self.status == 'pending'
    
    def accept(self):
        """Accept the connection request"""
        self.status = 'accepted'
        self.responded_at = datetime.utcnow()
    
    def decline(self, reason=None):
        """Decline the connection request"""
        self.status = 'declined'
        self.responded_at = datetime.utcnow()
        if reason:
            self.decline_reason = reason
    
    def block(self):
        """Block the connection"""
        self.status = 'blocked'
        self.responded_at = datetime.utcnow()
    
    def __repr__(self):
        return f'<CoachConnection {self.id}: {self.requester_coach_id} -> {self.receiver_coach_id} ({self.status})>'
