from flask import Blueprint, jsonify, request, send_file
from models import db, Donor, Donation, Campaign, User
from schemas import donor_schema, donors_schema, donation_schema, donations_schema, campaign_schema, campaigns_schema
from auth import require_auth, require_tower_access
from sqlalchemy import func
from excel_export import export_donations_to_excel
from datetime import datetime

# Create API blueprint
api_bp = Blueprint('api', __name__)

# Health check endpoint
@api_bp.route('/health', methods=['GET'])
def health():
    """API health check"""
    return jsonify({'status': 'healthy', 'api': 'v1'})

# Donor endpoints
@api_bp.route('/donors', methods=['GET'])
@require_auth
def get_donors():
    """Get all donors"""
    donors = Donor.query.all()
    return jsonify(donors_schema.dump(donors))

@api_bp.route('/donors/<int:donor_id>', methods=['GET'])
@require_auth
def get_donor(donor_id):
    """Get a specific donor"""
    donor = Donor.query.get_or_404(donor_id)
    return jsonify(donor_schema.dump(donor))

@api_bp.route('/donors', methods=['POST'])
@require_auth
def create_donor():
    """Create a new donor"""
    data = request.get_json()
    
    try:
        donor = donor_schema.load(data, session=db.session)
        db.session.add(donor)
        db.session.commit()
        return jsonify(donor_schema.dump(donor)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Donation endpoints
@api_bp.route('/donations', methods=['GET'])
@require_auth
def get_donations():
    """Get all donations"""
    # Get user_id from query parameter to filter by user
    user_id = request.args.get('user_id', type=int)
    
    if user_id:
        # Filter donations by user_id
        donations = Donation.query.filter_by(user_id=user_id).all()
    else:
        # Get all donations (for admin users)
        donations = Donation.query.all()
    
    return jsonify(donations_schema.dump(donations))

@api_bp.route('/donations/<int:donation_id>', methods=['GET'])
@require_auth
def get_donation(donation_id):
    """Get a specific donation"""
    donation = Donation.query.get_or_404(donation_id)
    return jsonify(donation_schema.dump(donation))

@api_bp.route('/donations', methods=['POST'])
@require_auth
def create_donation():
    """Create a new donation"""
    data = request.get_json()
    
    try:
        # Add user ID to donation
        data['user_id'] = request.user_id
        donation = donation_schema.load(data, session=db.session)
        db.session.add(donation)
        db.session.commit()
        return jsonify(donation_schema.dump(donation)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/donations/apartment/<int:tower>/<int:floor>/<int:unit>', methods=['GET'])
@require_auth
@require_tower_access('tower')
def get_apartment_donation(tower, floor, unit):
    """Get donation for a specific apartment"""
    donation = Donation.query.filter_by(
        tower=tower, 
        floor=floor, 
        unit=unit
    ).first()
    
    if donation:
        return jsonify(donation_schema.dump(donation))
    else:
        return jsonify({'message': 'No donation found for this apartment'}), 404

@api_bp.route('/donations/apartment/<int:tower>/<int:floor>/<int:unit>', methods=['POST'])
@require_auth
@require_tower_access('tower')
def create_apartment_donation(tower, floor, unit):
    """Create a donation for a specific apartment"""
    data = request.get_json()
    data.update({
        'tower': tower,
        'floor': floor,
        'unit': unit,
        'user_id': request.user_id
    })
    
    try:
        donation = donation_schema.load(data, session=db.session)
        db.session.add(donation)
        db.session.commit()
        return jsonify(donation_schema.dump(donation)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/donations/apartment/<int:tower>/<int:floor>/<int:unit>/follow-up', methods=['POST'])
@require_auth
@require_tower_access('tower')
def mark_apartment_follow_up(tower, floor, unit):
    """Mark an apartment for follow-up"""
    data = request.get_json()
    data.update({
        'tower': tower,
        'floor': floor,
        'unit': unit,
        'status': 'follow-up',
        'amount': 0,  # Placeholder amount for follow-up
        'donor_name': data.get('donor_name', 'Follow-up Required'),
        'user_id': request.user_id
    })
    
    try:
        donation = donation_schema.load(data, session=db.session)
        db.session.add(donation)
        db.session.commit()
        return jsonify(donation_schema.dump(donation)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/donations/apartment/<int:tower>/<int:floor>/<int:unit>/skip', methods=['POST'])
@require_auth
@require_tower_access('tower')
def mark_apartment_skipped(tower, floor, unit):
    """Mark an apartment as skipped"""
    data = request.get_json()
    data.update({
        'tower': tower,
        'floor': floor,
        'unit': unit,
        'status': 'skipped',
        'amount': 0,  # Placeholder amount for skipped
        'donor_name': data.get('donor_name', 'Skipped'),
        'user_id': request.user_id
    })
    
    try:
        donation = donation_schema.load(data, session=db.session)
        db.session.add(donation)
        db.session.commit()
        return jsonify(donation_schema.dump(donation)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Campaign endpoints
@api_bp.route('/campaigns', methods=['GET'])
@require_auth
def get_campaigns():
    """Get all campaigns"""
    campaigns = Campaign.query.all()
    return jsonify(campaigns_schema.dump(campaigns))

@api_bp.route('/campaigns/<int:campaign_id>', methods=['GET'])
@require_auth
def get_campaign(campaign_id):
    """Get a specific campaign"""
    campaign = Campaign.query.get_or_404(campaign_id)
    return jsonify(campaign_schema.dump(campaign))

@api_bp.route('/campaigns', methods=['POST'])
@require_auth
def create_campaign():
    """Create a new campaign"""
    data = request.get_json()
    
    try:
        campaign = campaign_schema.load(data, session=db.session)
        db.session.add(campaign)
        db.session.commit()
        return jsonify(campaign_schema.dump(campaign)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Statistics endpoint
@api_bp.route('/stats', methods=['GET'])
@require_auth
def get_stats():
    """Get donation statistics"""
    try:
        # Total donations
        total_donations = Donation.query.filter_by(status='completed').count()
        
        # Total amount collected
        total_amount = db.session.query(func.sum(Donation.amount)).filter_by(status='completed').scalar() or 0
        
        # Average donation
        avg_donation = db.session.query(func.avg(Donation.amount)).filter_by(status='completed').scalar() or 0
        
        # Follow-ups count
        follow_ups = Donation.query.filter_by(status='follow-up').count()
        
        # Skipped count
        skipped = Donation.query.filter_by(status='skipped').count()
        
        return jsonify({
            'total_donations': total_donations,
            'total_amount': float(total_amount),
            'average_donation': float(avg_donation),
            'follow_ups': follow_ups,
            'skipped': skipped
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Excel Export endpoint
@api_bp.route('/export/excel', methods=['GET'])
@require_auth
def export_excel():
    """Export all donations to Excel file"""
    try:
        excel_file = export_donations_to_excel()
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"donation_report_{timestamp}.xlsx"
        
        return send_file(
            excel_file,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': f'Failed to generate Excel file: {str(e)}'}), 500
