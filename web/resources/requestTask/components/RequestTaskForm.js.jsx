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
import * as requestTaskActions from '../requestTaskActions';
import * as activityActions from '../../activity/activityActions';
import * as requestActions from '../../request/requestActions';
import * as requestFolderActions from '../../requestFolder/requestFolderActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { CheckboxInput, TextInput, SelectFromObject } from '../../../global/components/forms';
import SingleDatePickerInput from '../../../global/components/forms/dates/SingleDatePickerInput.js.jsx';
import FileLocation from '../../file/components/FileLocation.js.jsx';

// import components

class RequestTaskForm extends Binder {
    constructor(props) {    
        super(props);
        this.state = {
            request: {}
            , requestTask: {
                dueDate: DateTime.local().toMillis() 
            }
            , assigneeRow: [{ _id: null }] // default 1
            , submitting: false
            , field: {
                category: false
                , dueDate: false
                , description: false
                , assignee: false
                , _folder: false
            }
            , selectedFolder: {
                _client: props.match.params.clientId
            }
        }
        this._bind(
            '_handleFormChange'
            , '_handleSelectClientUser'
            , '_handleAddDelegatedAdmin'
            , '_handleCreateRequestTask'
            , '_handleClose'
            , '_handleUpdateRequestTask'
            , '_handleBulkUpdateRequesTask'
            , '_handleCheckedField'
            , '_handleLocationChange'
        );
    }

    componentDidMount() {
        console.log("RequestTaskForm")
        // const { selectedClient = {} } = this.props;
        
        // const request = _.cloneDeep(this.state.request);
        // request["_client"] = selectedClient._id;
    }

    componentWillReceiveProps(prevProps) {
        const { selectedRequestTask = {} } = prevProps;
        const { requestTask = {} } = this.state;
        if (selectedRequestTask._id && selectedRequestTask._id != requestTask._id) {
            const assigneeRow = [];
            selectedRequestTask.assignee.map(user => {
                assigneeRow.push({ _id: user._id });
            });
            this.setState({ requestTask: selectedRequestTask, assigneeRow });
        }
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
        const { userMap } = this.props;
        const requestTask = _.cloneDeep(this.state.requestTask);
        const assigneeRow = _.cloneDeep(this.state.assigneeRow);

        if (!requestTask.assignee) {
            requestTask["assignee"] = [];
        }
        if (!e.target.value && assigneeRow[index]) {
            requestTask.assignee = requestTask.assignee.filter(user => assigneeRow[index]._id !== user._id);
            assigneeRow[index]._id = null;
        } else if (!requestTask.assignee.some(user => user._id === e.target.value) && userMap[e.target.value]) {
            if (assigneeRow[index]._id) {
                requestTask.assignee = requestTask.assignee.filter(user => assigneeRow[index]._id !== user._id);
            }
            requestTask.assignee.push({
                _id: e.target.value
                , firstname: userMap[e.target.value].firstname
                , lastname: userMap[e.target.value].lastname
                , username: userMap[e.target.value].username
            });
            assigneeRow[index]._id = e.target.value;
        }
        this.setState({ requestTask, assigneeRow });
    }
    
    _handleAddDelegatedAdmin() {
        const assigneeRow = _.cloneDeep(this.state.assigneeRow);
        assigneeRow.push({ _id: null });
        this.setState({ assigneeRow });
    }

    _handleCreateRequestTask() {
        const { dispatch, match, listArgs, selectedClient } = this.props;
        const requestTask = _.cloneDeep(this.state.requestTask);
        const selectedFolder = _.cloneDeep(this.state.selectedFolder);
        let listArgsCopy = _.cloneDeep(listArgs) || {};

        this.setState({ submitting: true });
        requestTask._request = match.params.requestId;
        requestTask._firm = match.params.firmId;
        requestTask.dueDate = requestTask.dueDate;
        requestTask._request = match.params.requestId;
        requestTask._folder = selectedFolder && selectedFolder._id;

        if (selectedClient._id) {
            requestTask._client = selectedClient._id;
        }
        
        dispatch(requestTaskActions.sendCreateRequestTask(requestTask)).then(json => {
            if (json.success) {
                dispatch(requestTaskActions.addSingleRequestTaskToMap(json.item));
                dispatch(requestTaskActions.addRequestTaskToList(json.item, ...listArgsCopy));
                dispatch(requestFolderActions.singleUpdateToMap(json.requestFolder));
                dispatch(requestActions.singleUpdateToMap(json.request));
                if (json.activity && selectedClient._id) {
                    dispatch(activityActions.invalidateList(...['_client', selectedClient._id]));
                }
                this._handleClose();
            } else {
                this.setState({ submitting: false });
                alert(json.error);
            }
        });
    }

    _handleClose() {
        this.setState({
            requestTask: { dueDate: DateTime.local().toMillis() }
            , assigneeRow: [{ _id: null }] // default 1
            , submitting: false
            , field: {
                category: false
                , dueDate: false
                , description: false
                , assignee: false
                , _folder: false
            }
        }, () => {
            this.props.close();
        })
    }

