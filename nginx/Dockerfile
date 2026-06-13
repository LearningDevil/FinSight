# Use the official lightweight Nginx image
FROM nginx:alpine

# Copy your custom Nginx configuration into the container
# Make sure your local file is named correctly (nginx.conf or default.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 so the container can serve HTTP traffic
EXPOSE 80
