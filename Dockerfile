FROM node:16-alpine

ENV PORT=8080

# Set working directory
WORKDIR /home/govsearch

COPY package*.json ./
COPY dist ./dist

RUN npm ci --omit=dev

CMD ["npm", "start"]
