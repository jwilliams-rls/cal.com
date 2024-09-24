# Use the official Node.js image from Docker Hub (Alpine is lightweight and includes Yarn)
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and yarn.lock files to the working directory
COPY package.json yarn.lock ./

# Install Yarn dependencies
RUN yarn install

# Copy the rest of the application files to the container
COPY . .

# Expose the necessary ports for frontend (3000) and backend API (4000)
EXPOSE 3000
EXPOSE 4000

# Default command to run the application in development mode
CMD ["yarn", "dev"]


