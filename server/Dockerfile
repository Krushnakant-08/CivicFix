# syntax=docker/dockerfile:1.6

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV JWT_SECRET=${JWT_SECRET}
ENV MONGO_URI=${MONGO_URI}
ENV CLIENT_URL=${CLIENT_URL}

EXPOSE 5000

CMD ["node", "index.js"]
