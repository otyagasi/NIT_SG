# デプロイメント引き継ぎドキュメント

## 📋 このドキュメントについて

このドキュメントは、AI搭載リアルタイム議事録作成アプリケーションを**新しいリポジトリ**で運用する際の、GitHub Actionsとさくらサーバーへのデプロイ設定の完全な引き継ぎ手順です。

---

## 🎯 デプロイメントの全体像

### デプロイフロー

```
開発者のPC
    ↓ git commit & push
GitHub リポジトリ（新規）
    ↓ GitHub Actions（自動実行）
さくらサーバー（自動デプロイ）
    ↓
ブラウザからアクセス（HTTPS）
```

### 重要な原則

- ✅ **正**: Git → GitHub Actions → さくらサーバー（自動デプロイ）
- ❌ **禁**: WinSCPやFTPでさくらサーバーへ直接アップロード
- ❌ **禁**: さくらサーバー上で直接ファイル編集

**理由**: 手動アップロードは、次回のGitHub Actionsデプロイ時に上書きされます。必ずGit経由で管理してください。

---

## 📦 ステップ1: 新しいリポジトリの作成

### 1-1. GitHubで新規リポジトリを作成

1. GitHubにログイン
2. 右上の「+」→「New repository」をクリック
3. 以下の設定を入力：
   - **Repository name**: 例）`minutes-app-new`（任意の名前）
   - **Description**: 「AI搭載リアルタイム議事録作成アプリケーション」
   - **Public/Private**: Privateを推奨（学校のプロジェクトのため）
   - **Initialize this repository with**: 何もチェックしない（既存コードを移行するため）
4. 「Create repository」をクリック

### 1-2. 既存コードを新しいリポジトリにプッシュ

```bash
# 現在のディレクトリで実行（既存プロジェクトのルート）
cd /path/to/NIT_SG

# 既存のリモートリポジトリを確認
git remote -v

# 既存のリモートを削除（または名前を変更）
git remote remove origin

# 新しいリポジトリをリモートとして追加（URLは新規リポジトリのURLに置き換え）
git remote add origin https://github.com/YOUR_USERNAME/minutes-app-new.git

# mainブランチにプッシュ
git push -u origin main
```

> **注意**: `YOUR_USERNAME`と`minutes-app-new`は実際のGitHubユーザー名とリポジトリ名に置き換えてください。

---

## 🔧 ステップ2: さくらサーバーの設定

### 2-1. さくらサーバーにSSH接続

さくらサーバーにSSHでアクセスできることを確認してください。

```bash
ssh ユーザー名@サーバーホスト名
```

例:
```bash
ssh myuser@myserver.sakura.ne.jp
```

- **ユーザー名**: さくらサーバーのFTPアカウント名
- **サーバーホスト名**: さくらサーバーのホスト名（例：`myserver.sakura.ne.jp`）

### 2-2. さくらサーバーにGitをインストール（必要に応じて）

```bash
# Gitがインストールされているか確認
git --version

# インストールされていない場合、さくらサーバーのコンパネから「Git」を有効化
# または、サポートに問い合わせてください
```

### 2-3. さくらサーバーに公開ディレクトリを用意

```bash
# SSH接続後、公開ディレクトリに移動
cd ~/www

# または、別のディレクトリを使う場合
mkdir -p ~/www/minutes
cd ~/www/minutes
```

> **重要**: このディレクトリパスを覚えておいてください（後でGitHub Secretsに設定します）

### 2-4. さくらサーバーでGitリポジトリをクローン

```bash
# 新しいリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/minutes-app-new.git .

# または、ディレクトリ名を指定してクローン
git clone https://github.com/YOUR_USERNAME/minutes-app-new.git ~/www/minutes

# mainブランチをチェックアウト
git checkout main
```

> **注意**: URLは新しいリポジトリのURLに置き換えてください。

### 2-5. さくらサーバーでの権限設定

```bash
# ファイルの権限を確認
ls -la

# 必要に応じて、Webサーバーが読み取れるよう権限を調整
chmod -R 755 ~/www/minutes
```

---

## 🔐 ステップ3: GitHub Secretsの設定

GitHub Actionsがさくらサーバーにアクセスするために、以下の機密情報をGitHub Secretsに登録します。

### 3-1. GitHub Secretsにアクセス

