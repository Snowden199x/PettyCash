from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from werkzeug.security import check_password_hash
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

# ✅ Create Blueprint
osas = Blueprint(
    'osas',
    __name__,
    url_prefix='/osas',
    template_folder='templates',
    static_folder='static'
)

# ✅ Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# -------- LOGIN ROUTE --------
@osas.route('/login', methods=['GET', 'POST'])
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
            else:
                flash('Incorrect password.', 'danger')
        else:
            flash('Admin not found.', 'danger')

    return render_template('login.html')

# -------- DASHBOARD ROUTE --------
@osas.route('/dashboard')
def osas_dashboard():
    if 'osas_admin' in session:
        return render_template('homepage.html')
    else:
        return redirect(url_for('osas.osas_login'))