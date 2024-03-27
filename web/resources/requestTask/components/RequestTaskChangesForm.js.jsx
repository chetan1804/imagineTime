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
import * as taskActivityActions from '../../taskActivity/taskActivityActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { TextAreaInput } from '../../../global/components/forms';

// import components

class RequestTaskChangesForm extends Binder {
    constructor(props) {    
        super(props);
        this.state = {
            note: ""
            , submitting: false
        }
        this._bind(
            '_handleFormChange'
            , '_handleSubmit'
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

    _handleSubmit() {
        const { dispatch, selectedRequestTask } = this.props;
        this.setState({ submitting: true });
        const taskActivity = {
            text: "request changes"
            , note: this.state.note
            , _requestTask: selectedRequestTask._id
            , _request: selectedRequestTask._request
        }
        dispatch(taskActivityActions.sendCreateRequestChanges(taskActivity)).then(json => {
            if (json.success && json.item) {
                dispatch(taskActivityActions.addSingleTaskActivityToMap(json.item));
                dispatch(taskActivityActions.addTaskActivityToList(json.item, ...['_requestTask', selectedRequestTask._id]));
                this.setState({ submitting: false, content: "" }, () => {
                    this.props.close();
                });
            }
        });
    }

    render() {
        const {
            isOpen
            , close
            , selectedRequestTask
        } = this.props;
        
        const {
            note
            , submitting
        } = this.state;

        const isNotEmpty = (selectedRequestTask && selectedRequestTask._id);

        return (
            <Modal
                cardSize="standard"
                isOpen={isOpen}
                closeAction={close}
                closeText="Cancel"
                confirmAction={this._handleSubmit}
                confirmText="Request Changes"
                disableConfirm={submitting}
                modalHeader="Request Changes"
                showButtons={true}
            >
                {!isNotEmpty ? 
                    <div className="-loading-hero hero">
                        <div className="u-centerText">
                            <div className="loading"></div>
                        </div>
                    </div>
                    : 
                    <div>
                        <div className="-share-link-configuration">
                            <div className="-body">
                                <div className="-setting yt-row space-between">
                                    <p>If you like, leave a brief comment here explaining what changes you would like to see made. This comment will appear in the activity section for the task.</p>
                                </div>
                                <div className="-setting yt-row space-between -textarea-field">
                                    <TextAreaInput
                                        change={this._handleFormChange}
                                        name="note"
                                        placeholder="Comment..."
                                        value={note}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </Modal>
        )
    }
}

RequestTaskChangesForm.propTypes = {}

RequestTaskChangesForm.defaultProps = {}

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
    )(RequestTaskChangesForm)
);
