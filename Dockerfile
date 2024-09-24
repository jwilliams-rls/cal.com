# Use Node.js 18.x as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock to the container
COPY package.json yarn.lock ./

# Install dependencies with the correct Yarn version
RUN corepack enable && corepack prepare yarn@3.4.1 --activate
RUN yarn install --immutable

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]
