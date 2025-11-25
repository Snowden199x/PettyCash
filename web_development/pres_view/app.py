from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, make_response
import os
import re
from dotenv import load_dotenv
from werkzeug.security import check_password_hash, generate_password_hash
from supabase import create_client

# =======================
# Initialize Blueprint
# =======================
pres = Blueprint(
    'pres',
    __name__,
    template_folder='templates/pres',
    static_folder='static'
)

load_dotenv()

# =======================
# Supabase Setup
# =======================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# =======================
# Utility: Validate Password
# =======================
def validate_password(pw):
    errors = []
    if len(pw) < 8:
        errors.append("Password must be at least 8 characters.")
    if not re.search(r"[a-z]", pw):
        errors.append("Password must contain a lowercase letter.")
    if not re.search(r"[A-Z]", pw):
        errors.append("Password must contain an uppercase letter.")
    if not re.search(r"\d", pw):
        errors.append("Password must contain a number.")
    if not re.search(r"[^A-Za-z0-9]", pw):
        errors.append("Password must contain a special character.")
    return errors

# =======================
# LANDING PAGE + HEALTHCHECK
# =======================
@pres.route('/')
def landingpage():
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'status': 'ok', 'page': 'landing'})
    return render_template('landingpage.html')

@pres.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'api': 'PRES API', 'version': '1.0'})

# =======================
# LOGIN PAGE (Web + JSON)
# =======================
@pres.route('/login/pres', methods=['GET', 'POST'])
def pres_login():
    if request.method == 'POST':
        username = request.form.get('username') or request.json.get('username')
        password = request.form.get('password') or request.json.get('password')
        result = supabase.table('organizations').select('*').eq('username', username).execute()

        if result.data:
            org = result.data[0]
            if check_password_hash(org['password'], password):
                session['pres_user'] = True
                session['org_id'] = org['id']
                session['org_name'] = org['org_name']

                if request.accept_mimetypes.best == 'application/json':
                    if org.get('must_change_password', False):
                        return jsonify({'success': True, 'must_change_password': True, 'org_id': org['id'], 'org_name': org['org_name']})
                    return jsonify({'success': True, 'org_id': org['id'], 'org_name': org['org_name']})
                if org.get('must_change_password', False):
                    return redirect(url_for('pres.change_password'))
                return redirect(url_for('pres.homepage'))
            else:
                error_msg = "Incorrect password."
                if request.accept_mimetypes.best == 'application/json':
                    return jsonify({'success': False, 'error': error_msg}), 401
                flash(error_msg, "danger")
                return redirect(url_for('pres.pres_login'))
        else:
            error_msg = "Organization not found."
            if request.accept_mimetypes.best == 'application/json':
                return jsonify({'success': False, 'error': error_msg}), 404
            flash(error_msg, "danger")
            return redirect(url_for('pres.pres_login'))
        
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'info': 'POST username and password to this endpoint.'})
    return render_template('pres_login.html')

# =======================
# AUTH STATUS FOR MOBILE
# =======================
@pres.route('/api/auth_status', methods=['GET'])
def pres_auth_status():
    login_state = session.get('pres_user') is True
    return jsonify({
        'logged_in': login_state,
        'org_id': session.get('org_id') if login_state else None,
        'org_name': session.get('org_name') if login_state else None
    })

# =======================
# FORGOT PASSWORD (mostly frontend)
# =======================
@pres.route('/forgot-password', methods=['GET', 'POST'])
def pres_forgot_password():
    if request.method == 'POST':
        username = request.form.get('username')
        flash("Password reset instructions sent!", "success")
    return render_template('forgot_password.html')

