"""
CRUD для добавок (extras) кафе Coffee.
GET / — список активных добавок (публичный).
GET /all — все добавки для админки.
POST / — создать (требует X-Session-Id).
PUT /{id} — обновить (требует X-Session-Id).
DELETE /{id} — удалить (требует X-Session-Id).
"""
import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def row_to_dict(row, cur) -> dict:
    return dict(zip([d[0] for d in cur.description], row))

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers', {})
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')

    path_parts = [p for p in path.split('/') if p]
    item_id = path_parts[-1] if path_parts and path_parts[-1].isdigit() else None

    conn = get_db()
    cur = conn.cursor()

    if method == 'GET':
        is_all = 'all' in path_parts
        if is_all:
            cur.execute("SELECT * FROM extras ORDER BY sort_order, id")
        else:
            cur.execute("SELECT * FROM extras WHERE is_active = TRUE ORDER BY sort_order, id")
        rows = [row_to_dict(r, cur) for r in cur.fetchall()]
        conn.close()
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(rows, default=str)}

    if not session_id:
        conn.close()
        return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'})}

    body = json.loads(event.get('body') or '{}')

    if method == 'POST':
        cur.execute(
            "INSERT INTO extras (name, price, is_active, sort_order) VALUES (%s, %s, %s, %s) RETURNING *",
            (body.get('name', ''), int(body.get('price', 0)), body.get('is_active', True), int(body.get('sort_order', 0)))
        )
        row = row_to_dict(cur.fetchone(), cur)
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(row, default=str)}

    if method == 'PUT' and item_id:
        cur.execute(
            "UPDATE extras SET name=%s, price=%s, is_active=%s, sort_order=%s WHERE id=%s RETURNING *",
            (body.get('name', ''), int(body.get('price', 0)), body.get('is_active', True), int(body.get('sort_order', 0)), item_id)
        )
        row = row_to_dict(cur.fetchone(), cur)
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(row, default=str)}

    if method == 'DELETE' and item_id:
        cur.execute("DELETE FROM extras WHERE id=%s", (item_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'})}
