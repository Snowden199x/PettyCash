from flask import Flask, redirect, url_for
from supabase import create_client
import os
from dotenv import load_dotenv

# ✅ Import the OSAS Blueprint
from osas_view.app import osas  

# ✅ Load environment variables
load_dotenv()

# ✅ Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

# ✅ Register the OSAS Blueprint
app.register_blueprint(osas, url_prefix='/osas')

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