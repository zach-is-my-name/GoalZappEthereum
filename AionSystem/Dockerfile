#executer: node run index.js
FROM node:alpine 
RUN apk add --no-cache bash
WORKDIR ./executor
RUN /bin/bash -c "pwd"
COPY ./package.json .
RUN /bin/bash -c "npm install " #silent 
ENTRYPOINT ["node", "index.js"] 
