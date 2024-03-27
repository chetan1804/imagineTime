/**
 * View component for /files/new
 *
 * Creates a new file from a copy of the defaultItem in the file reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import moment from 'moment';
import { DateTime } from 'luxon';

// import actions
import * as requestActions from '../requestActions';
import * as activityActions from '../../activity/activityActions';
import * as requestFolderActions from '../../requestFolder/requestFolderActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { CheckboxInput, TextInput, SelectFromObject } from '../../../global/components/forms';

// import components

class RequestListForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            request: {}
            , delegatedAdminRow: [{ _id: null }] // default 1
            , submitting: false
        }
        this._bind(
            '_handleFormChange'
            , '_handleSelectClientUser'
            , '_handleAddDelegatedAdmin'
            , '_handleCreateRequestList'
            , '_handleUpdateRequestList'
            , '_handleClose'
        );
    }

    componentDidMount() {
        this.setState({ request: {
            name: this.props.selectedRequest.name
        }});
    }

    _handleFormChange(e) {
        /**
         * This let's us change arbitrarily nested objects with one pass
         */
        let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
            return e.target.value;
        });
        this.setState(newState);
    }

    _handleSelectClientUser(index, e) {
        const request = _.cloneDeep(this.state.request);
        const delegatedAdminRow = _.cloneDeep(this.state.delegatedAdminRow);
        if (!request.delegatedAdmin) {
            request["delegatedAdmin"] = [];
        }
        if (!e.target.value && delegatedAdminRow[index]) {
            request.delegatedAdmin.splice(request.delegatedAdmin.indexOf(delegatedAdminRow[index]._id), 1);
            delegatedAdminRow[index]._id = null;
        } else if (!request.delegatedAdmin.includes(e.target.value)) {
            if (delegatedAdminRow[index]._id) {
                request.delegatedAdmin.splice(request.delegatedAdmin.indexOf(delegatedAdminRow[index]._id), 1);
                request.delegatedAdmin.push(e.target.value);
                delegatedAdminRow[index]._id = e.target.value;
            } else {
                request.delegatedAdmin.push(e.target.value);
                delegatedAdminRow[index]._id = e.target.value;
            }
        }
        this.setState({ request, delegatedAdminRow });
    }
    
    _handleAddDelegatedAdmin() {
        const delegatedAdminRow = _.cloneDeep(this.state.delegatedAdminRow);
        delegatedAdminRow.push({ _id: null });
        this.setState({ delegatedAdminRow });
    }

    _handleCreateRequestList() {
        const { dispatch, match, selectedClient, listArgs } = this.props;
        const request = _.cloneDeep(this.state.request);

        this.setState({ submitting: true });

        request._firm = match.params.firmId;
        request.type = "list";

        if (selectedClient._id) {
            request._client = selectedClient._id;
        }

        dispatch(requestActions.sendCreateRequest(request)).then(json => {
            console.log("json", json)
            if (json.success) {
                dispatch(requestActions.addSingleRequestToMap(json.item));
                dispatch(requestActions.addRequestToList(json.item, ...listArgs));
                if (json.activity) {
                    dispatch(activityActions.invalidateList(...listArgs));
                }
                this._handleClose();
            } else {
                this.setState({ submitting: false });
                alert(json.error);
            }
        });
    }

    _handleUpdateRequestList() {
        const { dispatch, selectedRequest } = this.props;
        const request = _.cloneDeep(this.state.request);

        this.setState({ submitting: true });
        const updatedData = {
            ...request,
            _id: selectedRequest._id,
            _firm: selectedRequest._firm
        }

        dispatch(requestActions.sendUpdateRequest(updatedData)).then(json => {
            console.log("update", json);
            if (json.success) {
                this._handleClose();
            } else {
                this.setState({ submitting: false });
                alert(json.error);
            }
        });
    }

    _handleClose() {
        this.setState({
            request: {}
            , delegatedAdminRow: [{ _id: null }] // default 1
            , submitting: false
        }, () => {
            this.props.close();
        })
    }

    render() {
        const {
            isOpen
            , selectedClient
            , clientUserListItems = []
            , selectedRequest
        } = this.props;
        
        const {
            submitting
            , request = {}
            , delegatedAdminRow
        } = this.state;


        const modalHeaderText = selectedRequest._id ? "Update Request List" : "Create Request List";
        const modalConfirmtext = submitting ? selectedRequest._id ? "Updating..." : "Creating..." : selectedRequest._id ? "Update Request List" : "Create Request List";
        const disabledButton = _.isEqual(request, selectedRequest) || !request.name ? true : false;
        const workspaceItems = selectedClient._id ? [selectedClient] : [];

        return (
            <Modal
                cardSize="large"
                isOpen={isOpen}
                closeAction={this._handleClose}
                closeText="Cancel"
                confirmAction={selectedRequest._id ? this._handleUpdateRequestList : this._handleCreateRequestList}
                confirmText={modalConfirmtext}
                disableConfirm={submitting || disabledButton}
                modalHeader={modalHeaderText}
                showButtons={true}
            >
                <div>
                    <div className="-share-link-configuration">
                        <div className="-header">
                            <i className="fas fa-eye"/> Link settings 
                        </div>
                        <div className="-body">
                            <div className="-setting yt-row space-between">
                                <div className="-instructions yt-col">
                                    <p><strong>Workspace{selectedClient._id ? <sup className="-required">*</sup> : ""}</strong></p>
                                    <p>Select workspace to request from</p>
                                </div>
                                <div className="-inputs yt-col">
                                    <SelectFromObject
                                        change={() => console.log("temporary fixed")}
                                        items={workspaceItems}
                                        disabled={true}
                                        display="name"
                                        displayStartCase={false}
                                        filterable={true}
                                        isClearable={false}
                                        name="clientId"
                                        placeholder="Firm request lists"
                                        selected={selectedClient._id}
                                        value="_id"
                                    />
                                </div>
                            </div>
                            <hr/>
                            <div className="-setting yt-row space-between">
                                <div className="-instructions yt-col">
                                    <p><strong>Name<sup className="-required">*</sup></strong></p>
                                    <p>Name your request list</p>
                                </div>
                                <div className="-inputs yt-col">
                                    <TextInput
                                        change={this._handleFormChange}
                                        name="request.name"
                                        placeholder={"Enter request list name"}
                                        value={request.name}
                                    />
                                </div>
                            </div>
                            { selectedClient._id && <hr /> || null }
                            {
                                selectedClient._id && 
                                <div className="-setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                        <p><strong>Delegated Admin</strong></p>
                                        <p>A delegated admin is a client user who can view the entire request list and delegate tasks to other assignees</p>
                                    </div>
                                    <div className="yt-col">
                                        {
                                            delegatedAdminRow.map((row, i) => 
                                                <div className="-inputs yt-row" key={i}>
                                                    <SelectFromObject
                                                        change={this._handleSelectClientUser.bind(this, i)}
                                                        items={clientUserListItems}
                                                        disabled={false}
                                                        display="displayName"
                                                        displayStartCase={true}
                                                        filterable={true}
                                                        isClearable={true}
                                                        name="clientUserId"
                                                        placeholder="Select delegated admin"
                                                        selected={row._id}
                                                        value="_id"
                                                        signersId={selectedRequest ? selectedRequest.delegatedAdmin : request.delegatedAdmin}
                                                    />
                                                </div>
                                            )
                                        }
                                        <div className="-inputs yt-row" style={{ display: "inline-block", textAlign: "right" }}>
                                            <button className="yt-btn xx-small u-pullRight" onClick={this._handleAddDelegatedAdmin} disabled={!clientUserListItems || !request.delegatedAdmin ? true : clientUserListItems.length <= delegatedAdminRow.length}>
                                                <i className="fal fa-plus" aria-hidden="true"></i>Add Delegated Admin
                                            </button>
                                        </div>
                                    </div>
                                </div> || null
                            }
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }
}

RequestListForm.propTypes = {}

RequestListForm.defaultProps = {
    selectedUsers: []
    , selectedClient: {}
}

const mapStoreToProps = (store, props) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    const { selectedUsers } = props;
    let clientUserListItems = [];

    if (selectedUsers) {
        clientUserListItems = selectedUsers.map(user => {
            let newUser = _.cloneDeep(user);
            if (!user.firstname && !user.lastname) {
                newUser.displayName = user.username;
            } else {
                newUser.displayName = `${user.firstname} ${user.lastname}`;
            }
            return newUser;
        });
    }

    return {
        loggedInUser: store.user.loggedIn.user
        , clientUserListItems
    }
}

export default withRouter(
    connect(
        mapStoreToProps
    )(RequestListForm)
);
