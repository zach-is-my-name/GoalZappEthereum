import React from 'react';
import { withAuth } from '@8base/app-provider';
import jwt_decode from "jwt-decode";

class AuthContainer extends React.Component {
  async componentDidMount() {
    console.log("AuthContainer rendered")
    const { auth } = this.props;

    const token = window.localStorage.getItem("auth")
    console.log(token)
    if (token) {
      const decoded = jwt_decode(token)
      const current_time = Date.now().valueOf() / 1000;
      if ( decoded.exp < current_time) {
        window.location.href = "http://getgoalzapp.com"
      }
    } else {
     await auth.authClient.authorize()
    }
  }
  render() {
    return <h2>Loading...</h2>;
  }
}

AuthContainer = withAuth(AuthContainer);

export { AuthContainer };
