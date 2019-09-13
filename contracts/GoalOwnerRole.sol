pragma solidity ^0.5.0;

import "./Context.sol";
import "./Roles.sol";

contract GoalOwnerRole is Context {
    using Roles for Roles.Role;

    event GoalOwnerAdded(address indexed account);

    Roles.Role private _goalOwners;

    constructor () internal {
        _addGoalOwner(_msgSender());
    }

    modifier onlyGoalOwner() {
        require(isGoalOwner(_msgSender()), "GoalOwner Role: caller does not have the GoalOwner role");
        _;
    }

    modifier notGoalOwner() {
	require(!isGoalOwner(_msgSender()), "GoalOwner Role: GoalOwner CAN NOT call this function");
	_;
    }

    function isGoalOwner(address account) public view returns (bool) {
        return _goalOwners.has(account);
    }

    function _addGoalOwner(address account) internal {
        _goalOwners.add(account);
        emit GoalOwnerAdded(account);
    }
}

