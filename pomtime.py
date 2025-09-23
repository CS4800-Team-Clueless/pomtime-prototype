from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello world!"

@app.route("/cay")
def cays_api():
    return "cay's endpoint contribution!"

@app.route("/kristie", methods=["GET"])
def kristie_api():
    return "kristie's enpoint!"
    
@app.route("/darlyn")
def darlyn_api():
    return "darlyn's endpoint!"

if __name__ == "__main__":
    app.run(debug=True)
