FROM node:12 AS build-api

RUN mkdir -p /api
WORKDIR /api
COPY api/package.json .
COPY api/yarn.lock .
RUN yarn install
COPY api/src ./src
COPY api/tsconfig.json .
COPY api/tsconfig.shared.json .
RUN yarn build

FROM node:12 AS build-frontend

RUN mkdir -p /frontend
WORKDIR /frontend
COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN yarn install
COPY frontend/angular.json .
COPY frontend/src ./src
COPY frontend/tsconfig.app.json .
COPY frontend/tsconfig.json .
COPY frontend/tsconfig.shared.json .
RUN yarn run build --prod

