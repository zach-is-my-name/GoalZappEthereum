/* eslint-disable */
import React, {Component} from 'react';
import '../../../style/SelectGoalForm.css'
import {withRouter} from 'react-router-dom'
class SelectGoalForm extends Component {

  componentDidMount() {
      let selectedGoalDoc = this.props.goalDocs.find(element => element.id === this.props.value)
      selectedGoalDoc && selectedGoalDoc.proxyAddress ? this.props.setProxyAddress(selectedGoalDoc.proxyAddress, !!this.props.match.params.goaldocid) : null
  }

componentDidUpdate(prevProps) {
  if (prevProps.goalDocs !== this.props.goalDocs) {
      let selectedGoalDoc = this.props.goalDocs.find(element => element.id === this.props.value)
      selectedGoalDoc && selectedGoalDoc.proxyAddress ? this.props.setProxyAddress(selectedGoalDoc.proxyAddress) : null
  }
}

  render() {
    // console.log('form', this.props)

    const goalSelectInputValues = this.props.goalDocs.map((goalDoc, index) => {
      return <option value={JSON.stringify(goalDoc)} key={goalDoc.id}> {goalDoc.goal} </option>
    });

// if goal is loaded -- pre select : if goal is not loaded return null
      return (
        <form className="goal-select">
          <select value={ JSON.stringify(this.props.goalDocs.find(element => element.id === this.props.value))} onChange={this.props.handleChange}>
            <option value={JSON.stringify({newGoal: "new-goal"})} key={null}>---New Goal---</option>
            {goalSelectInputValues}
          </select>
          {/* </Field> */}
        </form>
      )
        }
        }

        // SelectGoalForm = reduxForm({form: 'goalSelectForm'})(SelectGoalForm);

        export default withRouter(SelectGoalForm);