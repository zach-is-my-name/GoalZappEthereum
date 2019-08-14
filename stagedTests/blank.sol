//test requirements: 
  // suggester already has tokens *
  // suggester already approved transfer; with escrow contract as the spender*
  // owner has already deposited bonds (rewards optional, but helpful to include for copying to other tests) *
  // Structs working properly  
  // have an id for argument *

//what to test
  // balance of contract increments on deoposit *
  //suggestedSteps[_id].suggesterBond * 
  // decrements bondFunds*
  //suggestedSteps[_id].ownerBond * 
  // setSuggestionTimeOut

// Issues
  // how to test that current block time is stored in the Suggester  // struct? you can access the suggester struct, but you don't have  // anything to compare it to. 

