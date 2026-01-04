FROM node:20-alpine

WORKDIR /app

COPY services/success-emoji/package*.json ./
RUN npm install

COPY services/success-emoji/ ./

EXPOSE 3002

CMD ["npm", "start"]
