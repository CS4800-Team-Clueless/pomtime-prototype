import os
from flask import Flask
from dotenv import load_dotenv
from flask_cors import CORS

# Load variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
