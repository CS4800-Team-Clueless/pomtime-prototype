import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from pymongo import MongoClient
from google.oauth2 import id_token
from google.auth.transport import requests
import secrets
from datetime import datetime, timedelta, timezone
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
pomodoro_collection = db['pomodoro_sessions']

app = Flask(__name__)

# Check if running in production
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production' or os.getenv('ENV') == 'production'

# Disable debug mode in production
DEBUG_MODE = not IS_PRODUCTION

app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Configure CORS - update with your actual frontend URL
CORS(app, supports_credentials=True, origins=[
    'http://localhost:5173',
    os.getenv('FRONTEND_URL', 'http://localhost:5173')
], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

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
            # Clean up any old sessions for this email (in case user was deleted and recreated)
            sessions_to_delete = [sess_token for sess_token, session in sessions.items()
                                  if session.get('email') == email]
            for old_token in sessions_to_delete:
                del sessions[old_token]
                print(f"Cleaned up old session for {email}")

            # Create new user document
            user = {
                'google_id': google_id,
                'email': email,
                'name': name,
                'picture': picture,
                'points': 0,  # Initialize with 0 points
                'pomodoro_sessions': 0,  # Initialize session count
                'collection': {},  # Initialize empty collection
                'level': 1,  # Initialize at level 1
                'experience': 0,  # Initialize with 0 XP
                'settings': {  # Initialize default settings
                    'background_type': 'gradient',
                    'background_value': 'gradient-1',
                    'dark_mode': False
                },
                'created_at': datetime.utcnow(),
                'last_login': datetime.utcnow(),
                'daily_points': {
                    'date': datetime.now(timezone.utc).date(),
                    'points_earned': 0
                }
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
        print(f"Token validation error: {str(e)}")
        if IS_PRODUCTION:
            return jsonify({'error': 'Invalid authentication token'}), 401
        else:
            return jsonify({'error': 'Invalid token', 'details': str(e)}), 401

    except Exception as e:
        print(f"Authentication error: {str(e)}")
        import traceback
        traceback.print_exc()
        if IS_PRODUCTION:
            return jsonify({'error': 'Authentication failed'}), 500
        else:
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


def check_daily_point_limit(user_id, points):
    DAILY_LIMIT = 50
    # Using UTC-8 for PST (adjust to -7 during daylight saving if needed)
    pst = timezone(timedelta(hours=-8))
    today = str(datetime.now(pst).date())

    user = users_collection.find_one({'_id': ObjectId(user_id)})
    daily_points = user.get('daily_points', {})

    last_date = daily_points.get('date')
    daily_points_earned = daily_points.get('points_earned', 0)

    if last_date != today:
        # Reset for new day
        daily_points_earned = 0
        reset_date = True
    else:
        reset_date = False

    if daily_points_earned >= DAILY_LIMIT:
        return 0  # No more points can be added today

    points_to_add = min(points, DAILY_LIMIT - daily_points_earned)

    if reset_date:
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'daily_points': {
                    'date': today,
                    'points_earned': 0
                }
            }}
        )
    else:
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'daily_points.points_earned': points_to_add}}
        )

    return points_to_add


@app.route('/api/user/daily-points', methods=['GET'])
@require_auth
def get_daily_points():
    """Get user's daily points progress"""
    user_id = request.user['user_id']
    # CHANGED: PST is UTC-8, PDT is UTC-7
    pst = timezone(timedelta(hours=-8))
    today = str(datetime.now(pst).date())

    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if not user:
        return jsonify({'error': 'User not found'}), 404

    daily_points = user.get('daily_points', {})
    last_date = daily_points.get('date')
    points_earned = daily_points.get('points_earned', 0)

    # If it's a new day, return 0
    if last_date != today:
        points_earned = 0

    return jsonify({
        'daily_points': points_earned,
        'daily_limit': 50,
        'date': today
    })


# ==================== DAILY CHECK-IN ROUTES ====================

