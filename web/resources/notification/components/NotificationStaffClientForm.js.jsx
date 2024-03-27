/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Switch, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { permissions } from '../../../global/utils';

// import actions
import * as staffClientActions from '../../staffClient/staffClientActions';
import * as clientActions from '../../client/clientActions';
import * as staffActions from '../../staff/staffActions';
import * as userActions from '../../user/userActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import ClientSettingsLayout from '../../client/practice/components/ClientSettingsLayout.js.jsx';
import WorkspaceLayout from '../../client/practice/components/WorkspaceLayout.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import brandingName from '../../../global/enum/brandingName.js.jsx';

// import resource components
import ClientNotificationForm from './ClientNotificationForm.js.jsx';
import StaffNotificationForm from './StaffNotificationForm.js.jsx';

class NotificationStaffClientForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            staffClient: null
            , selectClient: null
            , isLoading: null
            , clientNotification: null
            , staffNotification: null
        }
        this._bind(
            "_handleUpdateStaffClient"
            , "_handleUpdateClient"
            , "_closeDropdowns"
            , "_handleFormClientChange"
            , "_handleFormStaffChange"
        )
    }

    _closeDropdowns() { 
        // do nothing
    }    

    componentDidMount() {
        const { dispatch, loggedInUser, match, staffClient } = this.props;


        // These two fetches should live on every top-level practice view.
        dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
        dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));        
        if (!staffClient) {
            dispatch(staffClientActions.fetchListIfNeeded("_client", match.params.clientId, "_user", loggedInUser._id)).then(json => {
                if (json.success && json.list && json.list.length) {
                    const staffNotification = {
                        sN_upload: json.list[0].sN_upload
                        , sN_viewed: json.list[0].sN_viewed
                        , sN_downloaded: json.list[0].sN_downloaded
                        , sN_leaveComment: json.list[0].sN_leaveComment
                        , sN_sendMessage: json.list[0].sN_sendMessage
                        , sN_viewSignatureRequest: json.list[0].sN_viewSignatureRequest
                        , sN_signingCompleted: json.list[0].sN_signingCompleted
                        , sN_autoSignatureReminder: json.list[0].sN_autoSignatureReminder
                    }
                    this.setState({ staffNotification, staffClient: json.list[0] });
                } else {
                    this.setState({ staffNotification: {}, staffClient: {} });
                }
            });    
        } else {
            const staffNotification = {
                sN_upload: staffClient.sN_upload
                , sN_viewed: staffClient.sN_viewed
                , sN_downloaded: staffClient.sN_downloaded
                , sN_leaveComment: staffClient.sN_leaveComment
                , sN_sendMessage: staffClient.sN_sendMessage
                , sN_viewSignatureRequest: staffClient.sN_viewSignatureRequest
                , sN_signingCompleted: staffClient.sN_signingCompleted
                , sN_autoSignatureReminder: staffClient.sN_autoSignatureReminder
            }
            this.setState({ staffNotification, staffClient });
        }
        dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(json => {
            if (json.success && json.item) {
                const clientNotification = {
                    sN_upload: json.item.sN_upload
                    , sN_viewed: json.item.sN_viewed
                    , sN_downloaded: json.item.sN_downloaded
                    , sN_leaveComment: json.item.sN_leaveComment
                    , sN_sendMessage: json.item.sN_sendMessage
                    , sN_autoSignatureReminder: json.item.sN_autoSignatureReminder
                }
                this.setState({ selectClient: json.item, clientNotification });
            }
        });
        dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches firm's staff members 
        dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId)); 
        dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    }

    _handleUpdateClient(type) {
        const { dispatch } = this.props;
        let selectClient = _.cloneDeep(this.state.selectClient);
        
        if (type && selectClient) {
            // ui notification loading
            this.setState({ isLoading: "client-" + type });

            selectClient[type] = !selectClient[type];
            dispatch(clientActions.sendUpdateClient(selectClient)).then(json => {
                this.setState({  selectClient, isLoading: null });
            })
        }
    }

    _handleUpdateStaffClient(type) {
        const { dispatch } = this.props;
        let staffClient = _.cloneDeep(this.state.staffClient);
        
        if (type && staffClient) {
            // ui notification loading
            this.setState({ isLoading: "staff-" + type });

            staffClient[type] = !staffClient[type];
            dispatch(staffClientActions.sendUpdateStaffClient(staffClient)).then(json => {
                this.setState({  staffClient, isLoading: null });
            })
        } 
    }

    _handleFormClientChange(name, value) {
        let newState = _.update(this.state, name, () => {
            return value;
        });
        const clientNotification = _.cloneDeep(newState.clientNotification);
        const selectClient = _.cloneDeep(this.state.selectClient);

        // setState before update to the backend
        this.setState({ clientNotification }, () => {
            if (selectClient) {
                const { dispatch } = this.props;
                selectClient.sN_upload = clientNotification.sN_upload
                selectClient.sN_viewed = clientNotification.sN_viewed
                selectClient.sN_downloaded = clientNotification.sN_downloaded
                selectClient.sN_leaveComment = clientNotification.sN_leaveComment
                selectClient.sN_sendMessage = clientNotification.sN_sendMessage
                selectClient.sN_autoSignatureReminder = clientNotification.sN_autoSignatureReminder
                dispatch(clientActions.sendUpdateClient(selectClient)).then(json => {
                    this.setState({ selectClient });
                })
            }
        });
    }

    _handleFormStaffChange(name, value) {
        let newState = _.update(this.state, name, () => {
            return value;
        });
        const staffNotification = _.cloneDeep(newState.staffNotification);
        const staffClient = _.cloneDeep(this.state.staffClient);

        // setState before update to the backend
        this.setState({ staffNotification }, () => {
            if (staffClient) {
                const { dispatch } = this.props;
                staffClient.sN_upload = staffNotification.sN_upload;
                staffClient.sN_viewed = staffNotification.sN_viewed;
                staffClient.sN_downloaded = staffNotification.sN_downloaded;
                staffClient.sN_leaveComment = staffNotification.sN_leaveComment;
                staffClient.sN_sendMessage = staffNotification.sN_sendMessage;
                staffClient.sN_viewSignatureRequest = staffNotification.sN_viewSignatureRequest;
                staffClient.sN_signingCompleted = staffNotification.sN_signingCompleted;
                staffClient.sN_autoSignatureReminder = staffNotification.sN_autoSignatureReminder;
                dispatch(staffClientActions.sendUpdateStaffClient(staffClient)).then(json => {
                    this.setState({ staffClient });
                })
            }
        });
    }

    render() {
        const { 
            staffClient
            , selectClient
            , isLoading
            , clientNotification
            , staffNotification
        } = this.state;
        const {
            staffClientStore
            , loggedInUser
            , match
            , staffStore
            , clientStore
        } = this.props;

        const isEmpty = (
            staffClientStore.selected.didInvalidate
            || clientStore.selected.didInvalidate
            || staffStore.selected.didInvalidate
            || !selectClient
            || !clientNotification
            || !staffNotification
        );
        const isFetching = (
            staffClientStore.selected.isFetching
            || clientStore.selected.isFetching
            || staffStore.selected.isFetching
            || !selectClient
            || !clientNotification
            || !staffNotification
        );

        // check if staff is owner
        const isStaffOwner = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);
        // const NotificationLayout = match.path === "/firm/:firmId/workspaces/:clientId/notifications" ? WorkspaceLayout : ClientSettingsLayout;

        console.log('staffNotification', staffNotification)

        return (
            isEmpty ?
                (isFetching ? 
                    <div className="-loading-hero hero">
                        <div className="u-centerText">
                            <div className="loading"></div>
                        </div>
                    </div> 
                    : 
                    <div className="hero three-quarter ">
                        <div className="yt-container slim">
                            <h2>Hmm.  Something's wrong here. </h2>
                            <p>Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>.</p>
                        </div>
                    </div>
                )
                :
                <div style={{ opacity: isFetching ? 0.5 : 1 }}>
                    <CloseWrapper
                        isOpen={!_.isEmpty(isLoading)}
                        closeAction={this._closeDropdowns}
                    />                    
                    <div className="-mob-layout-ytcol100 yt-row">
                        <div className="yt-col _70">
                            <ClientNotificationForm
                                handleFormChange={this._handleFormClientChange}
                                clientNotification={clientNotification}
                                allowedToUpdate={isStaffOwner}
                            />
                            <StaffNotificationForm
                                handleFormChange={this._handleFormStaffChange}
                                staffNotification={staffNotification}
                                allowedToUpdate={staffNotification && _.has(staffNotification, 'sN_upload')}
                                noTopMargin={true}
                            />
                        </div>
                    </div>
                </div>
        )
    }
}

NotificationStaffClientForm.propTypes = {
    dispatch: PropTypes.func.isRequired
}

NotificationStaffClientForm.defaultProps = {

}


const mapStoreToProps = (store, props) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
    */

    const loggedInUser = store.user ? store.user.loggedIn ? store.user.loggedIn.user : null : null;
    let staffClient = null;
    if (loggedInUser) {

        if (store.staffClient && store.staffClient.byId) {

            const listsId = Object.keys(store.staffClient.byId);
            const staffClientId = listsId.filter(id => {
                return store.staffClient.byId[id]._client == props.match.params.clientId
                        && store.staffClient.byId[id]._user == loggedInUser._id 
                        ? id : null
            });

            staffClient = isNaN(staffClientId) ? null : store.staffClient.byId[staffClientId];
        }
    }
   
    return {
        loggedInUser
        , staffStore: store.staff
        , clientStore: store.client 
        , staffClientStore: store.staffClient 
        , staffClient
    }
}

export default withRouter(
        connect(
        mapStoreToProps
    )(NotificationStaffClientForm)
);
