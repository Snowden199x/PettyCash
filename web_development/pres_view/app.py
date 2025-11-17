from flask import Blueprint, render_template, request, redirect, url_for, flash, session
import os
from dotenv import load_dotenv
from werkzeug.security import check_password_hash, generate_password_hash
from supabase import create_client

# ======================================
# Initialize Blueprint
# ======================================
pres = Blueprint('pres', __name__, template_folder='templates', static_folder='static')

load_dotenv()

# 🔌 Supabase Setup (ADDED)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ======================================
# LANDING PAGE 
# ======================================
@pres.route('/')
def landingpage():
    return render_template('landingpage.html')

# ======================================
# LOGIN PAGE 
# ======================================
@pres.route('/login', methods=['GET', 'POST'])
def pres_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # 🔍 FETCH account from organizations table
        result = supabase.table('organizations').select('*').eq('username', username).execute()

        if result.data:
            org = result.data[0]

            # 🔒 Check hashed password
            if check_password_hash(org['password'], password):
                session['pres_user'] = org['username']
                session['org_id'] = org['id']

                # 🚨 FIRST-TIME LOGIN?
                if org.get('must_change_password', True):
                    return redirect(url_for('pres.change_password'))

                return redirect(url_for('pres.homepage'))
            else:
                flash("Incorrect password.", "danger")
                return redirect(url_for('pres.pres_login'))
        else:
            flash("Organization not found.", "danger")
            return redirect(url_for('pres.pres_login'))

    return render_template('login.html')

# ======================================
# FORGOT PASSWORD
# ======================================
@pres.route('/forgot-password', methods=['GET', 'POST'])
def pres_forgot_password():
    if request.method == 'POST':
        username = request.form.get('username')
        flash("Password reset instructions sent!", "success")
    return render_template('forgot_password.html')

# ======================================
# CHANGE PASSWORD (NEW — ADDED)
# ======================================
@pres.route('/change-password', methods=['GET', 'POST'])
def change_password():
    if 'pres_user' not in session:
        return redirect(url_for('pres.pres_login'))

    if request.method == 'POST':
        new_pw = request.form.get('new_password')
        confirm_pw = request.form.get('confirm_password')

        if not new_pw or not confirm_pw:
            flash("Please fill out all fields.", "danger")
            return redirect(url_for('pres.change_password'))

        if new_pw != confirm_pw:
            flash("Passwords do not match.", "danger")
            return redirect(url_for('pres.change_password'))

        # 🔐 Hash new password
        hashed_pw = generate_password_hash(new_pw)

        # 🔄 Update Supabase
        supabase.table('organizations').update({
            'password': hashed_pw,
            'must_change_password': False
        }).eq('id', session['org_id']).execute()

        flash("Password changed successfully!", "success")
        return redirect(url_for('pres.homepage'))

    return render_template('change_pass.html')

# ======================================
# HOMEPAGE
# ======================================
@pres.route('/homepage')
def homepage():
    if 'pres_user' in session:
        return render_template('homepage.html')
    return redirect(url_for('pres.pres_login'))

# ======================================
# LOGOUT
# ======================================
@pres.route('/logout')
def pres_logout():
    session.clear()
    return redirect(url_for('pres.landingpage'))