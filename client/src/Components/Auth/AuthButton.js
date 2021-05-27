/* eslint-disable */
import React from 'react';
import { withAuth } from '@8base/react-sdk';
import { Query, graphql, compose, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import '../../style/AuthButton.css'
const CURRENT_USER_QUERY = gql`
  query {
    user {
      id
      email
      lastName
      firstName
    }
  }
`;

class AuthButton extends React.Component {

  renderContent = ({ loading }) => {
    const { auth, client } = this.props;

    if (loading) {
      return null;
    }

    const Logout = () => (
      <button
        onClick={async () => {
          await client.clearStore();
          auth.authClient.logout();
        }}
      >
        Sign Out
      </button>
    );

    const Login = () => <button onClick={() => auth.authClient.authorize()}>Sign In</button>;

    return <>{auth.isAuthorized ? <Logout /> : <Login />}</>;
  };

  render() {
    return <Query query={CURRENT_USER_QUERY}>{this.renderContent}</Query>;
  }
}

AuthButton = compose(
  withApollo,
  withAuth
)(AuthButton);

export default  AuthButton ;
