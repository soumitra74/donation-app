#!/usr/bin/env python3
"""
Script to initialize the database tables
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole, Invite, Donor, Campaign, Donation

def init_database():
    """Initialize database tables"""
    
    with app.app_context():
        try:
            print("Creating database tables...")
            
            # Create all tables
            db.create_all()
            
            print("✅ Database tables created successfully!")
            
            # Verify tables were created
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"\n📋 Created tables: {', '.join(tables)}")
            
            # Show table schemas
            for table_name in tables:
                print(f"\nTable: {table_name}")
                columns = inspector.get_columns(table_name)
                for column in columns:
                    print(f"  - {column['name']}: {column['type']}")
            
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")
            db.session.rollback()
            sys.exit(1)

if __name__ == "__main__":
    init_database()
