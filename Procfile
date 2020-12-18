api: cd api && CORS_ORIGINS=http://localhost:4200 PORT=5000 SESSION_SECRET=test yarn start-dev:watch
database: docker-compose up postgres redis
frontend: cd frontend && yarn start --proxy-config proxy.conf.json
