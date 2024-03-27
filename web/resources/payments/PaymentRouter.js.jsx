// import primary libraries
import React from "react";
import { Switch } from "react-router-dom";

// import global components
import Binder from "../../global/components/Binder.js.jsx";
import YTRoute from "../../global/components/routing/YTRoute.js.jsx";

// import quickTask views
import PaymentLayout from "./views/PaymentLayout.js.jsx";

class EmailUrlRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/payments/activate/:token" component={PaymentLayout} />
      </Switch>
    );
  }
}

export default EmailUrlRouter;
