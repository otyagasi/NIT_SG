from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "<h1>flask server</h1>"

@app.route('/hello')
def hello():
    return "Hello, World!"

if __name__ == '__main__':
    app.run(debug=True)
