import psycopg2, os
from dotenv import load_dotenv
load_dotenv('backend/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT p.id, p.slug, p.name, p.brand, c.name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id;')
rows = cur.fetchall()
for r in rows:
    print(f'"{r[1]}": ("{r[2]}", "{r[3]}", "{r[4]}"),')
