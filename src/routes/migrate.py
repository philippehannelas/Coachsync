"""
Migration endpoint to add notes column to booking table
This is a one-time migration - call once and then remove this file
"""

from flask import Blueprint, jsonify
from src.models.user import db

migrate_bp = Blueprint('migrate', __name__)

@migrate_bp.route('/migrate/add-booking-notes', methods=['POST'])
def add_booking_notes_column():
    """
    Add notes column to booking table if it doesn't exist
    This is safe to run multiple times (uses IF NOT EXISTS)
    """
    try:
        # Raw SQL to add column if it doesn't exist
        sql = """
        ALTER TABLE booking 
        ADD COLUMN IF NOT EXISTS notes TEXT;
        """
        
        db.session.execute(db.text(sql))
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Migration completed successfully. Notes column added to booking table.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Migration failed: {str(e)}'
        }), 500
"""
Migration to add event type support to bookings
Adds: event_type, event_title, is_recurring, recurring_days, recurring_end_date, parent_event_id
"""

from flask import Blueprint, jsonify
from src.models.user import db

migrate_events_bp = Blueprint('migrate_events', __name__)

@migrate_events_bp.route('/migrate/add-event-types', methods=['POST', 'GET'])
def add_event_types():
    """
    Add event type fields to booking table
    Safe to run multiple times (uses IF NOT EXISTS)
    """
    try:
        # Create ENUM type for event_type
        sql_enum = """
        DO $$ BEGIN
            CREATE TYPE event_type AS ENUM ('customer_session', 'personal_event');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
        
        # Add columns
        sql_columns = """
        ALTER TABLE booking 
        ADD COLUMN IF NOT EXISTS event_type event_type DEFAULT 'customer_session',
        ADD COLUMN IF NOT EXISTS event_title VARCHAR(200),
        ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS recurring_days JSON,
        ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
        ADD COLUMN IF NOT EXISTS parent_event_id VARCHAR(36);
        """
        
        # Make customer_id nullable for personal events
        sql_nullable = """
        ALTER TABLE booking 
        ALTER COLUMN customer_id DROP NOT NULL;
        """
        
        db.session.execute(db.text(sql_enum))
        db.session.execute(db.text(sql_columns))
        db.session.execute(db.text(sql_nullable))
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Migration completed successfully. Event type fields added to booking table.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Migration failed: {str(e)}'
        }), 500