@app.route('/api/checkin', methods=['GET', 'POST'])
@require_auth
def daily_checkin():
    """Handle daily check-in status and submission"""
    try:
        user_id = request.user['user_id']
        user = users_collection.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Use PST timezone (UTC-8)
        pst = timezone(timedelta(hours=-8))
        today = str(datetime.now(pst).date())

        # Get last check-in date
        last_checkin_date = user.get('daily_points', {}).get('last_checkin_date')
        already_checked_in = (last_checkin_date == today)

        # GET request - return status
        if request.method == 'GET':
            return jsonify({
                'can_check_in': not already_checked_in,
                'already_checked_in': already_checked_in,
                'last_checkin_date': last_checkin_date
            })

        # POST request - perform check-in
        if already_checked_in:
            return jsonify({
                'success': False,
                'error': 'Already checked in today'
            }), 400

        # Award points - check daily limit
        points_earned = 5
        actual_points_added = check_daily_point_limit(user_id, points_earned)
        new_total_points = user.get('points', 0) + actual_points_added

        # Update user document with today's date
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {
                    'points': new_total_points,
                    'daily_points.last_checkin_date': today
                }
            }
        )

        return jsonify({
            'success': True,
            'points_earned': actual_points_added,
            'total_points': new_total_points
        })

    except Exception as e:
        print(f"Error during check-in: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Check-in operation failed'}), 500

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
    task_points = task.get('points', 1)
    points = check_daily_point_limit(user_id, task_points)

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


# ====================== POMODORO ROUTES ======================

@app.route('/api/pomodoro/complete', methods=['POST'])
@require_auth
def complete_timer():
    """
    Mark a pomodoro timer as complete:
    - increments user points
    - increments pomodoro_sessions count
    - updates a collection entry
    - logs the session in pomodoro_collection
    """
    user_id = request.user['user_id']
    data = request.get_json()

    # You can send these from the frontend
    duration_minutes = data.get('duration_minutes', 25)
    label = data.get('label', 'Pomodoro Session')
    # simple points rule: 2 point per 25 minutes
    timer_points = data.get('points', max(2, round(duration_minutes / 25)))

    # Get the actual points to add after checking daily limit
    actual_points_to_add = check_daily_point_limit(user_id, timer_points)

    # Update user doc: points, pomodoro_sessions, and collection
    update_fields = {
        'points': actual_points_to_add,  # Use the actual points returned
        'pomodoro_sessions': 1,
        'collection.Pomodoro': 1,
    }

    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$inc': update_fields}
    )

    # Insert a row into pomodoro_collection for history
    pomodoro_session = {
        'user_id': user_id,
        'label': label,
        'duration_minutes': duration_minutes,
        'points_earned': actual_points_to_add,  # Use actual points added
        'completed_at': datetime.utcnow(),
    }

    pomodoro_collection.insert_one(pomodoro_session)

    # Return updated user info
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    return jsonify({
        'success': True,
        'points_earned': actual_points_to_add,  # Return actual points earned
        'total_points': user.get('points', 0),
        'pomodoro_sessions': user.get('pomodoro_sessions', 0),
        'collection': user.get('collection', {})
    })

@app.route('/api/pomodoro/sessions', methods=['GET'])
@require_auth
def get_sessions():
    """Get user's pomodoro sessions history"""
    user_id = request.user['user_id']

    sessions = list(pomodoro_collection.find({'user_id': user_id}))

    # Convert ObjectId to string
    for session in sessions:
        session['_id'] = str(session['_id'])

    return jsonify({'sessions': sessions})


# ==================== LEVEL/EXPERIENCE ROUTES ====================

def calculate_level_from_xp(xp):
    """Calculate level based on total XP (100 XP per level)"""
    return max(1, int(xp // 100) + 1)


def xp_for_next_level(current_level):
    """Calculate XP needed for next level"""
    return current_level * 100


def get_xp_for_rarity(stars):
    """Get XP reward based on rarity"""
    xp_rewards = {
        3: 15,  # 3-star = 10 XP
        4: 100,  # 4-star = 100 XP
        5: 1500  # 5-star = 1500 XP
    }
    return xp_rewards[stars]


@app.route('/api/profile/stats', methods=['GET'])
@require_auth
def get_profile_stats():
    """Get user's level and experience"""
    user_id = request.user['user_id']
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if user:
        # Initialize level and experience if they don't exist (for existing users)
        if 'level' not in user:
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'level': 1, 'experience': 0}}
            )
            user['level'] = 1
            user['experience'] = 0

        level = user.get('level', 1)
        experience = user.get('experience', 0)

        # Calculate progress to next level
        current_level_xp = (level - 1) * 100
        xp_in_current_level = experience - current_level_xp
        xp_needed_for_next = 100

        return jsonify({
            'level': level,
            'experience': experience,
            'xp_in_current_level': xp_in_current_level,
            'xp_needed_for_next': xp_needed_for_next
        })

    return jsonify({'error': 'User not found'}), 404


