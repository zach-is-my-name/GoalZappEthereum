/* eslint-disable */
import React, {Component} from 'react';
import MinusButton from './Buttons/MinusButton.js'
import EditButton from './Buttons/EditButton.js'
import PlusButton from './Buttons/PlusButton.js'
import SuggestStepSmart from '../../SuggestStep-smart.js'
import SuggestRemoveStep from '../../SuggestRemoveStep-smart.js'
import YesNoPrompt from '../../YesNoPrompt.js'
import RemoveSuggestedStep from '../../RemoveSuggestedStep-smart.js'
import '../../../../style/ForeignGoalCurrentSteps.css'

class ForeignStepWithButtons extends Component {
  constructor(props) {
    super(props)
    this.state={
      toggleConfirmPrompt: false,
      indexToRemove: null,
      indexClicked: null,
      stepActivated: false,
      activeIndexEditStep: null,
      editStepOn: false,
      editedStep: '',
      renderRemoveMutation:false,
      renderSuggestRemoveState: false,
      renderSuggestEditState: false,
      renderRemoveSuggestedStepState: false,
      renderSuggestStepState: false,
    }

    this.clickHandlerCancel = this.clickHandlerCancel.bind(this)
    this.clickHandlerSuggestAdd = this.clickHandlerSuggestAdd.bind(this)
    this.clickHandlerSuggestRemove = this.clickHandlerSuggestRemove.bind(this)
    this.clickHandlerSuggestEdit = this.clickHandlerSuggestEdit.bind(this)
    this.clickHandlerConfirmSuggestRemove = this.clickHandlerConfirmSuggestRemove.bind(this)
    this.unrenderSuggestRemoveStep = this.unrenderSuggestRemoveStep.bind(this)
    this.unrenderRemoveSuggestedStep = this.unrenderRemoveSuggestedStep.bind(this)
    this.unrenderSuggestEditStep = this.unrenderSuggestEditStep.bind(this)
    this.clickHandlerConfirmRemoveSuggestedStep = this.clickHandlerConfirmRemoveSuggestedStep.bind(this)
    this.unrenderSuggestStep = this.unrenderSuggestStep.bind(this)
  }

  render() {
    const {stepObj} = this.props
    const ownStepsBool = this.props.selectedSuggesterId === this.props.loggedInUserId
    let style
        if (stepObj.suggestedStep === false) {
          style = {color: '#000000'}
          }
         else if (stepObj.suggestedStep && stepObj.suggestRemove) {
          style = {color: '#ef3779', textDecoration: 'line-through'}
          }
          else if (stepObj.suggestedStep === true) {
          style =  {color: '#ef3779'}
        }
    return (
      <div className="foreign-step-with-buttons-container">
        <MinusButton
          clickHandlerSuggestRemove={this.clickHandlerSuggestRemove}
          clickHandlerRemoveSuggested={this.clickHandlerRemoveSuggested}
          stepIndex={this.props.stepIndex}
          stepObj={this.props.stepObj}
        />

        <EditButton
          clickHandlerSuggestEdit={this.clickHandlerSuggestEdit}
          stepIndex={this.state.stepIndex}
          renderSuggestEditState={this.state.renderSuggestEditState}
          stepObj={this.props.stepObj}
          unrenderSuggestEditStepFunction={this.unrenderSuggestEditStep}
          editStepOn={this.state.editStepOn}
          activeIndexEditStep={this.state.activeIndexEditStep}
          id={this.props.id}
          selectedSuggesterId={this.props.selectedSuggesterId}
          ownStepsBool={this.props.selectedSuggesterId === this.props.loggedInUserId}
          loggedInUserId={this.props.loggedInUserId}
          style={style}
        />

        <PlusButton
          clickHandlerSuggestAdd={this.clickHandlerSuggestAdd}
          stepIndex={this.props.stepIndex}
        />

        {/******render logic******/}
        {/*Remove Suggested Step*/}
        <div className="foreign-step-button container">
          {this.state.toggleConfirmPrompt &&(this.props.stepIndex !== null) &&
            (this.state.indexToRemove === this.props.stepIndex) &&
            this.props.stepObj.suggestedStep &&
            this.props.selectedSuggesterId === this.props.loggedInUserId &&
            this.props.stepObj.suggester.id &&
            this.props.stepObj.suggester.id === this.props.loggedInUserId ?
              <div className="foreign-step-button confirm-prompt">
                <div className="foreign-step-button
                text">
                  <p>Remove Step?</p>
                </div>
                <YesNoPrompt
                  clickEventYes={this.clickHandlerConfirmRemoveSuggestedStep}
                  clickEventNo={this.clickHandlerCancel}/>
              </div>
            : null}
        </div>

        <div className="foreign-step-remove-suggested-component">
          {this.state.renderRemoveSuggestedStepState ?
            <RemoveSuggestedStep
              indexToRemove={this.state.indexToRemove}
              idToRemove={this.props.stepObj.id}
              goalDocId={this.props.goalDocId}
              unrenderRemoveSuggestedStepFunction={this.unrenderRemoveSuggestedStep}
              stepObj={this.props.stepObj}
              loggedInUserId={this.props.loggedInUserId}
            />
          : null
          }
        </div>
        {/*Suggest Remove Step*/}
        <div className="foreign-step-button container">
          {(this.state.toggleConfirmPrompt && (this.props.stepIndex !== null) && (this.state.indexToRemove === this.props.stepIndex) && !this.props.stepObj.suggestedStep && !this.props.stepObj.suggestRemove)
            && this.props.selectedSuggesterId === this.props.loggedInUserId ?
              <div className="foreign-step-button confirm-prompt">
                <div className="foreign-step-button
                text">
                  <p>Suggest Remove Step?</p>
                </div>
                <YesNoPrompt
                  clickEventYes={this.clickHandlerConfirmSuggestRemove}
                  clickEventNo={this.clickHandlerCancel}/>
              </div>
            : null}
        </div>
        {this.state.renderSuggestRemoveState ?
          <div className="foreign-step-suggest-remove-component">
            <SuggestRemoveStep
              indexToRemove={this.state.indexToRemove}
              goalDocId={this.props.goalDocId}
              id={this.props.id}
              unrenderSuggestRemoveStepFunction={this.unrenderSuggestRemoveStep}
              stepObj={this.props.stepObj}
              loggedInUserId={this.props.loggedInUserId}
              targetUserId={this.props.targetUserId}
            />
          </div>
        : null }

        {/* </div> */}
        {/*suggest step */}
        {this.state.stepActivated && (this.state.stepIndex !== null) &&
          (this.state.indexClicked === this.state.stepIndex) && ownStepsBool && this.state.renderSuggestStepState
            ? <div className="foreign-step-suggest">
              <SuggestStepSmart
                stepIndex={this.state.stepIndex}
                goalDocId={this.props.goalDocId}
                targetUserId={this.props.targetUserId}
                loggedInUserId={this.props.loggedInUserId}
                unrenderSuggestStepFunctiion={this.unrenderSuggestStep}
                proxyAddress={this.props.proxyAddress}
                currentEthereumAccount={this.props.currentEthereumAccount}
              />
            </div>
            : null }

      </div>
  )
  }

