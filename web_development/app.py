from flask import Flask, render_template, request, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, Client

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# Supabase configuration
SUPABASE_URL = "https://bnkggjdkhhdrvtnqrzcv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua2dnamRraGhkcnZ0bnFyemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzg4MzEsImV4cCI6MjA3NTk1NDgzMX0._Icb4qRXTzU8GSdLrv0hqYHc7cJMG-ObpZgFM2hPqOI"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Routes
@app.route('/')
def home():
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Fetch user from Supabase
        response = supabase.table("users").select("*").eq("email", email).execute()
        user = response.data[0] if response.data else None

        if not user:
            flash("Invalid email or password.", "error")
            return redirect(url_for('login'))

        # Check hashed password
        if not check_password_hash(user['password'], password):
            flash("Invalid email or password.", "error")
            return redirect(url_for('login'))

        flash(f"Welcome back, {user['fullname']}!", "success")
        return redirect(url_for('home'))

    return render_template('login.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        fullname = request.form['fullname']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        # Password validation
        if len(password) < 8:
            flash("Password must be at least 8 characters long.", "error")
            return redirect(url_for('signup'))

        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return redirect(url_for('signup'))

        # Check if email already exists
        existing_user = supabase.table("users").select("email").eq("email", email).execute()
        if existing_user.data:
            flash("Email already registered. Please log in instead.", "error")
            return redirect(url_for('signup'))

        # Hash password
        password_hash = generate_password_hash(password)

        # Insert into Supabase
        supabase.table("users").insert({
            "fullname": fullname,
            "email": email,
            "password": password_hash
        }).execute()

        flash("Signup successful! Please log in.", "success")
        return redirect(url_for('login'))

    return render_template('signup.html')


@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']
        flash("Password reset instructions have been sent to your email.", "success")
        return redirect(url_for('login'))
    return render_template('forgot_password.html')


if __name__ == '__main__':
    app.run(debug=True)