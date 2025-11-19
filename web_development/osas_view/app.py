from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from supabase import create_client
import os
from dotenv import load_dotenv
import random
import string
from datetime import datetime

load_dotenv()

# =========================
# Blueprint Initialization
# =========================
osas = Blueprint(
    'osas',
    __name__,
    url_prefix='/osas',
    template_folder='templates',
    static_folder='static'
)

# =========================
# Supabase Setup
# =========================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# Helper Functions
# =========================
def generate_username():
    return f"0125-{random.randint(1000,9999)}"

def generate_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def get_admin_data(username):
    result = supabase.table('osas_admin').select('*').eq('username', username).execute()
    if result.data:
        return result.data[0]
    return None

def log_activity(admin_id, action_type, description):
    supabase.table('osas_activity_log').insert({
        "admin_id": admin_id,
        "action_type": action_type,
        "description": description,
        "created_at": datetime.utcnow().isoformat()
    }).execute()

# =========================
# AUTH AND NAV
# =========================
@osas.route('/login', methods=['GET', 'POST'])
def osas_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        admin = get_admin_data(username)
        if admin:
            if check_password_hash(admin['password'], password):
                session['osas_admin'] = username
                log_activity(admin['id'], 'login', f'Admin {username} logged in')
                flash('OSAS login successful!', 'success')
                return redirect(url_for('osas.osas_dashboard'))
            flash('Incorrect password.', 'danger')
        else:
            flash('Admin not found.', 'danger')
    return render_template('osas/login.html')

@osas.route('/dashboard')
def osas_dashboard():
    if 'osas_admin' in session:
        return render_template('osas/homepage.html')
    return redirect(url_for('osas.osas_login'))

@osas.route('/logout')
def osas_logout():
    username = session.get('osas_admin')
    if username:
        admin = get_admin_data(username)
        if admin:
            log_activity(admin['id'], 'logout', f'Admin {username} logged out')
    session.clear()
    return redirect(url_for('osas.osas_login'))

@osas.route('/reports')
def osas_reports():
    if 'osas_admin' in session:
        return render_template('reports.html')
    return redirect(url_for('osas.osas_dashboard'))

@osas.route('/settings')
def osas_settings():
    if 'osas_admin' in session:
        return render_template('settings.html')
    return redirect(url_for('osas.osas_dashboard'))

# =========================
# ORGANIZATION API
# =========================
@osas.route('/api/organizations', methods=['GET'])
def get_organizations():
    result = supabase.table('organizations').select('*').execute()
    orgs = []
    if result.data:
        for org in result.data:
            orgs.append({
                'id': org['id'],
                'name': org['org_name'],
                'username': org['username'],
                'password': org['password'],
                'date': org['accreditation_date'],
                'status': org['status'],
                'created_by': org.get('created_by')
            })
    return jsonify({'organizations': orgs})

@osas.route('/add_organization', methods=['POST'])
def add_organization():
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401
    data = request.get_json()
    org_name = data.get('orgName')
    username = data.get('username') or generate_username()
    password = data.get('password') or generate_password()
    accreditation_date = data.get('accreditationDate')
    status = data.get('orgStatus')

    # Get current admin ID for created_by
    admin = get_admin_data(session['osas_admin'])

    existing = supabase.table('organizations').select('*').or_(
        f"org_name.eq.{org_name},username.eq.{username}"
    ).execute()
    if existing.data and len(existing.data) > 0:
        return jsonify({'error': 'Organization name or username already exists'}), 400

    hashed_password = generate_password_hash(password)
    supabase.table('organizations').insert({
        'org_name': org_name,
        'username': username,
        'password': hashed_password,
        'accreditation_date': accreditation_date,
        'status': status,
        'must_change_password': True,
        'created_by': admin['id'] if admin else None
    }).execute()
    # Activity log
    if admin:
        log_activity(admin['id'], 'organization', f'Added new organization: "{org_name}"')
    return jsonify({'message': 'Organization added', 'username': username, 'password': password}), 201

