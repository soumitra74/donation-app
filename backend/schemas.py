from marshmallow import Schema, fields, ValidationError
from marshmallow.validate import Range, Length, OneOf
from models import Donor, Donation, Campaign
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

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

class DonationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Donation
        load_instance = True
        include_fk = True
    
    # Custom validation
    amount = fields.Decimal(required=True, validate=Range(min=0.01))
    donor_name = fields.Str(required=True, validate=Length(min=1, max=100))
    tower = fields.Int(required=True, validate=Range(min=1, max=10))
    floor = fields.Int(required=True, validate=Range(min=1, max=14))
    unit = fields.Int(required=True, validate=Range(min=1, max=4))
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

# Schema instances
donor_schema = DonorSchema()
donors_schema = DonorSchema(many=True)

campaign_schema = CampaignSchema()
campaigns_schema = CampaignSchema(many=True)

donation_schema = DonationSchema()
donations_schema = DonationSchema(many=True)