@app.route('/api/collection/release', methods=['OPTIONS'])
def handle_release_options():
    """Handle OPTIONS preflight for release endpoint"""
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response, 200


@app.route('/api/collection/release', methods=['POST'])
@require_auth
def release_character():
    """Release a character for XP"""
    user_id = request.user['user_id']
    data = request.get_json()

    char_name = data.get('character')
    release_count = data.get('count', 1)  # Allow releasing multiple

    if not char_name:
        return jsonify({'error': 'Character name required'}), 400

    if release_count < 1:
        return jsonify({'error': 'Invalid count'}), 400

    # Get character rarity
    char_rarity = None
    all_chars = (
            [(name, 5) for name in FIVE_STAR_POOL] +
            [(name, 4) for name in FOUR_STAR_POOL] +
            [(name, 3) for name in THREE_STAR_POOL]
    )

    for name, stars in all_chars:
        if name == char_name:
            char_rarity = stars
            break

    if not char_rarity:
        return jsonify({'error': 'Invalid character'}), 400

    # Check if user owns this character
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    collection = user.get('collection', {})

    current_count = collection.get(char_name, 0)
    if current_count < release_count:
        return jsonify({'error': f'Only own {current_count}, cannot release {release_count}'}), 400

    # Calculate XP reward
    xp_per_char = get_xp_for_rarity(char_rarity)
    total_xp_gained = xp_per_char * release_count

    # Remove copies of the character
    new_count = current_count - release_count

    # Initialize level/xp if not exists
    if 'level' not in user:
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'level': 1, 'experience': 0}}
        )
        user['level'] = 1
        user['experience'] = 0

    # Update user's collection and experience
    if new_count == 0:
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$unset': {f'collection.{char_name}': ''},
                '$inc': {'experience': total_xp_gained}
            }
        )
    else:
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {f'collection.{char_name}': new_count},
                '$inc': {'experience': total_xp_gained}
            }
        )

    # Get updated user data
    updated_user = users_collection.find_one({'_id': ObjectId(user_id)})
    new_experience = updated_user.get('experience', 0)
    old_level = updated_user.get('level', 1)
    new_level = calculate_level_from_xp(new_experience)

    leveled_up = new_level > old_level

    # Update level if leveled up
    if leveled_up:
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'level': new_level}}
        )

    # Calculate progress
    current_level_xp = (new_level - 1) * 100
    xp_in_current_level = new_experience - current_level_xp

    return jsonify({
        'success': True,
        'xp_gained': total_xp_gained,
        'total_xp': new_experience,
        'level': new_level,
        'leveled_up': leveled_up,
        'xp_in_current_level': xp_in_current_level,
        'xp_needed_for_next': 100,
        'collection': updated_user.get('collection', {})
    })


# ==================== SETTINGS ROUTES ====================

@app.route('/api/settings', methods=['GET'])
@require_auth
def get_settings():
    """Get user's settings"""
    user_id = request.user['user_id']
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if user:
        default_settings = {
            'background_type': 'gradient',
            'background_value': 'gradient-1',
            'dark_mode': False
        }
        return jsonify({'settings': user.get('settings', default_settings)})

    return jsonify({'error': 'User not found'}), 404


@app.route('/api/settings', methods=['PUT'])
@require_auth
def update_settings():
    """Update user's settings"""
    user_id = request.user['user_id']
    data = request.get_json()

    settings = data.get('settings', {})

    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {'settings': settings}}
    )

    return jsonify({'success': True, 'settings': settings})


