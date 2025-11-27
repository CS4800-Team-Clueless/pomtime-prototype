import os
from flask import Flask
from dotenv import load_dotenv
from flask_cors import CORS
from pymongo import MongoClient

# Load variables from .env file
load_dotenv()

# Initialize MongoDB client
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "PomTimeDB")

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

app = Flask(__name__)
CORS(app)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
