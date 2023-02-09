FROM node:16

ENV PORT=8080

COPY . .

ENV NODE_ENV=production # don't install dev packages

RUN npm ci # install from package-lock.json

CMD npm start