  clickHandlerCancel(event) {
    // console.log('no clicked')
    this.setState(prevState => ({
      toggleConfirmPrompt: !prevState.toggleConfirmPrompt,
      indexToRemove: null
    }))
  }

  clickHandlerSuggestAdd(stepIndex){
    this.setState(prevState => ({
      indexClicked: stepIndex,
      stepActivated: !prevState.stepActivated,
      stepIndex: this.props.stepIndex,
      renderSuggestStepState: !prevState.renderSuggestStepState,
    }))
}

  unrenderSuggestStep() {
    this.setState({
      renderSuggestStepState: false,
      indexClicked: null,
      stepActivated: false,
      stepIndex: null,
    })
  }

  clickHandlerSuggestRemove(indexToRemove) {
    // console.log('index to remove', indexToRemove)
    this.setState(prevState => ({
      toggleConfirmPrompt: !prevState.toggleConfirmPrompt,
      indexToRemove: indexToRemove,
      // stepIndex: this.props.stepIndex
    }))
  }

  clickHandlerConfirmSuggestRemove() {
    this.setState(prevState => ({
      toggleConfirmPrompt: !prevState.toggleConfirmPrompt,
      renderSuggestRemoveState: true,
    }))
  }

  unrenderSuggestRemoveStep() {
    this.setState(prevState => ({
      renderSuggestRemoveState: false,
    }))}

  clickHandlerRemoveSuggested() {
    // console.log('remove suggested')
    this.setState(prevState => ({
      toggleConfirmPrompt: !prevState.toggleConfirmPrompt,
      indexToRemove: indexToRemove,
      // stepIndex: this.props.stepIndex
    }))
  }

  clickHandlerConfirmRemoveSuggestedStep() {
    // console.log("clickHandler confirm ")
    this.setState(prevState => ({
      toggleConfirmPrompt: !prevState.toggleConfirmPrompt,
      renderRemoveSuggestedStepState: true,
    }))
  }

  unrenderRemoveSuggestedStep() {
    // console.log('unrenderRemoveSuggestedStep')
    this.setState(prevState => ({
      renderRemoveSuggestedStepState: false,
    }))
  }

  clickHandlerSuggestEdit(stepIndex, event) {
    this.setState(prevState => ({
      renderSuggestEditState: true,
      stepIndex: this.props.stepIndex
    }))
  }

  unrenderSuggestEditStep() {
    this.setState(prevState => ({
      renderSuggestEditState: false,
    }))
  }
}

export default ForeignStepWithButtons
