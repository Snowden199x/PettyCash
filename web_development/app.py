from flask import Flask, redirect, url_for, session
from supabase import create_client
import os
from dotenv import load_dotenv

# ✅ Import the OSAS, PRES Blueprint
from osas_view.app import osas  
from pres_view.app import pres

# ✅ Load environment variables
load_dotenv()

# ✅ Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

# ⭐ IMPORTANT: Session cookie name (avoid conflicts)
app.config['SESSION_COOKIE_NAME'] = 'pockitrack_session'
app.config['SESSION_PERMANENT'] = False

# ✅ Register the OSAS, PRES Blueprint
app.register_blueprint(osas, url_prefix='/osas')
app.register_blueprint(pres, url_prefix='/pres')

# ✅ Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ✅ Redirect root URL to OSAS login
@app.route('/')
def home():
    return redirect(url_for('osas.osas_login'))

# ✅ Run the app
if __name__ == '__main__':
    app.run(debug=True)
