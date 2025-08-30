#!/usr/bin/env python3
"""
Script to show a clean summary of all users and their tower assignments
"""

import sys
import os
import json

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, UserRole

def show_user_summary():
    """Show a clean summary of all users"""
    
    with app.app_context():
        try:
            print("=" * 80)
            print("DONATION APP - USER SUMMARY")
            print("=" * 80)
            
            # Get all users with their roles
            users = User.query.order_by(User.id).all()
            
            print(f"\n📊 Total Users: {len(users)}")
            print(f"🔐 Default Password: Welcome@123 (for all collector users)")
            print(f"🔑 Admin Password: Set individually")
            
            print(f"\n" + "=" * 80)
            print("USER DETAILS")
            print("=" * 80)
            
            for user in users:
                print(f"\n👤 {user.name}")
                print(f"   📧 Email: {user.email}")
                print(f"   🆔 ID: {user.id}")
                print(f"   ✅ Status: {'Active' if user.is_active else 'Inactive'}")
                
                # Get user roles
                user_roles = UserRole.query.filter_by(user_id=user.id).all()
                
                if user_roles:
                    for role in user_roles:
                        print(f"   🔐 Role: {role.role}")
                        if role.assigned_towers:
                            towers = json.loads(role.assigned_towers)
                            tower_letters = [chr(64 + tower) for tower in towers]
                            print(f"   🏢 Assigned Blocks: {', '.join(tower_letters)} (Towers: {towers})")
                        else:
                            print(f"   🏢 Assigned Blocks: All blocks (Admin)")
                else:
                    print(f"   🔐 Role: None assigned")
                
                print()
            
            print("=" * 80)
            print("BLOCK ASSIGNMENT SUMMARY")
            print("=" * 80)
            
            # Create a mapping of blocks to users
            block_assignments = {}
            for i in range(1, 11):  # Towers 1-10
                block_letter = chr(64 + i)  # A, B, C, etc.
                block_assignments[block_letter] = []
            
            for user in users:
                user_roles = UserRole.query.filter_by(user_id=user.id).all()
                for role in user_roles:
                    if role.assigned_towers:
                        towers = json.loads(role.assigned_towers)
                        for tower in towers:
                            block_letter = chr(64 + tower)
                            block_assignments[block_letter].append(user.name)
            
            for block_letter, users_list in block_assignments.items():
                if users_list:
                    print(f"🏢 Block {block_letter}: {', '.join(users_list)}")
                else:
                    print(f"🏢 Block {block_letter}: No users assigned")
            
        except Exception as e:
            print(f"Error showing user summary: {e}")

if __name__ == "__main__":
    show_user_summary()
