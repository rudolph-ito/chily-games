FROM node:12.16.1-alpine AS dev
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY angular.json ./
COPY karma.conf.js ./
COPY proxy.conf.json ./
COPY src ./src
COPY tsconfig.* ./ 

CMD yarn start --host 0.0.0.0 --proxy-config proxy.conf.json