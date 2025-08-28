"""
Authentication service for the donation app
Handles password hashing, JWT tokens, and Google OAuth
"""

import jwt
import bcrypt
import requests
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from models import User, Invite, UserRole, db
import json

class AuthService:
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
        app.config.setdefault('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
        app.config.setdefault('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=24))
        app.config.setdefault('GOOGLE_CLIENT_ID', 'your-google-client-id')
    
    def hash_password(self, password):
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')  # Convert bytes to string for database storage
    
    def verify_password(self, password, password_hash):
        """Verify a password against its hash"""
        # password_hash from database is already a string, so we need to encode it back to bytes
        if isinstance(password_hash, str):
            password_hash = password_hash.encode('utf-8')
        return bcrypt.checkpw(password.encode('utf-8'), password_hash)
    
    def generate_token(self, user_id, email, roles):
        """Generate JWT token for user"""
        payload = {
            'user_id': user_id,
            'email': email,
            'roles': roles,
            'exp': datetime.utcnow() + self.app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    def verify_token(self, token):
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def verify_google_token(self, google_token):
        """Verify Google OAuth token and get user info"""
        try:
            # Verify the token with Google
            response = requests.get(
                'https://www.googleapis.com/oauth2/v3/tokeninfo',
                params={'access_token': google_token}
            )
            
            if response.status_code != 200:
                return None
            
            token_info = response.json()
            
            # Verify the token is for our app
            if token_info.get('aud') != self.app.config['GOOGLE_CLIENT_ID']:
                return None
            
            # Get user info
            user_info_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {google_token}'}
            )
            
            if user_info_response.status_code != 200:
                return None
            
            return user_info_response.json()
        except Exception as e:
            current_app.logger.error(f"Google token verification error: {e}")
            return None
    
    def get_user_roles(self, user_id):
        """Get user roles and tower assignments"""
        user_roles = UserRole.query.filter_by(user_id=user_id).all()
        roles = []
        for user_role in user_roles:
            role_data = {
                'role': user_role.role,
                'assigned_towers': json.loads(user_role.assigned_towers) if user_role.assigned_towers else []
            }
            roles.append(role_data)
        return roles
    
    def has_role(self, user_id, required_role):
        """Check if user has a specific role"""
        user_role = UserRole.query.filter_by(user_id=user_id, role=required_role).first()
        return user_role is not None
    
    def can_access_tower(self, user_id, tower):
        """Check if user can access a specific tower"""
        user_roles = UserRole.query.filter_by(user_id=user_id).all()
        
        for user_role in user_roles:
            if user_role.role == 'admin':
                return True  # Admins can access all towers
            
            if user_role.assigned_towers:
                assigned_towers = json.loads(user_role.assigned_towers)
                if tower in assigned_towers:
                    return True
        
        return False

# Initialize auth service
auth_service = AuthService()

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'No authorization token provided'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = auth_service.verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to request
        request.user_id = payload['user_id']
        request.user_email = payload['email']
        request.user_roles = payload['roles']
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(required_role):
    """Decorator to require a specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'user_roles'):
                return jsonify({'error': 'Authentication required'}), 401
            
            user_roles = [role['role'] for role in request.user_roles]
            if required_role not in user_roles:
                return jsonify({'error': f'Role {required_role} required'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_tower_access(tower_param='tower'):
    """Decorator to require tower access"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'user_id'):
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get tower from URL parameter or request body
            tower = kwargs.get(tower_param) or request.json.get('tower')
            
            if not auth_service.can_access_tower(request.user_id, int(tower)):
                return jsonify({'error': f'Access denied to tower {tower}'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
