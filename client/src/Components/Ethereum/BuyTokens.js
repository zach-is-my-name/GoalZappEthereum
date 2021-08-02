/* eslint-disable */
import React from 'react'
import "../../style/BuyTokens.css"
import GOALESCROW from '../../abi/GoalEscrow.json'
import goalzapptokensystem from '../../abi/GoalZappTokenSystem.json'
import * as DeployedAddress from '../../ContractAddress.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
const BN = require("bn.js")
let accounts = web3.eth.getAccounts()
let selectedAddress;
let etherBalanceFromWei;
// console.log(goalzapptokensystem)
// console.log(window)
const GoalZappTokenSystem = new web3.eth.Contract(goalzapptokensystem.abi, DeployedAddress.GOALZAPPTOKENSYSTEM )

class BuyTokens extends React.Component  {
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
    this.buyTokens = this.buyTokens.bind(this)
    this.confirm = this.confirm.bind(this)
    this.cancel = this.cancel.bind(this)
    this.calculatePurchasePrice = this.calculatePurchasePrice.bind(this)
    this.calculateReturnAmount = this.calculateReturnAmount.bind(this)
    this.handleSubmitTokenDenominated = this.handleSubmitTokenDenominated.bind(this)
    this.handleSubmitEtherDenominated = this.handleSubmitEtherDenominated.bind(this)
    this.showTokenInput = this.showTokenInput.bind(this)
    this.showEtherInput = this.showEtherInput.bind(this)
    this.showCalc = this.showCalc.bind(this)
    this.getPriceCalcForm = this.getPriceCalcForm.bind(this)
    this.handleChangeCalcForm = this.handleChangeCalcForm.bind(this)
}


  async buyTokens(event, etherToSend) {
    console.log('buyTokens() arg etherToSend', etherToSend)
    console.log('typeof etherToSend', typeof etherToSend)
    //event.preventDefault()
    if (etherBalanceFromWei > etherToSend) {
      etherToSend = etherToSend.toString()
      let result = await GoalZappTokenSystem.methods.buy().send({from: window.ethereum.selectedAddress, value: Web3.utils.toWei(etherToSend) })
      console.log(result)
      let tokenBalance = web3.utils.fromWei(await GoalZappTokenSystem.methods.balanceOf(window.ethereum.selectedAddress).call())
      this.props.setUserTokenBalance(tokenBalance)

    } else {
      alert("Not enough ether to buy tokens")
    }
  }

  async confirm(event)  {
    event.preventDefault()
    let formValue = parseFloat(this.state.formValue)
    console.log('confirm() formValue type', typeof formValue)
    if (this.state.denomination === "ether") {
      if (formValue && typeof formValue === "number") {
        this.buyTokens(event, formValue)
      } else { alert("Please Enter a valid number")}
    } else if (this.state.denomination === "tokens")  {

      this.buyTokens(event, await this.calculatePurchasePrice(this.state.formValue))
    } else {
      alert("Error: Cannot confirm purchase without denomination")
    }
  }

  async calculatePurchasePrice(value) {
    let formValue = parseFloat(value)
    if (formValue && typeof formValue === 'number') {
      let tokensDesired = formValue
      let poolBalance = web3.utils.fromWei(await GoalZappTokenSystem.methods.poolBalance().call())
      poolBalance = parseFloat(poolBalance)
      let totalSupply = web3.utils.fromWei(await GoalZappTokenSystem.methods.totalSupply().call())
      totalSupply = parseFloat(totalSupply)
      let exponent = 2

      let price = poolBalance * (Math.pow(((tokensDesired / totalSupply) + 1), exponent + 1) - 1)

      return price
    }
    alert("Enter the number of tokens you want")
  }

  async getPriceCalcForm(value) {
    value = parseFloat(value)
    let calcFormValue = await this.calculatePurchasePrice(value)
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
      let returnAmount = await GoalZappTokenSystem.methods.calculatePurchaseReturn(totalSupplyBN, poolBalanceBN, reserveRatioBN, etherOfferedInWei).call()
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
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    selectedAddress = window.ethereum.selectedAddress;
    try {
    etherBalanceFromWei = web3.utils.fromWei(await web3.eth.getBalance(accounts[0]))
  } catch (error) {
    // Handle error. Likely the user rejected the login
    console.error(error)
  }
  }

  render() {


      let tokenInput = (
        <div className="buy-tokens-enter-tokens">
        <form  onSubmit={this.handleSubmitTokenDenominated}>
        <input type="text" value={this.state.formValue} onChange={this.handleChange} />
        <input disabled={this.state.renderConfirm} type="submit" value="Buy" />
        </form>
      </div>
     )

      let etherInput = (
        <div className="buy-tokens-enter-ether">
          <form onSubmit={this.handleSubmitEtherDenominated}>
            <input type="text" value={this.state.formValue} onChange={this.handleChange} />
            <input disabled={this.state.renderConfirm} type="submit" value="Buy" />
          </form>
          </div>
        )

      let calc = (
        <div className="buy-tokens-calculate">
        <p>Enter token amount</p>
        <form>
        {/*<form onSubmit={this.calculatePurchasePrice}>*/}
          <input type="text" value={this.state.calcFormValue} onChange={this.handleChangeCalcForm} />
          <button type="button" onClick={() => this.getPriceCalcForm(this.state.calcFormValue)}>Get Price</button>
          <button type="button" onClick={() => this.calculateReturnAmount(this.state.calcFormValue)}>Token Amount</button>
        </form>
      </div>
      )

      let confirmPrompt = (
      <div className="buy-tokens">
      <div className="buy-tokens-confirmPrompt">
        <button onClick={this.confirm} className="button-yes"  value="confirm">Confirm</button>
        <button onClick={this.cancel} className="button-no" value="cancel">Cancel</button>
      </div>
      </div>
      )

    return (
      <div className="buy-tokens">
        <p onClick={this.showTokenInput}>Tokens to Buy</p>
         {this.state.showTokenInput ? tokenInput : null}
         {this.state.renderConfirm ? confirmPrompt : null}
        <p> or </p>
        <p onClick={this.showEtherInput}>Ether to Spend</p>
         {this.state.showEtherInput ? etherInput : null}
         {this.state.renderConfirm ? confirmPrompt : null}
        <p onClick={this.showCalc}>Calculate Token Price</p>
         {this.state.showCalc ? calc : null}
       </div>
    )


  }
}

export default BuyTokens
