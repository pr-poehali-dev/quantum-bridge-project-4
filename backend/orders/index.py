"""
Управление заказами кафе Coffee.
POST / — создать заказ (публичный).
GET /?order_number=XXX — статус заказа по номеру (публичный).
GET /all — все заказы (кассир/админ).
PUT /{id}/status — обновить статус (кассир/админ).
"""
import json
import os
import random
import string
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def gen_order_number() -> str:
    return ''.join(random.choices(string.digits, k=6))

def row_to_dict(row, cur) -> dict:
    cols = [d[0] for d in cur.description]
    d = dict(zip(cols, row))
    for k, v in d.items():
        if hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
    return d

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers', {})
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')
    qs = event.get('queryStringParameters') or {}

    conn = get_db()
    cur = conn.cursor()

    path_parts = [p for p in path.split('/') if p]

    # GET /all — все заказы для персонала
    if method == 'GET' and 'all' in path_parts:
        if not session_id:
            conn.close()
            return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'})}
        cur.execute("SELECT * FROM orders ORDER BY created_at DESC")
        rows = cur.fetchall()
        items = [row_to_dict(r, cur) for r in rows]
        conn.close()
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(items)}

    # GET /?order_number=XXX — статус заказа
    if method == 'GET':
        order_number = qs.get('order_number', '')
        if not order_number:
            conn.close()
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите номер заказа'})}
        cur.execute("SELECT * FROM orders WHERE order_number = %s", (order_number,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Заказ не найден'})}
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(row_to_dict(row, cur))}

    # PUT /{id}/status — обновить статус
    if method == 'PUT' and 'status' in path_parts:
        if not session_id:
            conn.close()
            return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'})}
        order_id = None
        for i, p in enumerate(path_parts):
            if p == 'status' and i > 0 and path_parts[i-1].isdigit():
                order_id = path_parts[i-1]
        if not order_id:
            conn.close()
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Не указан ID заказа'})}
        body = json.loads(event.get('body') or '{}')
        new_status = body.get('status', '')
        valid = ['new', 'confirmed', 'preparing', 'ready', 'done', 'cancelled']
        if new_status not in valid:
            conn.close()
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неверный статус'})}
        cur.execute("UPDATE orders SET status=%s, updated_at=NOW() WHERE id=%s RETURNING *", (new_status, order_id))
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(row_to_dict(row, cur))}

    # POST / — создать заказ
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        customer_name = (body.get('customer_name') or '').strip()
        customer_phone = (body.get('customer_phone') or '').strip()
        items = body.get('items', [])
        total = body.get('total', 0)
        comment = body.get('comment', '')

        if not customer_name or not items:
            conn.close()
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите имя и добавьте товары'})}

        for _ in range(10):
            number = gen_order_number()
            cur.execute("SELECT id FROM orders WHERE order_number = %s", (number,))
            if not cur.fetchone():
                break

        cur.execute(
            "INSERT INTO orders (order_number, customer_name, customer_phone, items, total, comment, status) VALUES (%s, %s, %s, %s, %s, %s, 'new') RETURNING *",
            (number, customer_name, customer_phone, json.dumps(items, ensure_ascii=False), total, comment)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(row_to_dict(row, cur))}

    conn.close()
    return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'})}
