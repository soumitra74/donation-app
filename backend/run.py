#!/usr/bin/env python3
"""
Run script for the donation app backend
"""

from app import app

if __name__ == "__main__":
    print("Starting Donation App Backend...")
    print("API will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    print("API docs: http://localhost:5000/api/v1/")
    print("\nPress Ctrl+C to stop the server")
    
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=5000,
        debug=False
    )
