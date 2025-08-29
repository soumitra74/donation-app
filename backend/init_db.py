#!/usr/bin/env python3
"""
Script to initialize the database tables
"""

import sys
import os
import csv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole, Invite, Donor, Campaign, Donation, Sponsorship

def seed_sponsorships_from_csv():
    """Seed the database with sponsorship data from donation-plan.csv file"""
    csv_file_path = os.path.join(os.path.dirname(__file__), 'donation-plan.csv')
    
    if not os.path.exists(csv_file_path):
        print(f"CSV file not found at: {csv_file_path}")
        print("Please ensure donation-plan.csv exists in the backend directory")
        return
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            created_count = 0
            skipped_count = 0
            
            for row in reader:
                # Check if sponsorship already exists
                existing_sponsorship = Sponsorship.query.filter_by(name=row['name']).first()
                
                if existing_sponsorship:
                    print(f"Skipped existing sponsorship: {row['name']}")
                    skipped_count += 1
                    continue
                
                # Create new sponsorship
                sponsorship = Sponsorship(
                    name=row['name'],
                    amount=float(row['amount']),
                    max_count=int(row['max_count']),
                    booked=0,
                    is_closed=False
                )
                
                db.session.add(sponsorship)
                created_count += 1
                print(f"Created sponsorship: {row['name']} - ₹{row['amount']} (Max: {row['max_count']})")
            
            db.session.commit()
            print(f"\nCSV sponsorship seeding completed!")
            print(f"Created: {created_count} sponsorships")
            print(f"Skipped: {skipped_count} existing sponsorships")
            
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        db.session.rollback()

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
            
            # Seed sponsorship data
            print("\n🌱 Seeding sponsorship data...")
            seed_sponsorships_from_csv()
            
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")
            db.session.rollback()
            sys.exit(1)

if __name__ == "__main__":
    init_database()
