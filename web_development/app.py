from flask import Flask, request, jsonify
from supabase import create_client, Client

app = Flask(__name__)

# --- Supabase Configuration ---
SUPABASE_URL = "https://itvemmgexltaomqwtmhk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dmVtbWdleGx0YW9tcXd0bWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODkwNjgsImV4cCI6MjA3NjQ2NTA2OH0.g39gxQVjl4CpfeIumJGN9fv9YGXsNUI5UZH4rABLb3o"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- ROUTES ---
@app.route('/')
def home():
    return "Flask + Supabase connected successfully!"

@app.route('/add_user', methods=['POST'])
def add_user():
    data = request.json
    response = supabase.table("users").insert(data).execute()
    return jsonify(response.data)

@app.route('/get_users', methods=['GET'])
def get_users():
    response = supabase.table("users").select("*").execute()
    return jsonify(response.data)

if __name__ == '__main__':
    app.run(debug=True)
