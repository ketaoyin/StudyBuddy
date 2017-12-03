#!/bin/bash
npm install
mkdir data
mongod --dbpath data/
mongo
fuser -k 8001/tcp
fuser -k 8004/tcp
lsof -n -i4TCP:8001
lsof -n -i4TCP:8004
npm start