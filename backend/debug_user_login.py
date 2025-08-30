#!/usr/bin/env python3
"""
Script to debug user login issues
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole
from auth import auth_service

def debug_user_login():
    """Debug login issues for specific users"""
    
    with app.app_context():
        try:
            # Check the specific user
            email = "deep.mca84@gmail.com"
            password = "Welcome@123"
            
            print("=" * 60)
            print("DEBUGGING USER LOGIN")
            print("=" * 60)
            
            # Find the user
            user = User.query.filter_by(email=email).first()
            if not user:
                print(f"❌ User {email} not found in database!")
                return
            
            print(f"✅ User found:")
            print(f"   ID: {user.id}")
            print(f"   Name: {user.name}")
            print(f"   Email: {user.email}")
            print(f"   Active: {user.is_active}")
            print(f"   Has password_hash: {bool(user.password_hash)}")
            
            if user.password_hash:
                print(f"   Password hash: {user.password_hash[:20]}...")
                
                # Test password verification
                is_valid = auth_service.verify_password(password, user.password_hash)
                print(f"   Password verification: {'✅ Valid' if is_valid else '❌ Invalid'}")
                
                # Test with wrong password
                is_wrong_valid = auth_service.verify_password("wrongpassword", user.password_hash)
                print(f"   Wrong password test: {'❌ Should be invalid' if not is_wrong_valid else '⚠️  Unexpectedly valid'}")
            else:
                print(f"   ❌ No password hash set!")
            
            # Check user role
            user_role = UserRole.query.filter_by(user_id=user.id).first()
            if user_role:
                print(f"   Role: {user_role.role}")
                if user_role.assigned_towers:
                    import json
                    towers = json.loads(user_role.assigned_towers)
                    tower_letters = [chr(64 + tower) for tower in towers]
                    print(f"   Assigned Towers: {towers} ({', '.join(tower_letters)})")
            else:
                print(f"   ❌ No user role assigned!")
            
            print()
            
            # Test password hashing
            print("Testing password hashing:")
            test_hash = auth_service.hash_password(password)
            print(f"   New hash for '{password}': {test_hash.decode('utf-8')[:20]}...")
            
            # Verify the new hash
            test_verify = auth_service.verify_password(password, test_hash.decode('utf-8'))
            print(f"   Verification of new hash: {'✅ Valid' if test_verify else '❌ Invalid'}")
            
            # Compare with stored hash
            if user.password_hash:
                print(f"   Stored hash: {user.password_hash[:20]}...")
                print(f"   New hash:   {test_hash.decode('utf-8')[:20]}...")
                print(f"   Hashes match: {'✅ Yes' if user.password_hash == test_hash.decode('utf-8') else '❌ No'}")
            
        except Exception as e:
            print(f"❌ Error debugging user: {e}")

if __name__ == "__main__":
    debug_user_login()
