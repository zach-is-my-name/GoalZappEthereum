#executer: node run index.js
FROM node:15-alpine 
RUN apk add --no-cache bash make python g++ 
#WORKDIR ./executor
RUN /bin/bash -c "pwd"
COPY . .
#CMD sudo chown -R $(whoami) ~/.npm
#RUN npm install --unsafe-perm  #silent 
RUN /bin/bash -c "npm install --unsafe-perm" #silent 
ENTRYPOINT ["node", "index.js"] 
