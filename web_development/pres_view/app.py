from flask import Flask, render_template, request, redirect, url_for, flash, session
import os
from dotenv import load_dotenv

load_dotenv()  # loads variables from .env

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")  # Make sure you have SECRET_KEY in your .env

# -------- LANDING PAGE --------
@app.route('/')
def landingpage():
    return render_template('landingpage.html')

# -------- LOGIN PAGE --------
@app.route('/login', methods=['GET', 'POST'])
def pres_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # DEMO login validation (replace with your DB check)
        if username == "demo" and password == "demo":
            session['pres_user'] = username
            return redirect(url_for('homepage'))
        else:
            flash("Invalid username or password", "danger")
            return redirect(url_for('pres_login'))

    return render_template('login.html')

# -------- FORGOT PASSWORD --------
@app.route('/forgot-password', methods=['GET', 'POST'])
def pres_forgot_password():
    if request.method == 'POST':
        username = request.form.get('username')
        # handle password reset logic here
        flash("Password reset instructions sent!", "success")
    return render_template('forgot_password.html')

# -------- HOMEPAGE AFTER LOGIN --------
@app.route('/homepage')
def homepage():
    if 'pres_user' in session:
        return render_template('homepage.html')
    return redirect(url_for('pres_login'))

# -------- LOGOUT --------
@app.route('/logout')
def pres_logout():
    session.clear()
    return redirect(url_for('landingpage'))

if __name__ == "__main__":
    app.run(debug=True)