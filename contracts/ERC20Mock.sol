pragma solidity ^0.5.0;

//import "./GoalZappTokenSystem.sol"; 
import "./ERC20.sol";
// mock class using ERC20

contract ERC20Mock is ERC20 {
    //constructor (address initialAccount, uint256 initialBalance) public {
      //  _mint(initialAccount, initialBalance);
    //}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _burnFrom(account, amount);
    }

    function transferInternal(address from, address to, uint256 value) public returns (bool) {
        _transfer(from, to, value);
        return true;
    }

    function transferNoRestriction(address from, address to, uint256 value) checkProtectedTokens(value) public returns (bool) {
        _transfer(from, to, value);
        return true;
    }

    function approveInternal(address owner, address spender, uint256 value) public {
        _approve(owner, spender, value);
    } 

    function transferFromInternal(address sender, address recipient, uint256 amount)  public returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, _allowances[sender][msg.sender].sub(amount));
        return true;
    }

    function decreaseAllowanceInternal(address spender, uint256 subtractedValue)  public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].sub(subtractedValue));
        return true;
    }

    function increaseAllowanceInternal(address spender, uint256 addedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].add(addedValue));
        return true;
    }
   
    function mintNoRestrict(address account, uint256 amount) public { 
        require(account != address(0), "ERC20: mint to the zero address");
        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        //setRestrictedTokens(account, amount);	
        emit Transfer(address(0), account, amount);
     } 

}
