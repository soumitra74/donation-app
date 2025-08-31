#!/usr/bin/env python3
"""
Database migration script to convert amount fields from Numeric to Integer
This script updates the existing database schema to use integer amounts instead of decimal amounts
"""

from app import app, db
from models import Donation, Sponsorship, Campaign
from sqlalchemy import text
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_amount_fields():
    """Migrate amount fields from Numeric to Integer"""
    with app.app_context():
        try:
            logger.info("Starting amount field migration...")
            
            # 1. Create temporary columns
            logger.info("Creating temporary columns...")
            db.session.execute(text("""
                ALTER TABLE donations 
                ADD COLUMN amount_int INTEGER
            """))
            
            db.session.execute(text("""
                ALTER TABLE sponsorships 
                ADD COLUMN amount_int INTEGER
            """))
            
            db.session.execute(text("""
                ALTER TABLE campaigns 
                ADD COLUMN goal_amount_int INTEGER,
                ADD COLUMN current_amount_int INTEGER
            """))
            
            # 2. Convert existing data
            logger.info("Converting existing data...")
            db.session.execute(text("""
                UPDATE donations 
                SET amount_int = CAST(amount AS INTEGER)
                WHERE amount IS NOT NULL
            """))
            
            db.session.execute(text("""
                UPDATE sponsorships 
                SET amount_int = CAST(amount AS INTEGER)
                WHERE amount IS NOT NULL
            """))
            
            db.session.execute(text("""
                UPDATE campaigns 
                SET goal_amount_int = CAST(goal_amount AS INTEGER),
                    current_amount_int = CAST(current_amount AS INTEGER)
                WHERE goal_amount IS NOT NULL
            """))
            
            # 3. Drop old columns
            logger.info("Dropping old columns...")
            db.session.execute(text("ALTER TABLE donations DROP COLUMN amount"))
            db.session.execute(text("ALTER TABLE sponsorships DROP COLUMN amount"))
            db.session.execute(text("ALTER TABLE campaigns DROP COLUMN goal_amount"))
            db.session.execute(text("ALTER TABLE campaigns DROP COLUMN current_amount"))
            
            # 4. Rename new columns
            logger.info("Renaming new columns...")
            db.session.execute(text("ALTER TABLE donations RENAME COLUMN amount_int TO amount"))
            db.session.execute(text("ALTER TABLE sponsorships RENAME COLUMN amount_int TO amount"))
            db.session.execute(text("ALTER TABLE campaigns RENAME COLUMN goal_amount_int TO goal_amount"))
            db.session.execute(text("ALTER TABLE campaigns RENAME COLUMN current_amount_int TO current_amount"))
            
            # 5. Add NOT NULL constraints
            logger.info("Adding NOT NULL constraints...")
            db.session.execute(text("ALTER TABLE donations ALTER COLUMN amount SET NOT NULL"))
            db.session.execute(text("ALTER TABLE sponsorships ALTER COLUMN amount SET NOT NULL"))
            db.session.execute(text("ALTER TABLE campaigns ALTER COLUMN goal_amount SET NOT NULL"))
            
            # 6. Set default for current_amount
            db.session.execute(text("ALTER TABLE campaigns ALTER COLUMN current_amount SET DEFAULT 0"))
            
            db.session.commit()
            logger.info("Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Migration failed: {str(e)}")
            raise

def verify_migration():
    """Verify that the migration was successful"""
    with app.app_context():
        try:
            logger.info("Verifying migration...")
            
            # Check donations
            donations = Donation.query.limit(5).all()
            for donation in donations:
                logger.info(f"Donation {donation.id}: amount = {donation.amount} (type: {type(donation.amount)})")
            
            # Check sponsorships
            sponsorships = Sponsorship.query.limit(5).all()
            for sponsorship in sponsorships:
                logger.info(f"Sponsorship {sponsorship.id}: amount = {sponsorship.amount} (type: {type(sponsorship.amount)})")
            
            # Check campaigns
            campaigns = Campaign.query.limit(5).all()
            for campaign in campaigns:
                logger.info(f"Campaign {campaign.id}: goal_amount = {campaign.goal_amount}, current_amount = {campaign.current_amount}")
            
            logger.info("Verification completed successfully!")
            
        except Exception as e:
            logger.error(f"Verification failed: {str(e)}")
            raise

if __name__ == "__main__":
    print("Database Migration: Converting amount fields to Integer")
    print("=" * 60)
    
    # Ask for confirmation
    response = input("This will modify your database schema. Are you sure you want to continue? (y/N): ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        exit(0)
    
    try:
        migrate_amount_fields()
        verify_migration()
        print("\nMigration completed successfully!")
        print("All amount fields have been converted to Integer type.")
        
    except Exception as e:
        print(f"\nMigration failed: {str(e)}")
        print("Please check the logs for more details.")
        exit(1)
