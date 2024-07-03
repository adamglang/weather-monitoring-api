FROM node:18

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of your source code
COPY . .

# Generate Prisma client
RUN yarn prisma generate

# Your build command
RUN yarn build

# Create a start script
RUN echo '#!/bin/sh\n\
yarn start &\n\
yarn start:processor\n\
wait' > start.sh && chmod +x start.sh

CMD ["./start.sh"]