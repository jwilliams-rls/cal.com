# Use the official Node.js image.
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and lock files for Yarn
COPY package.json yarn.lock ./

# Set the correct version of Yarn to 3.4.1 (as per your configuration)
RUN yarn set version 3.4.1

# Install the project dependencies
RUN yarn install

# Copy the remaining application files into the working directory
COPY . .

# Expose the ports for the frontend (3000) and backend API (4000)
EXPOSE 3000
EXPOSE 4000

# Command to run the app in production mode. 
# Change this to ["yarn", "dev"] if running in a development environment.
CMD ["yarn", "start"]

