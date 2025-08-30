#!/usr/bin/env python3
"""
Simple script to view SQLite database tables and their contents
"""

import sqlite3
import os

def view_database():
    """View all tables and their contents in the database"""
    
    db_path = "instance/donation_app.db"
    
    if not os.path.exists(db_path):
        print(f"Database file not found: {db_path}")
        return
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("=" * 60)
        print("DATABASE TABLES")
        print("=" * 60)
        
        for table in tables:
            table_name = table[0]
            print(f"\n📋 TABLE: {table_name}")
            print("-" * 40)
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            print("Columns:")
            for col in columns:
                col_id, col_name, col_type, not_null, default_val, pk = col
                pk_marker = " (PRIMARY KEY)" if pk else ""
                not_null_marker = " NOT NULL" if not_null else ""
                print(f"  - {col_name}: {col_type}{not_null_marker}{pk_marker}")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            print(f"Total rows: {count}")
            
            # Show sample data (first 5 rows)
            if count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 5;")
                rows = cursor.fetchall()
                
                if rows:
                    # Get column names
                    cursor.execute(f"PRAGMA table_info({table_name});")
                    column_info = cursor.fetchall()
                    column_names = [col[1] for col in column_info]
                    
                    print("\nSample data (first 5 rows):")
                    print(" | ".join(column_names))
                    print("-" * (len(" | ".join(column_names))))
                    
                    for row in rows:
                        # Format row data for better display
                        formatted_row = []
                        for i, value in enumerate(row):
                            if value is None:
                                formatted_row.append("NULL")
                            elif isinstance(value, str) and len(value) > 20:
                                formatted_row.append(value[:17] + "...")
                            else:
                                formatted_row.append(str(value))
                        print(" | ".join(formatted_row))
                else:
                    print("No data found")
            else:
                print("Table is empty")
            
            print()
        
        conn.close()
        
    except Exception as e:
        print(f"Error accessing database: {e}")

if __name__ == "__main__":
    view_database()
