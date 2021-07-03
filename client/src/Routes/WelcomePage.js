/* eslint-disable */
import React from 'react'
import {compose, withApollo, graphql} from 'react-apollo'
import {withRouter, Redirect} from 'react-router-dom'
import { withAuth } from '@8base/react-sdk';
import AuthButton from '../Components/Auth/AuthButton'
import '../style/WelcomePage.css'
import { Client } from '@8base/api-client';
import gql from 'graphql-tag';
import jwt_decode from "jwt-decode";

const client = new Client("https://api.8base.com/ckbx087zh000207ms3ink870q");
let response
const userQuery =  gql`
  query {
    user {
      id
      email
      lastName
      firstName
    }
  }
`;

class WelcomePage extends React.Component  {

  async checkAuthentication() {
    console.log("AuthContainer rendered")
    const { auth, client } = this.props;

    const token = window.localStorage.getItem("auth")
    // console.log(token)
    if (token) {
      const decoded = jwt_decode(token)
      const current_time = Date.now().valueOf() / 1000;
      if ( decoded.exp < current_time) {
          await client.clearStore();
          auth.authClient.logout();
      }
    } else { await auth.authClient.authorize() }

    /**
     * set auth headers for communicating with the 8base API.
     */
    //client.setIdToken(idToken);
    /**
     * check if user exists in 8base.
     */
    // try {
    //
    //    response = await this.props.client.query({query: userQuery});
    //    console.log("WelcomePage response", response.data.user.id)
    //
    // } catch(response) {
    //   console.log(response)
    //   /**
    //    * If user doesn't exist, an error will be
    //    * thrown
    //    */
    // }
  }

  async componentDidMount() {
    await this.checkAuthentication();
  }

  render () {
    if (this.props.data.loading) {
      return  (
        <h2> Loading... </h2>
      )
    }
    else if (this.props.data.user && this.props.data.user.id) {
      return <Redirect to="/globalfeed" />
    } else {

    return (
    <div className="main">
    <h5> Welcome to GoalZapp! </h5>

    <p>GoalZapp is an Ethereum enabaled web application allowing you to post personal goals and receive helpful suggestions from others
    toward acheiving those goals.
     </p>
    <ul>
    <li>-  Suggesters are rewarded with the ZAPP token for their contribution if you deem their suggested step valuable
    enough to be included among your list of steps toward acheiving your goal
    </li>
  <br/>
    <li>-  Kinda like a crowd sourced, token incentivized, receipe for success for
    acheiving your dreams...
     </li>
     </ul>

     <p className="try"> Give it a try! </p>
  <AuthButton className="auth-button" />
  </div>
  )
  }
}
}

WelcomePage = compose(withAuth, withRouter, withApollo, graphql(userQuery, {
    options: { fetchPolicy: 'network-only' } }))(WelcomePage)

export default withAuth(WelcomePage)
