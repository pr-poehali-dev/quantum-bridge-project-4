"""
Авторизация администратора кафе Coffee.
POST /login — вход по логину и паролю, возвращает session token.
POST /logout — выход.
GET / — проверка сессии.
"""
import json
import os
import hashlib
import secrets
import psycopg2

SESSIONS = {}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers', {})
    session_id = headers.get('X-Session-Id', '')

    if method == 'GET':
        if session_id in SESSIONS:
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True, 'username': SESSIONS[session_id]})}
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': False})}

    body = json.loads(event.get('body') or '{}')

    if path.endswith('/logout'):
        SESSIONS.pop(session_id, None)
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True})}

    username = body.get('username', '').strip()
    password = body.get('password', '')

    if not username or not password:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': False, 'error': 'Введите логин и пароль'})}

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id, username FROM admins WHERE username = %s AND password_hash = %s", (username, hash_password(password)))
    admin = cur.fetchone()
    conn.close()

    if not admin:
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': False, 'error': 'Неверный логин или пароль'})}

    token = secrets.token_hex(32)
    SESSIONS[token] = username
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True, 'token': token, 'username': username})}
