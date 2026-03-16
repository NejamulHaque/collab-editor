FROM node:20-alpine
RUN apk add --no-cache python3 bash
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 1234
CMD ["node", "server.js"]
