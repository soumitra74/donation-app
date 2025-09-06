from flask import Blueprint, jsonify, request, send_file
from models import db, Donor, Donation, Campaign, User, Sponsorship
from schemas import donor_schema, donors_schema, donation_schema, donations_schema, campaign_schema, campaigns_schema, sponsorship_schema, sponsorships_schema, qr_code_upload_schema
from auth import require_auth, require_tower_access, require_role
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
    """Get donations, optionally filtered by user and paginated.

    Supported query params:
    - user_id: int -> filter by collector user id
    - page: int (1-based)
    - page_size: int (default 20, max 100)
    - limit: int (alternative to page_size)
    - offset: int (0-based, alternative to page)

    Notes:
    - Results are ordered by created_at DESC (most recent first)
    - Response body remains an array for backward compatibility
    - Pagination metadata is provided via headers: X-Total-Count, X-Page, X-Page-Size
    """
    # Filters
    user_id = request.args.get('user_id', type=int)

    # Pagination params
    page = request.args.get('page', type=int)
    page_size = request.args.get('page_size', type=int)
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', type=int)

    # Build base query
    query = Donation.query
    if user_id:
        query = query.filter_by(user_id=user_id)

    # Order by most recent
    query = query.order_by(Donation.created_at.desc())

    # Total count before slicing
    total_count = query.count()

    # Apply pagination
    applied_page = None
    applied_page_size = None
    if page is not None or page_size is not None:
        # Normalize values
        applied_page = max(1, page or 1)
        applied_page_size = page_size or 20
        applied_page_size = max(1, min(applied_page_size, 100))
        calc_offset = (applied_page - 1) * applied_page_size
        query = query.offset(calc_offset).limit(applied_page_size)
    elif limit is not None or offset is not None:
        # Offset-limit style
        calc_offset = max(0, offset or 0)
        calc_limit = max(1, min(limit or 20, 100))
        applied_page = (calc_offset // calc_limit) + 1 if calc_limit else 1
        applied_page_size = calc_limit
        query = query.offset(calc_offset).limit(calc_limit)

    donations = query.all()

    response = jsonify(donations_schema.dump(donations))
    # Add pagination headers (always include total for clients that care)
    response.headers['X-Total-Count'] = str(total_count)
    if applied_page is not None:
        response.headers['X-Page'] = str(applied_page)
    if applied_page_size is not None:
        response.headers['X-Page-Size'] = str(applied_page_size)

    return response

@api_bp.route('/donations/<int:donation_id>', methods=['GET'])
@require_auth
def get_donation(donation_id):
    """Get a specific donation"""
    donation = Donation.query.get_or_404(donation_id)
    return jsonify(donation_schema.dump(donation))

@api_bp.route('/donations/<int:donation_id>', methods=['PUT'])
@require_auth
def update_donation(donation_id):
    """Update a specific donation"""
    donation = Donation.query.get_or_404(donation_id)
    data = request.get_json()
    
    try:
        # Handle sponsorship changes
        # If donation had a different sponsorship, decrement its booked count
        if donation.sponsorship_id:
            if donation.sponsorship_id != data.get('sponsorship_id'):
                prev_sponsorship = Sponsorship.query.get(donation.sponsorship_id)
                if prev_sponsorship:
                    prev_sponsorship.booked = max(0, prev_sponsorship.booked - 1)
                    prev_sponsorship.is_closed = False
                    db.session.add(prev_sponsorship)
            else: # donation.sponsorship_id == data.get('sponsorship_id'):
                pass

        # Handle new sponsorship booking if sponsorship_id is provided
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
        else:
            # If sponsorship_id is not provided, set it to None
            donation.sponsorship_id = None
        
        # Update the donation
        donation = donation_schema.load(data, instance=donation, session=db.session, partial=True)
        db.session.commit()
        return jsonify(donation_schema.dump(donation))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

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

@api_bp.route('/donations/<int:donation_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_donation(donation_id):
    """Delete a specific donation (admin only)"""
    try:
        donation = Donation.query.get_or_404(donation_id)

        # If donation was linked to a sponsorship, adjust booked count and reopen if needed
        if donation.sponsorship_id:
            sponsorship = Sponsorship.query.get(donation.sponsorship_id)
            if sponsorship and sponsorship.booked is not None:
                sponsorship.booked = max(0, (sponsorship.booked or 0) - 1)
                if sponsorship.is_closed and sponsorship.booked < sponsorship.max_count:
                    sponsorship.is_closed = False
                db.session.add(sponsorship)

        db.session.delete(donation)
        db.session.commit()
        return jsonify({'message': 'Donation deleted successfully'}), 200
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

# Today's statistics endpoint
@api_bp.route('/stats/today', methods=['GET'])
@require_auth
def get_today_stats():
    """Get today's donation statistics"""
    try:
        # Get today's date range (start and end of today)
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # Today's donations (completed status only)
        today_donations = Donation.query.filter(
            Donation.status == 'completed',
            Donation.created_at >= today_start,
            Donation.created_at <= today_end
        )

        # Total donations today
        total_donations = today_donations.count()

        # Total amount collected today
        total_amount = db.session.query(func.sum(Donation.amount)).filter(
            Donation.status == 'completed',
            Donation.created_at >= today_start,
            Donation.created_at <= today_end
        ).scalar() or 0

        # Average donation today
        avg_donation = db.session.query(func.avg(Donation.amount)).filter(
            Donation.status == 'completed',
            Donation.created_at >= today_start,
            Donation.created_at <= today_end
        ).scalar() or 0

        return jsonify({
            'total_donations': total_donations,
            'total_amount': float(total_amount),
            'average_donation': float(avg_donation)
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
