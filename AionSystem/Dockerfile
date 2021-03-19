#executer: node run index.js
FROM node:15-alpine 
RUN apk add --no-cache bash make python g++ 
COPY . .
WORKDIR .
SHELL ["/bin/bash", "-c"]
RUN /bin/bash -c "npm install --unsafe-perm" 
ENTRYPOINT ["node", "index.js"] 
