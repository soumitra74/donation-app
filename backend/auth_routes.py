"""
Authentication routes for the donation app
Handles login, registration, invite management, and Google OAuth
"""

from flask import Blueprint, request, jsonify
from models import User, Invite, UserRole, db
from schemas import register_schema, login_schema, google_auth_schema, invite_schema, invites_schema, user_schema, change_password_schema
from auth import auth_service, require_auth, require_role
from datetime import datetime, timedelta
import json

# Create auth blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user using an invite code"""
    data = request.get_json()
    
    try:
        # Validate registration data
        validated_data = register_schema.load(data)
        
        # Check if invite exists and is valid
        invite = Invite.query.filter_by(
            invite_code=validated_data['invite_code'],
            is_used=False
        ).first()
        
        if not invite:
            return jsonify({'error': 'Invalid or expired invite code'}), 400
        
        if invite.expires_at < datetime.utcnow():
            return jsonify({'error': 'Invite code has expired'}), 400
        
        if invite.email != validated_data['email']:
            return jsonify({'error': 'Email does not match invite'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=validated_data['email']).first()
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        # Create new user
        password_hash = None
        if validated_data.get('use_system_password') and invite.system_password:
            # Use system-generated password
            password_hash = auth_service.hash_password(invite.system_password)
        else:
            # Use user-provided password
            password_hash = auth_service.hash_password(validated_data['password'])
        
        user = User(
            email=validated_data['email'],
            name=validated_data['name'],
            password_hash=password_hash
        )
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create user role
        user_role = UserRole(
            user_id=user.id,
            role=invite.role,
            assigned_towers=invite.assigned_towers
        )
        
        db.session.add(user_role)
        
        # Mark invite as used
        invite.is_used = True
        
        db.session.commit()
        
        # Generate token
        roles = auth_service.get_user_roles(user.id)
        token = auth_service.generate_token(user.id, user.email, roles)
        
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': user_schema.dump(user),
            'roles': roles
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password"""
    data = request.get_json()
    
    try:
        # Validate login data
        validated_data = login_schema.load(data)
        
        # Find user
        user = User.query.filter_by(email=validated_data['email']).first()
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Verify password
        if not auth_service.verify_password(validated_data['password'], user.password_hash):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate token
        roles = auth_service.get_user_roles(user.id)
        token = auth_service.generate_token(user.id, user.email, roles)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user_schema.dump(user),
            'roles': roles
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/google-auth', methods=['POST'])
def google_auth():
    """Login/Register with Google OAuth"""
    data = request.get_json()
    
    try:
        # Validate Google auth data
        validated_data = google_auth_schema.load(data)
        
        # Verify Google token
        google_user_info = auth_service.verify_google_token(validated_data['google_token'])
        if not google_user_info:
            return jsonify({'error': 'Invalid Google token'}), 401
        
        # Check if invite exists and is valid
        invite = Invite.query.filter_by(
            invite_code=validated_data['invite_code'],
            is_used=False
        ).first()
        
        if not invite:
            return jsonify({'error': 'Invalid or expired invite code'}), 400
        
        if invite.expires_at < datetime.utcnow():
            return jsonify({'error': 'Invite code has expired'}), 400
        
        if invite.email != google_user_info['email']:
            return jsonify({'error': 'Email does not match invite'}), 400
        
        # Check if user already exists
        user = User.query.filter_by(email=google_user_info['email']).first()
        
        if not user:
            # Create new user
            user = User(
                email=google_user_info['email'],
                name=google_user_info.get('name', invite.name),
                google_id=google_user_info['id']
            )
            
            db.session.add(user)
            db.session.flush()  # Get user ID
            
            # Create user role
            user_role = UserRole(
                user_id=user.id,
                role=invite.role,
                assigned_towers=invite.assigned_towers
            )
            
            db.session.add(user_role)
            
            # Mark invite as used
            invite.is_used = True
            
            db.session.commit()
        
        # Generate token
        roles = auth_service.get_user_roles(user.id)
        token = auth_service.generate_token(user.id, user.email, roles)
        
        return jsonify({
            'message': 'Google authentication successful',
            'token': token,
            'user': user_schema.dump(user),
            'roles': roles
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    """Get current user profile"""
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    roles = auth_service.get_user_roles(user.id)
    
    return jsonify({
        'user': user_schema.dump(user),
        'roles': roles
    }), 200

@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """Change user password"""
    data = request.get_json()
    
    try:
        # Validate password change data
        validated_data = change_password_schema.load(data)
        
        # Get user
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not auth_service.verify_password(validated_data['current_password'], user.password_hash):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Hash new password
        new_password_hash = auth_service.hash_password(validated_data['new_password'])
        
        # Update password
        user.password_hash = new_password_hash.decode('utf-8')
        db.session.commit()
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/invites', methods=['POST'])
@require_auth
@require_role('admin')
def create_invite():
    """Create a new invite (admin only)"""
    data = request.get_json()
    
    try:
        # Validate invite data
        validated_data = invite_schema.load(data)
        
        # Generate invite code and optional system password
        invite_code = Invite.generate_invite_code()
        system_password = None
        
        if data.get('generate_system_password', False):
            system_password = Invite.generate_system_password()
        
        # Set expiration (default 7 days)
        expires_at = validated_data.get('expires_at') or (datetime.utcnow() + timedelta(days=7))
        
        invite = Invite(
            email=validated_data['email'],
            name=validated_data['name'],
            invite_code=invite_code,
            system_password=system_password,
            assigned_towers=validated_data.get('assigned_towers'),
            role=validated_data.get('role', 'collector'),
            expires_at=expires_at,
            created_by=request.user_id
        )
        
        db.session.add(invite)
        db.session.commit()
        
        return jsonify({
            'message': 'Invite created successfully',
            'invite': {
                'email': invite.email,
                'name': invite.name,
                'invite_code': invite.invite_code,
                'system_password': invite.system_password,
                'role': invite.role,
                'assigned_towers': json.loads(invite.assigned_towers) if invite.assigned_towers else [],
                'expires_at': invite.expires_at.isoformat(),
                'invite_url': f"/register?code={invite.invite_code}"
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/invites', methods=['GET'])
@require_auth
@require_role('admin')
def get_invites():
    """Get all invites (admin only)"""
    invites = Invite.query.order_by(Invite.created_at.desc()).all()
    return jsonify(invites_schema.dump(invites)), 200

@auth_bp.route('/invites/<invite_code>', methods=['GET'])
def get_invite(invite_code):
    """Get invite details by code (public endpoint)"""
    invite = Invite.query.filter_by(invite_code=invite_code).first()
    
    if not invite:
        return jsonify({'error': 'Invite not found'}), 404
    
    if invite.is_used:
        return jsonify({'error': 'Invite has already been used'}), 400
    
    if invite.expires_at < datetime.utcnow():
        return jsonify({'error': 'Invite has expired'}), 400
    
    return jsonify({
        'email': invite.email,
        'name': invite.name,
        'role': invite.role,
        'assigned_towers': json.loads(invite.assigned_towers) if invite.assigned_towers else [],
        'has_system_password': bool(invite.system_password),
        'expires_at': invite.expires_at.isoformat()
    }), 200

@auth_bp.route('/users', methods=['GET'])
@require_auth
@require_role('admin')
def get_users():
    """Get all users (admin only)"""
    users = User.query.all()
    return jsonify([user_schema.dump(user) for user in users]), 200

@auth_bp.route('/users', methods=['POST'])
@require_auth
@require_role('admin')
def create_user():
    """Create a new user (admin only)"""
    data = request.get_json()
    
    try:
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        # Create new user
        password_hash = auth_service.hash_password(data['password'])
        
        user = User(
            email=data['email'],
            name=data['name'],
            password_hash=password_hash
        )
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create user role
        user_role = UserRole(
            user_id=user.id,
            role=data['role'],
            assigned_towers=json.dumps(data.get('assigned_towers', []))
        )
        
        db.session.add(user_role)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user_schema.dump(user)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@require_auth
@require_role('admin')
def update_user(user_id):
    """Update a user (admin only)"""
    data = request.get_json()
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if email is being changed and if it already exists
        if data['email'] != user.email:
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user:
                return jsonify({'error': 'User with this email already exists'}), 400
        
        # Update user
        user.email = data['email']
        user.name = data['name']
        
        # Update user role
        user_role = UserRole.query.filter_by(user_id=user.id).first()
        if user_role:
            user_role.role = data['role']
            user_role.assigned_towers = json.dumps(data.get('assigned_towers', []))
        else:
            # Create new role if none exists
            user_role = UserRole(
                user_id=user.id,
                role=data['role'],
                assigned_towers=json.dumps(data.get('assigned_towers', []))
            )
            db.session.add(user_role)
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user_schema.dump(user)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_user(user_id):
    """Delete a user (admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Don't allow admin to delete themselves
        if user.id == request.user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Delete user (cascade will handle user_roles)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
