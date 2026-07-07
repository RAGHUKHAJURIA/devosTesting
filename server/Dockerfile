FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=5000
ENV IN_DOCKER=true

EXPOSE 5000

CMD ["npm", "start"]
