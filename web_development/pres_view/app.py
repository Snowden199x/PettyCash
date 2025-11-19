from flask import Blueprint, render_template, request, redirect, url_for, flash, session, make_response
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
# LANDING PAGE
# =======================
@pres.route('/')
def landingpage():
    return render_template('landingpage.html')

# =======================
# LOGIN PAGE
# =======================
@pres.route('/login/pres', methods=['GET', 'POST'])
def pres_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        result = supabase.table('organizations').select('*').eq('username', username).execute()

        if result.data:
            org = result.data[0]

            if check_password_hash(org['password'], password):
                # Set session
                session['pres_user'] = True
                session['org_id'] = org['id']
                session['org_name'] = org['org_name']

                # Redirect to change password if required
                if org.get('must_change_password', False):
                    return redirect(url_for('pres.change_password'))

                return redirect(url_for('pres.homepage'))
            else:
                flash("Incorrect password.", "danger")
                return redirect(url_for('pres.pres_login'))
        else:
            flash("Organization not found.", "danger")
            return redirect(url_for('pres.pres_login'))

    return render_template('pres_login.html')

# =======================
# FORGOT PASSWORD
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

    if request.method == 'POST':
        new_pw = request.form.get('new_password')
        confirm_pw = request.form.get('confirm_password')

        if not new_pw or not confirm_pw:
            flash("Please fill out all fields.", "danger")
            return render_template('change_password.html')

        if new_pw != confirm_pw:
            flash("Passwords do not match.", "danger")
            return render_template('change_password.html')

        errors = validate_password(new_pw)
        if errors:
            for e in errors:
                flash(e, "danger")
            return render_template('change_password.html')

        hashed_pw = generate_password_hash(new_pw)
        supabase.table('organizations').update({
            'password': hashed_pw,
            'must_change_password': False
        }).eq('id', session['org_id']).execute()

        # Ensure session values persist
        session['pres_user'] = True

        flash("Password changed successfully!", "success")
        return redirect(url_for('pres.homepage'))

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
    return redirect(url_for('pres.landingpage'))