1. GitHubの新しいリポジトリページに移動
2. 「Settings」タブをクリック
3. 左サイドバーの「Secrets and variables」→「Actions」をクリック
4. 「New repository secret」をクリック

### 3-2. 必要なSecretsを登録

以下の4つのSecretを登録してください：

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `SERVER_HOST` | さくらサーバーのホスト名 | `myserver.sakura.ne.jp` |
| `SERVER_USERNAME` | SSHユーザー名（FTPアカウント名） | `myuser` |
| `SERVER_PASS` | SSHパスワード | `your_password` |
| `SERVER_DEPLOY_DIR` | デプロイ先ディレクトリの絶対パス | `/home/myuser/www/minutes` |

#### 登録手順（各Secretごとに繰り返し）

1. 「New repository secret」をクリック
2. **Name**: Secret名を入力（例：`SERVER_HOST`）
3. **Secret**: 対応する値を入力（例：`myserver.sakura.ne.jp`）
4. 「Add secret」をクリック

> **重要**:
> - パスワードは絶対に誰にも見せないでください
> - Secretsは登録後、値を確認できません（更新は可能）
> - `SERVER_DEPLOY_DIR`は**絶対パス**で指定してください（例：`/home/myuser/www/minutes`）

### 3-3. Secretsの確認

全て登録すると、以下のように4つのSecretが表示されます：

```
SERVER_HOST          Updated X minutes ago
SERVER_USERNAME      Updated X minutes ago
SERVER_PASS          Updated X minutes ago
SERVER_DEPLOY_DIR    Updated X minutes ago
```

---

## ⚙️ ステップ4: GitHub Actionsワークフローファイルの配置

### 4-1. ワークフローファイルの確認

既存のプロジェクトには、既に以下のファイルがあります：

```
.github/
└── workflows/
    └── main.yml
```

このファイルの内容を確認してください：

```yaml
name: sakura

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
     - name: Checkout Repository
       uses: actions/checkout@v3
     - name: Deploy
       uses: appleboy/ssh-action@master
       with:
         host: ${{ secrets.SERVER_HOST }}
         username: ${{ secrets.SERVER_USERNAME }}
         password: ${{ secrets.SERVER_PASS }}
         script: |
           cd ${{ secrets.SERVER_DEPLOY_DIR }}
           git pull origin main
```

### 4-2. ワークフローファイルの説明

| セクション | 説明 |
|-----------|------|
| `name: sakura` | ワークフローの名前（表示用） |
| `on: push: branches: ["main"]` | mainブランチへのpushでトリガー |
| `on: pull_request: branches: ["main"]` | mainブランチへのPRでトリガー |
| `uses: actions/checkout@v3` | GitHubリポジトリをチェックアウト |
| `uses: appleboy/ssh-action@master` | SSH経由でさくらサーバーに接続 |
| `host/username/password` | GitHub Secretsから接続情報を取得 |
| `script: cd ... && git pull ...` | さくらサーバーで実行するコマンド |

### 4-3. カスタマイズが必要な場合

デフォルトのままで問題ありませんが、以下のようなカスタマイズが可能です：

#### ブランチ名を変更したい場合

```yaml
on:
  push:
    branches: [ "production" ]  # mainではなくproductionブランチでトリガー
```

#### デプロイ後にビルドコマンドを実行したい場合

```yaml
script: |
  cd ${{ secrets.SERVER_DEPLOY_DIR }}
  git pull origin main
  npm install
  npm run build
```

#### プルしたブランチを変更したい場合

```yaml
script: |
  cd ${{ secrets.SERVER_DEPLOY_DIR }}
  git pull origin production  # mainではなくproductionブランチをプル
```

---

## ✅ ステップ5: デプロイのテスト

### 5-1. 初回デプロイのテスト

1. **ローカルで小さな変更を加える**

   例：`README.md`にテスト用のコメントを追加

   ```bash
   echo "# テスト用コミット" >> README.md
   git add README.md
   git commit -m "test: デプロイテスト"
   git push origin main
   ```

2. **GitHub Actionsの実行を確認**

   - GitHubリポジトリページの「Actions」タブをクリック
   - 「sakura」ワークフローが実行中になっていることを確認
   - クリックして詳細ログを確認

3. **成功の確認**

   ✅ 成功した場合：緑色のチェックマークが表示される

   ❌ 失敗した場合：赤いXマークが表示される → ログを確認してエラーを特定

