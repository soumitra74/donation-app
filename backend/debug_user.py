#!/usr/bin/env python3
"""
Script to debug user login issues
"""

import sys
import os
import json

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole
from auth import auth_service

def debug_user(email):
    """Debug a specific user"""
    
    with app.app_context():
        try:
            print(f"🔍 Debugging user: {email}")
            print("=" * 50)
            
            # Find the user
            user = User.query.filter_by(email=email).first()
            if not user:
                print(f"❌ User {email} not found!")
                return
            
            print(f"✅ User found:")
            print(f"   ID: {user.id}")
            print(f"   Name: {user.name}")
            print(f"   Email: {user.email}")
            print(f"   Active: {user.is_active}")
            print(f"   Has password_hash: {bool(user.password_hash)}")
            
            if user.password_hash:
                print(f"   Password hash length: {len(user.password_hash)}")
                print(f"   Password hash starts with: {user.password_hash[:10]}...")
            else:
                print(f"   ❌ No password hash found!")
            
            # Check user roles
            user_roles = UserRole.query.filter_by(user_id=user.id).all()
            if user_roles:
                for role in user_roles:
                    print(f"   Role: {role.role}")
                    if role.assigned_towers:
                        towers = json.loads(role.assigned_towers)
                        tower_letters = [chr(64 + tower) for tower in towers]
                        print(f"   Assigned Towers: {towers} ({', '.join(tower_letters)})")
            else:
                print(f"   ❌ No user roles found!")
            
            # Test password verification
            test_password = "Welcome@123"
            if user.password_hash:
                is_valid = auth_service.verify_password(test_password, user.password_hash)
                print(f"   Password verification test: {'✅ Valid' if is_valid else '❌ Invalid'}")
            else:
                print(f"   ❌ Cannot test password - no hash found")
            
        except Exception as e:
            print(f"❌ Error debugging user: {e}")

def test_login(email, password):
    """Test login functionality"""
    
    with app.app_context():
        try:
            print(f"\n🔐 Testing login for: {email}")
            print("=" * 50)
            
            # Find user
            user = User.query.filter_by(email=email).first()
            if not user:
                print(f"❌ User not found")
                return
            
            if not user.is_active:
                print(f"❌ User is not active")
                return
            
            if not user.password_hash:
                print(f"❌ No password hash found")
                return
            
            # Verify password
            if auth_service.verify_password(password, user.password_hash):
                print(f"✅ Password verification successful")
                
                # Get user roles
                roles = auth_service.get_user_roles(user.id)
                print(f"✅ User roles: {roles}")
                
                # Generate token
                token = auth_service.generate_token(user.id, user.email, roles)
                print(f"✅ Token generated successfully")
                print(f"   Token length: {len(token)}")
                
            else:
                print(f"❌ Password verification failed")
                
        except Exception as e:
            print(f"❌ Error testing login: {e}")

if __name__ == "__main__":
    email = "deep.mca84@gmail.com"
    password = "Welcome@123"
    
    debug_user(email)
    test_login(email, password)
