#!/usr/bin/env python3
"""
Migration script to add coach_assignment table
Run this script to apply the migration to your database
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.main import app, db

def run_migration():
    """Run the SQL migration"""
    migration_file = os.path.join(os.path.dirname(__file__), 'add_coach_assignment_table.sql')
    
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    with app.app_context():
        try:
            # Execute the SQL migration
            db.session.execute(db.text(sql))
            db.session.commit()
            print("✅ Migration completed successfully!")
            print("   - Created assignment_status enum type")
            print("   - Created coach_assignment table")
            print("   - Created indexes for performance")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Migration failed: {e}")
            sys.exit(1)

if __name__ == '__main__':
    print("Running migration: add_coach_assignment_table")
    print("=" * 50)
    run_migration()
