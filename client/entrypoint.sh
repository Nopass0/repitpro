#!/bin/sh

# Check if SSL certificates exist, if not, generate them
if [ ! -f /etc/nginx/ssl/fullchain.pem ] || [ ! -f /etc/nginx/ssl/privkey.pem ]; then
    echo "Generating self-signed SSL certificate..."
    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -subj "/CN=localhost"
fi

# Start nginx
nginx -g "daemon off;"
