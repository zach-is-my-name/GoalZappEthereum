/* eslint-disable */
import React, {Component} from 'react';
import * as actions from '../../Actions/actions.js'
import { arrayMove} from 'react-sortable-hoc';
import {ForeignSteps} from './Sortable/Foreign/ForeignSteps.js'

class ForeignGoalCurrentSteps extends Component {
  constructor(props) {
    super(props)
    this.state = {
      newIndex: null,
      oldIndex: null,
      indexInMotion: null,
      toggleOnZappButton: true
    }
    // this.clickHandlerYes = this.clickHandlerYes.bind(this)
    // this.clickHandlerNo = this.clickHandlerNo.bind(this)
  }

  render() {
    let {clonedSteps} = this.props
    return (<div className="steps-container">
      <ForeignSteps
        clonedSteps={clonedSteps}
        onSortEnd={this.onSortEnd.bind(this)}
        onSortStart={this.onSortStart.bind(this)}
        helperClass="sortable-helper"
        hideSortableGhost={true}
        pressDelay={100}
        newIndex={this.state.newIndex}
        oldIndex={this.state.oldIndex}
        indexInMotion={this.state.indexInMotion}
        goalDocId={this.props.goalDocId}
        targetUser={this.props.targetUser}
        loggedInUser={this.props.loggedInUser}/>
    </div>

    )
  }
  onSortEnd({oldIndex, newIndex}) {
    this.setState({newIndex: newIndex, oldIndex: oldIndex})
    const newOrderedList = arrayMove(this.props.clonedSteps, oldIndex, newIndex)
    // this.props.dispatch(actions.moveStepOnClone(newOrderedList))
  }

  onSortStart({index, collection}) {
    this.setState({indexInMotion: index})
  }
} {/* const mapStateToProps = (state, props) => {
              return {currentGoalSteps: state.goals.currentGoalSteps, loggedInUser: state.goals.loggedInUserID, targetUser: state.goals.targetUserID, currentGoalStepsClone: state.goals.clonedSteps}
              }
            */
}
export default(ForeignGoalCurrentSteps);
