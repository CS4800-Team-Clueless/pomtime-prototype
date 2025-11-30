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
import certifi
from bson.objectid import ObjectId

# Load variables from .env
load_dotenv()

# Initialize MongoDB client
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "PomTimeDB")

# Connect to MongoDB with SSL certificate
client = MongoClient(
    MONGODB_URI,
    tlsCAFile=certifi.where()
)
db = client[DB_NAME]
users_collection = db['users']
tasks_collection = db['tasks']

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
                'points': 0,  # Initialize with 0 points
                'collection': {},  # Initialize empty collection
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
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if user:
        user['_id'] = str(user['_id'])
        return jsonify({'user': user})

    return jsonify({'error': 'User not found'}), 404


# ==================== POINTS ROUTES ====================

@app.route('/api/points', methods=['GET'])
@require_auth
def get_points():
    """Get user's current points"""
    user_id = request.user['user_id']
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if user:
        return jsonify({'points': user.get('points', 0)})

    return jsonify({'error': 'User not found'}), 404


@app.route('/api/pomodoro/complete', methods=['POST'])
@require_auth
def complete_pomodoro():
    """Complete a pomodoro session and award points"""
    user_id = request.user['user_id']
    data = request.get_json()

    duration_minutes = data.get('duration_minutes', 25)
    session_type = data.get('session_type', 'work')  # 'work' or 'break'

    # Only award points for work sessions
    if session_type == 'work':
        # Award 2 points per 25-minute work session
        points_earned = ( duration_minutes / 25 ) * 2

        # Award points to user
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'points': points_earned}}
        )

        # Get updated user points
        user = users_collection.find_one({'_id': ObjectId(user_id)})

        return jsonify({
            'success': True,
            'points_earned': points_earned,
            'total_points': user.get('points', 0)
        })

    # Break sessions don't award points
    return jsonify({
        'success': True,
        'points_earned': 0,
        'message': 'Break completed'
    })

# ==================== TASK ROUTES ====================

@app.route('/api/tasks', methods=['GET'])
@require_auth
def get_tasks():
    """Get all tasks for the current user"""
    user_id = request.user['user_id']

    tasks = list(tasks_collection.find({'user_id': user_id}))

    # Convert ObjectId to string
    for task in tasks:
        task['_id'] = str(task['_id'])

    return jsonify({'tasks': tasks})


@app.route('/api/tasks', methods=['POST'])
@require_auth
def create_task():
    """Create a new task"""
    user_id = request.user['user_id']
    data = request.get_json()

    # Calculate points based on duration (30 min = 1 point)
    duration_minutes = data.get('duration_minutes', 30)
    calculated_points = duration_minutes / 30

    task = {
        'user_id': user_id,
        'title': data.get('title'),
        'start': datetime.fromisoformat(data.get('start').replace('Z', '+00:00')),
        'end': datetime.fromisoformat(data.get('end').replace('Z', '+00:00')),
        'duration_minutes': duration_minutes,
        'points': data.get('points', calculated_points),  # Allow custom points
        'recurring': data.get('recurring', False),
        'completed': False,
        'created_at': datetime.utcnow()
    }

    result = tasks_collection.insert_one(task)
    task['_id'] = str(result.inserted_id)
    task['start'] = task['start'].isoformat()
    task['end'] = task['end'].isoformat()
    task['created_at'] = task['created_at'].isoformat()

    return jsonify({'success': True, 'task': task}), 201


@app.route('/api/tasks/<task_id>', methods=['PUT'])
@require_auth
def update_task(task_id):
    """Update a task"""
    user_id = request.user['user_id']
    data = request.get_json()

    # Verify task belongs to user
    task = tasks_collection.find_one({'_id': ObjectId(task_id), 'user_id': user_id})
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    update_data = {}
    if 'title' in data:
        update_data['title'] = data['title']
    if 'start' in data:
        update_data['start'] = datetime.fromisoformat(data['start'].replace('Z', '+00:00'))
    if 'end' in data:
        update_data['end'] = datetime.fromisoformat(data['end'].replace('Z', '+00:00'))
    if 'duration_minutes' in data:
        update_data['duration_minutes'] = data['duration_minutes']
        # Recalculate points if not custom
        if 'points' not in data:
            update_data['points'] = data['duration_minutes'] / 30
    if 'points' in data:
        update_data['points'] = data['points']
    if 'recurring' in data:
        update_data['recurring'] = data['recurring']

    tasks_collection.update_one(
        {'_id': ObjectId(task_id)},
        {'$set': update_data}
    )

    return jsonify({'success': True})


