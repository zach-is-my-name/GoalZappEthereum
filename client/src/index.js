/* eslint-disable */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './Components/container/App';
import CreateUser from './Components/User/CreateUser';
import {store} from './store';
import { BrowserRouter as Router, Route, Swtich } from 'react-router-dom'
import {ApolloProvider, ApolloClient} from 'react-apollo';
// import Authorization from './services/authorization'
import './index.css';
import {networkInterface} from './networkinterface'

// import GlobalFeed from './Routes/GlobalFeed'
import UserFeedPage from './Routes/UserFeedPage'
import NotFound from './Routes/NotFound'

export const client = new ApolloClient({
  networkInterface: networkInterface,
  connectToDevTools: true
});

// const auth = new Authroisation()

ReactDOM.render(
  <ApolloProvider store={store} client={client}>
    <Router>
      <div>
        <Route  path='/' component={App} />
        {/* <Route path='/userfeed/:userid' component={UserFeedPage} /> */}
        <Route path='/signup' component={CreateUser} />
        {/* <Route exact path='/userfeed' component={UserFeedPage} /> */}
        {/* <Route  path='/userfeed/:userid' component={UserFeedPage} /> */}
        {/* <Route component={NotFound} /> */}
      </div>
    </Router>

  </ApolloProvider>,
    document.getElementById('root')
);
