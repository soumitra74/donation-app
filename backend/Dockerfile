FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Add PostgreSQL support
RUN pip install --no-cache-dir psycopg2-binary

# Copy application code
COPY . .

# Create wait_for_db.py script
RUN echo '#!/usr/bin/env python3\n\
import time\n\
import psycopg2\n\
import os\n\
\n\
def wait_for_db():\n\
    """Wait for database to be ready"""\n\
    db_url = os.getenv("DATABASE_URL")\n\
    if not db_url:\n\
        print("DATABASE_URL not set, skipping database wait")\n\
        return\n\
    \n\
    print("Waiting for database to be ready...")\n\
    while True:\n\
        try:\n\
            conn = psycopg2.connect(db_url)\n\
            conn.close()\n\
            print("Database is ready!")\n\
            break\n\
        except psycopg2.OperationalError:\n\
            print("Database not ready, waiting...")\n\
            time.sleep(2)\n\
\n\
if __name__ == "__main__":\n\
    wait_for_db()' > wait_for_db.py

# Make scripts executable
RUN chmod +x wait_for_db.py

# Expose port
EXPOSE 5000

# Default command
CMD ["python", "run.py"]
