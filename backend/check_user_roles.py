#!/usr/bin/env python3
"""
Script to check user roles and tower assignments
"""

import sys
import os
import json

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole

def check_user_roles():
    """Check user roles and tower assignments"""
    
    with app.app_context():
        try:
            print("=" * 60)
            print("USER ROLES AND TOWER ASSIGNMENTS")
            print("=" * 60)
            
            # Get all users with their roles
            users = User.query.all()
            
            for user in users:
                print(f"\n👤 User: {user.name} ({user.email})")
                print(f"   ID: {user.id}")
                print(f"   Active: {user.is_active}")
                
                # Get user roles
                user_roles = UserRole.query.filter_by(user_id=user.id).all()
                
                if user_roles:
                    for role in user_roles:
                        print(f"   Role: {role.role}")
                        if role.assigned_towers:
                            towers = json.loads(role.assigned_towers)
                            tower_letters = [chr(64 + tower) for tower in towers]  # Convert to A, B, C, etc.
                            print(f"   Assigned Towers: {towers} ({', '.join(tower_letters)})")
                        else:
                            print(f"   Assigned Towers: None")
                else:
                    print(f"   Roles: None assigned")
                
                print()
            
        except Exception as e:
            print(f"Error checking user roles: {e}")

if __name__ == "__main__":
    check_user_roles()
