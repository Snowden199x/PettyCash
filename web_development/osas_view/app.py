from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from supabase import create_client
import os
from dotenv import load_dotenv
import random
import string
from datetime import date

load_dotenv()

# Blueprint
osas = Blueprint(
    'osas',
    __name__,
    url_prefix='/osas',
    template_folder='templates',
    static_folder='static'
)

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Helper functions
def generate_username():
    return f"0125-{random.randint(1000,9999)}"

def generate_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

# --- LOGIN DASHBOARD LOGOUT ---
@osas.route('/login', methods=['GET','POST'])
def osas_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        result = supabase.table('osas_admin').select('*').eq('username', username).execute()
        if result.data:
            admin = result.data[0]
            if check_password_hash(admin['password'], password):
                session['osas_admin'] = username
                flash('OSAS login successful!', 'success')
                return redirect(url_for('osas.osas_dashboard'))
            flash('Incorrect password.', 'danger')
        else:
            flash('Admin not found.', 'danger')
    return render_template('login.html')

@osas.route('/dashboard')
def osas_dashboard():
    if 'osas_admin' in session:
        return render_template('homepage.html')
    return redirect(url_for('osas.osas_login'))

@osas.route('/logout')
def osas_logout():
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


# ==========================
# ORGANIZATION API
# ==========================

# GET all organizations
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
                'status': org['status']
            })
    return jsonify({'organizations': orgs})

# ADD organization
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

    # Check for duplicates
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
        'must_change_password': True
    }).execute()

    return jsonify({'message': 'Organization added', 'username': username, 'password': password}), 201

# UPDATE organization
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
    return jsonify({'message': 'Organization updated'})

# DELETE organization
@osas.route('/api/organizations/<int:org_id>', methods=['DELETE'])
def delete_organization(org_id):
    if 'osas_admin' not in session:
        return jsonify({'error': 'Login required'}), 401

    supabase.table('organizations').delete().eq('id', org_id).execute()
    return jsonify({'message': 'Organization deleted'})