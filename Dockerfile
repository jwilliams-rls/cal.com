# Use the official node image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock for dependency installation
COPY package.json yarn.lock ./

# Install dependencies with Yarn
RUN yarn install --frozen-lockfile

# Copy the application code to the container
COPY . .

# Expose the port
EXPOSE 3000

# Run the application using Yarn
CMD ["yarn", "start"]
