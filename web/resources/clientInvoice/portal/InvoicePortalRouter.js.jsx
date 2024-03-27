import React from "react";
import { Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";

import YTRoute from "../../../global/components/routing/YTRoute.js.jsx";

import InvoicePortalList from "./views/InvoicePortalList.js.jsx";

const InvoicePortalRouter = (props) => {
  const { breadcrumbs } = props;
  return (
    <Switch>
      <YTRoute
        breadcrumbs={breadcrumbs}
        component={InvoicePortalList}
        exact
        staff={true}
        path="/portal/:clientId/invoices"
      />
    </Switch>
  );
};

InvoicePortalRouter.propTypes = {};

const mapStoreToProps = (store, props) => {
  const { match } = props;
  const clientId = match.params.clientId;
  const breadcrumbs = [
    { display: "Invoices", path: `/portal/${clientId}/invoices` },
  ];

  return {
    breadcrumbs,
  };
};

export default withRouter(connect(mapStoreToProps)(InvoicePortalRouter));
