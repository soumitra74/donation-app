#!/usr/bin/env python3
"""
Debug run script for the donation app backend
"""

import os
import sys
from app import app
from debug_config import setup_debug_logging, enable_sql_debugging, enable_request_logging

if __name__ == "__main__":
    print("=" * 60)
    print("Starting Donation App Backend in DEBUG MODE...")
    print("=" * 60)
    
    # Setup debug logging
    app = setup_debug_logging(app)
    
    # Enable SQL debugging (uncomment if you want to see SQL queries)
    # enable_sql_debugging(app)
    
    # Enable request/response logging
    enable_request_logging(app)
    
    print("\nAPI will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    print("API docs: http://localhost:5000/api/v1/")
    print("\nDebug features enabled:")
    print("- Detailed request/response logging")
    print("- SQL query logging (if enabled)")
    print("- Comprehensive error tracking")
    print("- Auto-reload on code changes")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        app.run(
            host='0.0.0.0',  # Allow external connections
            port=5000,
            debug=True,
            use_reloader=True,  # Auto-reload on file changes
            threaded=True       # Handle multiple requests
        )
    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("Server stopped by user")
        print("=" * 60)
        sys.exit(0)
    except Exception as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)
