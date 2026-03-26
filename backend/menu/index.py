"""
CRUD для позиций меню кафе Coffee.
GET / — список всех активных позиций (публичный).
GET /all — все позиции для админки.
POST / — создать позицию (требует X-Session-Id).
PUT /{id} — обновить позицию (требует X-Session-Id).
DELETE /{id} — удалить позицию (требует X-Session-Id).
"""
import json
import os
import psycopg2
import psycopg2.extras

AUTH_URL = None
SESSIONS = {}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def is_admin(headers: dict) -> bool:
    from backend_shared import SESSIONS as S
    return False

def check_session(headers: dict) -> bool:
    import urllib.request
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')
    if not session_id:
        return False
    func2url = os.environ.get('AUTH_URL', '')
    if not func2url:
        return True
    try:
        req = urllib.request.Request(func2url, headers={'X-Session-Id': session_id})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return data.get('ok', False)
    except Exception:
        return False

def row_to_dict(row, cur) -> dict:
    cols = [d[0] for d in cur.description]
    return dict(zip(cols, row))

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers', {})

    conn = get_db()
    cur = conn.cursor()

    path_parts = path.rstrip('/').split('/')
    item_id = path_parts[-1] if path_parts[-1].isdigit() else None

    if method == 'GET':
        is_all = path.endswith('/all')
        if is_all:
            cur.execute("SELECT * FROM menu_items ORDER BY sort_order, id")
        else:
            cur.execute("SELECT * FROM menu_items WHERE is_active = TRUE ORDER BY sort_order, id")
        rows = cur.fetchall()
        items = [row_to_dict(r, cur) for r in rows]
        conn.close()
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(items, default=str)}

    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')
    if not session_id:
        conn.close()
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'})}

    body = json.loads(event.get('body') or '{}')

    if method == 'POST':
        cur.execute(
            "INSERT INTO menu_items (name, description, price, tag, tag_color, image_url, is_active, sort_order) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
            (body.get('name'), body.get('description'), body.get('price', 0), body.get('tag'), body.get('tag_color', 'default'), body.get('image_url'), body.get('is_active', True), body.get('sort_order', 0))
        )
        row = cur.fetchone()
        conn.commit()
        item = row_to_dict(row, cur)
        conn.close()
        return {'statusCode': 201, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(item, default=str)}

    if method == 'PUT' and item_id:
        cur.execute(
            "UPDATE menu_items SET name=%s, description=%s, price=%s, tag=%s, tag_color=%s, image_url=%s, is_active=%s, sort_order=%s, updated_at=NOW() WHERE id=%s RETURNING *",
            (body.get('name'), body.get('description'), body.get('price', 0), body.get('tag'), body.get('tag_color', 'default'), body.get('image_url'), body.get('is_active', True), body.get('sort_order', 0), item_id)
        )
        row = cur.fetchone()
        conn.commit()
        item = row_to_dict(row, cur)
        conn.close()
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(item, default=str)}

    if method == 'DELETE' and item_id:
        cur.execute("DELETE FROM menu_items WHERE id=%s", (item_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'})}