@app.route('/api/settings/background-image', methods=['POST'])
@require_auth
def upload_background_image():
    """Upload a custom background image"""
    user_id = request.user['user_id']

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400

    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''

    if file_ext not in allowed_extensions:
        return jsonify({'error': 'Invalid file type. Use PNG, JPG, JPEG, GIF, or WEBP'}), 400

    # Read file as base64
    import base64
    file_data = file.read()
    base64_image = base64.b64encode(file_data).decode('utf-8')
    data_uri = f"data:image/{file_ext};base64,{base64_image}"

    # Update user's settings with the image
    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {
            'settings.background_type': 'image',
            'settings.background_value': data_uri
        }}
    )

    return jsonify({
        'success': True,
        'image_url': data_uri
    })


# =================== PROFILE SETTINGS ====================
@app.route('/api/user/displayed-characters', methods=['GET'])
@require_auth
def get_displayed_characters():
    """Get user's displayed characters"""
    user_id = request.user['user_id']

    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({'error': 'User not found'}), 404

        displayed_characters = user.get('displayed_characters', [])

        return jsonify({
            'displayed_characters': displayed_characters
        }), 200

    except Exception as e:
        print(f"Error fetching displayed characters: {e}")
        return jsonify({'error': 'Failed to fetch displayed characters'}), 500


@app.route('/api/user/displayed-characters', methods=['PUT'])
@require_auth
def update_displayed_characters():
    """Update user's displayed characters"""
    user_id = request.user['user_id']
    data = request.get_json()

    displayed_characters = data.get('displayed_characters', [])

    # Validate max limit (6)
    MAX_DISPLAY_LIMIT = 6
    if len(displayed_characters) > MAX_DISPLAY_LIMIT:
        return jsonify({
            'error': f'Cannot display more than {MAX_DISPLAY_LIMIT} characters'
        }), 400

    try:
        # Verify all characters are in user's collection
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        collection = user.get('collection', {})

        for character_name in displayed_characters:
            if character_name not in collection:
                return jsonify({
                    'error': f'{character_name} is not in your collection'
                }), 400

        # Update displayed characters
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'displayed_characters': displayed_characters}}
        )

        return jsonify({
            'success': True,
            'displayed_characters': displayed_characters
        }), 200

    except Exception as e:
        print(f"Error updating displayed characters: {e}")
        return jsonify({'error': 'Failed to update displayed characters'}), 500


# ==================== LEADERBOARD & PUBLIC PROFILE ROUTES ====================

@app.route('/api/leaderboard', methods=['GET'])
@require_auth
def get_leaderboard():
    """Get top users by level/experience (public data only)"""
    # Get top 100 users by level, then by experience
    top_users = list(users_collection.find(
        {},
        {
            'name': 1,
            'picture': 1,
            'level': 1,
            'experience': 1,
            'email': 1,
            '_id': 0
        }
    ).sort([('level', -1), ('experience', -1)]).limit(100))

    # Sanitize data - only show email domain, not full email
    for user in top_users:
        if 'email' in user:
            email_parts = user['email'].split('@')
            if len(email_parts) == 2:
                # Show first letter + *** @ domain
                user['email_display'] = f"{email_parts[0][0]}***@{email_parts[1]}"
            else:
                user['email_display'] = "***"
            del user['email']  # Remove full email

        # Ensure level/xp exist
        user['level'] = user.get('level', 1)
        user['experience'] = user.get('experience', 0)

    return jsonify({'leaderboard': top_users})


@app.route('/api/user/public-profile', methods=['POST'])
@require_auth
def get_public_profile():
    """Get another user's public profile by email"""
    data = request.get_json()
    search_email = data.get('email', '').strip().lower()

    if not search_email:
        return jsonify({'error': 'Email required'}), 400

    # Find user by email
    user = users_collection.find_one(
        {'email': search_email},
        {
            'name': 1,
            'picture': 1,
            'level': 1,
            'experience': 1,
            'collection': 1,
            'displayed_characters': 1,
            'pomodoro_sessions': 1,
            '_id': 0
        }
    )

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Get displayed characters for this user
    displayed_chars = user.get('displayed_characters', [])

    # Calculate stats
    collection = user.get('collection', {})
    total_poms = sum(collection.values())
    unique_poms = len(collection)

    # Sanitize email - only show domain
    email_parts = search_email.split('@')
    email_display = f"{email_parts[0][0]}***@{email_parts[1]}" if len(email_parts) == 2 else "***"

    return jsonify({
        'profile': {
            'name': user.get('name', 'User'),
            'picture': user.get('picture'),
            'email_display': email_display,
            'level': user.get('level', 1),
            'experience': user.get('experience', 0),
            'displayed_characters': displayed_chars,
            'stats': {
                'total_pomeranians': total_poms,
                'unique_pomeranians': unique_poms,
                'total_sessions': user.get('pomodoro_sessions', 0)
            }
        }
    })


