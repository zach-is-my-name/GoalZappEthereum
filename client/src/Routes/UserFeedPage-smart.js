/* eslint-disable */

import React, {Component} from 'react';
import {Route, Link, withRouter} from 'react-router-dom';
import {graphql, compose, withApollo} from 'react-apollo'
import gql from 'graphql-tag'
import CurrentUser from '../Components/User/CurrentUser'
import GlobalFeedPage from './GlobalFeedPage'
import CurrentGoal from '../Components/Goal/CurrentGoal-smart'
import CurrentStepsSmart from '../Components/Steps/CurrentSteps-smart'
import Notifications from '../Components/Feed/Notifications-smart'
import TargetUser from '../Components/User/TargetUser'
import SelectSuggesterSmart from '../Components/User/SelectSuggester-smart'
import SelectGoal from '../Components/Goal/SelectGoal-smart'
import SelectedSuggesterName from '../Components/User/SelectedSuggesterName'
import InputGoalSmart from '../Components/Goal/InputGoal-smart'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import '../style/UserFeedPage.css'


const targetUserQuery = gql `
query targetUserQuery($targetUserId: ID) {
  user(id: $targetUserId) {
    id
    userName
  }
}
`

class UserFeedPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      goalDocId: '',
      paramUserId: '',
      suggesters: [],
      suggestersIndex: 0,
      selectedSuggesterId: "",
      targetUserId: "",
      targetUserName: "",
      renderTargetUserSteps: false
    }

    this._setGoalDocId = this._setGoalDocId.bind(this)
    this._gotoSelf = this._gotoSelf.bind(this)
    this._setSuggesters = this._setSuggesters.bind(this)
    this._nextSuggester = this._nextSuggester.bind(this)
    this._prevSuggester = this._prevSuggester.bind(this)
    this._setGoalDocIdOnCreate = this._setGoalDocIdOnCreate.bind(this)
    this._setSelf = this._setSelf.bind(this)
    this._renderTargetUserSteps = this._renderTargetUserSteps.bind(this)

  }

  _setSelf(targetUserId, targetUserName) {
      const self = [{ userName: this.props.loggedInUserName, id: this.props.loggedInUserId }]
          this.setState(state => {
            return (
              {
                suggesters: [...self, ...state.suggesters],
                targetUserName: targetUserName,
                targetUserId: targetUserId
              }
            )
          })

      targetUserId === this.props.loggedInUserId ? this.props.renderFundGoal(): null
  }

  async componentDidMount() {
      const {match: {params: {goaldocid: urlMatchGoalDocId, userid: urlMatchUserId }}, goalDocId } = this.props;
      const targetUserResult  = await this.props.client.query({query: targetUserQuery, fetchPolicy: 'network-only', variables: {targetUserId: urlMatchUserId}})
      const targetUserId = targetUserResult.data.user.id
      const targetUserName = targetUserResult.data.user.userName
      if (this.props.loggedInUserId && targetUserId && targetUserName) {
        this._setSelf(targetUserId, targetUserName)


        if (typeof urlMatchGoalDocId === "string") {
          if (urlMatchGoalDocId.length > 25 || urlMatchGoalDocId.length < 25){
            this.props.history.push(`/userfeed/${this.props.loggedInUserId}`)
          }
        }
      }
      this.setState({targetUserId: urlMatchUserId || targetUser.id})
      urlMatchGoalDocId  ? this.props.setUrlHasGoalDoc() && this.setState({goalDocId: urlMatchGoalDocId}) : this.props.setUrlDoesNotHaveGoalDoc()
      urlMatchGoalDocId  ? this.setState({goalDocId: urlMatchGoalDocId}) : null
      urlMatchUserId ? this.setState({paramUserId: urlMatchUserId}): this.props.history.push('/')
  }

  async componentDidUpdate(prevProps, prevState) {
    if (this.state.suggesters.length && this.state.suggesters !== prevState.suggesters  || this.state.suggestersIndex !== prevState.suggestersIndex ) {
      this.setState((state) => {return ({selectedSuggesterId: state.suggesters[state.suggestersIndex].id})})
    }
    if (this.props.match.params.userid !== prevProps.match.params.userid) {
      const targetUserResult  = await this.props.client.query({query: targetUserQuery, fetchPolicy: 'network-only', variables: {targetUserId: this.props.match.params.userid}})
      const targetUserId = targetUserResult.data.user.id
      const targetUserName = targetUserResult.data.user.userName
      this.setState({targetUserName: targetUserName, targetUserId: targetUserId})
      this.props.targetUserId === this.props.loggedInUserId ? this.props.renderFundGoal(): null
    }
  }
  render() {
    const {match} = this.props
    const {suggesters} = this.state
    let renderNull =  null
    let renderComponent =   (

      <div className="userfeedpage-container">


        <div className="userfeed suggester-container">
        { this.state.goalDocId ?
          <SelectedSuggesterName
            loggedInUserId={this.props.loggedInUserId || null}
            selectedSuggesterId={this.state.selectedSuggesterId || null}
            suggestersIndex={this.state.suggestersIndex}
            suggesters={this.state.suggesters}
            targetUserId={this.state.targetUserId}
            />
        : null }

      { this.props.loggedInUserId && this.props.loggedInUserName && this.state.goalDocId  ?
          <SelectSuggesterSmart
            loggedInUserName={this.props.loggedInUserName}
            loggedInUserId={this.props.loggedInUserId}
            goalDocId={match.params.goaldocid}
            gotoSelf={this._gotoSelf}
            setSuggesters={this._setSuggesters}
            suggesters={suggesters}
            nextSuggester={this._nextSuggester}
            prevSuggester={this._prevSuggester}
            targetUserName={this.state.targetUserName}
            targetUserId={this.state.targetUserId}
            renderTargetUserStepsState={this.state.renderTargetUserSteps}
            renderTargetUserSteps={this._renderTargetUserSteps}
          />
        : null
      }
        </div>
        { match && match.params.goaldocid || this.state.goalDocId && this.state.suggestersIndex && this.state.suggesters.length   ?
            <CurrentStepsSmart
              loggedInUserId={this.props.loggedInUserId}
              targetUserId={this.state.targetUserId || null}
              goalDocId={match && match.params.goaldocid || this.state.goalDocId}
              suggestersIndex={this.state.suggestersIndex}
              selectedSuggesterId={this.state.selectedSuggesterId || null}
              currentEthereumAccount={this.props.currentEthereumAccount}
              proxyAddress={this.props.proxyAddress}
              renderTargetUserSteps={this.state.renderTargetUserSteps}
            />
          : null
        }
        <div className="userfeed footer1 container">
          {this.state.targetUserName ?
          <TargetUser targetUserName={this.state.targetUserName || ''}/>
          : null
          }

          <SelectGoal
            targetUserId={this.state.targetUserId}
            setGoalDocId={this._setGoalDocId}
            value={ match.params && match.params.goaldocid || this.state.goalDocId}
            setProxyAddress={this.props.setProxyAddress}
            clearGoalDoc={this._clearGoalDoc}
          />
        </div>


        <div className = "userfeed input-goal-container">
        {this.props.loggedInUserId && this.state.targetUserId
          && this.state.targetUserId  === this.props.loggedInUserId && !this.state.goalDocId ?
           <InputGoalSmart
            loggedInUserId = {this.props.loggedInUserId}
            _setGoalDocIdOnCreate = {this._setGoalDocIdOnCreate}
            proxyAddress={this.state.proxyAddress}
            currentEthereumAccount={this.props.currentEthereumAccount}
            setProxyAddress={this.props.setProxyAddress}
            setUserTokenBalance={this.props.setUserTokenBalance}
            userTokenBalance={this.props.userTokenBalance}
            currentAccount={this.props.currentEthereumAccount}
            setGoalDocId={this._setGoalDocId}
            targetUserId={this.state.targetUserId}
          / >
          : null
        }
        </div>

        <div className="userfeed footer2 container">
          <Link className="globalfeed" to="/globalfeed">
            <span className="fas faGlobe fa-lg"> <FontAwesomeIcon icon={ faGlobe } /> </span>
          </Link>
        </div>
      </div>
    )
    return this.props.loggedInUserId ? renderComponent : renderNull
  }

  _setGoalDocId(event) {
    event.preventDefault()
    const {match} = this.props
    const goalDoc = JSON.parse(event.target.value)
    console.log("goalDoc", goalDoc)
    goalDoc.newGoal && goalDoc.newGoal === 'new-goal' ? this.setState({goalDocId: ""}) : this.setState({goalDocId: goalDoc.id})
    goalDoc.proxyAddress ? this.props.setProxyAddress(goalDoc.proxyAddress) && this.setState({proxyAddress: goalDoc.proxyAddress}) : null
    goalDoc.newGoal === 'new-goal' ? this.props.history.push(`/userfeed/${match.params.userid}`)  :
    this.props.history.push(`/userfeed/${match.params.userid}/${goalDoc.id}`)
  }

  _clearGoalDoc = () => {
    this.setState({goalDocId: ""})
  }

  _setGoalDocIdOnCreate(id) {
    const {match} = this.props
    this.setState({goalDocId: id})
    this.props.history.push(`/userfeed/${match.params.userid}/${id}`)
  }

  _gotoSelf() {
    if (!this.state.renderTargetUserSteps) {
    this.setState(() => ({suggestersIndex: 0}))
    }
  }

  _setSuggesters(suggesters) {
     // console.log("suggesters param", suggesters)
     this.setState({suggesters: [...this.state.suggesters, ...suggesters]})
  }


  _nextSuggester() {
    const {suggesters, suggestersIndex, renderTargetUserSteps} = this.state
     // console.log("nextSuggester called")
     // console.log("suggesters = ", Boolean(suggesters))
     // console.log("suggesters.length= ", Boolean(suggesters.length))
     // console.log("suggestersIndex < this.state.suggesters.length -1 ", Boolean(suggestersIndex < this.state.suggesters.length -1))
     // console.log("suggesters[1] = ", Boolean(suggesters[1]))
     // console.log("suggesters Index", suggestersIndex)
     // console.log("suggesters", suggesters)
    if (!renderTargetUserSteps && suggesters && suggesters.length && (suggestersIndex < suggesters.length -1) && suggesters[1]) {
      // console.log("should advance")
     this.setState(prevState=> ({suggestersIndex: prevState.suggestersIndex + 1}))
   } else if (suggestersIndex === suggesters.length -1) {
     // console.log("end or array")
     this.setState( () => ({suggestersIndex: 0}))
    }
  }

  _prevSuggester() {
    const {suggesters, suggestersIndex, renderTargetUserSteps} = this.state
    if (!renderTargetUserSteps &&suggesters.length > 0 && suggesters[1]) {
     if (suggestersIndex !== 0) {
     this.setState(prevState=> ({suggestersIndex: prevState.suggestersIndex - 1}))
       } else if (suggestersIndex === 0) {
         this.setState(() => ({suggestersIndex: suggesters.length -1}))
      }
    }
  }

  _renderTargetUserSteps() {
    this.setState(prevState => {return ({renderTargetUserSteps: !prevState.renderTargetUserSteps})})
  }

}


const _withRouter =  compose(withRouter)(UserFeedPage)
const withQuery = withApollo(_withRouter)
export default withQuery
// export default _withRouter
