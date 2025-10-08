from flask import Flask

# Flaskアプリケーションのインスタンスを 'MinutesApp' という名前で作成
MinutesApp = Flask(__name__)

# --- アプリケーションのルートを定義 ---

# トップページ ('/') にアクセスされた場合に 'Welcome to MinutesApp!' と表示
@MinutesApp.route('/')
def home():
    return "Welcome to MinutesApp!"

# 他のページやAPIも同様にMinutesAppを使って定義
@MinutesApp.route('/about')
def about():
    return "This is the about page for MinutesApp."

# 【重要】
# 本番環境なので、以下の app.run() は絶対に記述しないでください
# if __name__ == '__main__':
#     MinutesApp.run()