### 5-2. さくらサーバーでの確認

```bash
# SSH接続
ssh ユーザー名@サーバーホスト名

# デプロイディレクトリに移動
cd ~/www/minutes

# 最新のコミットが反映されているか確認
git log -1

# ファイルの内容を確認
cat README.md
```

### 5-3. ブラウザでの動作確認

ブラウザで以下のURLにアクセス：

```
https://your-domain.com/minutes/
```

> **注意**: `your-domain.com`は実際のさくらサーバーのドメインに置き換えてください。

---

## 🐛 トラブルシューティング

### エラー1: SSH接続失敗

**エラーメッセージ例:**
```
Error: Failed to connect to the remote server
```

**原因と解決策:**

1. **Secretsの値が間違っている**
   - GitHub Secretsで`SERVER_HOST`、`SERVER_USERNAME`、`SERVER_PASS`を再確認
   - さくらサーバーのコントロールパネルでSSHが有効になっているか確認

2. **さくらサーバーでSSHが有効になっていない**
   - さくらサーバーのコントロールパネル → 「SSH設定」→「SSHを有効にする」

3. **ファイアウォールでブロックされている**
   - さくらサーバーのコントロールパネルでファイアウォール設定を確認

### エラー2: git pullが失敗

**エラーメッセージ例:**
```
fatal: could not read Username for 'https://github.com': No such device or address
```

**原因と解決策:**

1. **さくらサーバーでGit認証が設定されていない**

   パブリックリポジトリの場合は問題ないはずですが、プライベートリポジトリの場合は以下の設定が必要です：

   ```bash
   # SSH接続後、さくらサーバーで実行
   cd ~/www/minutes

   # HTTPS URLからSSH URLに変更
   git remote set-url origin git@github.com:YOUR_USERNAME/minutes-app-new.git
   ```

   または、Personal Access Token（PAT）を使用：

   ```bash
   # GitHubでPATを生成（Settings → Developer settings → Personal access tokens）
   # repo権限を付与

   # さくらサーバーで実行
   git remote set-url origin https://YOUR_PAT@github.com/YOUR_USERNAME/minutes-app-new.git
   ```

2. **プライベートリポジトリの場合の推奨設定**

   GitHub ActionsでSSHキーを使う方法（より安全）：

   ```bash
   # ローカルPCで実行
   ssh-keygen -t ed25519 -C "github-actions"
   # パスフレーズは空にする

   # 公開鍵をさくらサーバーの~/.ssh/authorized_keysに追加
   # 秘密鍵をGitHub Secretsに登録（名前：SERVER_SSH_KEY）
   ```

   `.github/workflows/main.yml`を以下に変更：

   ```yaml
   - name: Deploy
     uses: appleboy/ssh-action@master
     with:
       host: ${{ secrets.SERVER_HOST }}
       username: ${{ secrets.SERVER_USERNAME }}
       key: ${{ secrets.SERVER_SSH_KEY }}  # passwordの代わりにkeyを使用
       script: |
         cd ${{ secrets.SERVER_DEPLOY_DIR }}
         git pull origin main
   ```

### エラー3: ディレクトリが見つからない

**エラーメッセージ例:**
```
cd: /home/myuser/www/minutes: No such file or directory
```

**原因と解決策:**

1. **SERVER_DEPLOY_DIRのパスが間違っている**
   - さくらサーバーにSSH接続して、正しいパスを確認：

   ```bash
   pwd  # 現在のディレクトリを表示
   ```

   - GitHub Secretsの`SERVER_DEPLOY_DIR`を正しいパスに更新

2. **さくらサーバーでGitクローンしていない**
   - ステップ2-4を実行してクローンしてください

### エラー4: 権限エラー

**エラーメッセージ例:**
```
Permission denied
```

**原因と解決策:**

```bash
# さくらサーバーにSSH接続
ssh ユーザー名@サーバーホスト名

# デプロイディレクトリの権限を確認
ls -la ~/www/minutes

# 権限を修正
chmod -R 755 ~/www/minutes

# .gitディレクトリの所有者を確認
ls -la ~/www/minutes/.git

# 必要に応じて所有者を変更
# （通常は不要、さくらサーバーの管理者に相談）
```

---

## 🔄 日常の開発フロー

### 通常の開発手順

