from flask import Blueprint, jsonify, request, send_file
from models import db, Donor, Donation, Campaign, User, Sponsorship
from schemas import donor_schema, donors_schema, donation_schema, donations_schema, campaign_schema, campaigns_schema, sponsorship_schema, sponsorships_schema, qr_code_upload_schema
from auth import require_auth, require_tower_access
from sqlalchemy import func
from excel_export import export_donations_to_excel
from datetime import datetime
import base64
import io

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
        
        # Handle sponsorship booking if sponsorship_id is provided
        sponsorship_id = data.get('sponsorship_id')
        if sponsorship_id:
            sponsorship = Sponsorship.query.get(sponsorship_id)
            if not sponsorship:
                return jsonify({'error': 'Sponsorship not found'}), 404
            
            if sponsorship.is_closed:
                return jsonify({'error': 'Sponsorship is already closed'}), 400
            
            # Increment booked count
            sponsorship.booked += 1
            
            # Check if sponsorship is now fully booked
            if sponsorship.booked >= sponsorship.max_count:
                sponsorship.is_closed = True
            
            # Add the modified sponsorship back to the session
            db.session.add(sponsorship)
        
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
        # Handle sponsorship booking if sponsorship_id is provided
        sponsorship_id = data.get('sponsorship_id')
        if sponsorship_id:
            sponsorship = Sponsorship.query.get(sponsorship_id)
            if not sponsorship:
                return jsonify({'error': 'Sponsorship not found'}), 404
            
            if sponsorship.is_closed:
                return jsonify({'error': 'Sponsorship is already closed'}), 400
            
            # Increment booked count
            sponsorship.booked += 1
            
            # Check if sponsorship is now fully booked
            if sponsorship.booked >= sponsorship.max_count:
                sponsorship.is_closed = True
            
            # Add the modified sponsorship back to the session
            db.session.add(sponsorship)
        
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

# Sponsorship endpoints
@api_bp.route('/sponsorships', methods=['GET'])
@require_auth
def get_sponsorships():
    """Get all sponsorships"""
    sponsorships = Sponsorship.query.all()
    return jsonify(sponsorships_schema.dump(sponsorships))

@api_bp.route('/sponsorships/<int:sponsorship_id>', methods=['GET'])
@require_auth
def get_sponsorship(sponsorship_id):
    """Get a specific sponsorship"""
    sponsorship = Sponsorship.query.get_or_404(sponsorship_id)
    return jsonify(sponsorship_schema.dump(sponsorship))

@api_bp.route('/sponsorships', methods=['POST'])
@require_auth
def create_sponsorship():
    """Create a new sponsorship"""
    data = request.get_json()
    
    try:
        sponsorship = sponsorship_schema.load(data, session=db.session)
        db.session.add(sponsorship)
        db.session.commit()
        return jsonify(sponsorship_schema.dump(sponsorship)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/sponsorships/<int:sponsorship_id>', methods=['PUT'])
@require_auth
def update_sponsorship(sponsorship_id):
    """Update a sponsorship"""
    sponsorship = Sponsorship.query.get_or_404(sponsorship_id)
    data = request.get_json()
    
    try:
        sponsorship = sponsorship_schema.load(data, instance=sponsorship, session=db.session, partial=True)
        db.session.commit()
        return jsonify(sponsorship_schema.dump(sponsorship))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/sponsorships/<int:sponsorship_id>', methods=['DELETE'])
@require_auth
def delete_sponsorship(sponsorship_id):
    """Delete a sponsorship"""
    sponsorship = Sponsorship.query.get_or_404(sponsorship_id)
    
    try:
        db.session.delete(sponsorship)
        db.session.commit()
        return jsonify({'message': 'Sponsorship deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/sponsorships/<int:sponsorship_id>/book', methods=['POST'])
@require_auth
def book_sponsorship(sponsorship_id):
    """Book a sponsorship (mark as closed)"""
    sponsorship = Sponsorship.query.get_or_404(sponsorship_id)
    
    try:
        sponsorship.is_closed = True
        db.session.commit()
        return jsonify(sponsorship_schema.dump(sponsorship))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/sponsorships/<int:sponsorship_id>/unbook', methods=['POST'])
@require_auth
def unbook_sponsorship(sponsorship_id):
    """Unbook a sponsorship (mark as not closed)"""
    sponsorship = Sponsorship.query.get_or_404(sponsorship_id)
    
    try:
        sponsorship.is_closed = False
        db.session.commit()
        return jsonify(sponsorship_schema.dump(sponsorship))
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

# QR Code endpoints
@api_bp.route('/users/qr-code', methods=['POST'])
@require_auth
def upsert_user_qr_code():
    """Upsert QR code bitmap for the authenticated user"""
    try:
        # Get the authenticated user
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Validate the request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate using schema
        validated_data = qr_code_upload_schema.load(data)
        
        # Decode base64 data if provided as string
        qr_code_data = validated_data['qr_code_data']
        if isinstance(qr_code_data, str):
            try:
                qr_code_data = base64.b64decode(qr_code_data)
            except Exception as e:
                return jsonify({'error': f'Invalid base64 data: {str(e)}'}), 400
        
        # Update user's QR code data
        user.qr_code_data = qr_code_data
        user.qr_code_mime_type = validated_data['qr_code_mime_type']
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'QR code updated successfully',
            'user_id': user.id,
            'qr_code_mime_type': user.qr_code_mime_type,
            'has_qr_code': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/users/qr-code', methods=['GET'])
@require_auth
def get_user_qr_code():
    """Get QR code bitmap for the authenticated user"""
    try:
        # Get the authenticated user
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.qr_code_data:
            return jsonify({'error': 'No QR code found for this user'}), 404
        
        # Return the QR code as a file response
        return send_file(
            io.BytesIO(user.qr_code_data),
            mimetype=user.qr_code_mime_type or 'image/png',
            as_attachment=False
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/users/qr-code', methods=['DELETE'])
@require_auth
def delete_user_qr_code():
    """Delete QR code bitmap for the authenticated user"""
    try:
        # Get the authenticated user
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Clear QR code data
        user.qr_code_data = None
        user.qr_code_mime_type = None
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'QR code deleted successfully',
            'user_id': user.id,
            'has_qr_code': False
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
