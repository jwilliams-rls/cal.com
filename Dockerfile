# Use the official node image as a base image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and lock files to the working directory
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies based on the lock file
# This ensures that the build process uses cached layers for node_modules
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else npm ci; fi

# Copy the rest of your application code
COPY . .

# Expose the application port
EXPOSE 3000

# Command to run your application
CMD ["npm", "start"]

