import os
import sys

# app.pyのパスを通す
sys.path.insert(0, os.path.dirname(__file__))

# app.pyからFlaskインスタンスを 'application' という名前でインポート
from app import app as application