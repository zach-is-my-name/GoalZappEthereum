/* eslint-disable */
import React from 'react'
import "../../style/BuyTokens.css"
import goalescrow from '../../abi/GoalEscrow.json'
import goalzapptokensystem from '../../abi/GoalZappTokenSystem.json'
import * as DeployedAddress from '../../ContractAddress.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
const BN = require("bn.js")
let accounts = web3.eth.getAccounts()
let selectedAddress;
let tokenBalanceInWei;
let protectedTokens
// console.log(goalzapptokensystem)
// console.log(window)
const GoalZappTokenSystem = new web3.eth.Contract(goalzapptokensystem.abi, DeployedAddress.GOALZAPPTOKENSYSTEM )

class SellTokens extends React.Component  {
  constructor(props) {
    super(props)
    this.state = {
      formValue: "",
      renderConfirm: false,
      denomination: "",
      showTokenInput: false,
      showEtherInput: false,
      showCalc: false,
      calcFormValue: "",
    }

    this.handleChange = this.handleChange.bind(this)
    this.SellTokens = this.SellTokens.bind(this)
    this.confirm = this.confirm.bind(this)
    this.cancel = this.cancel.bind(this)
    this.calculateSalePrice = this.calculateSalePrice.bind(this)
    this.calculateReturnAmount = this.calculateReturnAmount.bind(this)
    this.handleSubmitTokenDenominated = this.handleSubmitTokenDenominated.bind(this)
    this.handleSubmitEtherDenominated = this.handleSubmitEtherDenominated.bind(this)
    this.showTokenInput = this.showTokenInput.bind(this)
    this.showEtherInput = this.showEtherInput.bind(this)
    this.showCalc = this.showCalc.bind(this)
    this.getPriceCalcForm = this.getPriceCalcForm.bind(this)
    this.handleChangeCalcForm = this.handleChangeCalcForm.bind(this)
}


  async SellTokens(event, amount) {
    console.log('SellTokens() arg amount', amount)
    console.log('typeof amount', typeof amount)
    //event.preventDefault()
    amount =  web3.utils.toWei(amount)
    if (tokenBalanceInWei < amount) {
      alert("Amount Entered exceeds available tokens")
      return
    }
   if (tokenBalanceInWei < protectedTokens) {
      alert("Amount Entered exceeds amount of tokens under protection.  Check time until protection lifts")
      return
    } else {
      amount = amount.toString()
      let result = await GoalZappTokenSystem.methods.sell(amount).send({from: this.props.currentEthereumAccount })
      console.log(result)
      let tokenBalance = web3.utils.fromWei(await GoalZappTokenSystem.methods.balanceOf(this.props.currentEthereumAccount).call())
      this.props.setUserTokenBalance(tokenBalance)
    }
  }

  async confirm(event)  {
    event.preventDefault()
    let formValue = parseFloat(this.state.formValue)
    console.log('confirm() formValue type', typeof formValue)
    if (this.state.denomination === "ether") {
      if (formValue && typeof formValue === "number") {
        let tokensToSell = await this.calculateSalePrice(this.state.formValue)
        if (tokensToSell <= this.props.userTokenBalance) {
        this.SellTokens(event, await this.calculateSalePrice(this.state.formValue))
        } else {
          alert("You don't have enough tokens to get this much ether back.")
          return
        }
      } else { alert("Please Enter a valid number")}
    } else if (this.state.denomination === "tokens")  {
      this.SellTokens(event, this.state.formValue )
    } else {
      alert("Error: Cannot confirm Sale without denomination")
    }
  }

  async calculateSalePrice(value) {
    let formValue = parseFloat(value)
    if (formValue && typeof formValue === 'number') {
      let etherDesired = formValue
      let poolBalance = web3.utils.fromWei(await GoalZappTokenSystem.methods.poolBalance().call())
      poolBalance = parseFloat(poolBalance)
      let totalSupply = web3.utils.fromWei(await GoalZappTokenSystem.methods.totalSupply().call())
      totalSupply = parseFloat(totalSupply)
      let exponent = 2

      // let price = poolBalance * (Math.pow(((tokensDesired / totalSupply) + 1), exponent + 1) - 1)
      let tokensRequired = totalSupply * ((Math.pow((etherDesired / poolBalance) + 1),(1/(exponent + 1))) -1)

      return tokensRequired
    }
    alert("Enter the number of tokens you want")
  }

  async getPriceCalcForm(value) {
    value = parseFloat(value)
    let calcFormValue = await this.calculateSalePrice(value)
    this.setState({calcFormValue})
  }

  cancel(event) {
    event.preventDefault()
    this.setState({renderConfirm:false, formValue: "", denomination: ""})
  }