# =======================
# CHANGE PASSWORD
# =======================
@pres.route('/change-password', methods=['GET', 'POST'])
def change_password():
    if not session.get('pres_user'):
        return redirect(url_for('pres.pres_login'))
    if 'org_id' not in session:
        flash("Session expired. Please log in again.", "danger")
        return redirect(url_for('pres.pres_login'))

    if request.method == 'POST':
        new_pw = request.form.get('new_password') or (request.json.get('new_password') if request.is_json else None)
        confirm_pw = request.form.get('confirm_password') or (request.json.get('confirm_password') if request.is_json else None)

        if not new_pw or not confirm_pw:
            error_msg = "Please fill out all fields."
            if request.accept_mimetypes.best == 'application/json':
                return jsonify({'success': False, 'error': error_msg}), 400
            flash(error_msg, "danger")
            return render_template('change_password.html')
        if new_pw != confirm_pw:
            error_msg = "Passwords do not match."
            if request.accept_mimetypes.best == 'application/json':
                return jsonify({'success': False, 'error': error_msg}), 400
            flash(error_msg, "danger")
            return render_template('change_password.html')
        errors = validate_password(new_pw)
        if errors:
            if request.accept_mimetypes.best == 'application/json':
                return jsonify({'success': False, 'errors': errors}), 400
            for e in errors:
                flash(e, "danger")
            return render_template('change_password.html')
        org_id = session.get('org_id')
        hashed_pw = generate_password_hash(new_pw)
        supabase.table('organizations').update({
            'password': hashed_pw,
            'must_change_password': False
        }).eq('id', org_id).execute()
        session['pres_user'] = True

        if request.accept_mimetypes.best == 'application/json':
            return jsonify({'success': True, 'message': 'Password changed'})
        flash("Password changed successfully!", "success")
        return redirect(url_for('pres.homepage'))
    
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'info': 'POST new_password and confirm_password'})
    return render_template('change_password.html')

# =======================
# HOMEPAGE
# =======================
@pres.route('/homepage')
def homepage():
    if not session.get('pres_user'):
        return redirect(url_for('pres.pres_login'))
    return render_template('pres_homepage.html')

# =======================
# HISTORY PAGE
# =======================
@pres.route('/history')
def history():
    if not session.get('pres_user'):
        return redirect(url_for('pres.pres_login'))
    return render_template('history.html')

# =======================
# WALLETS PAGE
# =======================
@pres.route('/wallets')
def wallets():
    if not session.get('pres_user'):
        return redirect(url_for('pres.pres_login'))
    return render_template('wallets.html')

# =======================
# PROFILE PAGE
# =======================
@pres.route('/profile')
def profile():
    if not session.get('pres_user'):
        return redirect(url_for('pres.pres_login'))
    return render_template('profile.html')


# =======================
# LOGOUT
# =======================
@pres.route('/logout')
def pres_logout():
    session.clear()
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'success': True, 'message': 'Logged out'})
    return redirect(url_for('pres.landingpage')
)

# =======================
# API ENDPOINTS FOR DATA
# =======================

