# GoalZapp/ : run truffle test
FROM node:12-alpine 
COPY ./package.json ./package-lock.json ./
COPY ./truffle-config.js ./utils ./GoalZapp/
COPY ./contracts ./GoalZapp/contracts/
COPY ./migrations ./GoalZapp/migrations/
COPY ./test ./GoalZapp/test/
RUN apk add --no-cache bash git \ 
&& /bin/bash -c "npm install --silent" \  
&& /bin/bash -c "npm install -g truffle --silent" 
WORKDIR ./GoalZapp
ENTRYPOINT ["/bin/bash"]
#CMD ["truffle", "test"]

