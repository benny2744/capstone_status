"""
Student Dashboard Server with Authentication
"""

from flask import Flask, request, jsonify, session, send_from_directory, redirect
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import json
import os
import secrets

app = Flask(__name__, static_folder='../dist', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Enable CORS for development
CORS(app, supports_credentials=True)

# Simple user database (in production, use a real database)
# Password is hashed version of the plaintext password
USERS = {
    "admin": generate_password_hash("changeme123"),
    "teacher": generate_password_hash("teacher2024"),
}

def load_students():
    """Load student data from JSON file"""
    data_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'students.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# ============ Auth Routes ============

@app.route('/api/login', methods=['POST'])
def login():
    """Handle login requests"""
    data = request.get_json()
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')
    
    if username in USERS and check_password_hash(USERS[username], password):
        session['user'] = username
        session.permanent = True
        return jsonify({'success': True, 'user': username})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """Handle logout requests"""
    session.pop('user', None)
    return jsonify({'success': True})

@app.route('/api/auth/status')
def auth_status():
    """Check if user is authenticated"""
    if 'user' in session:
        return jsonify({'authenticated': True, 'user': session['user']})
    return jsonify({'authenticated': False})

# ============ Protected API Routes ============

@app.route('/api/students')
@login_required
def get_students():
    """Return student data (protected)"""
    students = load_students()
    return jsonify(students)

# ============ Static File Serving ============

@app.route('/')
def serve_root():
    """Serve the main app or login page"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    print(f"🎓 Student Dashboard Server")
    print(f"   Running on http://localhost:{port}")
    print(f"   Debug mode: {debug}")
    print()
    print("Default credentials:")
    print("   admin / changeme123")
    print("   teacher / teacher2024")
    print()
    app.run(host='0.0.0.0', port=port, debug=debug)
