const http = require('http');
const Web3HttpProvider = require('web3-providers-http');

var options = {
    keepAlive: true,
    withCredentials: false,
    timeout: 20000, // ms
    headers: [
        {
            name: 'Access-Control-Allow-Origin',
            value: '*'
        }
    ]    }

const Web3 = require('web3');
const fs = require('fs');
const mongoose = require('mongoose');
const {Requests} = require('./models/Requests');
const {saveRequestedTxs} = require('./modules/saveRequestedTx');
const {saveExecutedTxs} = require('./modules/saveExecutedTx');
const {executeRequestedTxs} = require('./modules/executeRequestedTxs');

const dbHost = 'mongodb://mongo:27017/aion' 
const aionContractAddress = '0x91839cBF2D9436F1963f9eEeca7d35d427867a7a'
const privateKey = '0x61fa5d860372d5673644b41380642b9bd44d01e52c79852d2f90552cace94b8b' 
const reqConfirmations = 0
// Connect to database
mongoose.connect(dbHost, {useNewUrlParser: true, useUnifiedTopology: true})
    .then( ()=> console.log('Connected to aion executor database @@', dbHost))
    .catch( (err) => console.log('Could not connect to database', err));

// Inject Web3

const provider = new Web3HttpProvider('http://localhost:8545', options);
var web3 = new Web3(provider);

// Contract definition and account setting
const ABI = JSON.parse(fs.readFileSync('Aion_ABI.json'));
const aionContract = new web3.eth.Contract(ABI, aionContractAddress)
const account = web3.eth.accounts.privateKeyToAccount(privateKey);

// Global variables
var currentBlock = 0;
web3.eth.getBlockNumber()
    .then((number)=>{
        currentBlock = number;
        console.log('New Aion start block ', currentBlock);
    });

setInterval(function(){
    web3.eth.getBlock('latest', async (err,block)=>{
        if(err){
            console.log(err);          
            return;
        }
        //if currentBlockProcessed <= blockchainBlock { then process}    
        // block.number is where blockchain actually is
        // currentBlock is where this system is
    //console.log(`chain ${block.number} is >= Aion block ${currentBlock} ? ${block.number >= currentBlock}`)
    console.log(`Aion ${currentBlock} chain ${block.number}`)
        if(currentBlock <= block.number){
            console.log(`New chain block received: aion: ${currentBlock}, chain: ${block.number}`);            
            
            /** Get scheduleCallEvent events and save **/
            console.log(`Looking for Scheduled Transaction events from Aion block ${currentBlock} to chain block ${block.number}`)
            var events = await aionContract.getPastEvents('ScheduleCallEvent', {fromBlock: currentBlock-reqConfirmations, toBlock: block.number-reqConfirmations}) 
            for(var i = 0; i < events.length; i++){
                console.log(`Found new Scheduled Transaction from chain block ${web3.utils.hexToNumber(events[i].blockNumber)}, to be executed at ${web3.utils.hexToNumber(events[i].returnValues.blocknumber)}`);
                await saveRequestedTxs(events[i], web3);
                //console.log(`Registered scheduled tx to database`)
            }                                     
           /**               end                         **/

           /**      look for past executed events        **/
            //console.log(`Looking for past Executed events from Aion block ${currentBlock} to chain block ${block.number}`)
            var events = await aionContract.getPastEvents('ExecutedCallEvent', {fromBlock: currentBlock-reqConfirmations,toBlock: block.number-reqConfirmations})
           
            //if (events.length < 1) {console.log("no past executed events")} 
               
            for(var i = 0; i < events.length; i++){
                console.log('Registering successfully executed Tx...');
                await saveExecutedTxs(events[i],web3);
            }           
           /**               end                         **/

            //Execute pending transactions if any, Block and time based schedules
            await executeRequestedTxs(block.number, false, web3, account, aionContract);
            await executeRequestedTxs(/*current blockchain timeStamp*/ block.timestamp, true, web3, account, aionContract);    
            
            // Save last processed block
            currentBlock = block.number+1;
        //    console.log(`advance Aion block to ${currentBlock}`) 
        }
    })
},4000);


