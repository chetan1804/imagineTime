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
import * as requestFolderActions from '../requestFolderActions';
import * as activityActions from '../../activity/activityActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { TextInput } from '../../../global/components/forms';

// import components

class RequestListForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            requestFolder: {}
            , submitting: false
        }
        this._bind(
            '_handleFormChange'
            , '_handleClose'
            , '_handleFormSubmit'
        );
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


    _handleClose() {
        console.log("testme");
        this.setState({
            requestFolder: {}
            , submitting: false
        }, () => {
            console.log("testme");
            this.props.handleClose();
        })
    }

    _handleFormSubmit() {
        const { match, dispatch, listArgs } = this.props;
        const requestFolder = _.cloneDeep(this.state.requestFolder);
        this.setState({ submitting: true });
        requestFolder._firm = match.params.firmId;
        requestFolder._client = match.params.clientId;
        dispatch(requestFolderActions.sendCreateRequestFolder(requestFolder)).then(json => {
            console.log("res", json)
            if (json.success) {
                dispatch(requestFolderActions.addRequestFolderToList(json.item, ...listArgs));
                this._handleClose();
            } else {
                this.setState({ submitting: false }, () => {
                    alert(json.error);
                });
            }
        });
    }

    render() {
        const {
            isOpen
        } = this.props;
        
        const {
            submitting
            , requestFolder
        } = this.state;

        const disabledButton = !requestFolder || !requestFolder.name || !requestFolder.name.trim();

        return (
            <Modal
                cardSize="large"
                isOpen={isOpen}
                closeAction={this._handleClose}
                closeText="Cancel"
                confirmAction={this._handleFormSubmit}
                confirmText="Create New Folder"
                disableConfirm={submitting || disabledButton}
                modalHeader="Create New Folder"
                showButtons={true}
            >
                <div>
                    <div className="-share-link-configuration">
                        <div className="-body">
                            <div className="-setting yt-row space-between">
                                <TextInput
                                    change={this._handleFormChange}
                                    label="Folder Name"
                                    name="requestFolder.name"
                                    placeholder="Folder Name"
                                    value={requestFolder.name}
                                    required={false}
                                    autoFocus={true}
                                    onSubmit={this._handleFormSubmit}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }
}

RequestListForm.propTypes = {}

RequestListForm.defaultProps = {}

const mapStoreToProps = (store, props) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    const { selectedUsers = [] } = props;

    const clientUserListItems = selectedUsers.map(user => {
        let newUser = _.cloneDeep(user);
        if (!user.firstname && !user.lastname) {
            newUser.displayName = user.username;
        } else {
            newUser.displayName = `${user.firstname} ${user.lastname}`;
        }
        return newUser;
    });

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
