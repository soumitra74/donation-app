from marshmallow import Schema, fields, ValidationError
from marshmallow.validate import Range, Length, OneOf, Email
from models import Donor, Donation, Campaign, User, Invite, UserRole, Sponsorship
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from datetime import datetime, timedelta

# Authentication Schemas
class UserSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        include_fk = True
        exclude = ('qr_code_data',)  # Explicitly exclude binary data
    
    # Custom validation
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=Length(min=1, max=100))
    password_hash = fields.Str(dump_only=True)  # Never return password hash
    google_id = fields.Str(dump_only=True)  # Never return Google ID
    qr_code_mime_type = fields.Str(dump_only=True)  # Return MIME type for frontend reference
    
    # Include roles
    user_roles = fields.Nested('UserRoleSchema', many=True, dump_only=True)

class InviteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Invite
        load_instance = True
        include_fk = True
    
    # Custom validation
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=Length(min=1, max=100))
    invite_code = fields.Str(dump_only=True)  # Auto-generated
    system_password = fields.Str(dump_only=True)  # Auto-generated
    role = fields.Str(validate=OneOf(['collector', 'admin']))
    assigned_towers = fields.Str(validate=Length(max=200))
    expires_at = fields.DateTime(required=True)
    
    def validate_expires_at(self, value, **kwargs):
        if value <= datetime.utcnow():
            raise ValidationError('Expiration date must be in the future')

class UserRoleSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = UserRole
        load_instance = True
        include_fk = True
    
    # Custom validation
    role = fields.Str(required=True, validate=OneOf(['collector', 'admin']))
    assigned_towers = fields.Str(validate=Length(max=200))

# Registration and Login Schemas
class RegisterSchema(Schema):
    invite_code = fields.Str(required=True, validate=Length(equal=8))
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=Length(min=1, max=100))
    password = fields.Str(required=True, validate=Length(min=6, max=100))
    use_system_password = fields.Bool(default=False)

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class GoogleAuthSchema(Schema):
    google_token = fields.Str(required=True)
    invite_code = fields.Str(required=True, validate=Length(equal=8))

class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=Length(min=6, max=100))

class QRCodeUploadSchema(Schema):
    """Schema for QR code upload validation"""
    qr_code_data = fields.Raw(required=True)
    qr_code_mime_type = fields.Str(required=True, validate=OneOf(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp']))

# Base schemas using SQLAlchemyAutoSchema
class DonorSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Donor
        load_instance = True
        include_fk = True
    
    # Custom validation
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=Length(min=1, max=100))

class CampaignSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Campaign
        load_instance = True
        include_fk = True
    
    # Custom validation
    title = fields.Str(required=True, validate=Length(min=1, max=200))
    goal_amount = fields.Decimal(required=True, validate=Range(min=0.01))
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    
    def validate_end_date(self, value, **kwargs):
        if 'start_date' in kwargs['data'] and value <= kwargs['data']['start_date']:
            raise ValidationError('End date must be after start date')

class SponsorshipSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Sponsorship
        load_instance = True
        include_fk = True
    
    # Custom validation
    name = fields.Str(required=True, validate=Length(min=1, max=200))
    amount = fields.Decimal(required=True, validate=Range(min=0.01))
    max_count = fields.Int(required=True, validate=Range(min=1))
    booked = fields.Int(required=False, validate=Range(min=0))
    is_booked = fields.Bool(default=False)

class DonationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Donation
        load_instance = True
        include_fk = True
    
    # Custom validation
    amount = fields.Decimal(required=True, validate=Range(min=0))
    donor_name = fields.Str(required=True, validate=Length(min=1, max=100))
    tower = fields.Int(required=True, validate=Range(min=1, max=100))
    floor = fields.Int(required=True, validate=Range(min=1, max=100))
    unit = fields.Int(required=True, validate=Range(min=1, max=100))
    phone_number = fields.Str(validate=Length(max=20))
    head_count = fields.Int(validate=Range(min=1))
    payment_method = fields.Str(validate=OneOf(['cash', 'upi-self', 'upi-other']))
    upi_other_person = fields.Str(validate=Length(max=100))
    sponsorship = fields.Str(validate=Length(max=200))
    volunteer_id = fields.Str(validate=Length(max=50))
    volunteer_name = fields.Str(validate=Length(max=100))
    
    # Optional foreign keys
    donor_id = fields.Int(required=False)
    campaign_id = fields.Int(required=False)
    user_id = fields.Int(required=False)
    sponsorship_id = fields.Int(required=False)

# Schema instances
user_schema = UserSchema()
users_schema = UserSchema(many=True)

invite_schema = InviteSchema()
invites_schema = InviteSchema(many=True)

user_role_schema = UserRoleSchema()
user_roles_schema = UserRoleSchema(many=True)

register_schema = RegisterSchema()
login_schema = LoginSchema()
google_auth_schema = GoogleAuthSchema()
change_password_schema = ChangePasswordSchema()

donor_schema = DonorSchema()
donors_schema = DonorSchema(many=True)

campaign_schema = CampaignSchema()
campaigns_schema = CampaignSchema(many=True)

sponsorship_schema = SponsorshipSchema()
sponsorships_schema = SponsorshipSchema(many=True)

donation_schema = DonationSchema()
donations_schema = DonationSchema(many=True)

qr_code_upload_schema = QRCodeUploadSchema()