# ==================== FRIENDS/LEADERBOARD ROUTES ====================

@app.route('/api/friends', methods=['GET'])
@require_auth
def get_friends():
    """Get user's friends list"""
    user_id = request.user['user_id']
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if not user:
        return jsonify({'error': 'User not found'}), 404

    friends = user.get('friends', [])
    return jsonify({'friends': friends})


@app.route('/api/friends', methods=['POST'])
@require_auth
def add_friend():
    """Add a friend to user's friends list"""
    user_id = request.user['user_id']
    data = request.get_json()

    friend_email = data.get('email', '').strip().lower()

    if not friend_email:
        return jsonify({'error': 'Email required'}), 400

    # Get current user
    current_user = users_collection.find_one({'_id': ObjectId(user_id)})

    # Prevent adding yourself
    if current_user.get('email', '').lower() == friend_email:
        return jsonify({'error': 'Cannot add yourself as a friend'}), 400

    # Check if friend exists
    friend = users_collection.find_one({'email': friend_email})
    if not friend:
        return jsonify({'error': 'User not found'}), 404

    # Get current friends list
    friends = current_user.get('friends', [])

    # Check if already friends
    if friend_email in friends:
        return jsonify({'error': 'Already in your friends list'}), 400

    # Add friend to list
    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$push': {'friends': friend_email}}
    )

    return jsonify({
        'success': True,
        'message': f'{friend.get("name")} added to friends'
    }), 201


@app.route('/api/friends/<email>', methods=['DELETE'])
@require_auth
def remove_friend(email):
    """Remove a friend from user's friends list"""
    user_id = request.user['user_id']
    friend_email = email.strip().lower()

    # Remove friend from list
    result = users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$pull': {'friends': friend_email}}
    )

    if result.modified_count == 0:
        return jsonify({'error': 'Friend not found in list'}), 404

    return jsonify({
        'success': True,
        'message': 'Friend removed'
    })


@app.route('/api/friends/leaderboard', methods=['GET'])
@require_auth
def get_friends_leaderboard():
    """Get leaderboard of user's friends + current user"""
    user_id = request.user['user_id']
    user = users_collection.find_one({'_id': ObjectId(user_id)})

    if not user:
        return jsonify({'error': 'User not found'}), 404

    friends = user.get('friends', [])

    if not friends:
        return jsonify({'leaderboard': []})

    # Get all friends' profiles + current user
    # Create a list that includes both friends and current user's email
    emails_to_fetch = friends + [user.get('email')]

    friends_data = list(users_collection.find(
        {'email': {'$in': emails_to_fetch}},
        {
            'name': 1,
            'picture': 1,
            'level': 1,
            'experience': 1,
            'email': 1,
            '_id': 0
        }
    ).sort([('level', -1), ('experience', -1)]))

    # Format the data - keep full email for frontend to use
    for friend in friends_data:
        friend['level'] = friend.get('level', 1)
        friend['experience'] = friend.get('experience', 0)
        # Store full email as email_display for consistency with frontend
        friend['email_display'] = friend['email']

    return jsonify({'leaderboard': friends_data})

# ==================== HEALTH CHECK AND ERROR HANDLING ====================

@app.errorhandler(Exception)
def handle_exception(e):
    """Catch-all error handler"""
    # Log the full error server-side
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

    # Return sanitized error to client
    if IS_PRODUCTION:
        return jsonify({
            'error': 'An error occurred',
            'message': 'Please try again or contact support if the problem persists'
        }), 500
    else:
        return jsonify({
            'error': str(e),
            'details': traceback.format_exc()
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'database': 'connected'})

if __name__ == '__main__':
    # Create indexes for better query performance
    users_collection.create_index('google_id', unique=True)
    users_collection.create_index('email')
    tasks_collection.create_index([('user_id', 1), ('start', 1)])

    app.run(debug=DEBUG_MODE, host='0.0.0.0', port=5000)