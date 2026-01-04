FROM node:20-alpine

WORKDIR /app

COPY services/success-event/package*.json ./
RUN npm install

COPY services/success-event/ ./

EXPOSE 3001

CMD ["npm", "start"]
