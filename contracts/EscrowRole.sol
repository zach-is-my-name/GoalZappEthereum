pragma solidity ^0.5.0;

import "./Context.sol";
import "./Roles.sol";

contract EscrowRole is Context {
    using Roles for Roles.Role;
    bool isSet;
    event EscrowRoleAdded(address indexed account);

    Roles.Role private _escrow;

    modifier onlyEscrowRole() {
        require(isEscrow(_msgSender()), "Escrow Role: caller does not have the Escrow role");
        _;
    }
   
    modifier notSet() {
      require(!isSet, "Escrow role already set");
      _;
    }

    function isEscrow(address account) public view returns (bool) {
        return _escrow.has(account);
    }

    function _addEscrowRole(address account) external notSet {
        _escrow.add(account);
        emit EscrowRoleAdded(account);
        isSet = true;
    }
}
