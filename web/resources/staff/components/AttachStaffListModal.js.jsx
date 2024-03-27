/**
 * Resuable component for an actionable file list used by both /admin and /firm users 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
const async = require('async');

// import actions 
import * as staffClientActions from '../../staffClient/staffClientActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../global/components/forms'
import Modal from '../../../global/components/modals/Modal.js.jsx';
import ProgressBar from '../../../global/components/helpers/ProgressBar.js.jsx';
import ActiveStaffListItem from './ActiveStaffListItem.js.jsx';
import _ from 'lodash';
import StaffNotificationForm from '../../notification/components/StaffNotificationForm.js.jsx';

class AttachStaffListModal extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            submitting: false
            , selectedStaffIds: []
            , progress: null
            , selectingStaff: true
            , staffNotification: {
                sN_upload: true
                , sN_viewed: true
                , sN_downloaded: true
                , sN_leaveComment: true
                , sN_sendMessage: true
                , sN_signingCompleted: true
                , sN_viewSignatureRequest: true
                , sN_autoSignatureReminder: true
            }
        }
        this._bind(
            '_handleFormSubmit'
            , '_close'
            , '_handleSelectingStaff'
            , '_handleFormStaffChange'
        );
    }

    _handleFormSubmit() {
        const { 
            viewingAs
            , match
            , dispatch
            , staffMap
            , selectedClientId
        } = this.props;

        const selectedStaffIds = _.cloneDeep(this.state.selectedStaffIds);
        this.setState({ submitting: true });
        if (selectedStaffIds && selectedStaffIds.length) {

            let clientIds = [];
            const staffNotification = _.cloneDeep(this.state.staffNotification);
            const selectedStaffs = selectedStaffIds.map(item => {
                return staffMap[item];
            });

            if (viewingAs === "single-client" && match.params.clientId) {
                clientIds.push(match.params.clientId);
            } else if (selectedClientId && selectedClientId.length) {
                clientIds = selectedClientId;
            }

            const sendData = { 
                clientIds
                , selectedStaffs
                , firmId: match.params.firmId
                , staffNotification
            }

            dispatch(staffClientActions.sendCreateMultipleStaffClient(sendData)).then(json => {
                if (json && json.success && json.list && json.list.length) {
                    if (viewingAs === "single-client") {
                        async.map(json.list, (item, cb) => {
                            dispatch(staffClientActions.addSingleStaffClientToMap(item));
                            dispatch(staffClientActions.addStaffClientToList(item, ...['_client', item._client]));
                            cb();
                        }, (err) => {
                            if (!err) {
                                this._close(json.success);
                            }
                        });
                    } else {
                        clientIds.forEach(id => {
                            dispatch(staffClientActions.invalidateList('_client', id));
                        });
                        this._close(json.success);
                    }
                } else {
                    this._close(json.success);
                }

                this.setState({ selectingStaff: false })
            });
        }
    }

    _close(action) {
        const { handleNewStaffClient } = this.props;
        this.setState({
            submitting: false
            , selectedStaffIds: []
            , progress: null
        }, () => {
            if (handleNewStaffClient) {
                handleNewStaffClient(action);
            }
        });
    }

    _handleSelectingStaff() {
        const selectingStaff = _.cloneDeep(this.state.selectingStaff);
        this.setState({ selectingStaff: !selectingStaff });
    }
    
    _handleFormStaffChange(name, value) {
        console.log("name", name, "value", value)
        let newState = _.update(this.state, name, () => {
            return value;
        });
        const staffNotification = _.cloneDeep(newState.staffNotification);

        // setState before update to the backend
        this.setState({ staffNotification });
    }

    render() {
        const {
            close
            , isOpen
            , staffListItems
            , staffMap
        } = this.props;

        const {
            submitting
            , selectedStaffIds
            , selectingStaff
            , staffNotification
        } = this.state;

        return (
            <Modal
                closeAction={close}
                closeText={submitting ? null : "Close"}
                confirmAction={
                    submitting ? close 
                    : selectingStaff ? this._handleSelectingStaff
                    : this._handleFormSubmit
                }
                confirmText={
                    submitting ? "Saving..." 
                    : selectingStaff ? 'Next'
                    : "Continue assigning"
                }
                disableConfirm={submitting || !selectedStaffIds.length}
                isOpen={isOpen}
                modalHeader="Assign staff"
                cardSize="jumbo"
                showConfirm={true}
            >
                {
                    selectingStaff ?
                    <ActiveStaffListItem
                        staffListItems={staffListItems}
                        staffMap={staffMap}
                        viewingAs="single-client"
                        handleNewStaffClient={() => console.log('hello world')}
                        handleSelectStaff={(staffs) => this.setState({ selectedStaffIds: staffs })}
                    />
                    :
                    <StaffNotificationForm 
                        handleFormChange={this._handleFormStaffChange}
                        staffNotification={staffNotification}
                        allowedToUpdate={staffNotification && _.has(staffNotification, 'sN_upload')}
                        multiple={true}
                    />
                }
            </Modal>
        )
    }
}

AttachStaffListModal.propTypes = {
  // allFilesSelected: PropTypes.bool 
  dispatch: PropTypes.func.isRequired
}

AttachStaffListModal.defaultProps = {
  // allFilesSelected: false 
  staffListItems: []
}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

   /**
   * REGARDING PAGINATION: Pagination would normally be handled on the parent component WorkspaceFiles.
   * The listArgs in WorkspaceFiles.state are not accessible from that component's mapStoreToProps
   * function. We have to paginate the list here instead since it is passed to this component as a prop
   * with no need to be aware of the listArgs.
   */
    
    return {
        // paginatedList: paginatedList
        loggedInUser: store.user.loggedIn.user
        , socket: store.user.socket
    }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(AttachStaffListModal)
);
