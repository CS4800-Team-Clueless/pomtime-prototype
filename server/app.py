from flask import Flask
from dotenv import load_dotenv
import os

# Load variables from .env file
load_dotenv()

app = Flask(__name__)

@app.route("/")
def home():
    return "Pomtime server"

if __name__ == "__main__":
    # Get PORT from .env, default to 5000 if not set
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
