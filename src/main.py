import os
import sys
# Path fix to ensure 'src' is found when main.py is inside 'src'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.coach import coach_bp
from src.routes.customer import customer_bp
from src.routes.booking import booking_bp
from src.routes.availability import availability_bp
from src.routes.date_specific_availability import date_specific_bp
from src.routes.migrate import migrate_bp
from src.routes.migrate import migrate_events_bp
from src.routes.migrate import migrate_session_notes_bp
from src.routes.migrate import migrate_training_plans_bp
from src.routes.training_plan import training_plan_bp
from src.routes.exercise_template import exercise_template_bp
from src.routes.workout_completion import workout_completion_bp
from src.routes.admin import admin_bp
from src.routes.customer_management import customer_management_bp
from src.routes.branding import branding_bp
from src.routes.package import package_bp
from src.routes.coach_assignment import assignment_bp


app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app, origins=["https://coachsync-web.onrender.com", "http://localhost:5173"], supports_credentials=True)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(coach_bp, url_prefix='/api/coach')
app.register_blueprint(customer_bp, url_prefix='/api/customer')
app.register_blueprint(booking_bp, url_prefix='/api')
app.register_blueprint(availability_bp, url_prefix='/api')
app.register_blueprint(date_specific_bp, url_prefix='/api')
app.register_blueprint(migrate_bp, url_prefix='/api')
app.register_blueprint(migrate_events_bp, url_prefix='/api')
app.register_blueprint(migrate_session_notes_bp, url_prefix='/api')
app.register_blueprint(migrate_training_plans_bp, url_prefix='/api')
app.register_blueprint(training_plan_bp, url_prefix='/api')
app.register_blueprint(exercise_template_bp, url_prefix='/api')
app.register_blueprint(workout_completion_bp)
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(customer_management_bp, url_prefix='/api')
app.register_blueprint(branding_bp, url_prefix='/api')
app.register_blueprint(package_bp, url_prefix='/api/packages')
app.register_blueprint(assignment_bp, url_prefix='/api')

# Database configuration for production
# Use PostgreSQL if DATABASE_URL is set, otherwise fall back to SQLite
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Render provides DATABASE_URL automatically when you connect the database
    # Fix for SQLAlchemy 1.4+ which doesn't accept postgres:// prefix
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    print(f"✅ Using PostgreSQL database")
else:
    # Fallback to SQLite for local development
    os.makedirs('/tmp/coachsync', exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/coachsync/app.db'
    print(f"⚠️  Using SQLite database (data will not persist on Render)")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()
    print(f"✅ Database tables created successfully")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Don't intercept API routes - let blueprints handle them
    if path.startswith('api/'):
        return "Not Found", 404
    
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "Welcome to AthleteHub API", 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
