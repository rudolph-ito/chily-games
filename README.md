Overview
========

# Development

## One time setup

* Run `make install` to install dependencies
* Run `make copy-shared` to copy shared code to `api` / `frontend`
  * Rerun after any changes to shared code
* Run `make create-databases` to create development and test databases and migrate the development database
  * Rerun after pruning docker volumes

## Run app locally

* Run `nf start`

## Lint / Test

* Run `yarn lint --fix`
* Run `yarn prettier --write`
* Run `make test-api`
* Run `make test-frontend`

## Debugging

* Connect to the database with `docker-compose run --rm postgres psql -h postgres -p 5432 -U chily-user` and enter password `test`