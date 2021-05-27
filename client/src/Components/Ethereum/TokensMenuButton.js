/* eslint-disable */
import React from 'react'
import { Wrapper, Button, Menu, MenuItem } from 'react-aria-menubutton';
import {withRouter, Link} from 'react-router-dom';
import BuyTokens from './BuyTokens'
import SellTokens from './SellTokens'
import '../../style/TokenMenuButton.css'

class MenuButton extends React.Component {
  constructor(props){
  super(props)
  this.handleSelection = this.handleSelection.bind(this)
  this.state = {
    showBuyTokens:  false,
    showSellTokens: false,
  }

  this.showBuyTokens = this.showBuyTokens.bind(this)
  this.showSellTokens = this.showSellTokens.bind(this)
  this.handleBuyClick = this.handleBuyClick.bind(this)
  this.handleSellClick = this.handleSellClick.bind(this)
}

handleSelection(value, event) {
  // console.log('handleSeleciton event', event)
}

handleBuyClick() {
  this.showBuyTokens()
}

handleSellClick() {
  this.showSellTokens()
}

showBuyTokens() {
  this.setState((prevState) => (
      {showBuyTokens: !prevState.showBuyTokens}
  ))
}

showSellTokens() {
  this.setState((prevState) => (
      {showSellTokens: !prevState.showSellTokens}
  ))
}
//className={`class1 ${class2}`}

  render() {
    const token = 'token'
    return (
      <Wrapper
      className={`menu-button ${token}`}
      onSelection={this.handleSelection}
      closeOnSelection={false}
      >
        <Button className={`menu-button-user-button ${token}`}>
          Token Menu
        </Button>
        <Menu className="menu-button-menu">
          <ul>
            <MenuItem className="menuitem-userfeed">
              <li onClick={this.handleBuyClick}>Buy Tokens</li>
              {this.state.showBuyTokens ? <BuyTokens currentEthereumAccount={this.props.currentEthereumAccount} setUserTokenBalance={this.props.setUserTokenBalance}/> : null}
            </MenuItem>
            <MenuItem className="menuitem-userfeed">
            <li onClick={this.handleSellClick}>Sell Tokens</li>
            {this.state.showSellTokens ? <SellTokens currentEthereumAccount={this.props.currentEthereumAccount} userTokenBalance={this.props.userTokenBalance} setUserTokenBalance={this.props.setUserTokenBalance}/> : null}
            </MenuItem>
          </ul>
        </Menu>
      </Wrapper>
    )
  }
}

export default withRouter(MenuButton)
