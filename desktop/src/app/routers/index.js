import React from 'react';
import { Redirect, Route, Switch} from 'react-router-dom';

// Pages
import Welcome from './../pages/welcome';
import SignIn from './../pages/sign-in';
import Accounts from './../pages/accounts';
import Upload from './../pages/upload';
import Share from './../pages/share';
import Signature from './../pages/signature';
import Link from './../pages/link';
import Settings from './../pages/settings';

const Routes = (props) => {
  console.log('props : ', props);
  const { isSignedIn } = props;

  return (
    <Switch>
      {
        isSignedIn ? 
          <Switch>
            <Route exact path="/accounts" component={Accounts} />
            <Route exact path="/upload" component={Upload} />     
            <Route exact path="/share" component={Share} />     
            <Route exact path="/signature" component={Signature} />     
            <Route exact path="/link" component={Link} />     
            <Route exact path="/settings" component={Settings} />     
            <Route path="*" render={() => <Redirect to={{pathname: '/upload'}} />} />
          </Switch>
        :
          <Switch>
            <Route exact path="/" component={Welcome} /> 
            <Route exact path="/sign-in" component={SignIn} />
            <Route path="*" render={() => <Redirect to={{pathname: '/sign-in'}} />} />
          </Switch>
      }
      {/* <Route component={NotFound} /> */}
    </Switch>
  )
};

export default Routes;