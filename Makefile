.PHONY: install
install: # Install dependencies
	yarn install
	cd api && yarn install
	cd frontend && yarn install

.PHONY: copy-shared
copy-shared: # Copy shared files to api / frontend directories
	cp tsconfig.json api/tsconfig.shared.json
	rm -rf api/src/shared
	cp -r shared api/src
	cp tsconfig.json frontend/tsconfig.shared.json
	rm -rf frontend/src/app/shared
	cp -r shared frontend/src/app

.PHONY: create-databases
create-databases: # Create development / test databases and migrate the development database
	docker-compose up -d postgres
	sleep 2
	cd api && yarn create-databases && yarn sequelize db:migrate
	cd api && NODE_ENV=test yarn create-databases

.PHONY: reset-database
reset-database:
	docker-compose down
	docker volume prune -f

.PHONY: build-api
build-api: # Build api
	cd api && yarn build

.PHONY: test-api
test-api: # Run api tests
	docker-compose up -d postgres redis
	cd api && NODE_ENV=test yarn test --reporter spec

.PHONY: test-frontend
test-frontend: # Run frontend tests
	cd frontend && yarn test

.PHONY: start-local-production
start-local-production:
	docker-compose -f docker-compose.production.yml up --build
