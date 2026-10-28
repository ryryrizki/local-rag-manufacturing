import sqlite3
from contextlib import contextmanager
from config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  revision TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'active',
  effective_date TEXT,
  sha256 TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id);
"""

def connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection

def init_db():
    with connect() as connection:
        connection.executescript(SCHEMA)

@contextmanager
def transaction():
    connection = connect()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

