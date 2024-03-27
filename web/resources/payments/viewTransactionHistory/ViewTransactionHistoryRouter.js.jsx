import React from "react";
import { Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";

import YTRoute from "../../../global/components/routing/YTRoute.js.jsx";

import ViewTransactionHistory from "./views/ViewTransactionHistory.js.jsx";

const ViewTransactionHistoryRouter = (props) => {
    const { breadcrumbs } = props;
    return (
        <Switch>
            <YTRoute
                breadcrumbs={breadcrumbs}
                component={ViewTransactionHistory}
                exact
                staff={true}
                path="/firm/:firmId/card-transactions"
            />
        </Switch>
    );
};

ViewTransactionHistoryRouter.propTypes = {};

const mapStoreToProps = (store, props) => {
    const { match } = props;
    const firmId = match.params.firmId;
    const breadcrumbs = [
        { display: "View Transactions", path: `/firm/${firmId}/card-transactions` },
    ];

    return {
        breadcrumbs,
    };
};

export default withRouter(connect(mapStoreToProps)(ViewTransactionHistoryRouter));
