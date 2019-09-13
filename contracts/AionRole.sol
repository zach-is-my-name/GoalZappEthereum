pragma solidity ^0.5.0;

import "./Context.sol";
import "./Roles.sol";

contract AionRole is Context {
    using Roles for Roles.Role;

    event AionAddressAdded(address indexed aionAddr);

    Roles.Role private _aionAddress;

    constructor () internal {
        _addAionAddress();
    }

    modifier onlyAionRole() {
        require(isAionAddress(_msgSender()), "Aion Role: caller does not have the Aion role");
        _;
    }

    function isAionAddress(address account) public view returns (bool) {
        return _aionAddress.has(account);
    }

    function _addAionAddress() internal {
        _aionAddress.add(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
        emit AionAddressAdded(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
    }
}