```bash
# 1. ローカルで開発
npm run serve
# → http://localhost:8000/minutes/ で動作確認

# 2. 変更をコミット
git add .
git commit -m "機能: 〇〇を追加"

# 3. mainブランチにプッシュ
git push origin main

# 4. GitHub Actionsが自動実行される
# → GitHubの「Actions」タブで確認

# 5. さくらサーバーに自動デプロイされる
# → ブラウザで動作確認
```

### ブランチ戦略（推奨）

本番環境を壊さないように、以下のブランチ戦略を推奨します：

```bash
# 開発用ブランチを作成
git checkout -b develop

# 機能開発
git checkout -b feature/new-feature

# 開発完了後、developにマージ
git checkout develop
git merge feature/new-feature

# 動作確認後、mainにマージ（本番デプロイ）
git checkout main
git merge develop
git push origin main
```

### GitHub Actionsでのデプロイをdevelopブランチでもテストしたい場合

`.github/workflows/main.yml`を以下のように変更：

```yaml
on:
  push:
    branches: [ "main", "develop" ]  # developも追加
```

ただし、さくらサーバーでのスクリプトも変更が必要：

```yaml
script: |
  cd ${{ secrets.SERVER_DEPLOY_DIR }}

  # 現在のブランチを取得
  BRANCH=${{ github.ref_name }}

  # ブランチをチェックアウト
  git fetch origin
  git checkout $BRANCH
  git pull origin $BRANCH
```

---

## 📊 GitHub Actionsのログの見方

### ログの確認手順

1. GitHubリポジトリページの「Actions」タブをクリック
2. 最新のワークフロー実行をクリック
3. 「build」ジョブをクリック
4. 各ステップを展開してログを確認

### ログの見方

```
✅ Set up job                  # ジョブの準備
✅ Checkout Repository         # リポジトリのチェックアウト
✅ Deploy                      # さくらサーバーへのデプロイ
  ├─ SSH接続
  ├─ cd /home/myuser/www/minutes
  ├─ git pull origin main
  │  └─ Updating 1234567..abcdefg
  │      Fast-forward
  │      README.md | 1 +
  │      1 file changed, 1 insertion(+)
  └─ 完了
✅ Post Checkout Repository
✅ Complete job
```

### エラー時のログ

```
❌ Deploy
  ├─ SSH接続
  └─ Error: Failed to connect to the remote server
      Host: myserver.sakura.ne.jp
      User: myuser
```

この場合、SSH接続に失敗しているため、GitHub Secretsの`SERVER_HOST`、`SERVER_USERNAME`、`SERVER_PASS`を確認してください。

---

## 🔐 セキュリティのベストプラクティス

### 1. パスワード認証よりSSHキー認証を推奨

現在はパスワード認証ですが、より安全なSSHキー認証への移行を推奨します。

**理由:**
- パスワードは漏洩リスクがある
- SSHキーは暗号化されており、より安全
- パスワードローテーション不要

**移行手順:**
- トラブルシューティングのエラー2を参照

### 2. GitHub Secretsの定期的な更新

- さくらサーバーのパスワードを定期的に変更
- 変更後、必ずGitHub Secretsの`SERVER_PASS`を更新

### 3. プライベートリポジトリの使用

- 学校のプロジェクトなので、必ずPrivateリポジトリにしてください
- 公開リポジトリにするとコードが誰でも見えてしまいます

### 4. Secretsを絶対にコミットしない

- `.env`ファイルにSecretsを書かない
- コード内にパスワードをハードコードしない
- `.gitignore`に`.env`を追加

---

## 📚 さくらサーバー固有の注意事項

### さくらレンタルサーバーの制限

1. **SSHポート**: 標準ポート22（変更不可）
2. **Git**: インストール済み（バージョンが古い場合あり）
3. **シェル**: bash（一部コマンドが制限されている場合あり）
4. **ディスク容量**: プランに応じて制限あり

### さくらサーバーでのGit設定

初回クローン時に以下を設定することを推奨：

```bash
# さくらサーバーにSSH接続後
cd ~/www/minutes

# Git設定
git config user.name "Your Name"
git config user.email "your.email@example.com"

# pullの戦略を設定（コンフリクト回避）
git config pull.rebase false
```

### 公開ディレクトリの設定

さくらサーバーでは、通常以下のディレクトリが公開ディレクトリです：

- `~/www/` - 公開ディレクトリのルート
- `~/www/minutes/` - アプリケーションのディレクトリ

