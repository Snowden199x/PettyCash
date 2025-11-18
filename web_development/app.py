from flask import Flask, redirect, url_for, session
from supabase import create_client
import os
from dotenv import load_dotenv

# Blueprints
from osas_view.app import osas
from pres_view.app import pres

# Load environment variables
load_dotenv()

# ===========================
# Initialize Flask app
# ===========================
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

# Session configuration
app.config['SESSION_COOKIE_NAME'] = 'pockitrack_session'
app.config['SESSION_PERMANENT'] = False

# ===========================
# Register Blueprints
# ===========================
app.register_blueprint(osas, url_prefix='/osas')
app.register_blueprint(pres, url_prefix='/pres')

# ===========================
# Supabase connection
# ===========================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ===========================
# Root redirects
# ===========================
@app.route('/')
def home():
    return redirect(url_for('osas.osas_login'))

@app.route('/osas')
def osas_root():
    return redirect(url_for('osas.osas_login'))

@app.route('/pres')
def pres_root():
    return redirect(url_for('pres.pres_login'))

# ===========================
# Run the app
# ===========================
if __name__ == '__main__':
    app.run(debug=True)