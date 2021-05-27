import React from 'react';
import { withAuth } from '@8base/app-provider';

class AuthContainer extends React.Component {
  async componentDidMount() {
    console.log("AuthContainer rendered")
    const { auth } = this.props;

     await auth.authClient.authorize() 
  }

  render() {
    return <h2>Loading...</h2>;
  }
}

AuthContainer = withAuth(AuthContainer);

export { AuthContainer };
