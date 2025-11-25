from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from supabase import create_client
import os
from dotenv import load_dotenv
import random
import string
from datetime import datetime
import uuid

load_dotenv()

osas = Blueprint(
    'osas',
    __name__,
    url_prefix='/osas',
    template_folder='templates',
    static_folder='static'
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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

def log_admin_audit(admin_id, field, old_value, new_value):
    supabase.table('osas_admin_audit').insert({
        'admin_id': admin_id,
        'changed_field': field,
        'old_value': old_value,
        'new_value': new_value,
        'changed_at': datetime.utcnow().isoformat()
    }).execute()

# ========== AUTH & NAV ===========
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
                device_info = request.user_agent.string
                ip_address = request.remote_addr or "Unknown"
                supabase.table('osas_sessions').insert({
                    'admin_id': admin['id'],
                    'device_info': device_info,
                    'ip_address': ip_address,
                    'last_active_at': datetime.utcnow().isoformat(),
                    'is_current': True
                }).execute()
                flash('OSAS login successful!', 'success')
                return redirect(url_for('osas.osas_dashboard'))
            flash('Incorrect password.', 'danger')
        else:
            flash('Admin not found.', 'danger')
    return render_template('osas/login.html')

@osas.route('/dashboard')
def osas_dashboard():
    if 'osas_admin' in session:
        return render_template('osas/homepage.html', active_page='dashboard')
    return redirect(url_for('osas.osas_login'))

@osas.route('/logout')
def osas_logout():
    username = session.get('osas_admin')
    if username:
        admin = get_admin_data(username)
        if admin:
            log_activity(admin['id'], 'logout', f'Admin {username} logged out')
            device_info = request.user_agent.string
            ip_address = request.remote_addr or "Unknown"
            supabase.table('osas_sessions').update({
                'is_current': False,
                'last_active_at': datetime.utcnow().isoformat()
            }).eq('admin_id', admin['id']).eq('device_info', device_info).eq('ip_address', ip_address).execute()
    session.clear()
    return redirect(url_for('osas.osas_login'))

@osas.route('/reports')
def osas_reports():
    if 'osas_admin' in session:
        return render_template('osas/reports.html', active_page='reports')
    return redirect(url_for('osas.osas_login'))

@osas.route('/settings')
def osas_settings():
    if 'osas_admin' in session:
        return render_template('osas/settings.html', active_page='settings')
    return redirect(url_for('osas.osas_login'))

@osas.route('/orgs')
def osas_orgs():
    if 'osas_admin' in session:
        return render_template('osas/orgs.html', active_page='orgs')
    return redirect(url_for('osas.osas_login'))

@osas.route('/archive')
def osas_archive():
    if 'osas_admin' in session:
        return render_template('osas/archive.html', active_page='archive')
    return redirect(url_for('osas.osas_login'))

# ========== ORGANIZATION API ===========
@osas.route('/api/organizations', methods=['GET'])
def get_organizations():
    department = request.args.get('department')
    orgs = []
    dept_id = None
    if department and department != "All Departments":
        dept_result = supabase.table('departments').select('id').eq('dept_name', department).execute()
        if dept_result.data:
            dept_id = dept_result.data[0]['id']
    org_query = supabase.table('organizations').select('*').eq('status', 'Active')
    if dept_id:
        org_query = org_query.eq('department_id', dept_id)
    result = org_query.execute()
    if result.data:
        for org in result.data:
            dept_name = "-"
            if org.get('department_id'):
                d = supabase.table('departments').select('dept_name').eq('id', org['department_id']).execute()
                if d.data and isinstance(d.data, list):
                    dept_name = d.data[0]['dept_name']
            orgs.append({
                'id': org['id'],
                'name': org['org_name'],
                'department': dept_name,
                'username': org['username'],
                'password': org['password'],
                'date': str(org.get('accreditation_date')),
                'status': org.get('status'),
                'created_by': org.get('created_by')
            })
    return jsonify({'organizations': orgs})

@osas.route('/api/archived_organizations', methods=['GET'])
def get_archived_organizations():
    orgs = []
    result = supabase.table('organizations').select('*').eq('status', 'Archived').execute()
    if result.data:
        for org in result.data:
            dept_name = "-"
            if org.get('department_id'):
                d = supabase.table('departments').select('dept_name').eq('id', org['department_id']).execute()
                if d.data and isinstance(d.data, list):
                    dept_name = d.data[0]['dept_name']
            orgs.append({
                'id': org['id'],
                'name': org['org_name'],
                'department': dept_name,
                'username': org['username'],
                'password': org['password'],
                'date': str(org.get('accreditation_date')),
                'status': org.get('status'),
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
    status = 'Active'
    department_id = data.get('department_id')
    admin = get_admin_data(session['osas_admin'])
    existing = supabase.table('organizations').select('id').or_(
        f"org_name.eq.{org_name},username.eq.{username}"
    ).execute()
    if existing.data and len(existing.data) > 0:
        return jsonify({'error': 'Organization name or username already exists'}), 400

    hashed_password = generate_password_hash(password)
    org_result = supabase.table('organizations').insert({
        'org_name': org_name,
        'username': username,
        'password': hashed_password,
        'accreditation_date': accreditation_date,
        'status': status,
        'department_id': department_id,
        'must_change_password': True,
        'created_by': admin['id'] if admin else None
    }).execute()

    new_org_id = None
    if org_result.data and isinstance(org_result.data, list) and len(org_result.data) > 0:
        new_org_id = org_result.data[0]['id']
    if new_org_id:
        default_checklist = {
            "august": False, "september": False, "october": False, "november": False,
            "december": False, "january": False, "february": False, "march": False, "april": False, "may": False,
        }
        supabase.table('financial_reports').insert({
            "organization_id": new_org_id,
            "status": "Pending Review",
            "notes": "",
            "checklist": default_checklist,
            "submission_date": datetime.utcnow().date().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).execute()

    dept_name = "-"
    if department_id:
        d = supabase.table('departments').select('dept_name').eq('id', department_id).execute()
        if d.data and isinstance(d.data, list):
            dept_name = d.data[0]['dept_name']

    if admin:
        log_activity(admin['id'], 'organization', f'Added new organization: "{org_name}" in {dept_name}')
    return jsonify({'message': 'Organization added', 'username': username, 'password': password}), 201

@osas.route('/api/organizations/<int:org_id>', methods=['PUT'])
def update_organization(org_id):
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401
    data = request.get_json()
    update_data = {
        'org_name': data.get('orgName'),
        'username': data.get('username'),
        'password': generate_password_hash(data.get('password')) if data.get('password') else None,
        'accreditation_date': data.get('accreditationDate'),
        'status': 'Active',
        'department_id': data.get('department_id')
    }
    update_data = {k: v for k, v in update_data.items() if v is not None}
    result = supabase.table('organizations').select('*').eq('id', org_id).execute()
    old_org = result.data[0] if result.data and isinstance(result.data, list) else {}
    supabase.table('organizations').update(update_data).eq('id', org_id).execute()
    admin = get_admin_data(session['osas_admin'])
    if admin:
        for key in update_data:
            old = old_org.get(key)
            new = update_data[key]
            if old != new:
                log_admin_audit(admin['id'], key, old, new)
        log_activity(admin['id'], 'organization', f'Updated organization [{org_id}]')
    return jsonify({'message': 'Organization updated'})

@osas.route('/api/organizations/<int:org_id>', methods=['DELETE'])
def archive_organization(org_id):
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401
    supabase.table('organizations').update({'status': 'Archived'}).eq('id', org_id).execute()
    admin = get_admin_data(session['osas_admin'])
    if admin:
        log_activity(admin['id'], 'organization', f"Archived organization [{org_id}]")
    return jsonify({'message': 'Organization archived'})

@osas.route('/api/organizations/<int:org_id>/restore', methods=['PATCH'])
def restore_organization(org_id):
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401
    supabase.table('organizations').update({'status': 'Active'}).eq('id', org_id).execute()
    admin = get_admin_data(session['osas_admin'])
    if admin:
        log_activity(admin['id'], 'organization', f"Restored organization [{org_id}]")
    return jsonify({'message': 'Organization restored'})

# ========== DEPARTMENTS API ===========
@osas.route('/api/departments', methods=['GET'])
def get_departments():
    try:
        result = supabase.table('departments').select('id,dept_name').execute()
        print(result)  # See output in console
        departments = [{"id": d["id"], "name": d["dept_name"]} for d in result.data if isinstance(result.data, list)]
        return jsonify({"departments": departments})
    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ========== FINANCIAL REPORTS API ===========
@osas.route('/api/organizations/<int:org_id>/financial_reports', methods=['GET'])
def get_financial_reports_by_org(org_id):
    results = supabase.table('financial_reports').select('*').eq('organization_id', org_id).execute()
    reports = results.data if results.data else []
    return jsonify({"reports": reports})

@osas.route('/api/organizations/<int:org_id>/financial_reports', methods=['POST'])
def create_financial_report_by_org(org_id):
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401
    data = request.get_json()
    report = {
        "organization_id": org_id,
        "status": data.get("status") or "Pending Review",
        "notes": data.get("notes") or "",
        "checklist": data.get("checklist") or {},
        "submission_date": data.get("submission_date") or datetime.utcnow().date().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    inserted = supabase.table('financial_reports').insert(report).execute()
    return jsonify({"message": "Financial report created", "report": inserted.data[0]})

@osas.route('/api/financial_reports/<int:report_id>', methods=['PUT'])
def update_financial_report(report_id):
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401
    data = request.get_json()
    update_data = {}
    if "status" in data: update_data["status"] = data["status"]
    if "notes" in data: update_data["notes"] = data["notes"]
    if "checklist" in data: update_data["checklist"] = data["checklist"]
    update_data["updated_at"] = datetime.utcnow().isoformat()
    try:
        print(f"Updating Financial Report {report_id} with:", update_data)
        result = supabase.table('financial_reports').update(update_data).eq('id', report_id).execute()
        print(f"Supabase Update Result: {result}")
        
        if hasattr(result, 'error') and result.error:
            print("Supabase returned error:", result.error)
            return jsonify({"error": result.error}), 500
        return jsonify({"message": "Financial report updated", "updated": update_data})
    except Exception as e:
        print("ERROR during financial report update:", e)
        return jsonify({'error': str(e)}), 500

@osas.route('/api/financial_reports/<int:report_id>', methods=['GET'])
def get_single_financial_report(report_id):
    result = supabase.table('financial_reports').select('*').eq('id', report_id).execute()
    if not result.data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(result.data[0])

# ========== ADMIN/SETTINGS ===========
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
    old_admin = get_admin_data(username)

    if data.get("full_name") and data["full_name"] != old_admin.get("full_name"):
        update_data["full_name"] = data["full_name"]
        log_admin_audit(old_admin['id'], "full_name", old_admin.get("full_name"), data["full_name"])

    if data.get("email") and data["email"] != old_admin.get("email"):
        update_data["email"] = data["email"]
        log_admin_audit(old_admin['id'], "email", old_admin.get("email"), data["email"])

    # Handle username change and uniqueness check
    if data.get("username") and data["username"] != username:
        existing = supabase.table('osas_admin').select('id').eq("username", data["username"]).execute()
        if existing.data:
            return jsonify({"error": "Username already exists."}), 400
        update_data["username"] = data["username"]
        log_admin_audit(old_admin['id'], "username", old_admin.get("username"), data["username"])
        session["osas_admin"] = data["username"]

    if update_data:
        supabase.table('osas_admin').update(update_data).eq('username', username).execute()
        new_user = update_data.get("username", username)
    else:
        new_user = username

    admin = get_admin_data(new_user)
    if admin:
        log_activity(admin['id'], 'settings', "Profile updated")
    return jsonify({"message": "Profile updated!", "updated": update_data})


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
    log_admin_audit(admin['id'], "password", None, "[UPDATED]")
    log_activity(admin['id'], 'security', "Changed password")
    return jsonify({"message": "Password changed"})

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

@osas.route('/api/admin/sessions', methods=['GET'])
def get_admin_sessions():
    if 'osas_admin' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    admin = get_admin_data(session['osas_admin'])
    sessions = []
    if admin:
        result = supabase.table('osas_sessions').select('*').eq('admin_id', admin['id']).order('last_active_at', desc=True).execute()
        sessions = result.data
    return jsonify({'sessions': sessions})

@osas.route('/api/admin/request_password_reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    username = data.get('username')
    admin = get_admin_data(username)
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404
    token = str(uuid.uuid4())
    expires_at = (datetime.utcnow()).isoformat()
    supabase.table('osas_password_resets').insert({
        'admin_id': admin['id'],
        'token': token,
        'expires_at': expires_at,
        'used': False
    }).execute()
    return jsonify({'message': 'Password reset token generated', 'token': token})

@osas.route('/api/admin/reset_password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_pw = data.get('new_password')
    row = supabase.table('osas_password_resets').select('*').eq('token', token).eq('used', False).execute()
    if not row.data or not new_pw:
        return jsonify({'error': 'Invalid token or password'}), 400
    admin_id = row.data[0]['admin_id']
    hashed = generate_password_hash(new_pw)
    supabase.table('osas_admin').update({'password': hashed}).eq('id', admin_id).execute()
    supabase.table('osas_password_resets').update({'used': True}).eq('token', token).execute()
    log_admin_audit(admin_id, "password", None, "[RESET]")
    log_activity(admin_id, 'security', 'Password reset via token')
    return jsonify({'message': 'Password reset successful'})