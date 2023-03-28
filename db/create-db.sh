#!/bin/bash

read -p 'This script will create a new database and delete any existing data. Are you sure you want to continue? (y/n) ' confirm

if [ "$confirm" == "y" ]; then
  # drop and create production database
  psql -c "DROP DATABASE IF EXISTS soundtrack;" \
  && psql -c "CREATE DATABASE soundtrack;"

  # drop and create test database
  psql -c "DROP DATABASE IF EXISTS soundtrack_test;" \
  && psql -c "CREATE DATABASE soundtrack_test;"

  # run migrations and seed data on production database
  npx knex migrate:latest && node db/seed.js

  # run migrations on test database
  NODE_ENV=test npx knex migrate:latest
else
  echo "Aborted."
fi
