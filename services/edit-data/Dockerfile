FROM node:20-alpine

WORKDIR /app

COPY services/shared /app/shared
RUN cd /app/shared && npm install

COPY services/edit-data/package*.json ./
RUN npm install

COPY services/edit-data/ ./

EXPOSE 3003

CMD ["npm", "start"]