アクセスURL: `https://your-domain.com/minutes/`

---

## 🆘 緊急時の対応

### デプロイが失敗して本番が止まった場合

1. **前のバージョンに戻す（ロールバック）**

   ```bash
   # さくらサーバーにSSH接続
   ssh ユーザー名@サーバーホスト名

   # デプロイディレクトリに移動
   cd ~/www/minutes

   # 前のコミットに戻す
   git log  # コミット履歴を確認
   git reset --hard <前のコミットID>
   ```

2. **GitHubで該当コミットをrevertする**

   ```bash
   # ローカルで実行
   git revert <問題のあるコミットID>
   git push origin main
   # → GitHub Actionsが自動実行され、さくらサーバーに反映される
   ```

### さくらサーバーへの手動デプロイ（最終手段）

**通常は推奨しませんが**、緊急時のみ手動デプロイも可能です：

```bash
# さくらサーバーにSSH接続
ssh ユーザー名@サーバーホスト名

# デプロイディレクトリに移動
cd ~/www/minutes

# 手動でpull
git pull origin main
```

> **警告**: 手動デプロイ後、次回のGitHub Actionsデプロイ時にコンフリクトが発生する可能性があります。緊急時のみ使用してください。

---

## ✅ 引き継ぎチェックリスト

引き継ぎ時に以下の項目を確認してください：

### 新リポジトリの準備
- [ ] GitHubで新しいリポジトリを作成した
- [ ] 既存コードを新しいリポジトリにプッシュした
- [ ] リポジトリがPrivateになっている

### さくらサーバーの準備
- [ ] さくらサーバーにSSH接続できる
- [ ] デプロイディレクトリにGitリポジトリをクローンした
- [ ] ファイルの権限が正しく設定されている（755）

### GitHub Secretsの設定
- [ ] `SERVER_HOST`を登録した
- [ ] `SERVER_USERNAME`を登録した
- [ ] `SERVER_PASS`を登録した
- [ ] `SERVER_DEPLOY_DIR`を登録した（絶対パス）

### GitHub Actionsの設定
- [ ] `.github/workflows/main.yml`が存在する
- [ ] トリガーブランチが正しい（main）
- [ ] デプロイスクリプトが正しい

### デプロイのテスト
- [ ] テスト用のコミットをpushした
- [ ] GitHub Actionsが正常に実行された（緑のチェックマーク）
- [ ] さくらサーバーに変更が反映された
- [ ] ブラウザで動作確認した

### ドキュメントの引き継ぎ
- [ ] このドキュメント（DEPLOYMENT_HANDOVER.md）を後任者に共有した
- [ ] さくらサーバーのログイン情報を安全に引き継いだ
- [ ] GitHub Secretsの値を安全に引き継いだ（必要に応じて）

---

## 📞 サポート情報

### さくらインターネット サポート

- **コントロールパネル**: https://secure.sakura.ad.jp/
- **サポートサイト**: https://help.sakura.ad.jp/
- **電話サポート**: 契約プランに応じて異なる

### GitHub サポート

- **GitHub Docs**: https://docs.github.com/
- **GitHub Actions Docs**: https://docs.github.com/actions

### よくある質問

**Q: デプロイにどのくらい時間がかかりますか？**
A: 通常1〜2分程度です。GitHub Actionsのログで進捗を確認できます。

**Q: 複数人で開発する場合の注意点は？**
A: 必ずブランチを分けて開発してください。mainブランチへのマージ時にコンフリクトしないよう、定期的にpullしてください。

**Q: さくらサーバーのディスク容量が足りなくなったら？**
A: 不要なファイルを削除するか、プランのアップグレードを検討してください。

**Q: HTTPS化は必要ですか？**
A: はい、Web Speech API（マイクアクセス）を使うため、本番環境では必須です。さくらサーバーの無料SSL証明書（Let's Encrypt）を有効化してください。

---

## 📝 最後に

このドキュメントに不明点がある場合は、前任者に連絡してください。また、実際にデプロイを試しながら、このドキュメントを更新していってください。

**前任者の連絡先:**
- 氏名: _______________
- メールアドレス: _______________
- 電話番号: _______________

**引き継ぎ日:** _______________

**後任者の氏名:** _______________

---

**改版履歴:**
- 2025-XX-XX: 初版作成
