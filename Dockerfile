# Multi-stage Dockerfile for Donation App (Backend + Frontend)
FROM node:20-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ .

# Create .env file with the correct API URL and set environment variable
ARG VITE_API_URL=http://localhost/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env

# Build the frontend application
RUN npm run build

# Replace any remaining localhost:5000 references with localhost
RUN find /app/frontend/dist -name "*.js" -type f -exec sed -i 's|localhost:5000|localhost|g' {} \;
RUN find /app/frontend/dist -name "*.html" -type f -exec sed -i 's|localhost:5000|localhost|g' {} \;

# Backend stage
FROM python:3.12-slim AS backend-builder

# Set working directory for backend
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Make scripts executable
RUN chmod +x wait_for_db.py

# Final stage
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for runtime
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    python3-dev \
    nginx \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from backend stage
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend application
COPY --from=backend-builder /app/backend ./backend

# Copy frontend build from frontend stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create nginx configuration
RUN mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Create nginx configuration for serving frontend and proxying API
RUN echo 'server {' > /etc/nginx/sites-available/donation-app && \
    echo '    listen 80;' >> /etc/nginx/sites-available/donation-app && \
    echo '    server_name localhost;' >> /etc/nginx/sites-available/donation-app && \
    echo '' >> /etc/nginx/sites-available/donation-app && \
    echo '    # Serve frontend static files' >> /etc/nginx/sites-available/donation-app && \
    echo '    location / {' >> /etc/nginx/sites-available/donation-app && \
    echo '        root /app/frontend/dist;' >> /etc/nginx/sites-available/donation-app && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/sites-available/donation-app && \
    echo '        add_header Cache-Control "no-cache, no-store, must-revalidate";' >> /etc/nginx/sites-available/donation-app && \
    echo '    }' >> /etc/nginx/sites-available/donation-app && \
    echo '' >> /etc/nginx/sites-available/donation-app && \
    echo '    # Proxy API requests to backend' >> /etc/nginx/sites-available/donation-app && \
    echo '    location /api/ {' >> /etc/nginx/sites-available/donation-app && \
    echo '        proxy_pass http://localhost:5000;' >> /etc/nginx/sites-available/donation-app && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/sites-available/donation-app && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/sites-available/donation-app && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/sites-available/donation-app && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/sites-available/donation-app && \
    echo '    }' >> /etc/nginx/sites-available/donation-app && \
    echo '' >> /etc/nginx/sites-available/donation-app && \
    echo '    # Health check endpoint' >> /etc/nginx/sites-available/donation-app && \
    echo '    location /health {' >> /etc/nginx/sites-available/donation-app && \
    echo '        proxy_pass http://localhost:5000/health;' >> /etc/nginx/sites-available/donation-app && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/sites-available/donation-app && \
    echo '    }' >> /etc/nginx/sites-available/donation-app && \
    echo '}' >> /etc/nginx/sites-available/donation-app

# Enable the site
RUN ln -s /etc/nginx/sites-available/donation-app /etc/nginx/sites-enabled/

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Create startup script
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Starting Donation App..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Create nginx pid directory' >> /app/start.sh && \
    echo 'mkdir -p /run/nginx' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start nginx in background' >> /app/start.sh && \
    echo 'echo "Starting nginx..."' >> /app/start.sh && \
    echo 'nginx' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait a moment for nginx to start' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start backend as app user' >> /app/start.sh && \
    echo 'echo "Starting backend..."' >> /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'su app -c "python run.py"' >> /app/start.sh

# Make startup script executable
RUN chmod +x /app/start.sh

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app

# Expose port
EXPOSE 80

# Default command
CMD ["/app/start.sh"]
