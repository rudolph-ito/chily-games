Overview
========

A web application that allows people to create and play their own variants of Cyvasse, a board game introduced by George RR Martin in his series of "Song of Fire and Ice".

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
* Run `make test-api`
* Run `make test-frontend`

## Debugging

* Connect to the database with `docker-compose run --rm postgres psql -h postgres -p 5432 -U chily-user` and enter password `test`