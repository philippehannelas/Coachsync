#!/usr/bin/env python3
"""
Migration runner for coach_connections table
Adds Coach Network system database schema
"""

import os
import sys

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.models.user import db
from src.main import app

def run_migration():
    """Run the coach_connections migration"""
    migration_file = os.path.join(os.path.dirname(__file__), 'add_coach_connections_table.sql')
    
    print("Running migration: add_coach_connections_table")
    print("=" * 50)
    
    try:
        with app.app_context():
            # Read SQL file
            with open(migration_file, 'r') as f:
                sql = f.read()
            
            # Execute SQL
            db.session.execute(db.text(sql))
            db.session.commit()
            
            print("✅ Migration completed successfully!")
            print("   - Created coach_connections table")
            print("   - Created indexes for performance")
            print("   - Added rating columns to coach_assignment table")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        db.session.rollback()
        sys.exit(1)

if __name__ == '__main__':
    run_migration()
