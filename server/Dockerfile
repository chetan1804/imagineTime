FROM --platform=linux/amd64 node:10.24.1-buster
MAINTAINER grant@fugitivelabs.com

ENV NODE_OPTIONS=--max-old-space-size=8192

RUN npm install -g forever

ADD / ./server

RUN cd /server && npm rebuild node-sass node-sass-middleware winston-mongodb 
RUN cd /server && npm install babel-runtime

EXPOSE 80

CMD forever --minUptime 1000 --spinSleepTime 1000 /server/yote.js