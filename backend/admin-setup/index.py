"""
Создание первого администратора кафе Coffee.
POST / — создать admin (только если ещё нет ни одного).
"""
import json
import os
import hashlib
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    username = body.get('username', '').strip()
    password = body.get('password', '')

    if not username or not password:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите логин и пароль'})}

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM admins")
    count = cur.fetchone()[0]

    if count > 0:
        conn.close()
        return {'statusCode': 403, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Администратор уже существует'})}

    cur.execute("INSERT INTO admins (username, password_hash) VALUES (%s, %s)", (username, hash_password(password)))
    conn.commit()
    conn.close()
    return {'statusCode': 201, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True, 'username': username})}
