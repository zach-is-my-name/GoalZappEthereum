# GoalZapp/ : run truffle test
FROM node:15-alpine 
COPY ./truffle-config.js ./utils ./package.json ./package-lock.json ./GoalZapp/
COPY ./contracts ./GoalZapp/contracts/
COPY ./migrations ./GoalZapp/migrations/
COPY ./test ./GoalZapp/test/
RUN apk add --no-cache bash git \ 
&& cd GoalZapp \
&& echo "npm install in progress... could be long depending on machine" \
&& echo "once test suite begins, be advised some tests require **30 second** intervals.why? because GoalZapp runs an external tx scheduling service.  the delay is to accomodate registering a scheduled call on a backend. time traveling ganache forward to scheduled tx time, picking up the blocktime on the back end, finally calling the smart contract function from the backend and testing the result. You can run these services/tests yourself by cloning from the localAionTestVersion branch" \
&& /bin/bash -c "npm install --silent" \ 
&& /bin/bash -c "npm install --silent" \ 
&& /bin/bash -c "npm install --silent fs-extra -g" \ 
&& /bin/bash -c "npm install -g --unsafe-perm --silent truffle" 
WORKDIR ./GoalZapp
SHELL ["/bin/bash", "-c"]
CMD truffle migrate && truffle test ./test/BondingCurve.test.js && truffle test ./test/ERC20Restricted.test.js && truffle test ./test/ERC20Protection.test.js && truffle test ./test/ERC20.test.js && truffle test ./test/GoalEscrow.test.js && echo "Looks like all 157 tests are passing"
#CMD truffle migrate && truffle test ./test/ERC20Restricted.test.js --bail
#CMD truffle migrate && truffle test ./test/ERC20Protection.test.js --bail
#ENTRYPOINT ["/bin/bash"]
#&& truffle test ./test/ERC20Protection.test.js && truffle test ./test/ERC20.test.js && truffle test ./test/GoalEscrow.test.js]

#ENTRYPOINT ["/bin/bash","-c", "truffle", "test", "BondingCurve.test.js", "&&", "truffle", "test", "ERC20Restricted.test.js", "&&", "truffle", "test", "ERC20Protection.test.js", "&&" "truffle", "test", "ERC20.test.js", "&&", "truffle", "test", "GoalEscrow.test.js"]
#ENTRYPOINT ["truffle", "test", "BondingCurve.test.js", "&&", "truffle", "test", "ERC20Restricted.test.js", "&&", "truffle", "test", "ERC20Protection.test.js", "&&" "truffle", "test", "ERC20.test.js", "&&", "truffle", "test", "GoalEscrow.test.js"]

