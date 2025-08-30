#!/usr/bin/env python3
"""
Script to set a password for a user
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User
from auth import auth_service

def set_user_password():
    """Set password for user surojeets@yahoo.com"""
    
    with app.app_context():
        try:
            # Find the user
            user = User.query.filter_by(email="surojeets@yahoo.com").first()
            if not user:
                print("User surojeets@yahoo.com not found!")
                return
            
            # Set a default password
            password = "Surojeet123!"  # You can change this password
            password_hash = auth_service.hash_password(password)
            
            # Update user's password
            user.password_hash = password_hash.decode('utf-8')
            db.session.commit()
            
            print(f"Password set successfully for user: surojeets@yahoo.com")
            print(f"Email: surojeets@yahoo.com")
            print(f"Password: {password}")
            print(f"User ID: {user.id}")
            print("\nIMPORTANT: Please change this password after first login!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error setting password: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    set_user_password()
