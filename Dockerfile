FROM node:16

ENV PORT=8080

ENV NEO4J_URL=http://10.0.0.1:7474/db/neo4j/tx
ENV NEO4J_USERNAME=default_username
ENV NEO4J_PASSWORD=default_password

COPY . .

RUN npm i

CMD npm start
