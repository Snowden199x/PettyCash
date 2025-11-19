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
                # Web: redirect logic
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

    # GET: serve login page for web, basic JSON for mobile
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
        # TODO: Implement actual reset email logic
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
        # Web form
        new_pw = request.form.get('new_password') or (request.json.get('new_password') if request.is_json else None)
        confirm_pw = request.form.get('confirm_password') or (request.json.get('confirm_password') if request.is_json else None)

        # Checks
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
    # GET
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
# LOGOUT
# =======================
@pres.route('/logout')
def pres_logout():
    session.clear()
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'success': True, 'message': 'Logged out'})
    return redirect(url_for('pres.landingpage')
)