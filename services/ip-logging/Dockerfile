FROM node:20-alpine

WORKDIR /app

COPY services/ip-logging/package*.json ./

COPY services/ip-logging/ ./

RUN mkdir -p /app/logs

EXPOSE 3005

CMD ["npm", "start"]