    _handleUpdateRequestTask() {
        const { dispatch, selectedClient } = this.props;
        const requestTask = _.cloneDeep(this.state.requestTask);

        this.setState({ submitting: true });
        requestTask._firm = match.params.firmId;
        requestTask.dueDate = new Date(requestTask.dueDate);

        if (selectedClient._id) {
            requestTask._client = selectedClient._id;
        }

        dispatch(requestTaskActions.sendUpdateRequestTask(requestTask)).then(json => {
            if (json.success) {
                this._handleClose();
            } else {
                this.setState({ submitting: false });
                alert(json.error);
            }
        });
    }

    _handleBulkUpdateRequesTask() {
        const { dispatch, match, selectedTaskIds } = this.props;
        const requestTask = _.cloneDeep(this.state.requestTask);
        const field = _.cloneDeep(this.state.field);

        this.setState({ submitting: true });
        
        requestTask.dueDate = new Date(requestTask.dueDate);

        if (!field.category) {
            delete requestTask.category;
        }
        if (!field.dueDate) {
            delete requestTask.dueDate;
        }
        if (!field.description) {
            delete requestTask.description;
        }
        if (!field.assignee) {
            delete requestTask.assignee;
        }
        if (!field._folder) {
            delete requestTask._folder;
        }

        const sendData = {
            requestTasksIds: selectedTaskIds
            , requestTask
            , _firm: match.params.firmId
            , _client: match.params.clientId
            , field
        }

        dispatch(requestTaskActions.sendBulkUpdateRequestTask(sendData)).then(json => {
            if (json.success) {
                this._handleClose();
            } else {
                this.setState({ submitting: false });
                alert(json.error);
            }
        });
    }

    _handleCheckedField(name) {
        const field = _.cloneDeep(this.state.field);
        field[name] = !field[name];
        this.setState({ field });
    }

    _handleLocationChange(folder) {
        this.setState({ selectedFolder: folder });
    }

