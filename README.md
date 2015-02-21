Installing Eruka
================

Install dependencies using npm

    cd eruka
    npm install

	psql eruka -q < createdb.sql

You're done!

Starting the server
===================

    node eruka-server.js

Also, start the postgresql server

Checking that the server is ok
==============================

    curl -s localhost:8080/game/1 | underscore print

    curl -s -d opp=2 localhost:8080/game | underscore print