# Get Dashboard Summary
@pres.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    if not session.get('pres_user'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    org_id = session.get('org_id')
    
    # TODO: Replace with actual database queries
    # Example query structure:
    # wallets = supabase.table('wallets').select('*').eq('org_id', org_id).execute()
    # transactions = supabase.table('transactions').select('*').eq('org_id', org_id).execute()
    
    # Calculate totals from your database
    summary = {
        'total_balance': 30000,
        'total_events': 5,
        'income_month': 3000,
        'expenses_month': 5000
    }
    
    return jsonify(summary)

# Get Wallets List
@pres.route('/api/wallets', methods=['GET'])
def get_wallets():
    if not session.get('pres_user'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    org_id = session.get('org_id')
    
    try:
        # Get wallets from database
        result = supabase.table('wallets').select('*').eq('org_id', org_id).execute()
        
        # If you have a wallets table, uncomment and modify this:
        # wallets = result.data
        
        # For now, return sample data
        wallets = [
            {
                'id': 1,
                'name': 'FEB FAIR',
                'month': 'February 2025',
                'activity': 'Feb Fair',
                'beginning_cash': 700,
                'total_income': 1830,
                'total_expenses': 1500,
                'ending_cash': 5000
            }
        ]
        
        return jsonify(wallets)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get Transactions for a specific wallet
@pres.route('/api/wallets/<int:wallet_id>/transactions', methods=['GET'])
def get_wallet_transactions(wallet_id):
    if not session.get('pres_user'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    org_id = session.get('org_id')
    
    try:
        # Get transactions from database
        # result = supabase.table('transactions').select('*').eq('wallet_id', wallet_id).execute()
        
        # Sample data
        transactions = [
            {
                'id': 1,
                'event': 'FEB FAIR',
                'description': '(24) Number of Customers',
                'amount': 852,
                'date': '2025-02-14',
                'type': 'income'
            },
            {
                'id': 2,
                'event': 'FEB FAIR',
                'description': '(1 set) Bracelet Locks',
                'amount': -73,
                'date': '2025-02-09',
                'type': 'expense'
            }
        ]
        
        return jsonify(transactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get All Transactions (for history page)
@pres.route('/api/transactions', methods=['GET'])
def get_all_transactions():
    if not session.get('pres_user'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    org_id = session.get('org_id')
    month = request.args.get('month')  # Optional filter
    year = request.args.get('year')    # Optional filter
    type_filter = request.args.get('type')  # 'income', 'expense', or 'all'
    
    try:
        # Get all transactions for the organization
        # query = supabase.table('transactions').select('*').eq('org_id', org_id)
        # if month and year:
        #     query = query.gte('date', f'{year}-{month}-01').lt('date', f'{year}-{int(month)+1}-01')
        # result = query.execute()
        
        # Sample data
        transactions = [
            {
                'id': 1,
                'event': 'FEB FAIR',
                'description': '(24) Number of Customers',
                'amount': 852,
                'date': '2025-02-14',
                'type': 'income'
            },
            {
                'id': 2,
                'event': 'FEB FAIR',
                'description': '(24) Number of Customers',
                'amount': 515,
                'date': '2025-02-13',
                'type': 'income'
            },
            {
                'id': 3,
                'event': 'FEB FAIR',
                'description': '(1 set) Bracelet Locks',
                'amount': -73,
                'date': '2025-02-09',
                'type': 'expense'
            }
        ]
        
        return jsonify(transactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get Organization Profile
@pres.route('/api/profile', methods=['GET'])
def get_profile():
    if not session.get('pres_user'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    org_id = session.get('org_id')
    
    try:
        result = supabase.table('organizations').select('*').eq('id', org_id).execute()
        
        if result.data:
            org = result.data[0]
            # Don't send password hash to frontend
            profile = {
                'org_name': org.get('org_name'),
                'org_short_name': org.get('org_short_name'),
                'department': org.get('department'),
                'school': org.get('school'),
                'profile_picture': org.get('profile_picture')
            }
            return jsonify(profile)
        else:
            return jsonify({'error': 'Organization not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update Organization Profile
@pres.route('/api/profile', methods=['PUT', 'POST'])
def update_profile():
    if not session.get('pres_user'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    org_id = session.get('org_id')
    data = request.get_json()
    
    try:
        # Update only allowed fields
        update_data = {}
        allowed_fields = ['org_name', 'org_short_name', 'department', 'school']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if update_data:
            result = supabase.table('organizations').update(update_data).eq('id', org_id).execute()
            
            # Update session if org_name changed
            if 'org_name' in update_data:
                session['org_name'] = update_data['org_name']
            
            return jsonify({'success': True, 'message': 'Profile updated successfully'})
        else:
            return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Upload Profile Picture
@pres.route('/api/profile/picture', methods=['POST'])
def upload_profile_picture():
    if not session.get('pres_user'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    org_id = session.get('org_id')
    
    if 'photo' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['photo']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    
    if file_ext not in allowed_extensions:
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        # TODO: Upload to Supabase Storage or your preferred storage
        # For now, you can save locally or implement Supabase storage
        
        # Example with Supabase Storage:
        # bucket_name = 'profile-pictures'
        # file_path = f'{org_id}/{file.filename}'
        # supabase.storage.from_(bucket_name).upload(file_path, file)
        # public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
        
        # Update organization record with new picture URL
        # supabase.table('organizations').update({'profile_picture': public_url}).eq('id', org_id).execute()
        
        return jsonify({'success': True, 'message': 'Profile picture uploaded successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get Receipts for a wallet
@pres.route('/api/wallets/<int:wallet_id>/receipts', methods=['GET'])
def get_wallet_receipts(wallet_id):
    if not session.get('pres_user'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Get receipts from database
        # result = supabase.table('receipts').select('*').eq('wallet_id', wallet_id).execute()
        
        # Sample data
        receipts = [
            {'id': 1, 'name': 'Materials', 'date': '2025-02-11', 'file_url': '/uploads/receipt1.pdf'},
            {'id': 2, 'name': 'Materials', 'date': '2025-02-11', 'file_url': '/uploads/receipt2.pdf'}
        ]
        
        return jsonify(receipts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500