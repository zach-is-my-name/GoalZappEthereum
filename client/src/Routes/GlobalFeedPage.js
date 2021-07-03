/* eslint-disable */
import React, {Component} from 'react';
import {graphql, compose} from 'react-apollo'
import gql from 'graphql-tag';
import { withAuth } from '@8base/react-sdk';
import jwt_decode from "jwt-decode";

import GlobalFeed from '../Components/Feed/GlobalFeed'

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


const AllGoalDocs = gql`
 query suggesterQuery {
  goalDocsList(orderBy: createdAt_DESC) {
    items {
      goal
      id
      owner {
        userName
        id
      }
    }
  }
}
`
class GlobalFeedPage extends Component {

async componentDidMount() {
    //console.log("AuthContainer rendered")
    const { auth, client } = this.props;

    const token = window.localStorage.getItem("auth")
    //console.log(token)
    if (token) {
      const decoded = jwt_decode(token)
      const current_time = Date.now().valueOf() / 1000;
      if ( decoded.exp < current_time) {
        console.log("token expired")
        await client.clearStore();
        auth.authClient.logout();
      } 
    } else { await auth.authClient.authorize() }
  }

  render() {
if (this.props.allGoalDocs && !this.props.allGoalDocs.loading) {
   /*
   if (!this.props.allGoalDocs.goalDocsList.items.length) {
     return  (
      <div>

      </div>
     )

   }
*/
    return(
      <div>
        <h4>Global Feed</h4>
        <GlobalFeed
          entries={this.props.allGoalDocs.goalDocsList.items || [] }
          loggedInUserId ={this.props.loggedInUserId}
          loggedInUserName={this.props.loggedInUserName}
        />
        {this.props.allGoalDocs.loading ? <p>loading</p>: null}
      </div>
        )
  }
  return null
}
}


const withData = compose(
graphql(AllGoalDocs, {
  name: 'allGoalDocs',
  options: () => (
    {
      fetchPolicy: 'network-only',
    })
})
)(GlobalFeedPage)

export default withAuth(withData)
