FROM node:16

ENV PORT=8080

RUN npm install -g sass

COPY . .
RUN npm ci # install from package-lock.json

# Compile SCSS to CSS
RUN sass ./src/frontend/scss/main.scss > ./src/public/main.css

# Compile frontend code
RUN npm run build-frontend
RUN npm run copy-assets

# Compile backend code
RUN npm run build

CMD ["npm", "start"]
