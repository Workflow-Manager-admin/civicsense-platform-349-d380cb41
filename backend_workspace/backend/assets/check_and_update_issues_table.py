import os
import psycopg2

SUPABASE_DB_URL = os.environ.get("SUPABASE_DB_URL")
SQL_ADD_COLUMN = 'ALTER TABLE issues ADD COLUMN "deletedBy" text;'
SQL_CHECK_COLUMN = """
SELECT column_name FROM information_schema.columns
WHERE table_name = 'issues' AND column_name = 'deletedBy';
"""


def ensure_deletedBy_column():
    if not SUPABASE_DB_URL:
        print("ERROR: SUPABASE_DB_URL not set in environment!")
        exit(1)
    # Connect to Postgres (Supabase)
    conn = psycopg2.connect(SUPABASE_DB_URL)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute(SQL_CHECK_COLUMN)
            result = cur.fetchone()
            if result:
                print("'deletedBy' column already exists in 'issues' table.")
            else:
                print("Adding 'deletedBy' column to 'issues' table...")
                cur.execute(SQL_ADD_COLUMN)
                print("Column added successfully.")
    finally:
        conn.close()


if __name__ == "__main__":
    ensure_deletedBy_column()
