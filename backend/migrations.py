"""
Database migration script for donation app
Run this script to update the database schema
"""

from app import app, db
from models import Donation, Donor, Campaign, User, Invite, UserRole
from auth import auth_service
from datetime import datetime, timedelta
import json

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
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN tower INTEGER'))
                conn.commit()
            print("Added tower column")
        
        if 'floor' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN floor INTEGER'))
                conn.commit()
            print("Added floor column")
        
        if 'unit' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN unit INTEGER'))
                conn.commit()
            print("Added unit column")
        
        if 'donor_name' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN donor_name VARCHAR(100)'))
                conn.commit()
            print("Added donor_name column")
        
        if 'phone_number' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN phone_number VARCHAR(20)'))
                conn.commit()
            print("Added phone_number column")
        
        if 'head_count' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN head_count INTEGER'))
                conn.commit()
            print("Added head_count column")
        
        if 'upi_other_person' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN upi_other_person VARCHAR(100)'))
                conn.commit()
            print("Added upi_other_person column")
        
        if 'sponsorship' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN sponsorship VARCHAR(200)'))
                conn.commit()
            print("Added sponsorship column")
        
        if 'volunteer_id' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN volunteer_id VARCHAR(50)'))
                conn.commit()
            print("Added volunteer_id column")
        
        if 'volunteer_name' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN volunteer_name VARCHAR(100)'))
                conn.commit()
            print("Added volunteer_name column")
        
        if 'user_id' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN user_id INTEGER'))
                conn.commit()
            print("Added user_id column")
        
        # Make foreign keys nullable (SQLite doesn't support ALTER COLUMN DROP NOT NULL)
        print("Migration completed successfully!")

def create_default_admin():
    """Create a default admin user"""
    with app.app_context():
        # Check if admin user already exists
        admin_user = User.query.filter_by(email='admin@donationapp.com').first()
        if admin_user:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin_password = "admin123"  # Change this in production!
        password_hash = auth_service.hash_password(admin_password)
        
        admin_user = User(
            email='admin@donationapp.com',
            name='System Administrator',
            password_hash=password_hash,
            is_active=True
        )
        
        db.session.add(admin_user)
        db.session.flush()  # Get user ID
        
        # Create admin role with access to all towers
        admin_role = UserRole(
            user_id=admin_user.id,
            role='admin',
            assigned_towers=json.dumps(list(range(1, 11)))  # Towers 1-10
        )
        
        db.session.add(admin_role)
        db.session.commit()
        
        print(f"Default admin user created:")
        print(f"Email: admin@donationapp.com")
        print(f"Password: {admin_password}")
        print("⚠️  IMPORTANT: Change this password in production!")

def create_sample_invites():
    """Create sample invites for testing"""
    with app.app_context():
        # Check if admin user exists
        admin_user = User.query.filter_by(email='admin@donationapp.com').first()
        if not admin_user:
            print("Admin user not found, creating sample invites skipped")
            return
        
        # Check if sample invite already exists
        existing_invite = Invite.query.filter_by(invite_code='COLL1234').first()
        if existing_invite:
            print("Sample invite already exists")
            return
        
        # Create sample collector invite
        collector_invite = Invite(
            email='collector@example.com',
            name='Sample Collector',
            invite_code='COLL1234',
            system_password='collector123',
            assigned_towers=json.dumps([1, 2, 3]),  # Towers 1, 2, 3
            role='collector',
            expires_at=datetime.utcnow() + timedelta(days=30),
            created_by=admin_user.id
        )
        
        db.session.add(collector_invite)
        db.session.commit()
        
        print("Sample collector invite created:")
        print(f"Email: collector@example.com")
        print(f"Invite Code: COLL1234")
        print(f"System Password: collector123")
        print(f"Assigned Towers: 1, 2, 3")

def seed_sample_data():
    """Seed the database with sample data"""
    with app.app_context():
        # Check if sample donors already exist
        existing_donor1 = Donor.query.filter_by(email="john@example.com").first()
        existing_donor2 = Donor.query.filter_by(email="jane@example.com").first()
        
        if not existing_donor1:
            donor1 = Donor(name="John Doe", email="john@example.com", phone="1234567890")
            db.session.add(donor1)
            print("Created sample donor: John Doe")
        
        if not existing_donor2:
            donor2 = Donor(name="Jane Smith", email="jane@example.com", phone="0987654321")
            db.session.add(donor2)
            print("Created sample donor: Jane Smith")
        
        # Check if sample campaign already exists
        existing_campaign = Campaign.query.filter_by(title="Apartment Donation Drive").first()
        if not existing_campaign:
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
            print("Created sample campaign: Apartment Donation Drive")
        
        db.session.commit()
        print("Sample data seeding completed!")

if __name__ == "__main__":
    print("Starting database migration...")
    create_tables()
    migrate_donation_table()
    create_default_admin()
    create_sample_invites()
    seed_sample_data()
    print("Migration completed!")
