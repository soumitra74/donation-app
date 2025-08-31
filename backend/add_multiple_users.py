#!/usr/bin/env python3
"""
Script to add multiple users with specific tower assignments
"""

import json
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole
from auth import auth_service

def add_multiple_users():
    """Add multiple users with their tower assignments"""
    
    # User data: email, name, assigned_towers
    users_data = [
        ("abhijit.banerjee5@gmail.com", "Abhijit Banerjee", [7, 8]),  # G and H
        ("bandpramit@gmail.com", "Pramit Bandyopadhyay", [1, 2, 10]),  # A, B and J
        ("abhijit.ray.chaudhury@gmail.com", "Abhijit Ray Chaudhury", [7, 8]),  # G and H
        ("indranil.cse@gmail.com", "Indranil Biswas", [8]),  # H
        ("paulsanjib@hotmail.com", "Sanjib Paul", [3, 4]),  # C and D
        ("subhra.roy@gmail.com", "Subhra Roy", [1, 2]),  # A and B
        ("sibnath_ghosh@yahoo.com", "Sibnath Ghosh", [1, 10]),  # A and J
        ("sumantamallick.ssr@gmail.com", "Sumanta Mallick", [4, 5, 6, 7]),  # D, E, F and G
        ("deep.mca84@gmail.com", "Sandeep Datta", [1, 2]),  # A and B
        ("surojeets@yahoo.com", "Surojeet Sengupta", [5, 6]),  # E and F
        ("soumitra.ghosh.iit@gmail.com", "Soumitra Ghosh", [3,4]),  # C and D
        ("admin@donationapp.com", "System Administrator", [1, 2, 3, 4, 5, 6, 7, 8, 10]),  # All towers
    ]
    
    password = "Welcome@123"
    
    with app.app_context():
        try:
            print("=" * 60)
            print("ADDING MULTIPLE USERS")
            print("=" * 60)
            
            for email, name, towers in users_data:
                print(f"\n👤 Processing: {name} ({email})")
                
                # Check if user already exists
                existing_user = User.query.filter_by(email=email).first()
                if existing_user:
                    print(f"  ⚠️  User already exists with ID: {existing_user.id}")
                    
                    # Update existing user's tower assignments
                    user_role = UserRole.query.filter_by(user_id=existing_user.id).first()
                    if user_role:
                        user_role.assigned_towers = json.dumps(towers)
                        # Update role to admin for admin@donationapp.com
                        if email == 'admin@donationapp.com':
                            user_role.role = 'admin'
                        db.session.commit()
                        print(f"  ✅ Updated tower assignments to: {towers}")
                    else:
                        # Create user role if it doesn't exist
                        role = 'admin' if email == 'admin@donationapp.com' else 'collector'
                        user_role = UserRole(
                            user_id=existing_user.id,
                            role=role,
                            assigned_towers=json.dumps(towers)
                        )
                        db.session.add(user_role)
                        db.session.commit()
                        print(f"  ✅ Created user role with towers: {towers}")
                        print(f"  ✅ Role: {role}")
                    
                    # Update password
                    password_hash = auth_service.hash_password(password)
                    existing_user.password_hash = password_hash
                    db.session.commit()
                    print(f"  ✅ Password updated")
                    
                    continue
                
                # Create new user
                user = User(
                    email=email,
                    name=name,
                    is_active=True
                )
                
                db.session.add(user)
                db.session.flush()  # Get user ID
                
                # Create user role with tower assignments
                # Assign admin role for admin@donationapp.com, collector for others
                role = 'admin' if email == 'admin@donationapp.com' else 'collector'
                user_role = UserRole(
                    user_id=user.id,
                    role=role,
                    assigned_towers=json.dumps(towers)
                )
                
                db.session.add(user_role)
                
                # Set password
                password_hash = auth_service.hash_password(password)
                user.password_hash = password_hash
                
                db.session.commit()
                
                # Convert tower numbers to letters for display
                tower_letters = [chr(64 + tower) for tower in towers]
                
                print(f"  ✅ Created user with ID: {user.id}")
                print(f"  ✅ Role: {role}")
                print(f"  ✅ Assigned Towers: {towers} ({', '.join(tower_letters)})")
                print(f"  ✅ Password: {password}")
            
            print(f"\n" + "=" * 60)
            print("SUMMARY")
            print("=" * 60)
            print(f"✅ All users processed successfully!")
            print(f"📧 Password for all users: {password}")
            print(f"🔐 Users have appropriate roles (admin for admin@donationapp.com, collector for others)")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating users: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    add_multiple_users()