@osas.route('/api/organizations/<int:org_id>', methods=['PUT'])
def update_organization(org_id):
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401
    data = request.get_json()
    update_data = {
        'org_name': data.get('orgName'),
        'username': data.get('username'),
        'password': generate_password_hash(data.get('password')),
        'accreditation_date': data.get('accreditationDate'),
        'status': data.get('orgStatus')
    }
    supabase.table('organizations').update(update_data).eq('id', org_id).execute()
    admin = get_admin_data(session['osas_admin'])
    if admin:
        log_activity(admin['id'], 'organization', f'Updated organization [{org_id}]')
    return jsonify({'message': 'Organization updated'})

@osas.route('/api/organizations/<int:org_id>', methods=['DELETE'])
def delete_organization(org_id):
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401
    supabase.table('organizations').delete().eq('id', org_id).execute()
    admin = get_admin_data(session['osas_admin'])
    if admin:
        log_activity(admin['id'], 'organization', f'Deleted organization [{org_id}]')
    return jsonify({'message': 'Organization deleted'})

# =========================
# SETTINGS/BACKEND API
# =========================

# ---- Profile GET/UPDATE ----
@osas.route('/api/admin/profile', methods=['GET'])
def get_profile():
    if 'osas_admin' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    username = session['osas_admin']
    admin = supabase.table('osas_admin').select('username,full_name,email').eq('username', username).execute()
    if admin.data:
        return jsonify(admin.data[0])
    return jsonify({'error': 'Not found'}), 404

@osas.route('/api/admin/profile', methods=['PUT'])
def update_profile():
    if 'osas_admin' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    username = session['osas_admin']
    data = request.get_json()
    update_data = {}
    if data.get("full_name"):
        update_data["full_name"] = data["full_name"]
    if data.get("email"):
        update_data["email"] = data["email"]
    if data.get("username") and data["username"] != username:
        existing = supabase.table('osas_admin').select('id').eq("username", data["username"]).execute()
        if existing.data:
            return jsonify({"error": "Username already exists."}), 400
        update_data["username"] = data["username"]
    supabase.table('osas_admin').update(update_data).eq('username', username).execute()
    if "username" in update_data:
        session["osas_admin"] = update_data["username"]
    admin = get_admin_data(update_data.get("username", username))
    if admin:
        log_activity(admin['id'], 'settings', "Profile updated")
    return jsonify({"message": "Profile updated!", "updated": update_data})

# ---- Change Password ----
@osas.route('/api/admin/password', methods=['POST'])
def change_password():
    if 'osas_admin' not in session:
        return jsonify({"error": "Not logged in"}), 401
    username = session['osas_admin']
    data = request.get_json()
    current_pw = data.get("currentPassword")
    new_pw = data.get("newPassword")
    admin = get_admin_data(username)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    if not check_password_hash(admin['password'], current_pw):
        return jsonify({"error": "Current password incorrect"}), 400
    hashed = generate_password_hash(new_pw)
    supabase.table('osas_admin').update({"password": hashed}).eq("username", username).execute()
    log_activity(admin['id'], 'security', "Changed password")
    return jsonify({"message": "Password changed"})

# ---- Activity Logs API ----
@osas.route('/api/admin/activity', methods=['GET'])
def get_activity():
    if 'osas_admin' not in session:
        return jsonify({"error": "Not logged in"}), 401
    username = session['osas_admin']
    admin = get_admin_data(username)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    admin_id = admin['id']
    action_type = request.args.get('type')
    activity_date = request.args.get('date')
    query = supabase.table("osas_activity_log").select('*').eq('admin_id', admin_id)
    if action_type and action_type.lower() != "all":
        query = query.eq("action_type", action_type)
    if activity_date:
        query = query.gte("created_at", activity_date + 'T00:00:00').lte("created_at", activity_date + 'T23:59:59')
    logs = query.order('created_at', desc=True).limit(50).execute()
    return jsonify(logs.data if logs.data else [])