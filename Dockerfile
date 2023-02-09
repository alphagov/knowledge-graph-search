FROM node:16

ENV PORT=8080

RUN npm install -g sass

COPY . .
RUN npm ci # install from package-lock.json

# Compile SCSS to CSS
RUN sass src/scss/main.scss > public/main.css

# Compile TypeScript to JavaScript (browser)
RUN npx webpack

CMD npm start
