from flask import Flask, redirect, url_for, session, jsonify, request
from supabase import create_client
import os
from dotenv import load_dotenv

# Blueprints
from osas_view.app import osas
from pres_view.app import pres

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

# Session configuration
app.config['SESSION_COOKIE_NAME'] = 'pockitrack_session'
app.config['SESSION_PERMANENT'] = False

# Register Blueprints
app.register_blueprint(osas, url_prefix='/osas')
app.register_blueprint(pres, url_prefix='/pres')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/')
def home():
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'message': 'Go to /osas/api/admin/login for authentication'}), 200
    return redirect(url_for('osas.osas_login'))

@app.route('/osas/api/auth_status', methods=['GET'])
def osas_auth_status():
    login_state = 'osas_admin' in session
    return jsonify({
        'logged_in': login_state,
        'user': session.get('osas_admin') if login_state else None
    })

@app.route('/pres/api/auth_status', methods=['GET'])
def pres_auth_status():
    login_state = 'pres_user' in session
    return jsonify({
        'logged_in': login_state,
        'user': session.get('pres_user') if login_state else None
    })

@app.route('/osas')
def osas_root():
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'message': 'Go to /osas/api/admin/login or /osas/api/auth_status'}), 200
    return redirect(url_for('osas.osas_login'))

@app.route('/pres')
def pres_root():
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'message': 'Go to /pres/api/admin/login or /pres/api/auth_status'}), 200
    return redirect(url_for('pres.pres_login'))

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'app': 'PockiTrack API', 'version': '1.0'})

if __name__ == '__main__':
    app.run(debug=True)