    render() {
        const {
            isOpen
            , selectedClient = {}
            , clientUserListItems = []
            , selectedRequestTask
            , requestTaskBulkEdit
            , match
        } = this.props;
        
        const {
            submitting
            , requestTask = {}
            , assigneeRow
            , field
            , selectedFolder
        } = this.state;

        const updateViewing = selectedRequestTask && selectedRequestTask._id && selectedRequestTask._id === requestTask._id;
        const modalHeaderText = requestTaskBulkEdit ? "Update Request Tasks" : updateViewing ? "Update Request Task" : "Create Request Task";
        const modalConfirmtext = submitting ? updateViewing ? "Updating..." : "Creating..." : requestTaskBulkEdit ? "Update Request Tasks" : updateViewing ? "Update Request Task" : "Create Request Task";
        let disabledButton = requestTask.category && requestTask.dueDate && requestTask.description ? false : true;

        if (!disabledButton && selectedClient._id) {
            disabledButton = requestTask.assignee && requestTask.assignee.length ? false : true;
        }

        if (updateViewing && !disabledButton) {
            disabledButton = _.isEqual(selectedRequestTask, requestTask);
        }

        if (requestTaskBulkEdit) {
            disabledButton = false;
            if (field.category || field.dueDate || field.description || field.assignee || field._folder) {
                if (field.category && !(requestTask && requestTask.category && requestTask.category.trim().length)) {
                    disabledButton = true;
                } else if (field.dueDate) {
                    disabledButton = false;
                } else if (field.description && !(requestTask && requestTask.description && requestTask.description.trim().length)) {
                    disabledButton = true;
                } else if (field.assignee && !(requestTask.assignee && requestTask.assignee.length)) {
                    disabledButton = true;
                } else if (field._folder) {
                    disabledButton = false;
                }
            } else {
                disabledButton = true;
            }
        }

        return (
            <Modal
                cardSize="large"
                isOpen={isOpen}
                closeAction={this._handleClose}
                closeText="Cancel"
                confirmAction={requestTaskBulkEdit ? this._handleBulkUpdateRequesTask : updateViewing ? this._handleUpdateRequestTask : this._handleCreateRequestTask}
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
                            {
                                selectedClient._id &&
                                <div className="-setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                        {
                                            requestTaskBulkEdit ?
                                            <CheckboxInput
                                                // disabled={!checked}
                                                label="Upload Location"
                                                name="requestTask"
                                                value={field._folder}
                                                change={this._handleCheckedField.bind(this, "_folder")}
                                                checked={field._folder}
                                            />
                                            : <p><strong>Upload Location</strong></p>
                                        }
                                    </div>
                                    <div className="-inputs yt-col">
                                        {/* <TextInput
                                            change={this._handleFormChange}
                                            name="requestTask._folder"
                                            placeholder="Enter category"
                                            value={requestTask._folder}
                                            disabled={!field._folder && requestTaskBulkEdit}
                                        /> */}
                                        <FileLocation 
                                            selectedClient={selectedClient}
                                            handleLocationChange={this._handleLocationChange}
                                            allowCreateFolder={true} // (firm.allowCreateFolder && viewingAs === "portal") || (viewingAs !== "portal")}
                                            selectedFolder={selectedFolder}
                                            personalId={null}
                                            // getDetail={{ type: "workspace", id: selectedClient && selectedClient._id, firmId: match.params.firmId }}
                                            getDetail={{ type: selectedClient._id && "workspace" ||  "general", id: selectedClient._id, firmId: match.params.firmId }}
                                            action="move"
                                        />
                                    </div>
                                </div> || null
                            }
                            { selectedClient._id && <hr/> || null }
                            <div className="-setting yt-row space-between">
                                <div className="-instructions yt-col">
                                    {
                                        requestTaskBulkEdit ?
                                        <CheckboxInput
                                            // disabled={!checked}
                                            label="Category"
                                            name="requestTask"
                                            value={field.category}
                                            change={this._handleCheckedField.bind(this, "category")}
                                            checked={field.category}
                                        />
                                        : <p><strong>Category<sup className="-required">*</sup></strong></p>
                                    }
                                </div>
                                <div className="-inputs yt-col">
                                    <TextInput
                                        change={this._handleFormChange}
                                        name="requestTask.category"
                                        placeholder="Enter category"
                                        value={requestTask.category}
                                        disabled={!field.category && requestTaskBulkEdit}
                                    />
                                </div>
                            </div>
                            <hr/>
                            <div className="-setting yt-row space-between">
                                <div className="-instructions yt-col">
                                    {
                                        requestTaskBulkEdit ?
                                        <CheckboxInput
                                            // disabled={!checked}
                                            label="Due Date"
                                            name="requestTask"
                                            value={field.dueDate}
                                            change={this._handleCheckedField.bind(this, "dueDate")}
                                            checked={field.dueDate}
                                        />
                                        : <p><strong>Due Date<sup className="-required">*</sup></strong></p>
                                    }
                                </div>
                                <div className="-inputs yt-col">
                                    <SingleDatePickerInput
                                        anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
                                        change={this._handleFormChange}
                                        enableOutsideDays={false}
                                        initialDate={requestTask.dueDate} // epoch/unix time in milliseconds
                                        inputClasses="-right"
                                        minDate={!!selectedRequestTask && !!selectedRequestTask.dueDate ? new Date(selectedRequestTask.dueDate).getTime() : DateTime.local().toMillis()}
                                        name="requestTask.dueDate"
                                        numberOfMonths={1}
                                        placeholder="Set due date"
                                        disabled={!field.dueDate && requestTaskBulkEdit}
                                    />
                                </div>
                            </div>
                            <hr/>
                            <div className="-setting yt-row space-between">
                                <div className="-instructions yt-col">
                                    {
                                        requestTaskBulkEdit ?
                                        <CheckboxInput
                                            // disabled={!checked}
                                            label="Description"
                                            name="requestTask"
                                            value={field.description}
                                            change={this._handleCheckedField.bind(this, "description")}
                                            checked={field.description}
                                        />
                                        : <p><strong>Description<sup className="-required">*</sup></strong></p>
                                    }
                                </div>
                                <div className="-inputs yt-col">
                                    <TextInput
                                        change={this._handleFormChange}
                                        name="requestTask.description"
                                        placeholder="Enter description"
                                        value={requestTask.description}
                                        disabled={!field.description && requestTaskBulkEdit}
                                    />
                                </div>
                            </div>
                            { selectedClient._id && <hr/> || null }
                            {
                                selectedClient._id &&
                                <div className="-setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                        {
                                            requestTaskBulkEdit ?
                                            <CheckboxInput
                                                // disabled={!checked}
                                                label="Assignee"
                                                name="requestTask"
                                                value={field.assignee}
                                                change={this._handleCheckedField.bind(this, "assignee")}
                                                checked={field.assignee}
                                            />
                                            : <p><strong>Assignee<sup className="-required">*</sup></strong></p>
                                        }
                                    </div>
                                    <div className="yt-col">
                                        {
                                            assigneeRow.map((row, i) => 
                                                <div className="-inputs yt-row" key={i}>
                                                    <SelectFromObject
                                                        change={this._handleSelectClientUser.bind(this, i)}
                                                        items={clientUserListItems}
                                                        display="displayName"
                                                        displayStartCase={true}
                                                        filterable={true}
                                                        isClearable={true}
                                                        name="clientUserId"
                                                        placeholder="Select assignee"
                                                        selected={row._id}
                                                        value="_id"
                                                        signersId={requestTask.assignee ? requestTask.assignee.map(user => user._id) : []}
                                                        disabled={!field.assignee && requestTaskBulkEdit}
                                                    />
                                                </div>
                                            )
                                        }
                                        <div className="-inputs yt-row" style={{ display: "inline-block", textAlign: "right" }}>
                                            <button className="yt-btn xx-small u-pullRight" onClick={this._handleAddDelegatedAdmin} disabled={!clientUserListItems || !requestTask.assignee ? true : clientUserListItems.length <= assigneeRow.length}>
                                                <i className="fal fa-plus" aria-hidden="true"></i>Add Assignee
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                || null
                            }
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }
}

RequestTaskForm.propTypes = {}

RequestTaskForm.defaultProps = {}

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
    )(RequestTaskForm)
);
