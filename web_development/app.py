from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# SQLite database file inside your project
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Example model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))

with app.app_context():
    db.create_all()  # Create database tables

@app.route('/')
def home():
    return "Database connected successfully!"

if __name__ == '__main__':
    app.run(debug=True)
