#executer: node run index.js
FROM node:alpine 
COPY . . 
#CMD pwd && ls -a
RUN apk add --no-cache bash #python3 gcc make g++ zlib-dev
RUN /bin/bash -c "npm install --silent" 
ENTRYPOINT ["node", "--no-warnings", "index.js"] 
