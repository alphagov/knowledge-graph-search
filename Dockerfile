FROM node:16

ENV PORT=8080

COPY . .

ENV NODE_ENV=production # don't install dev packages

RUN npm ci # install from package-lock.json

#ENV NEO4J_URL=http://10.0.0.1:7474/db/neo4j/tx
ENV NEO4J_URL=https://govgraph.dev:7473/db/neo4j/tx

CMD npm start
