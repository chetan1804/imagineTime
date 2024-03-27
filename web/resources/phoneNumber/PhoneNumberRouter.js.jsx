/**
 * Set up routing for all PhoneNumber views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import phoneNumber views
import CreatePhoneNumber from './views/CreatePhoneNumber.js.jsx';
import PhoneNumberList from './views/PhoneNumberList.js.jsx';
import SinglePhoneNumber from './views/SinglePhoneNumber.js.jsx';
import UpdatePhoneNumber from './views/UpdatePhoneNumber.js.jsx';

class PhoneNumberRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/phone-numbers" component={PhoneNumberList} />
        <YTRoute exact login={true} path="/phone-numbers/new" component={CreatePhoneNumber} />
        <YTRoute exact path="/phone-numbers/:phoneNumberId" component={SinglePhoneNumber}/>
        <YTRoute exact login={true} path="/phone-numbers/:phoneNumberId/update" component={UpdatePhoneNumber}/>
      </Switch>
    )
  }
}

export default PhoneNumberRouter;
