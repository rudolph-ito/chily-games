.PHONY: setup
setup: # Copy shared files to api / frontend directories
	cp tsconfig.json api/tsconfig.shared.json
	cp -r shared api/src
	cp tsconfig.json frontend/tsconfig.shared.json
	cp -r shared frontend/src/app
	mkdir -p api/certs && cd api/certs && openssl req -nodes -new -x509 -keyout server.key -out server.cert -subj "/C=US/ST=California/L=Los Angeles/O=Test/CN=localhost"

.PHONY: create-databases
create-databases:
	docker-compose up -d database
	sleep 2
	cd api && yarn create-databases

.PHONY: start
start:
	docker-compose up --build -d

.PHONY: stop
stop:
	docker-compose down
