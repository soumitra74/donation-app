#!/usr/bin/env python3
"""
Script to reset and reseed sponsorship data from donation-plan.csv
"""

import sys
import os
import csv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import Sponsorship

def reset_and_seed_sponsorships():
    """Reset all sponsorship data and reseed from CSV"""
    
    with app.app_context():
        try:
            print("🗑️  Clearing existing sponsorship data...")
            
            # Delete all existing sponsorships
            deleted_count = Sponsorship.query.delete()
            db.session.commit()
            print(f"✅ Deleted {deleted_count} existing sponsorships")
            
            # Seed from CSV
            print("\n🌱 Seeding sponsorship data from CSV...")
            seed_sponsorships_from_csv()
            
        except Exception as e:
            print(f"❌ Error resetting sponsorships: {e}")
            db.session.rollback()
            sys.exit(1)

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
            print(f"\n🎉 Sponsorship seeding completed!")
            print(f"📊 Created {created_count} sponsorships from CSV")
            
    except Exception as e:
        print(f"❌ Error reading CSV file: {e}")
        db.session.rollback()

if __name__ == "__main__":
    reset_and_seed_sponsorships()
