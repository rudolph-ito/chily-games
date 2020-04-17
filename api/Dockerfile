FROM node:12.16.1-alpine
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY certs ./certs
COPY src ./src
COPY test ./test
COPY .mocharc.yml ./
COPY nodemon.json ./
COPY .sequelizerc ./
COPY tsconfig.* ./

CMD yarn start-dev:watch