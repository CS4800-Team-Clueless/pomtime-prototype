from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello world!"

@app.route("/cay")
def cays_api():
    return "cay's endpoint contribution!"

if __name__ == "__main__":
    app.run(debug=True)