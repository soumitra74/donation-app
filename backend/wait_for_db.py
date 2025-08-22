#!/usr/bin/env python3
"""
Wait for database to be ready before starting the application
"""

import time
import psycopg2
import os
import sys

def wait_for_db():
    """Wait for database to be ready"""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not set, skipping database wait")
        return
    
    print("Waiting for database to be ready...")
    max_attempts = 30  # 30 attempts * 2 seconds = 60 seconds max wait
    attempt = 0
    
    while attempt < max_attempts:
        try:
            conn = psycopg2.connect(db_url)
            conn.close()
            print("Database is ready!")
            return True
        except psycopg2.OperationalError as e:
            attempt += 1
            print(f"Database not ready (attempt {attempt}/{max_attempts}), waiting... Error: {e}")
            time.sleep(2)
    
    print("Database connection failed after maximum attempts")
    return False

if __name__ == "__main__":
    success = wait_for_db()
    if not success:
        sys.exit(1)
