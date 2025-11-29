import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from pymongo import MongoClient
from google.oauth2 import id_token
from google.auth.transport import requests
import secrets
from datetime import datetime, timedelta
from functools import wraps

# Load variables from .env file
load_dotenv()

# Initialize MongoDB client
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "PomTimeDB")

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
users_collection = db['users']

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Configure CORS - update with your actual frontend URL
CORS(app, supports_credentials=True, origins=[
    'http://localhost:5173',
    os.getenv('FRONTEND_URL', 'http://localhost:5173')
])

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

# In-memory session storage (use Redis/MongoDB for production)
sessions = {}


# Middleware to require authentication
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token or token not in sessions:
            return jsonify({'error': 'Unauthorized'}), 401

        # Check if session has expired
        session_data = sessions[token]
        if session_data['expires'] < datetime.utcnow():
            del sessions[token]
            return jsonify({'error': 'Session expired'}), 401

        request.user = session_data
        return f(*args, **kwargs)

    return decorated_function


# ==================== AUTH ROUTES ====================

@app.route('/auth/google', methods=['POST'])
def google_auth():
    """Verify Google ID token and create/update user"""
    try:
        data = request.get_json()
        token = data.get('credential')

        if not token:
            return jsonify({'error': 'No credential provided'}), 400

        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Extract user information from Google
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

        # Check if user already exists
        user = users_collection.find_one({'google_id': google_id})

        if user:
            # Update existing user's last login
            users_collection.update_one(
                {'google_id': google_id},
                {'$set': {'last_login': datetime.utcnow()}}
            )
        else:
            # Create new user document
            user = {
                'google_id': google_id,
                'email': email,
                'name': name,
                'picture': picture,
                'created_at': datetime.utcnow(),
                'last_login': datetime.utcnow()
            }
            result = users_collection.insert_one(user)
            user['_id'] = result.inserted_id

        # Create session token
        session_token = secrets.token_urlsafe(32)
        sessions[session_token] = {
            'user_id': str(user['_id']),
            'email': email,
            'name': name,
            'picture': picture,
            'expires': datetime.utcnow() + timedelta(days=7)
        }

        return jsonify({
            'success': True,
            'token': session_token,
            'user': {
                'id': str(user['_id']),
                'email': email,
                'name': name,
                'picture': picture
            }
        })

    except ValueError as e:
        return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        return jsonify({'error': 'Authentication failed', 'details': str(e)}), 500


@app.route('/auth/verify', methods=['GET'])
def verify_token():
    """Verify if session token is still valid"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    if token in sessions:
        session_data = sessions[token]
        if session_data['expires'] > datetime.utcnow():
            return jsonify({
                'valid': True,
                'user': {
                    'id': session_data['user_id'],
                    'email': session_data['email'],
                    'name': session_data['name'],
                    'picture': session_data['picture']
                }
            })
        else:
            # Clean up expired session
            del sessions[token]

    return jsonify({'valid': False}), 401


@app.route('/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user and invalidate session"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token in sessions:
        del sessions[token]
    return jsonify({'success': True, 'message': 'Logged out successfully'})


@app.route('/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user's full profile from database"""
    user_id = request.user['user_id']

    from bson.objectid import ObjectId
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if user:
        user['_id'] = str(user['_id'])
        return jsonify({'user': user})

    return jsonify({'error': 'User not found'}), 404


# ==================== EXAMPLE PROTECTED ROUTE ====================

@app.route('/api/example', methods=['GET'])
@require_auth
def example_protected_route():
    """Example of a protected route that requires authentication"""
    return jsonify({
        'message': f'Hello {request.user["name"]}!',
        'user_email': request.user['email']
    })


# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'database': 'connected'})


if __name__ == '__main__':
    # Create indexes for better query performance
    users_collection.create_index('google_id', unique=True)
    users_collection.create_index('email')

    app.run(debug=True, host='0.0.0.0', port=5000)