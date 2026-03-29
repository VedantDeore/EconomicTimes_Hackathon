from flask import Flask
from flask_cors import CORS
from asgiref.wsgi import WsgiToAsgi
from app.config import get_settings
from app.routes import bp

settings = get_settings()

flask_app = Flask(__name__)
CORS(flask_app, origins=settings.CORS_ORIGINS)

flask_app.register_blueprint(bp)


@flask_app.route("/health")
def health():
    return {"status": "healthy", "service": "ai"}


app = WsgiToAsgi(flask_app)

if __name__ == "__main__":
    flask_app.run(host="127.0.0.1", port=8000, debug=True)
