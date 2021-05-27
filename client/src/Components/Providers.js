/* eslint-disable */
import React from 'react';
import App from './App';
import CreateUserAuth0 from './User/CreateUserAuth0';
import {store} from '../store';
import { AppProvider } from '@8base/react-sdk';
import AuthClient from '../AuthClient.js';
import { BrowserRouter as Router, Route, Swtich } from 'react-router-dom'
// import {ApolloProvider, ApolloClient} from 'react-apollo';
import {ApolloProvider} from 'react-apollo';
import {ApolloClient} from 'apollo-client'
import { onError } from 'apollo-link-error';
import {httpLink} from '../networkinterface'
import {InMemoryCache} from 'apollo-cache-inmemory'
// import Authorization from './services/authorization'

const cache = new InMemoryCache()

const client = new ApolloClient({
  link: logoutLink.concat(httpLink),
  cache: this.cache.restore(window.__APOLLO_CLIENT__),
  connectToDevTools: true
});

const logoutLink = onError(({ networkError }) => {
 if (networkError.statusCode === 401 || networkError.statusCode === 401) logout();
})

const logout = () => window.location.href = "http://getgoalzapp.com"

class Providers  extends React.PureComponent {

  onRequestSuccess = ({ operation }) => {
    const message = operation.getContext();

    // if (message) {
    //   // eslint-disable-next-line no-console
    //   console.error(message);
    // }
  };

  onRequestError = ({ graphQLErrors }) => {
    const hasGraphQLErrors = Array.isArray(graphQLErrors) && graphQLErrors.length > 0;

    if (hasGraphQLErrors) {
      graphQLErrors.forEach(error => {
        // eslint-disable-next-line no-console
        console.dir(error.message);
      });
    }
  };

render() {
    return(
    <Router>
    <ApolloProvider  client={client}>
        <AppProvider
          uri={"https://api.8base.com/ckbx087zh000207ms3ink870q"}
          authClient={AuthClient}
          onRequestSuccess={this.onRequestSuccess}
          onRequestError={this.onRequestError}
          >
          <div>
            <Route  path='/' component={App} />
            {/* <Route component={NotFound} /> */}
          </div>
    </ AppProvider>
    </ ApolloProvider>
    </Router>
  )
}
}

export {Providers}
