/* eslint-disable */

import React, {Component} from 'react';
import * as actions from '../../Actions/actions.js'
import { arrayMove} from 'react-sortable-hoc';
import ForeignSteps from './Sortable/Foreign/ForeignSteps.js'
import SuggestMoveStep from './SuggestMoveStep-smart.js'

class ForeignGoalCurrentSteps extends Component {
  constructor(props) {
    super(props)
    this.state = {
      newIndex: null,
      oldIndex: null,
      movedClonedSteps: [],
      renderMoveStep: false,
      movedStepIndex: null,
      toggleOnZappButton: true
    }
    this._unrenderMoveStep = this._unrenderMoveStep.bind(this)
  }

    // move step function needs a state entry to manipulate
    // that manipulated state gets passed to the move step component and that submits its computed data
  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.props.clonedSteps) !== JSON.stringify(prevProps.clonedSteps)) {
      // console.log('this.props', this.props.clonedSteps)
      // console.log('prevProps', prevProps.clonedSteps)


      this.setState({
        //merge
        movedClonedSteps : this.props.clonedSteps
      })
    }
  }

  // set state for Move on initial render
  componentDidMount() {
    // {console.log("SELECTED SUGGESTER !== LOGGEDIN USER")}

    this.setState({movedClonedSteps: this.props.clonedSteps})
  }

  render() {
      let suggestMoveStep
        if (this.state.renderMoveStep && this.props.loggedInUserId) {
         suggestMoveStep =
         <SuggestMoveStep
           _unrenderMoveStep={this._unrenderMoveStep}
           clonedSteps={this.state.movedClonedSteps}
           newIndex={this.state.newIndex}
           loggedInUserId={this.props.loggedInUserId}
         />

      } else if (this.state.renderMoveStep && !this.props.loggedInUserId ) {
        suggestMoveStep = null
      } else {
        suggestMoveStep = null
      }

    return (
      <div className="jsx-wrap">
        {suggestMoveStep}

        <ForeignSteps
          clonedSteps={this.props.clonedSteps}
          onSortEnd={this.onSortEnd}
          helperClass="sortable-helper"
          hideSortableGhost={true}
          pressDelay={100}
          newIndex={this.state.newIndex}
          oldIndex={this.state.oldIndex}
          goalDocId={this.props.goalDocId}
          targetUserId={this.props.targetUserId}
          loggedInUserId={this.props.loggedInUserId}
          selectedSuggesterId={this.props.selectedSuggesterId}
          suggestersIndex={this.props.suggestersIndex}
          selectedSuggesterName={this.props.selectedSuggesterName}
          proxyAddress={this.props.proxyAddress}
          currentEthereumAccount={this.props.currentEthereumAccount}
          currentEthereumAccount={this.props.currentEthereumAccount}
        />
      </div>
      )
      }

      onSortEnd = ({oldIndex, newIndex}) => {
          this.setState(() => { return {
            movedClonedSteps: arrayMove(this.state.movedClonedSteps, oldIndex, newIndex),
            newIndex: newIndex,
            oldIndex: oldIndex,
            }
          }, () => this.setState({renderMoveStep: true}
        ))
      }

 _unrenderMoveStep() {
   this.setState({
     renderMoveStep: false
   })
 }

}
export default(ForeignGoalCurrentSteps);