  async calculateReturnAmount(value) {
    let formValue = parseFloat(value)
    if (formValue && typeof formValue === 'number') {
      let etherOfferedInWei

      if (formValue < 1 && formValue > 0) {
        etherOfferedInWei = Web3.utils.toBN(Web3.utils.toWei(value))
        console.log('typeof etherOfferedInWei', typeof etherOfferedInWei)
        console.log('etherOfferedInWei', etherOfferedInWei)
      }

      else if (formValue % 1 === 0 && parseInt(Web3.utils.toWei((Math.round(formValue)).toString())) < (Number.SAFE_MAX_INTEGER - 1000)) {
          // if it has a decimal
        etherOfferedInWei = web3.utils.toWei(formValue)
        console.log('typeof etherOfferedInWei', typeof etherOfferedInWei)
        console.log('etherOfferedInWei', etherOfferedInWei)
      }

      else if (parseInt(Web3.utils.toWei((Math.round(formValue)).toString())) > (Number.SAFE_MAX_INTEGER - 1000)) {
          alert("Enter a smaller number")
          return
      }

      else {
        etherOfferedInWei = web3.utils.toBN(formValue)
        console.log('typeof etherOfferedInWei', typeof etherOfferedInWei)
        console.log('etherOfferedInWei', etherOfferedInWei)
      }

      let poolBalanceBN = Web3.utils.toBN(await GoalZappTokenSystem.methods.poolBalance().call())
      let totalSupplyBN = Web3.utils.toBN(await GoalZappTokenSystem.methods.totalSupply().call())
      let reserveRatioBN = Web3.utils.toBN(333333)
      try {
      let returnAmount = await GoalZappTokenSystem.methods.calculateSaleReturn(totalSupplyBN, poolBalanceBN, reserveRatioBN, etherOfferedInWei).call()
      typeof returnAmount === "object" ?  console.log(returnAmount.toString()) : console.log(returnAmount)
      this.setState({calcFormValue: returnAmount})
      } catch (error) {console.log(error)}
      } else {
      alert("Enter a number value")
    }
  }

 handleChange(event) {
  this.setState({formValue: event.target.value});
 }

 handleChangeCalcForm(event) {
  this.setState({calcFormValue: event.target.value});
 }

 handleSubmitTokenDenominated(event) {
  event.preventDefault()
  this.setState({renderConfirm: true, denomination: "tokens"})
 }

 handleSubmitEtherDenominated(event) {
  event.preventDefault()
  this.setState({renderConfirm: true, denomination: "ether"})
 }

 showTokenInput() {
   this.setState((prevState, props) => {return ({showTokenInput:!prevState.showTokenInput})
   })
 }

 showEtherInput() {
   this.setState((prevState, props) => {return ({showEtherInput:!prevState.showEtherInput})
   })
 }

 showCalc() {
   this.setState((prevState, props) => {return ({showCalc:!prevState.showCalc})
   })
 }



  async componentDidMount() {
    console.log(this.props.currentEthereumAccount)
    try {
    tokenBalanceInWei = await GoalZappTokenSystem.methods.balanceOf(this.props.currentEthereumAccount).call()
    protectedTokens = await GoalZappTokenSystem.methods.amountProtected(this.props.currentEthereumAccount).call()
    // You now have an array of accounts!
    // Currently only ever one:
    // ['0xFDEa65C8e26263F6d9A1B5de9555D2931A33b825']
  } catch (error) {
    // Handle error. Likely the user rejected the login
    console.error(error)
  }
  }

  render() {

      let tokenInput = (
        <div className="Sell-tokens-enter-tokens">
        <form  onSubmit={this.handleSubmitTokenDenominated}>
        <input type="text" value={this.state.formValue} onChange={this.handleChange} />
        <input disabled={this.state.renderConfirm} type="submit" value="Sell" />
        </form>
      </div>
     )

      let etherInput = (
        <div className="Sell-tokens-enter-ether">
          <form onSubmit={this.handleSubmitEtherDenominated}>
            <input type="text" value={this.state.formValue} onChange={this.handleChange} />
            <input disabled={this.state.renderConfirm} type="submit" value="Sell" />
          </form>
          </div>
        )

      let calc = (
        <div className="Sell-tokens-calculate">
        <p>Enter token amount</p>
        <form>
        {/*<form onSubmit={this.calculateSalePrice}>*/}
          <input type="text" value={this.state.calcFormValue} onChange={this.handleChangeCalcForm} />
          <button type="button" onClick={() => this.getPriceCalcForm(this.state.calcFormValue)}>Get Price</button>
          <button type="button" onClick={() => this.calculateReturnAmount(this.state.calcFormValue)}>Token Amount</button>
        </form>
      </div>
      )

      let confirmPrompt = (
      <div className="Sell-tokens">
      <div className="Sell-tokens-confirmPrompt">
        <button onClick={this.confirm} className="button-yes"  value="confirm">Confirm</button>
        <button onClick={this.cancel} className="button-no" value="cancel">Cancel</button>
      </div>
      </div>
      )

    return (
      <div className="Sell-tokens">
        <p onClick={this.showTokenInput}>Tokens to Sell</p>
         {this.state.showTokenInput ? tokenInput : null}
         {this.state.renderConfirm ? confirmPrompt : null}
        <p> or </p>
        <p onClick={this.showEtherInput}>Ether to Receive</p>
         {this.state.showEtherInput ? etherInput : null}
         {this.state.renderConfirm ? confirmPrompt : null}
        <p onClick={this.showCalc}>Calculate Token Price</p>
         {this.state.showCalc ? calc : null}
       </div>
    )


  }
}

export default SellTokens
