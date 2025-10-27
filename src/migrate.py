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

