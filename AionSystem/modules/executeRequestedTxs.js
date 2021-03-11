const {Requests} = require('../models/Requests');


async function executeRequestedTxs(blockNumber, txType, web3, account, aionContract){    
    nonce = await web3.eth.getTransactionCount(account.address,'pending');
    blocknumber = web3.utils.toBN(blockNumber.toString());
    const chainId = await web3.eth.getChainId() 
    const r = await Requests.find({status:"Pending", 
                                   schedType: txType
                                });

    if (r.length > 0) {console.log("Found pending tx's")}

    for(var i = 0; i < r.length; i++){
        console.log(`initiating Pending Transaction # ${i +1} of ${r.length}, scheduledTransactionTime: ${web3.utils.hexToNumber(r[i].blocknumber)}, timeNow: ${ web3.utils.hexToNumber(blocknumber)}`) 

// as soon as a scheduled transaction is found it's lookup up in database. 
// it's checked to ensure the current blocktime is before tx is to be scheduled 
// why is the scheduled-tx-time always LATER than the current time
        
     // if     scheduledTime <=  timeNow { proceed } ?? 
     // if     scheduledBlock <=  blockNow { proceed } ?? 
     // r[i].blocknumber === pending tx blockNumber or timeStamp
     // blocknumber variable  === true blockNumber or timeStamp
      console.log(`r[${i}].blocknumber ${web3.utils.hexToNumber(r[i].blocknumber)}, blocknumber ${blocknumber}`) 
      // fail: rTime + 30 > blocktime
        if (web3.utils.toBN(r[i].blocknumber).lte(blocknumber)) {            
            
            var block = r[i].blocknumber;
            var from = r[i].from;
            var to = r[i].to; 
            var value = r[i].value;
            var gaslimit = r[i].gaslimit;
            var gasprice = r[i].gasprice;
            var fee = r[i].fee;
            var data = r[i].data;
            var AionID = r[i].AionID;
            var schedType = r[i].schedType;

            console.log(`Pre-check: estimating gas for AionID ${web3.utils.hexToNumber(AionID)}`)

            await aionContract.methods.executeCall(block, from, to, value, gaslimit, gasprice, fee, data, AionID, schedType).estimateGas({
                from: account.address,
                gas: web3.utils.hexToNumber(gaslimit)
            })
            .catch(async function(error){
                console.log("gas error message ", error)
                r[i].status = 'Gas Error';
                await r[i].save(function(err){
                    console.log(`Error saving Gas error for AionID ${web3.utils.hexToNumber(AionID)}`, err || error);
                });
            });

            if (r[i].status == 'Gas Error'){ continue;}

            var byteCode = aionContract.methods.executeCall(block, from, to, value, gaslimit, gasprice, fee, data, AionID, schedType).encodeABI()
  
            console.log(`Generating new transaction for AionID ${AionID}`)
            
            nonce = Math.max(await web3.eth.getTransactionCount(account.address,'pending'), nonce);

            var tx = {
                to: aionContract.address,
                gas: gaslimit,
                gasPrice: gasprice,
                data: byteCode,
                nonce: nonce,
                chainId: chainId 
            }
            var signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
            r[i].status = 'Submitted';
            r[i].txHash = signedTx.transactionHash;
            var result = await r[i].save();
            if(result !=r[i]) {
                console.log('TxHash not saved properly')
            }


            web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('error',(error) => {
                console.log(`Error sending transaction for AionID ${web3.utils.hexToNumber(AionID)}`, error);
            });

            nonce = nonce + 1;

        }
    }

};

exports.executeRequestedTxs = executeRequestedTxs;
