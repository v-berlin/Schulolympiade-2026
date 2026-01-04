FROM node:20-alpine

WORKDIR /app

COPY services/shared /app/shared
RUN cd /app/shared && npm install

COPY services/edit-emoji/package*.json ./
RUN npm install

COPY services/edit-emoji/ ./

EXPOSE 3004

CMD ["npm", "start"]
