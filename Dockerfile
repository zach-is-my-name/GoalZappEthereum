# GoalZapp/ : run truffle test
FROM node:12-alpine 
COPY ./truffle-config.js ./utils ./package.json ./package-lock.json ./GoalZapp/
#COPY  ./GoalZapp/
COPY ./contracts ./GoalZapp/contracts/
COPY ./migrations ./GoalZapp/migrations/
COPY ./test ./GoalZapp/test/
RUN apk add --no-cache bash git \ 
&& cd GoalZapp \
&& /bin/bash -c "npm install --silent" \  
&& /bin/bash -c "npm install -g --unsafe-perm truffle --silent" 
WORKDIR ./GoalZapp
SHELL ["/bin/bash", "-c"]
CMD truffle test ./test/BondingCurve.test.js && truffle test ./test/ERC20Restricted.test.js && truffle test ./test/ERC20Protection.test.js && truffle test ./test/ERC20.test.js && truffle test ./test/GoalEscrow.test.js]

#ENTRYPOINT ["/bin/bash","-c", "truffle", "test", "BondingCurve.test.js", "&&", "truffle", "test", "ERC20Restricted.test.js", "&&", "truffle", "test", "ERC20Protection.test.js", "&&" "truffle", "test", "ERC20.test.js", "&&", "truffle", "test", "GoalEscrow.test.js"]
#ENTRYPOINT ["truffle", "test", "BondingCurve.test.js", "&&", "truffle", "test", "ERC20Restricted.test.js", "&&", "truffle", "test", "ERC20Protection.test.js", "&&" "truffle", "test", "ERC20.test.js", "&&", "truffle", "test", "GoalEscrow.test.js"]

