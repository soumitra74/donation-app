"""
Database migration script for donation app
Run this script to update the database schema
"""

from app import app, db
from models import Donation, Donor, Campaign, User, Invite, UserRole, Sponsorship
from auth import auth_service
from datetime import datetime, timedelta
import json
import csv
import os

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

def migrate_user_qr_code():
    """Migrate the users table to include QR code fields"""
    with app.app_context():
        # Check if new columns exist
        inspector = db.inspect(db.engine)
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        
        # Add QR code data column if it doesn't exist
        if 'qr_code_data' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE users ADD COLUMN qr_code_data BLOB'))
                conn.commit()
            print("Added qr_code_data column")
        
        # Add QR code MIME type column if it doesn't exist
        if 'qr_code_mime_type' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE users ADD COLUMN qr_code_mime_type VARCHAR(50)'))
                conn.commit()
            print("Added qr_code_mime_type column")
        
        print("QR code migration completed successfully!")

def migrate_sponsorship_table():
    """Migrate to add the sponsorships table"""
    with app.app_context():
        # Check if sponsorships table exists
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        if 'sponsorships' not in existing_tables:
            # Create the sponsorships table
            Sponsorship.__table__.create(db.engine)
            print("Created sponsorships table")
        else:
            # Check if 'booked' column exists
            existing_columns = [col['name'] for col in inspector.get_columns('sponsorships')]
            if 'booked' not in existing_columns:
                with db.engine.connect() as conn:
                    conn.execute(db.text('ALTER TABLE sponsorships ADD COLUMN booked INTEGER DEFAULT 0'))
                    conn.commit()
                print("Added 'booked' column to sponsorships table")
            else:
                print("'booked' column already exists in sponsorships table")
        
        print("Sponsorship table migration completed!")

def migrate_donation_sponsorship():
    """Migrate donations table to add sponsorship_id column"""
    with app.app_context():
        # Check if sponsorship_id column exists
        inspector = db.inspect(db.engine)
        existing_columns = [col['name'] for col in inspector.get_columns('donations')]
        
        if 'sponsorship_id' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE donations ADD COLUMN sponsorship_id INTEGER'))
                conn.commit()
            print("Added sponsorship_id column to donations table")
        else:
            print("sponsorship_id column already exists in donations table")
        
        print("Donation sponsorship migration completed!")

def migrate_sponsorship_is_closed():
    """Migrate to rename is_booked to is_closed in sponsorships table"""
    with app.app_context():
        inspector = db.inspect(db.engine)
        existing_columns = [col['name'] for col in inspector.get_columns('sponsorships')]
        
        if 'is_booked' in existing_columns and 'is_closed' not in existing_columns:
            with db.engine.connect() as conn:
                conn.execute(db.text('ALTER TABLE sponsorships RENAME COLUMN is_booked TO is_closed'))
                conn.commit()
            print("Renamed is_booked to is_closed in sponsorships table")
        elif 'is_closed' in existing_columns:
            print("is_closed column already exists in sponsorships table")
        else:
            print("Neither is_booked nor is_closed column found in sponsorships table")
        
        print("Sponsorship is_closed migration completed!")

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
        # existing_donor1 = Donor.query.filter_by(email="john@example.com").first()
        # existing_donor2 = Donor.query.filter_by(email="jane@example.com").first()
        
        # if not existing_donor1:
        #     donor1 = Donor(name="John Doe", email="john@example.com", phone="1234567890")
        #     db.session.add(donor1)
        #     print("Created sample donor: John Doe")
        
        # if not existing_donor2:
        #     donor2 = Donor(name="Jane Smith", email="jane@example.com", phone="0987654321")
        #     db.session.add(donor2)
        #     print("Created sample donor: Jane Smith")
        
        # Check if sample campaign already exists
        existing_campaign = Campaign.query.filter_by(title="Apartment Donation Drive").first()
        if not existing_campaign:
            from datetime import datetime, timedelta
            campaign = Campaign(
                title="SSR Durga Puja 2025",
                description="Collecting donations from apartment residents",
                goal_amount=300000.00,
                start_date=datetime.now(),
                end_date=datetime.now() + timedelta(days=60),
                is_active=True
            )
            db.session.add(campaign)
            print("Created sample campaign: Apartment Donation Drive")
        
        db.session.commit()
        print("Sample data seeding completed!")

def seed_sample_sponsorships():
    """Seed the database with sample sponsorship data"""
    with app.app_context():
        # Check if sample sponsorships already exist
        existing_sponsorship1 = Sponsorship.query.filter_by(name="Gold Sponsor").first()
        existing_sponsorship2 = Sponsorship.query.filter_by(name="Silver Sponsor").first()
        existing_sponsorship3 = Sponsorship.query.filter_by(name="Bronze Sponsor").first()
        
        if not existing_sponsorship1:
            sponsorship1 = Sponsorship(
                name="Gold Sponsor",
                amount=10000.00,
                max_count=5,
                booked=0,
                is_closed=False
            )
            db.session.add(sponsorship1)
            print("Created sample sponsorship: Gold Sponsor")
        
        if not existing_sponsorship2:
            sponsorship2 = Sponsorship(
                name="Silver Sponsor",
                amount=5000.00,
                max_count=10,
                booked=0,
                is_closed=False
            )
            db.session.add(sponsorship2)
            print("Created sample sponsorship: Silver Sponsor")
        
        if not existing_sponsorship3:
            sponsorship3 = Sponsorship(
                name="Bronze Sponsor",
                amount=2500.00,
                max_count=20,
                booked=0,
                is_closed=False
            )
            db.session.add(sponsorship3)
            print("Created sample sponsorship: Bronze Sponsor")
        
        db.session.commit()
        print("Sample sponsorship data seeding completed!")

def seed_sponsorships_from_csv():
    """Seed the database with sponsorship data from donation-plan.csv file"""
    with app.app_context():
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

if __name__ == "__main__":
    print("Starting database migration...")
    create_tables()
    migrate_donation_table()
    migrate_user_qr_code()
    migrate_sponsorship_table()
    migrate_donation_sponsorship()
    migrate_sponsorship_is_closed()
    create_default_admin()
    create_sample_invites()
    seed_sample_data()
    # seed_sample_sponsorships()
    seed_sponsorships_from_csv()
    print("Migration completed!")
