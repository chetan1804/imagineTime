Step 1: install postgress

install:
``brew install postgresql
run/exit/show
```brew services start/stop/list postgresql

some basic commands:
connect to default database/open prompt
```psql $name -U $username
```psql postgres // default
prompt commands
connection info
```\conninfo
exit
```\q
list databases
```\list
connect new db
```\c $name
list tables in database
```\dt
list roles
```\du

create user object to use
```psql postgres
create new role, CHANGE FOR ACTUAL PROJECTS
```CREATE ROLE me WITH LOGIN PASSWORD 'password';
```ALTER ROLE me CREATEDB;
```\q
log in with that user
```psql postgres -U me
create new database
```CREATE DATABASE $name

I CAN HELP INIT THIS AND SET THIS UP ON EVERYONES COMPUTER.




links
setup and simple example commands
https://blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8
knex
create new migration
```knex migrate:make create_things
migrate to latest
```knex migrate:latest
create database seed for things
```knex seed:make things
create seeds
```knex seed:run

BUILDING SCHEMAS
https://knexjs.org/#Schema-boolean

BUILDING QUERIES
https://devhints.io/knex



REMOTE STAGING DATABASE
for dev, we try all use a shared dev database to make things like setup and managing it a lot easier.
this is set up on gcloud. to connect to the database (assuming you are on a mac), you can simply run
```npm run dev-db``` in a terminal window. you might need to run ```chmod +x cloud_sql_proxy``` from the servr directory if github doesn't track those the first time you run it. 
NOTES: https://cloud.google.com/sql/docs/mysql/quickstart-proxy-test

STAGING AND PROD
tbd



NOTES ON IMPLEMENTING TEXT SEARCH ON A RESOURCE.
This is taken from a test migration I made for tags, but should be generalized and probably put into the initial "create" migrations.
https://github.com/Vincit/objection.js/issues/485 // can't do natively in knex or objection
https://hevodata.com/blog/postgresql-full-text-search-setup/ // how to set up and query (has errors)
https://www.postgresql.org/docs/10/functions-textsearch.html // other types of query operators
https://gist.github.com/cameronblandford/808ca0f66acffb8b50b4e3704d6063a1 // saving vector automatically





Migrations Documentation


- Create a new migration resource. General - replace "thing" with your resource
1.
```knex migrate:make create_thing```
2. copy-paste the /migrationTemplates/create_thing.js file contents into the next migration is created since it's a lot cleaner synax


- Add fields to an existing resource. General - replace "thing" with your resource
1.
```knex migrate:make thing_add_fields```
2. copy-paste the /migrationTemplates/thing_add_fields.js file contents into the next migration is created since it's a lot cleaner synax


- Run the latest migrations on the dev server
1. be connected to the dev server
```npm run dev-db```
2. make sure you have knex installed
3. from the server directory, run
```knex migrate:latest```


- Run the latest migrations on the demo server
1. be conneted to the staging/demo server
```npm run staging-db
2. temporarily uncomment some lines in the server/config.js. this is how knex determines how to hit the database. in order to hit the staging one from your local computer, you need to change these lines, config:91-93:
      ```, host: '10.62.64.3' // to run knex locally against these db's: run 'staging-db' and uncomment below two lines```
      ```// , host: 'localhost'```
      ```// , port: 3306```
for demo, or the same for lines 66-68 for staging
3. set the environment variable to the correct thing and run the migrate command
```NODE_ENV=demo knex migrate:latest```
4. change the config file back


- Run the seed util against the demo database. note this assumes its empty, which would happen if you drop it from the glcoud ui
1. do steps 1,2 above to connect to the staging/demo database 
2. run the seed database util with the correct environment variable
``` NODE_ENV=demo node util/seedDb/runSeedDb.js```