@app.route('/api/tasks/<task_id>/complete', methods=['POST'])
@require_auth
def complete_task(task_id):
    """Mark a task as complete and award points"""
    user_id = request.user['user_id']

    # Verify task belongs to user and not already completed
    task = tasks_collection.find_one({'_id': ObjectId(task_id), 'user_id': user_id})
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    if task.get('completed'):
        return jsonify({'error': 'Task already completed'}), 400

    # Mark task as completed
    tasks_collection.update_one(
        {'_id': ObjectId(task_id)},
        {'$set': {'completed': True, 'completed_at': datetime.utcnow()}}
    )

    # Award points to user
    points = task.get('points', 1)
    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$inc': {'points': points}}
    )

    # If recurring, create a new instance for tomorrow
    if task.get('recurring'):
        start = task['start'] + timedelta(days=1)
        end = task['end'] + timedelta(days=1)

        new_task = {
            'user_id': user_id,
            'title': task['title'],
            'start': start,
            'end': end,
            'duration_minutes': task.get('duration_minutes', 30),
            'points': task.get('points', 1),
            'recurring': True,
            'completed': False,
            'created_at': datetime.utcnow()
        }
        tasks_collection.insert_one(new_task)

    # Get updated points
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    return jsonify({
        'success': True,
        'points_earned': points,
        'total_points': user.get('points', 0)
    })


@app.route('/api/tasks/<task_id>', methods=['DELETE'])
@require_auth
def delete_task(task_id):
    """Delete a task"""
    user_id = request.user['user_id']

    result = tasks_collection.delete_one({'_id': ObjectId(task_id), 'user_id': user_id})

    if result.deleted_count == 0:
        return jsonify({'error': 'Task not found'}), 404

    return jsonify({'success': True})


# ==================== GACHA ROUTES ====================

# Gacha pools
FIVE_STAR_POOL = ["King", "Angel", "Dragon"]
FOUR_STAR_POOL = ["Snow", "Prince", "Moon", "Autumn"]
THREE_STAR_POOL = ["White", "Brown", "Orange", "Black", "Cream", "Gray", "Tan", "Beige"]


def perform_gacha_roll():
    """Perform a single gacha roll"""
    import random
    roll = random.random()

    if roll < 0.006:  # 0.6% for 5-star
        return {
            'name': random.choice(FIVE_STAR_POOL),
            'stars': 5
        }
    elif roll < 0.056:  # 5% for 4-star
        return {
            'name': random.choice(FOUR_STAR_POOL),
            'stars': 4
        }
    else:  # 94.4% for 3-star
        return {
            'name': random.choice(THREE_STAR_POOL),
            'stars': 3
        }


@app.route('/api/gacha/roll', methods=['POST'])
@require_auth
def gacha_roll():
    """Perform gacha roll(s) and add to collection"""
    user_id = request.user['user_id']
    data = request.get_json()
    count = data.get('count', 1)  # 1 or 10

    if count not in [1, 10]:
        return jsonify({'error': 'Invalid roll count'}), 400

    # Check if user has enough points
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    current_points = user.get('points', 0)

    if current_points < count:
        return jsonify({
            'error': 'Insufficient points',
            'required': count,
            'current': current_points
        }), 400

    # Deduct points
    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$inc': {'points': -count}}
    )

    # Perform rolls
    results = []
    collection_updates = {}

    for i in range(count):
        roll = perform_gacha_roll()
        results.append(roll)

        # Count each character for collection update
        char_name = roll['name']
        collection_updates[char_name] = collection_updates.get(char_name, 0) + 1

    # Update user's collection
    update_operations = {}
    for char_name, count_increment in collection_updates.items():
        update_operations[f'collection.{char_name}'] = count_increment

    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$inc': update_operations}
    )

    # Get updated user data
    updated_user = users_collection.find_one({'_id': ObjectId(user_id)})

    return jsonify({
        'success': True,
        'results': results,
        'remaining_points': updated_user.get('points', 0),
        'collection': updated_user.get('collection', {})
    })


@app.route('/api/collection', methods=['GET'])
@require_auth
def get_collection():
    """Get user's character collection"""
    user_id = request.user['user_id']
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if user:
        return jsonify({'collection': user.get('collection', {})})

    return jsonify({'error': 'User not found'}), 404


# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'database': 'connected'})


if __name__ == '__main__':
    # Create indexes for better query performance
    users_collection.create_index('google_id', unique=True)
    users_collection.create_index('email')
    tasks_collection.create_index([('user_id', 1), ('start', 1)])

    app.run(debug=True, host='0.0.0.0', port=5000)