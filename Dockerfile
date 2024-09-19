# Use the official Node.js image.
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the package files
COPY package.json yarn.lock ./

# Set the correct version of Yarn to 3.4.1
RUN yarn set version 3.4.1

# Install the dependencies
RUN yarn install

# Copy the remaining app files
COPY . .

# Expose the ports for frontend and backend
EXPOSE 3000
EXPOSE 4000

# Default command to run your app (change depending on the project setup)
CMD ["yarn", "dev"]
