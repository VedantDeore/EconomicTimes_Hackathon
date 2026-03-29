from flask import Flask
from flask_cors import CORS
from app.config import get_settings
from app.routes import bp

settings = get_settings()

app = Flask(__name__)
CORS(app, origins=settings.CORS_ORIGINS)

app.register_blueprint(bp)


@app.route("/health")
def health():
    return {"status": "healthy", "service": "ai"}


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
