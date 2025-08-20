from app import db
from datetime import datetime
import secrets
import string

class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for Google auth
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    donations = db.relationship('Donation', backref='user', lazy=True)
    user_roles = db.relationship('UserRole', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'

class Invite(db.Model):
    """Invite model for user registration"""
    __tablename__ = 'invites'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    invite_code = db.Column(db.String(32), unique=True, nullable=False)
    system_password = db.Column(db.String(100), nullable=True)  # Optional system-generated password
    assigned_towers = db.Column(db.String(200), nullable=True)  # JSON string of tower assignments
    role = db.Column(db.String(20), default='collector')  # collector, admin
    is_used = db.Column(db.Boolean, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Invite {self.email}>'
    
    @staticmethod
    def generate_invite_code():
        """Generate a random invite code"""
        return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    
    @staticmethod
    def generate_system_password():
        """Generate a random system password"""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

class UserRole(db.Model):
    """User role model for role-based access control"""
    __tablename__ = 'user_roles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # collector, admin
    assigned_towers = db.Column(db.String(200), nullable=True)  # JSON string of tower assignments
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<UserRole {self.user_id} - {self.role}>'

class Donor(db.Model):
    """Donor model"""
    __tablename__ = 'donors'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    donations = db.relationship('Donation', backref='donor', lazy=True)
    
    def __repr__(self):
        return f'<Donor {self.name}>'

class Campaign(db.Model):
    """Campaign model"""
    __tablename__ = 'campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    goal_amount = db.Column(db.Numeric(10, 2), nullable=False)
    current_amount = db.Column(db.Numeric(10, 2), default=0)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    donations = db.relationship('Donation', backref='campaign', lazy=True)
    
    def __repr__(self):
        return f'<Campaign {self.title}>'

class Donation(db.Model):
    """Donation model"""
    __tablename__ = 'donations'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Apartment-specific fields (for frontend compatibility)
    tower = db.Column(db.Integer, nullable=False)
    floor = db.Column(db.Integer, nullable=False)
    unit = db.Column(db.Integer, nullable=False)
    donor_name = db.Column(db.String(100), nullable=False)  # Direct donor name for apartment donations
    phone_number = db.Column(db.String(20))
    head_count = db.Column(db.Integer)
    upi_other_person = db.Column(db.String(100))
    sponsorship = db.Column(db.String(200))
    notes = db.Column(db.Text)
    volunteer_id = db.Column(db.String(50))
    volunteer_name = db.Column(db.String(100))
    
    # Original fields (for future extensibility)
    message = db.Column(db.Text)
    is_anonymous = db.Column(db.Boolean, default=False)
    payment_method = db.Column(db.String(50))
    status = db.Column(db.String(20), default='completed')  # completed, follow-up, skipped, pending
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys (optional for apartment donations)
    donor_id = db.Column(db.Integer, db.ForeignKey('donors.id'), nullable=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Collector
    
    def __repr__(self):
        return f'<Donation {self.id} - {self.donor_name} - ₹{self.amount}>'
