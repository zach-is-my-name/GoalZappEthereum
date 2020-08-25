/* eslint-disable */
import React, {Component} from 'react';
import SelectedSuggesterName from '../../Components/User/SelectedSuggesterName'
import {connect} from 'react-redux';
import * as actions from '../../Actions/actions.js'
import {SortableContainer, arrayMove} from 'react-sortable-hoc';
import {OwnSteps} from './Sortable/OwnGoal/OwnSteps.js'
import FirstStep from './FirstStep.js'
import update from 'immutability-helper';
import MoveStep from './MoveStep.js'
import uniqBy from 'lodash.uniqby'
import '../../style/OwnGoalCurrentSteps.css'

class OwnGoalCurrentSteps extends Component {
  constructor(props) {
    super(props)
    this.state = {
      newIndex: null,
      oldIndex: null,
      indexInMotion: null,
      movedSteps: [],
      renderMoveStep: false,
      showAddStepState: false,
      steps: []
    }

    this._unrenderMoveStep = this._unrenderMoveStep.bind(this)
    this._unrenderAddFirstStep = this._unrenderAddFirstStep.bind(this)
}

  componentDidMount() {
    // console.log("SELECTED SUGGESTER === LOGGEDIN USER")
    this.setState({movedSteps: [ ...this.props.steps, ...this.state.movedSteps,]})
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.props.steps) !== JSON.stringify(prevProps.steps)) {
      this.setState({
       movedSteps: uniqBy([...this.props.steps, ...this.state.movedSteps], 'id')
        // movedSteps: [...new Set(...this.props.steps, ...this.state.movedSteps)]
        // steps: [...this.props.steps, ...this.state.steps,]
      })
    }
  }

  render() {
    const clonedSteps = <p> Cloned Steps </p>
    const steps = <p> Steps </p>
    if (this.props.steps.length) {
    return (
      <div className="sortable-container">

        {/* <SelectedSuggesterName
          loggedInUserId={this.props.loggedInUserId}
          selectedSuggesterId={this.props.selectedSuggesterId}
          selectedSuggesterName={this.props.selectedSuggesterName}
          />
        */}
        <div>
        {this.state.renderMoveStep ?
          <MoveStep
            _unrenderMoveStep={this._unrenderMoveStep}
            steps={this.state.steps}
            newIndex={this.state.newIndex}
            oldIndex={this.state.oldIndex}
            clonedSteps={this.props.clonedSteps}
          /> : null}
        </div>
        <div>
          <OwnSteps
            onSortEnd={this.onSortEnd}
            randomColorStep={this.props.randomColorStep}
            currentGoalSteps={this.props.steps}
            currentGoalClonedSteps={this.props.clonedSteps}
            onSortEnd={this.onSortEnd}
            helperClass="sortable-helper"
            hideSortableGhost={true}
            pressDelay={100}
            newIndex={this.state.newIndex}
            oldIndex={this.state.oldIndex}
            indexInMotion={this.state.indexInMotion}
            toggleSuggestedSteps={this.state.toggleSuggestedSteps}
            goalDocId={this.props.goalDocId}
            targetUserId={this.props.targetUserId}
            loggedInUserId={this.props.loggedInUserId}
            getArr={this.getArr}
            selfState={this.props.selfState}
            suggestersIndex={this.props.suggestersIndex}
            selectedSuggesterId={this.props.selectedSuggesterId}
            proxyAddress={this.props.proxyAddress}
            currentEthereumAccount={this.props.currentEthereumAccount}
          />
        </div>
      </div>
    )}
      else {
        return (
        <FirstStep
          showAddStepState={this.state.showAddStepState}
          showAddStep={this.showAddStep}
          goalDocId={this.props.goalDocId}
          unrenderAddFirstStep={this._unrenderAddFirstStep}
          />
      )
      }
  }

  _unrenderAddFirstStep() {
    this.setState((prevState) => {
      return {
      showAddStepState: !prevState.showAddStepState
      }
    })
  }

  _unrenderMoveStep() {
    this.showAddStep()
    this.setState({
     renderMoveStep: false
   })
 }

 onSortEnd = ({oldIndex, newIndex}) => {
   this.setState(() =>  { return {
     steps: arrayMove(this.state.movedSteps, oldIndex, newIndex),
     newIndex: newIndex,
     oldIndex: oldIndex,
   }
  }, ()  => this.setState({renderMoveStep: true}) )
 }

 showAddStep = () => {
   this.setState((prevState) => {
     return {
       showAddStepState: !prevState.showAddStepState
     }
   })
 }

}
export default OwnGoalCurrentSteps;
