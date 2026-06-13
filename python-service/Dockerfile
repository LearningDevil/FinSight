# Use the official Python 3.11 slim image
# "slim" is a smaller Debian-based image with fewer preinstalled packages,
# which keeps the container lightweight while still functional
FROM python:3.11-slim

# Set the working directory inside the container to /app
WORKDIR /app

# Copy only requirements.txt first
# This allows Docker to cache the pip install layer if dependencies don’t change
COPY requirements.txt .

# Install Python dependencies listed in requirements.txt
# --no-cache-dir prevents pip from caching packages, reducing image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source code into the container
COPY . .

# Expose port 5000 so the container can serve traffic on this port
EXPOSE 5000

# Define the default command to run the application
# This starts your Python app by running app.py
CMD ["python", "app.py"]
