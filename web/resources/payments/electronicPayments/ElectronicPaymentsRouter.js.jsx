import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";

import YTRoute from "../../../global/components/routing/YTRoute.js.jsx";

import ElectronicPayment from "./views/ElectronicPayment.js.jsx";

const ElectronicPaymentsRouter = (props) => {
    const { breadcrumbs } = props;
    return (
        <Switch>
            <YTRoute
                breadcrumbs={breadcrumbs}
                component={ElectronicPayment}
                exact
                staff={true}
                path="/firm/:firmId/settings/electronic-payments"
            />
        </Switch>
    );
};

ElectronicPaymentsRouter.propTypes = {};

const mapStoreToProps = (store, props) => {
    const { match } = props;
    const firmId = match.params.firmId;
    const breadcrumbs = [
        { display: "Business Info", path: `/firm/${firmId}/settings/electronic-payments` },
    ];

    return {
        breadcrumbs,
    };
};

export default withRouter(connect(mapStoreToProps)(ElectronicPaymentsRouter));
