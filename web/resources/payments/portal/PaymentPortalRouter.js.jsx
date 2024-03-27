import React from "react";
import { Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";

import YTRoute from "../../../global/components/routing/YTRoute.js.jsx";

import PaymentPortalList from "./views/PaymentPortalList.js.jsx";

const PaymentPortalRouter = (props) => {
  const { breadcrumbs } = props;
  return (
    <Switch>
      <YTRoute
        breadcrumbs={breadcrumbs}
        component={PaymentPortalList}
        exact
        staff={true}
        path="/portal/:clientId/payments"
      />
    </Switch>
  );
};

PaymentPortalRouter.propTypes = {};

const mapStoreToProps = (store, props) => {
  const { match } = props;
  const clientId = match.params.clientId;
  const breadcrumbs = [
    { display: "Payments", path: `/portal/${clientId}/payments` },
  ];

  return {
    breadcrumbs,
  };
};

export default withRouter(connect(mapStoreToProps)(PaymentPortalRouter));
