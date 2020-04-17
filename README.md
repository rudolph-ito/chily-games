Overview
========

A web application that allows people to create and play their own variants of Cyvasse, a board game introduced by George RR Martin in his series of "Song of Fire and Ice".

# Development

## One time setup

* Run `yarn install` at the root level and in `api` and `frontend` folders
* Run `make setup`
* Run `make create-databases`
  * This needs to rerun anytime after pruning docker volumes
* Run `sequelize db:migrate` from the `api` folder

## Debugging

* Connect to the database with `docker-compose run database psql -h database -p 5432 -U cyvasse-user` and enter password `test`