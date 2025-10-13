from flask import Flask, render_template, request, redirect, url_for, flash
from werkzeug.security import generate_password_hash
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Needed for flash messages

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def login():
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        # Password validation (at least 8 characters)
        if len(password) < 8:
            flash("Password must be at least 8 characters long.", "error")
            return redirect(url_for('signup'))

        # Check if password and confirm password match
        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return redirect(url_for('signup'))

        # Hash the password before storing
        password_hash = generate_password_hash(password)

        new_user = User(email=email, password=password_hash)
        db.session.add(new_user)
        db.session.commit()

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