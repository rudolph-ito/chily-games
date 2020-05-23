.PHONY: install
setup: # Install dependencies
	yarn install
	cd api && yarn install
	cd frontend && yarn install

.PHONY: generate-local-api-certificate
generate-local-api-certificate: # Generates certificate for api to be able to serve HTTPS locally
	mkdir -p api/certs && cd api/certs && openssl req -nodes -new -x509 -keyout server.key -out server.cert -subj "/C=US/ST=California/L=Los Angeles/O=Test/CN=localhost"

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
	docker-compose up -d database
	sleep 2
	cd api && yarn create-databases && yarn sequelize db:migrate

.PHONY: test-api
test-api: # Run api tests
	docker-compose up -d database
	cd api && yarn build
	cd api && yarn test --reporter spec

.PHONY: test-frontend
test-frontend: # Run frontend tests
	cd frontend && yarn test