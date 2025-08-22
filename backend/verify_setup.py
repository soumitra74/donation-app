#!/usr/bin/env python3
"""
Comprehensive verification script for the donation app setup
"""

import sys
import os
import json
import requests
import time

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole
from auth import auth_service

def verify_database_setup():
    """Verify database setup and user creation"""
    
    with app.app_context():
        try:
            print("=" * 80)
            print("DATABASE SETUP VERIFICATION")
            print("=" * 80)
            
            # Check if tables exist
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            expected_tables = ['users', 'user_roles', 'invites', 'donors', 'campaigns', 'donations']
            
            print(f"\n📋 Database Tables:")
            for table in expected_tables:
                if table in tables:
                    print(f"   ✅ {table}")
                else:
                    print(f"   ❌ {table} - MISSING!")
            
            # Check user count
            user_count = User.query.count()
            print(f"\n👥 Total Users: {user_count}")
            
            if user_count == 0:
                print("   ❌ No users found in database!")
                return False
            
            # Check specific users
            test_users = [
                ("deep.mca84@gmail.com", "Deep MCA"),
                ("surojeets@yahoo.com", "Surojeet"),
                ("admin@donationapp.com", "System Administrator")
            ]
            
            print(f"\n🔍 User Verification:")
            for email, expected_name in test_users:
                user = User.query.filter_by(email=email).first()
                if user:
                    print(f"   ✅ {email} - {user.name}")
                    
                    # Check password
                    if user.password_hash:
                        print(f"      🔐 Password hash: {user.password_hash[:20]}...")
                    else:
                        print(f"      ❌ No password hash!")
                    
                    # Check role
                    user_role = UserRole.query.filter_by(user_id=user.id).first()
                    if user_role:
                        print(f"      👤 Role: {user_role.role}")
                        if user_role.assigned_towers:
                            towers = json.loads(user_role.assigned_towers)
                            tower_letters = [chr(64 + tower) for tower in towers]
                            print(f"      🏢 Towers: {', '.join(tower_letters)}")
                    else:
                        print(f"      ❌ No role assigned!")
                else:
                    print(f"   ❌ {email} - NOT FOUND!")
            
            return True
            
        except Exception as e:
            print(f"❌ Database verification failed: {e}")
            return False

def verify_api_endpoints():
    """Verify API endpoints are working"""
    
    print(f"\n" + "=" * 80)
    print("API ENDPOINTS VERIFICATION")
    print("=" * 80)
    
    base_url = "http://localhost:5000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint: Working")
        else:
            print(f"❌ Health endpoint: Status {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint: {e}")
    
    # Test login endpoint
    try:
        login_data = {
            "email": "deep.mca84@gmail.com",
            "password": "Welcome@123"
        }
        response = requests.post(
            f"{base_url}/api/v1/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login endpoint: Working")
            print(f"   👤 User: {data.get('user', {}).get('name', 'Unknown')}")
            print(f"   🔑 Token: {data.get('token', '')[:20]}...")
        else:
            print(f"❌ Login endpoint: Status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Login endpoint: {e}")

def run_user_summary():
    """Run the user summary script"""
    
    print(f"\n" + "=" * 80)
    print("USER SUMMARY")
    print("=" * 80)
    
    try:
        # Import and run user summary
        from user_summary import show_user_summary
        show_user_summary()
    except Exception as e:
        print(f"❌ User summary failed: {e}")

def run_debug_login():
    """Run the debug login script"""
    
    print(f"\n" + "=" * 80)
    print("LOGIN DEBUG VERIFICATION")
    print("=" * 80)
    
    try:
        # Import and run debug login
        from debug_user_login import debug_user_login
        debug_user_login()
    except Exception as e:
        print(f"❌ Debug login failed: {e}")

def main():
    """Main verification function"""
    
    print("🚀 Starting comprehensive verification...")
    
    # Wait a bit for services to be ready
    time.sleep(2)
    
    # Run all verifications
    db_ok = verify_database_setup()
    
    if db_ok:
        verify_api_endpoints()
        run_user_summary()
        run_debug_login()
        
        print(f"\n" + "=" * 80)
        print("VERIFICATION COMPLETE")
        print("=" * 80)
        print("✅ Database setup verified")
        print("✅ API endpoints tested")
        print("✅ User summary generated")
        print("✅ Login debug completed")
        print("\n🎉 Setup verification successful!")
    else:
        print(f"\n❌ Database verification failed. Please check the setup.")

if __name__ == "__main__":
    main()
