from app import db
from datetime import datetime

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
    
    def __repr__(self):
        return f'<Donation {self.id} - {self.donor_name} - ₹{self.amount}>'
