from marshmallow import Schema, fields, validate, ValidationError
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
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))

class CampaignSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Campaign
        load_instance = True
        include_fk = True
    
    # Custom validation
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    goal_amount = fields.Decimal(required=True, validate=validate.Range(min=0.01))
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    
    @validate('end_date')
    def validate_end_date(self, value, **kwargs):
        if 'start_date' in kwargs['data'] and value <= kwargs['data']['start_date']:
            raise ValidationError('End date must be after start date')

class DonationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Donation
        load_instance = True
        include_fk = True
    
    # Custom validation
    amount = fields.Decimal(required=True, validate=validate.Range(min=0.01))
    donor_id = fields.Int(required=True)
    campaign_id = fields.Int(required=True)

# Schema instances
donor_schema = DonorSchema()
donors_schema = DonorSchema(many=True)

campaign_schema = CampaignSchema()
campaigns_schema = CampaignSchema(many=True)

donation_schema = DonationSchema()
donations_schema = DonationSchema(many=True)
