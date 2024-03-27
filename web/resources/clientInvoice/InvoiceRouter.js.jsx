import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";

import YTRoute from "../../global/components/routing/YTRoute.js.jsx";

import InvoiceList from "./views/InvoiceList.js.jsx";

const InvoiceRouter = (props) => {
  const { breadcrumbs } = props;
  return (
    <Switch>
      <YTRoute
        breadcrumbs={breadcrumbs}
        component={InvoiceList}
        exact
        staff={true}
        path="/firm/:firmId/invoices"
      />
    </Switch>
  );
};

InvoiceRouter.propTypes = {};

const mapStoreToProps = (store, props) => {
  const { match } = props;
  const firmId = match.params.firmId;
  const breadcrumbs = [
    { display: "Invoices", path: `/firm/${firmId}/invoices` },
  ];

  return {
    breadcrumbs,
  };
};

export default withRouter(connect(mapStoreToProps)(InvoiceRouter));
