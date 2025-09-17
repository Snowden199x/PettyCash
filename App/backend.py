from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello, Python Backend is running!"

@app.route("/api/data")
def data():
    return {"message": "This is sample JSON data"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
