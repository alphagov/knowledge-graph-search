FROM node:16

ENV PORT=8080

RUN npm install -g sass

COPY . .
RUN npm ci # install from package-lock.json

# Compile SCSS to CSS
RUN sass src/scss/main.scss > public/main.css

# Compile TypeScript to JavaScript (browser)
RUN npx webpack

#ENV NEO4J_URL=http://10.0.0.1:7474/db/neo4j/tx
ENV NEO4J_URL=https://govgraph.dev:7473/db/neo4j/tx
ENV NEO4J_USERNAME=default_username
ENV NEO4J_PASSWORD=default_password

CMD npm start
