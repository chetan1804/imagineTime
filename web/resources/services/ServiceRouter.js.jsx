import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";

import YTRoute from "../../global/components/routing/YTRoute.js.jsx";

import Services from "./views/ServiceList.js.jsx";

const ServiceRouter = (props) => {
  const { breadcrumbs } = props;
  return (
    <Switch>
      <YTRoute
        breadcrumbs={breadcrumbs}
        component={Services}
        exact
        staff={true}
        path="/firm/:firmId/services"
      />
    </Switch>
  );
};

ServiceRouter.propTypes = {};

const mapStoreToProps = (store, props) => {
  const { match } = props;
  const firmId = match.params.firmId;
  const breadcrumbs = [
    { display: "Services", path: `/firm/${firmId}/services` },
  ];

  return {
    breadcrumbs,
  };
};

export default withRouter(connect(mapStoreToProps)(ServiceRouter));
