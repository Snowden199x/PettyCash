from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from pathlib import Path
import logging

# Initilize the SQLALchemy
db = SQLAlchemy()
DB_NAME = "dataRecipe.db"

# Configures the way how to debug in log and format 
logging.basicConfig(level=logging.INFO, filename="Recipe_Manager.log", filemode="w",
                    format="%(filename)s - %(asctime)s - %(levelname)s - %(message)s",
                    datefmt="%Y-%M-%D %H:%M:%S")

# Initializes the Custom logger for this file
logger = logging.getLogger(__name__)

def run_app():
    # Initialize the Flask
    app = Flask(__name__)

    # Settings for the Database
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
    app.config['SECRET_KEY'] = '48084b9b12ba702758cd10336ae388cf'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Allows the Vite and Flask to work
    CORS(app)

    db.init_app(app)

    create_database(app)

    # Automatically closes any DB session
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()
        
    return app

# Create Database if it does not exist
def create_database(app):
    db_path = Path(app.root_path) / DB_NAME
    if not db_path.exists():
        with app.app_context():
            db.create_all()
            logger.info("Database Created")