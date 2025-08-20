"""
Database migration script for donation app
Run this script to update the database schema
"""

from app import app, db
from models import Donation, Donor, Campaign

def create_tables():
    """Create all tables"""
    with app.app_context():
        db.create_all()
        print("All tables created successfully!")

def migrate_donation_table():
    """Migrate the donation table to include new apartment fields"""
    with app.app_context():
        # Check if new columns exist
        inspector = db.inspect(db.engine)
        existing_columns = [col['name'] for col in inspector.get_columns('donations')]
        
        # Add new columns if they don't exist
        if 'tower' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN tower INTEGER')
            print("Added tower column")
        
        if 'floor' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN floor INTEGER')
            print("Added floor column")
        
        if 'unit' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN unit INTEGER')
            print("Added unit column")
        
        if 'donor_name' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN donor_name VARCHAR(100)')
            print("Added donor_name column")
        
        if 'phone_number' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN phone_number VARCHAR(20)')
            print("Added phone_number column")
        
        if 'head_count' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN head_count INTEGER')
            print("Added head_count column")
        
        if 'upi_other_person' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN upi_other_person VARCHAR(100)')
            print("Added upi_other_person column")
        
        if 'sponsorship' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN sponsorship VARCHAR(200)')
            print("Added sponsorship column")
        
        if 'volunteer_id' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN volunteer_id VARCHAR(50)')
            print("Added volunteer_id column")
        
        if 'volunteer_name' not in existing_columns:
            db.engine.execute('ALTER TABLE donations ADD COLUMN volunteer_name VARCHAR(100)')
            print("Added volunteer_name column")
        
        # Make foreign keys nullable
        try:
            db.engine.execute('ALTER TABLE donations ALTER COLUMN donor_id DROP NOT NULL')
            print("Made donor_id nullable")
        except:
            print("donor_id already nullable or not supported")
        
        try:
            db.engine.execute('ALTER TABLE donations ALTER COLUMN campaign_id DROP NOT NULL')
            print("Made campaign_id nullable")
        except:
            print("campaign_id already nullable or not supported")
        
        print("Migration completed successfully!")

def seed_sample_data():
    """Seed the database with sample data"""
    with app.app_context():
        # Create sample donors
        donor1 = Donor(name="John Doe", email="john@example.com", phone="1234567890")
        donor2 = Donor(name="Jane Smith", email="jane@example.com", phone="0987654321")
        
        db.session.add(donor1)
        db.session.add(donor2)
        
        # Create sample campaign
        from datetime import datetime, timedelta
        campaign = Campaign(
            title="Apartment Donation Drive",
            description="Collecting donations from apartment residents",
            goal_amount=100000.00,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            is_active=True
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        print("Sample data seeded successfully!")

if __name__ == "__main__":
    print("Starting database migration...")
    create_tables()
    migrate_donation_table()
    seed_sample_data()
    print("Migration completed!")
