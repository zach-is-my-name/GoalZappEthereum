/* eslint-disable */
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import '../../style/CurrentSteps.css'
import plus from '../../style/images/plus_websize.png'
import minus from '../../style/images/minus.jpg'
import * as actions from '../../Actions/actions.js'
import SuggestStep from './SuggestStep.js'

class CurrentSteps extends Component {
  constructor(props) {
    super(props)
    this.state = {
      toggleOnSuggestInput: false,
      showItems: null
    }
    // this.clickHandler = this.clickHandler.bind(this)
    // this.toggleOff = this.toggleOff.bind(this)
  }

  // componentDidMount() {
  //   document.addEventListener('click', this.handleClickOutside.bind(this), true)
  // }

  // conmponentWillUnmount() {
  //   document.removeEventListener('click', this.handleClickOutside.bind(this), true)
  // }

  // handleClickOutside(event) {
  //   const domNode = ReactDOM.findDOMNode(this)
  //
  //   if((!domNode || !domNode.contains(event.target))) {
  //     this.setState({
  //       toggleOnSuggestInput: false
  //     })
  //   }
  // }

clickHandler(event, index){
this.setState({ activeIndex: index})
}

  render() {

  let steps = this.props.currentGoalSteps.map((step, index) => {
      return (
        <div key={`divKey${index}`} className="currentstep-wrapper">
          <li className="minus-image"><img key={`imagekey-minus${index}`} alt="" src={minus}/></li>  <li className="plus-image"><img  key={`imageKey-plus${index}`} onClick={e => this.clickHandler(e, index)}  alt="" src={plus}/></li>


          <li className="current-step" key={index}>{step}</li>


          {this.state.activeIndex === index  ? <SuggestStep /> : null}
        </div>
            )
        });

      return (
        <div className="steps-container">
          <p className="currentsteps-label">
            Steps:
          </p>
          <ul>{steps}</ul>
          {/* <button  onClick={this.reset.bind(this)}>
            reset
          </button> */}
          {/* {this.state.toggleOnSuggestInput ? <SuggestStep /> : null} */}
        </div>)}}

            const mapStateToProps = (state, props) => {
              return {currentGoalSteps: state.goals.currentGoalSteps}
            }

            export default connect(mapStateToProps)(CurrentSteps);
