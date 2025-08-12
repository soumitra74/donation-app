from flask import Blueprint, jsonify, request
from models import db, Donor, Donation, Campaign
from schemas import donor_schema, donors_schema, donation_schema, donations_schema, campaign_schema, campaigns_schema

# Create API blueprint
api_bp = Blueprint('api', __name__)

# Health check endpoint
@api_bp.route('/health', methods=['GET'])
def health():
    """API health check"""
    return jsonify({'status': 'healthy', 'api': 'v1'})

# Donor endpoints
@api_bp.route('/donors', methods=['GET'])
def get_donors():
    """Get all donors"""
    donors = Donor.query.all()
    return jsonify(donors_schema.dump(donors))

@api_bp.route('/donors/<int:donor_id>', methods=['GET'])
def get_donor(donor_id):
    """Get a specific donor"""
    donor = Donor.query.get_or_404(donor_id)
    return jsonify(donor_schema.dump(donor))

@api_bp.route('/donors', methods=['POST'])
def create_donor():
    """Create a new donor"""
    data = request.get_json()
    
    try:
        donor = donor_schema.load(data)
        db.session.add(donor)
        db.session.commit()
        return jsonify(donor_schema.dump(donor)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Donation endpoints
@api_bp.route('/donations', methods=['GET'])
def get_donations():
    """Get all donations"""
    donations = Donation.query.all()
    return jsonify(donations_schema.dump(donations))

@api_bp.route('/donations/<int:donation_id>', methods=['GET'])
def get_donation(donation_id):
    """Get a specific donation"""
    donation = Donation.query.get_or_404(donation_id)
    return jsonify(donation_schema.dump(donation))

@api_bp.route('/donations', methods=['POST'])
def create_donation():
    """Create a new donation"""
    data = request.get_json()
    
    try:
        donation = donation_schema.load(data)
        db.session.add(donation)
        db.session.commit()
        return jsonify(donation_schema.dump(donation)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Campaign endpoints
@api_bp.route('/campaigns', methods=['GET'])
def get_campaigns():
    """Get all campaigns"""
    campaigns = Campaign.query.all()
    return jsonify(campaigns_schema.dump(campaigns))

@api_bp.route('/campaigns/<int:campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    """Get a specific campaign"""
    campaign = Campaign.query.get_or_404(campaign_id)
    return jsonify(campaign_schema.dump(campaign))

@api_bp.route('/campaigns', methods=['POST'])
def create_campaign():
    """Create a new campaign"""
    data = request.get_json()
    
    try:
        campaign = campaign_schema.load(data)
        db.session.add(campaign)
        db.session.commit()
        return jsonify(campaign_schema.dump(campaign)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Statistics endpoint
@api_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get donation statistics"""
    total_donations = Donation.query.count()
    total_amount = db.session.query(db.func.sum(Donation.amount)).scalar() or 0
    total_donors = Donor.query.count()
    total_campaigns = Campaign.query.count()
    
    return jsonify({
        'total_donations': total_donations,
        'total_amount': float(total_amount),
        'total_donors': total_donors,
        'total_campaigns': total_campaigns
    })
