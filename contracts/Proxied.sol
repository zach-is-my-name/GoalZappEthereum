pragma solidity >=0.5.0 <0.6.0;

contract Proxied {
    uint256 public value;
    uint256 otherValue;    
    event OtherValue (uint256 ov);
    event Value (uint256 v);


    constructor () public {
       value =5; 
    }

    function getValue() public returns (uint256) {
      emit Value (value); 
    }

    function setOthervalue(uint256 _otherValue) public  {
      otherValue = _otherValue;
    }

    function getOtherValue() public  returns (uint256) {
      emit OtherValue(otherValue); 
      return otherValue;
    } 

}
