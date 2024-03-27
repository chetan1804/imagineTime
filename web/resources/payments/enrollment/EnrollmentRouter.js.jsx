import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";

import YTRoute from "../../../global/components/routing/YTRoute.js.jsx";
import Enrollment from "./views/Enrollment.js.jsx";

const EnrollmentRouter = (props) => {
  const { breadcrumbs } = props;
  return (
    <Switch>
      <YTRoute
        breadcrumbs={breadcrumbs}
        component={Enrollment}
        exact
        staff={true}
        path="/firm/:firmId/enrollment"
      />
    </Switch>
  );
};

EnrollmentRouter.propTypes = {};

const mapStoreToProps = (store, props) => {
  const { match } = props;
  const firmId = match.params.firmId;
  const breadcrumbs = [
    { display: "Enrollment", path: `/firm/${firmId}/enrollment` },
  ];

  return {
    breadcrumbs,
  };
};

export default withRouter(connect(mapStoreToProps)(EnrollmentRouter));
