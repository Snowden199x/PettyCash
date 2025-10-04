from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# SQLite database file (created automatically)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Example model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)

with app.app_context():
    db.create_all()  # creates database.db if it doesn't exist

@app.route('/')
def home():
    return "Database connected successfully!"

if __name__ == '__main__':
    app.run(debug=True)
