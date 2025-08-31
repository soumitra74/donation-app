#!/usr/bin/env python3
"""
Script to rebuild only the sponsorship table during Docker deployment
This script will drop and recreate the sponsorships table, then reseed it from CSV
"""

import sys
import os
import csv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import Sponsorship

def rebuild_sponsorships_table():
    """Rebuild only the sponsorship table by dropping and recreating it"""
    
    with app.app_context():
        try:
            print("🔄 Starting sponsorship table rebuild...")
            
            # Drop the sponsorships table with CASCADE to handle foreign key constraints
            print("🗑️  Dropping sponsorships table...")
            db.session.execute(db.text("DROP TABLE IF EXISTS sponsorships CASCADE"))
            db.session.commit()
            print("✅ Sponsorships table dropped")
            
            # Recreate the sponsorships table
            print("🏗️  Recreating sponsorships table...")
            Sponsorship.__table__.create(db.engine, checkfirst=True)
            print("✅ Sponsorships table recreated")
            
            # Seed from CSV
            print("\n🌱 Seeding sponsorship data from CSV...")
            seed_sponsorships_from_csv()
            
            print("\n🎉 Sponsorship table rebuild completed successfully!")
            
        except Exception as e:
            print(f"❌ Error rebuilding sponsorships table: {e}")
            db.session.rollback()
            sys.exit(1)

def seed_sponsorships_from_csv():
    """Seed the database with sponsorship data from donation-plan.csv file"""
    csv_file_path = os.path.join(os.path.dirname(__file__), 'donation-plan.csv')
    
    if not os.path.exists(csv_file_path):
        print(f"❌ CSV file not found at: {csv_file_path}")
        print("Please ensure donation-plan.csv exists in the backend directory")
        return
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            created_count = 0
            
            for row in reader:
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
                print(f"✅ Created sponsorship: {row['name']} - ₹{row['amount']} (Max: {row['max_count']})")
            
            db.session.commit()
            print(f"\n📊 Successfully created {created_count} sponsorships from CSV")
            
    except Exception as e:
        print(f"❌ Error reading CSV file: {e}")
        db.session.rollback()
        raise

if __name__ == "__main__":
    rebuild_sponsorships_table()
