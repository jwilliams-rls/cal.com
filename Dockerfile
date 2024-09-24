# Use the official Node.js image from Docker Hub
FROM node:18-alpine

# Enable Corepack, which helps manage Yarn versions
RUN corepack enable && corepack prepare yarn@3.4.1 --activate

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and yarn.lock files to the working directory
COPY package.json yarn.lock ./

# Install dependencies using Yarn 3.4.1
RUN yarn install

# Copy the rest of the application files to the container
COPY . .

# Expose the necessary ports for frontend (3000) and backend API (4000)
EXPOSE 3000
EXPOSE 4000

# Default command to run the application in development mode
CMD ["yarn", "dev"]


