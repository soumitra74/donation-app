"""
Debug configuration for Flask application
"""
import logging
import sys
from logging.handlers import RotatingFileHandler
import os

def setup_debug_logging(app):
    """Setup comprehensive debug logging for Flask app"""
    
    # Set Flask to debug mode
    app.debug = True
    
    # Configure logging
    if not app.debug and not app.testing:
        # File handler for production-like logging
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/donation_app.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
    
    # Console handler for immediate debug output
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    app.logger.addHandler(console_handler)
    
    # Set app logger level
    app.logger.setLevel(logging.DEBUG)
    
    # Log startup information
    app.logger.info('Donation App startup in DEBUG mode')
    app.logger.info(f'Database URI: {app.config.get("SQLALCHEMY_DATABASE_URI", "Not set")}')
    app.logger.info(f'Secret Key configured: {"Yes" if app.config.get("SECRET_KEY") else "No"}')
    app.logger.info(f'JWT Secret configured: {"Yes" if app.config.get("JWT_SECRET_KEY") else "No"}')
    
    # Enable SQLAlchemy query logging
    logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
    
    return app

def enable_sql_debugging(app):
    """Enable SQL query debugging"""
    app.config['SQLALCHEMY_ECHO'] = True
    app.logger.info('SQL query debugging enabled')

def enable_request_logging(app):
    """Enable request/response logging"""
    from flask import request
    
    @app.before_request
    def log_request_info():
        app.logger.debug(f'Request: {request.method} {request.url}')
        app.logger.debug(f'Headers: {dict(request.headers)}')
        if request.data:
            app.logger.debug(f'Body: {request.get_data()}')

    @app.after_request
    def log_response_info(response):
        app.logger.debug(f'Response: {response.status} {response.status_code}')
        return response
