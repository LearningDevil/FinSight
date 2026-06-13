# Use the official Node.js 20 image built on Alpine Linux
# Alpine is a minimal Linux distribution that keeps the image small and efficient
FROM node:20-alpine

# Set the working directory inside the container to /app
WORKDIR /app

# Copy only package.json first
# This allows Docker to cache the npm install layer if dependencies don’t change
COPY package.json .

# Install project dependencies
RUN npm install

# Copy the rest of the application source code into the container
COPY . .

# Expose port 3000 so the container can serve traffic on this port
EXPOSE 3000

# Define the default command to run the application
# This starts your Node.js app from src/index.js
CMD ["node", "src/index.js"]
