FROM node:20-alpine

WORKDIR /app

# Copy shared module
COPY services/shared /app/shared
RUN cd /app/shared && npm install

# Copy service files
COPY services/dashboard/package*.json ./
RUN npm install

COPY services/dashboard/ ./

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3000

CMD ["npm", "start"]
