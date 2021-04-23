import React from 'react'
import {withRouter, Redirect} from 'react-router-dom'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag';

class CreateUserAuth0 extends React.Component {
  state = {
    userName: '',

  }

  render() {
    if (this.props.data.loading) {
      return (
        <div>Loading</div>
      )
    }
    // redirect if user is logged in or did not finish Auth0 Lock dialog
    const auth0IdToken = window.localStorage.getItem('auth0IdToken')
    const graphcoolToken = window.localStorage.getItem('graphcoolToken')
    if (auth0IdToken || graphcoolToken ) {
      console.warn('not a new user or already logged in')
      return (
        <Redirect to={{
          pathname: '/'
        }}/>)
    } else if (auth0IdToken  === null  ) {
      console.warn('To register using Google, first complete the sign-up tab of the Auth0 pop-up')
        return (
      <Redirect to={{
          pathname: '/'
      }}/>
        )}
    return (
      <div>
        <input value={this.state.userName} placeholder='Name' onChange={(e) => this.setState({userName:e.target.value})}/>
        {this.state.userName && <button onClick={this.createUser}>Sign up</button>}
      </div>
        )
        }

  createUser = () => {
    const variables = {
      idToken: window.localStorage.getItem('auth0IdToken'),
      userName: this.state.userName
    }

    this.props.createUser({variables}).then((response) => {
      this.props.history.replace('/')
    }).catch((e) => {
      console.error(e)
      this.props.history.replace('/')
    })
  }
}

const createUser1 = gql `
  mutation createUserMutation($idToken: String!, $userName: String!){
    createUser(authProvider: {auth0: {idToken: $idToken}}, userName: $userName)  {
      id
    }
  }
`
const createUser = gql `
mutation createUserMutation {
  userSignUpWithToken(
    authProfileId: "process.env.REACT_APP_AUTH_PROFILE_ID"
    user: {
      email: "my@email.co"
    }
  ) {
    id
  }
}
`


// const createUserMutation = gql `
//   mutation($idToken: String!, $userName: String!) {
//     createUser(authProvider: { auth0: { idToken: $idToken } },
//       userName: $userName){
//       id
//     }
//   }`
const userQuery = gql `
  query {
    user {
      id
    }
  }
`

export default graphql(createUser, {name: 'createUser'})(graphql(userQuery, {
  options: {
    fetchPolicy: 'network-only'
  }
})(withRouter(CreateUserAuth0)))
