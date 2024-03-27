/**
 * A reusable component to add notes to any resource. If no noteId is passed,
 * it fetches its own default and saves the new note with the supplied pointers.
 * If a noteId is passed, it edits that note (Future functionality. For now it just creates new notes).
 * 
 * All it needs from the parent is a "pointers" object OR a noteId. It MUST have one.
 *  <DocumentTemplateApplyForm
 *    pointers={{"_file": match.params.fileId}}
 *    noteId={note._id}
 *    onSubmit={} // A callback that is called when a note is created/updated (to add the item to lists, etc...)
 *  />
 * 
 * NOTE: For _user we use loggedInUser by default.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import { DateTime } from 'luxon';
const async = require('async');
import ContentEditable from 'react-contenteditable'

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';
import routeUtils from '../../../global/utils/routeUtils';
import displayUtils from '../../../global/utils/displayUtils';
import validationUtils from '../../../global/utils/validationUtils';
import { COUNTRIES, COUNTRY_STATES, STATES } from '../../../config/constants';
import ProgressBar from '../../../global/components/helpers/ProgressBar.js.jsx';

// import form components
import { SelectFromObject, TextInput, CheckboxInput, SelectFromArray } from '../../../global/components/forms';

// import actions
import * as documentTemplateActions from '../documentTemplateActions';
import * as userActions from '../../user/userActions';
import * as fileActions from '../../file/fileActions';
import * as clientUserActions from '../../clientUser/clientUserActions';
import * as addressActions from '../../address/addressActions';
import * as firmActions from '../../firm/firmActions';
import * as clientActions from '../../client/clientActions';
import * as phoneNumberActions from '../../phoneNumber/phoneNumberActions';
import * as activityActions from '../../activity/activityActions';

class DocumentTemplateApplyForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            submitting: false
            , listArgs: {
                '_firm': props.match.params.firmId
            }
            , filename: ""
            , DOCXFormat: true
            , PDFFormat: false
            , contacts: []
            , template: {}
            , tagsArgs: {
                '_firm': props.match.params.firmId
                , '_client': props.match.params.firmId
                , 'tags-value': true
            }
            , showTags: false
            , status: "visible"
            , selectedClientIds: props.match.params.clientId ? [props.match.params.clientId] 
                                : props.selectedClientId && props.selectedClientId.length ? props.selectedClientId : null
            , selectedClientId: props.match.params.clientId ? props.match.params.clientId
                                : props.selectedClientId && props.selectedClientId.length ? props.selectedClientId[0] : null
            , isFilenameValid: true
            , progress: {
                message: 'In Progress'
                , percent: 0
            }
        }
        this._bind (
            '_handleFormChange'
            , '_handleFormSubmit'
            , '_handleRemoveTemplate'
            , '_handleClose'
            , '_handleContactChange'
            , '_getContactList'
            , '_handleTagsChange'
            , '_handleFetchSelectedClientDetails'
        );

        this.objTags = {};
        this.contactIds = {};
        this.globalTags = {};
        this.clientTags = {};
    }

    componentDidMount() {
        const {  loggedInUser, dispatch, match, socket } = this.props;
        // socket.on('folder_template_progress', (file) => {
        //     dispatch(fileActions.addSingleFileToMap(file));
        //     dispatch(fileActions.addFileToList(file, ...this.props.listArgs));
        // });
        const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
        const listByIdsArgs =  _.cloneDeep(this.state.listArgs);
        const selectedClientId = _.cloneDeep(this.state.selectedClientId);

        dispatch(documentTemplateActions.fetchListIfNeeded(...listArgs));

        // FIRM
        dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId)).then(json => {
            dispatch(addressActions.fetchSingleIfNeeded(json.item._primaryAddress));
            this._handleFetchSelectedClientDetails(selectedClientId);
        });

        socket.on('upload_status', (percent) => {
            this.setState({ progress: { message: 'In Progress', percent } });
        });
    }

    componentWillReceiveProps(nextProps) {
        const { match, selectedClientId } = this.props;
        if (nextProps.match.params.clientId) {
            if (!(_.isEqual(nextProps.match.params.clientId, match.params.clientId))) {
                this.setState({ selectedClientId: nextProps.match.params.clientId, selectedClientIds: [nextProps.match.params.clientId] });
            }
        } else if (nextProps.selectedClientId && nextProps.selectedClientId.length) {
            if (!(_.isEqual(nextProps.selectedClientId, selectedClientId))) {
                this.setState({ selectedClientId: nextProps.selectedClientId[0], selectedClientIds: nextProps.selectedClientId });
            }
        }
    }

    componentWillUnmount() {
        // const { socket } = this.props;
        // socket.off('folder_template_progress');
        // this._handleClose();
        const { socket, match } = this.props;
        // Remove the event listeners defined in the constructor since they will be attached every time the modal is opened.
        socket.off('upload_status');
    }

    _handleFetchSelectedClientDetails(selectedClientId) {
        const {  loggedInUser, dispatch, clientStoreMap } = this.props;
        const listByIdsArgs =  _.cloneDeep(this.state.listArgs);
        const selectedClient = clientStoreMap && clientStoreMap[selectedClientId];
        const addressIds = [];
        const phoneNumberIds = [];  
        
        if (selectedClient) {
            if (selectedClient._primaryAddress) {
                addressIds.push(selectedClient._primaryAddress);
            }
            if (selectedClient._primaryPhone) {
                phoneNumberIds.push(selectedClient._primaryPhone);
            }
    
            // CLIENT PRIMARY CONTACT
            dispatch(userActions.fetchListIfNeeded('_client', selectedClientId)).then(json => {
                if (json && json.success && json.list && json.list.length) {
                    json.list.forEach(user => {
                        if (user && user._primaryAddress) {
                            addressIds.push(user._primaryAddress);
                        }
                        if (user && user._primaryPhone) {
                            phoneNumberIds.push(user._primaryPhone);
                        }
                    });
                }
    
                // LOGGED IN USER
                if (loggedInUser._primaryAddress) {
                    addressIds.push(loggedInUser._primaryAddress);
                }
                if (loggedInUser._primaryPhone) {
                    phoneNumberIds.push(loggedInUser._primaryPhone);
                }
    
                if (addressIds && addressIds.length) {
                    listByIdsArgs._ids = addressIds.join('-');
                    dispatch(addressActions.fetchListByIdsIfNeeded(routeUtils.listArgsFromObject(listByIdsArgs), addressIds));
                }
    
                if (phoneNumberIds && phoneNumberIds.length) {
                    listByIdsArgs._ids = phoneNumberIds.join('-');
                    dispatch(phoneNumberActions.fetchListByIdsIfNeeded(routeUtils.listArgsFromObject(listByIdsArgs), phoneNumberIds));
                }
            });
        }

        dispatch(clientUserActions.fetchListIfNeeded('_client', selectedClientId));
    }

    _handleClose() {
        const { close } = this.props;
        this.setState({
            submitting: false
            , filename: ""
            , template: {}
        }, () => {
            close();
        });
    }

    _handleFormChange(e) {
        const { 
            documentTemplateStore
            , firmStore
            , loggedInUser
            , addressMap
            , phoneNumberMap
            , clientStore
            , userMap
            , clientStoreMap
        } = this.props;

        const selectedFirm = firmStore.selected.getItem();
        const selectedClientIds = _.cloneDeep(this.state.selectedClientIds);
        const selectedClientId = _.cloneDeep(this.state.selectedClientId);
        let newState = _.update(this.state, e.target.name, () => {
            return e.target.value;
        });

        if (e.target.name === "template._id" && e.target.value && documentTemplateStore && documentTemplateStore.byId && documentTemplateStore.byId[e.target.value]) {

            const template = _.cloneDeep(documentTemplateStore.byId[e.target.value]);
            const filename = template.filename; 

            // const newTemplate = [];
            Object.keys(template.tags).forEach(tagName => {

                let item = template.tags[tagName];

                if (item.tag === "date" || item.tag === "firm" || item.tag === "user") {
                    // date, firm, user tag

                    const value = displayUtils.getMergeFieldValue(item.name, {
                        firm: selectedFirm || {}
                        , client: {}
                        , user: loggedInUser || {}
                        , addressMap: addressMap || {}
                        , phoneNumberMap: phoneNumberMap || {}
                        , clientPrimaryContact: {}
                        , template: template
                    });
                    item.hasValue = !!value;
                    item.value = value;
                    this.globalTags[tagName] = item;

                } else {
                    // client, client-primary, contact
                    selectedClientIds.forEach(clientId => {
                        const newItem = _.cloneDeep(item);
                        if (!this.clientTags[clientId]) {
                            this.clientTags[clientId] = {};
                        }
                        const selectedClient = clientStoreMap && clientId && clientStoreMap[clientId];
                        const clientPrimaryContact = selectedClient && selectedClient._primaryContact && userMap && userMap[selectedClient._primaryContact] ? userMap[selectedClient._primaryContact] : {};                 
                        const value = displayUtils.getMergeFieldValue(newItem.name, {
                            firm: selectedFirm || {}
                            , client: selectedClient || {}
                            , user: loggedInUser || {}
                            , addressMap: addressMap || {}
                            , phoneNumberMap: phoneNumberMap || {}
                            , clientPrimaryContact: clientPrimaryContact
                            , template: template
                        });
                        newItem.hasValue = !!value;
                        newItem.value = value;
                        this.clientTags[clientId][tagName] = newItem;
                    });
                }
            });

            newState.filename = filename.slice(0, filename.indexOf(template.fileExtension));
            newState.template = template;
        } else if (e.target.name === "template._id" && !e.target.value) {
            newState.template = {};
            newState.filename = "";
            this.objTags = {};
            this.contactIds = {};
            this.globalTags = {};
            this.clientTags = {};
        } else if (e.target.name === "selectedClientId" && e.target.value && clientStoreMap && clientStoreMap[e.target.value] ) {
            this._handleFetchSelectedClientDetails(e.target.value);
        } else if (e.target.name === "filename") {
            newState.isFilenameValid = validationUtils.checkFilenameIsValid(e.target.value);
        }
        this.setState(newState);
    }

    _handleRemoveTemplate() {
    }

    _handleFormSubmit() {
        const { 
            dispatch
            , match
            , documentTemplateStore
        } = this.props;
        const {
            filename
            , DOCXFormat
            , PDFFormat
            , contacts
            , template
            , status
            , selectedClientIds
            , isFilenameValid
        } = this.state;

        if (this.globalTags && this.clientTags && template && template._id && (DOCXFormat || PDFFormat)) {

            const newFilename = isFilenameValid && filename && filename.trim() ? filename : template && template.filename && template.filename.slice(0, template.filename.indexOf(template.fileExtension));
            const globalTags = {};
            const clientTags = {}
            Object.keys(this.globalTags).forEach(item => {
                globalTags[item] = this.globalTags[item].value;
            });
            Object.keys(this.clientTags).forEach(clientId => {
                clientTags[clientId] = {}
                Object.keys(this.clientTags[clientId]).forEach(item => {
                    if (item && item.indexOf('_id') === -1) {
                        clientTags[clientId][item] = this.clientTags[clientId][item].value;
                    }
                });
            });
            
            this.setState({ submitting: true, showTags: false });

            const data = {
                filename: newFilename
                , DOCXFormat
                , PDFFormat
                , status
                , firmId: match.params.firmId
                , templateId: template && template._id
                , globalTags
                , clientTags
                , selectedClientIds                
            }

            dispatch(documentTemplateActions.sendApplyDocumentTemplate(data)).then(json => {
                if (json.success) {
                    if (this.props.handleSetInvalidList) {
                        this.props.handleSetInvalidList();
                    }
                    this._handleClose();
                } else {
                    alert(json.error);
                    this.setState({ submitting: false });
                }
            });
        }
    }

    _getContactList(userListItems) {
        let contactList = [];
        userListItems.forEach(user => {
          /**
           * NOTE: We'll need all user addresses to be in the map. This isn't a great way to do it
           * but without new list fetch overrides it's the only way to go.
           */
          this.props.dispatch(addressActions.fetchListIfNeeded('_user', user._id))
          let contactObject = {
            displayName: `${user.firstname} ${user.lastname}`
            , _id: user._id
            , contact: {
              username: user.username
              , firstname: user.firstname
              , lastname: user.lastname
            }
          }
          contactList.push(contactObject)
        })
        return contactList
    }

    _handleContactChange(e, contactTagList) {
        const { phoneNumberMap, userStore, addressMap } = this.props;

        const contactKey = e.target.name;
        const contactKeyId = e.target.name + '._id';
        const template = _.cloneDeep(this.state.template);
        const user = _.cloneDeep(userStore.byId[e.target.value]);
        const selectedClientId = _.cloneDeep(this.state.selectedClientId);

        if (contactTagList && contactTagList.length) {
            
            this.clientTags[selectedClientId][contactKeyId] = {
                tag: 'id'
                , name: contactKeyId
                , value: e.target.value
            };

            if (user && user._id && e.target.value) {

                this.contactIds[contactKeyId] = e.target.value;

                // tags
                contactTagList.forEach(keyName => {
                    const tempKeyName = keyName.replace(contactKey, 'User')
                    const value = displayUtils.getMergeFieldValue(tempKeyName, {
                        user
                        , addressMap: addressMap || {}
                        , phoneNumberMap: phoneNumberMap || {}
                    });

                    this.clientTags[selectedClientId][keyName].value = value;
                    this.clientTags[selectedClientId][keyName].hasValue = !!value;
                });
            } else {
                delete this.contactIds[contactKeyId];

                contactTagList.forEach(keyName => {
                    this.clientTags[selectedClientId][keyName].value = "";
                    this.clientTags[selectedClientId][keyName].hasValue = false;
                });
            }
            // this.setState({ template });
            this.forceUpdate();
        }
    }

    _handleTagsChange(tag) {
        const selectedClientId = _.cloneDeep(this.state.selectedClientId);
        if (tag.tag === "date" || tag.tag === "firm" || tag.tag === "user" && this.globalTags && this.globalTags[tag.name]) {
            this.globalTags[tag.name].value = tag.value;
        } else if (this.clientTags && this.clientTags[selectedClientId] && this.clientTags[selectedClientId][tag.name]) {
            this.clientTags[selectedClientId][tag.name].value = tag.value;
        }

        // const tempTags = _.cloneDeep(this.objTags);
        // if (this.objTags[name]) {
        //     this.objTags[name].value = value.trim();
        // }
        
        // if (_.some(this.objTags, _.isEmpty) && !_.some(tempTags, _.isEmpty)) {
        //     this.forceUpdate();
        // } else if (!_.some(this.objTags, _.isEmpty) && _.some(tempTags, _.isEmpty)) {
        //     this.forceUpdate();
        // }
    }

    render() {


        const { 
            isOpen
            , closeAction
            , documentTemplateStore
            , userStore
            , match
            , userMap
            , clientUserStore
            , firmStore
            , clientStore
            , phoneNumberStore
            , clientStoreMap
            , addressStore
        } = this.props;

        const {
            submitting
            , filename
            , DOCXFormat
            , PDFFormat
            , contacts
            , template
            , showTags
            , status
            , selectedClientId
            , selectedClientIds
            , isFilenameValid
            , progress
        } = this.state;

        const documentTemplateStoreInfo = documentTemplateStore.util.getSelectedStore('_firm', match.params.firmId);
        const clientUserStoreInfo = clientUserStore.util.getListInfo('_client', selectedClientId);
        const userStoreInfo = userStore.util.getListInfo('_client', selectedClientId);
        let documentTemplateListItems = documentTemplateStore.util.getList('_firm', match.params.firmId);
        let clientUserListItems = clientUserStore.util.getList('_client', selectedClientId);

        const tags = template && template.tags;
        const arrTags = _.toArray(tags);
        if (documentTemplateListItems && documentTemplateListItems.length) {
            documentTemplateListItems = _.orderBy(documentTemplateListItems, [item => item.filename.toLowerCase()], ['asc']); 
        }
        let createdByName = "";
        if (template) {
            let createrById = template._createdBy; 
            if (createrById && userMap && userMap[createrById]) {
                createdByName = "Created by: "
                createdByName += userMap[createrById].firstname  + " " + userMap[createrById].lastname;
            }
        }

        let userListItems = [];
        if (clientUserListItems && clientUserListItems.length) {
            clientUserListItems.forEach(item => {
                if (item && item.status === "active" && userStore && userStore.byId && userStore.byId[item._user]) {
                    userListItems .push(userStore.byId[item._user]);
                }
            })
        }

        const contactListItems = userListItems && userListItems.length ? this._getContactList(userListItems) : null;
        const filenameErrorMessage = `A filename can't contain any of the following characters: \ / : * ? " < > |`;

        const isEmpty = (
            !documentTemplateListItems
            || documentTemplateStore.selected.didInvalidate
            || !documentTemplateStoreInfo
            || documentTemplateStoreInfo.isFetching
        );

        const isFetching = (
            !documentTemplateListItems
            || documentTemplateStore.selected.isFetching
            || !documentTemplateStoreInfo
            || documentTemplateStoreInfo.isFetching
        );

        const clientListItems = selectedClientIds.map(item => clientStoreMap[item]);

        return (
            <Modal
                isOpen={isOpen}
                closeAction={this._handleClose}
                closeText="Cancel"
                confirmAction={this._handleFormSubmit}
                confirmText={submitting ? "Submitting" : "Create"}
                disableConfirm={submitting || _.isEmpty(template) || !(DOCXFormat || PDFFormat)}
                modalHeader="Create a file from a template"
                showButtons={true}
                cardSize="large"
            >
                <div>
                    <div className="-share-link-configuration" style={showTags ? { minHeight: "calc(100vh - 220px)" } : {}}>
                        {
                            submitting ?
                            <div className="-body -max-width">
                                <ProgressBar
                                    progress={progress}
                                />
                            </div>
                            : null
                        }
                        <div className="-body">
                            {
                                showTags ? null
                                : <div>
                                    <div className="-setting yt-row space-between">
                                        <div className="-instructions yt-col">
                                            <p><strong>Document template</strong></p>
                                        </div>
                                        { (isEmpty || isFetching) || documentTemplateListItems && documentTemplateListItems.length ? 
                                            <div className="-inputs yt-col">
                                                <SelectFromObject
                                                    change={this._handleFormChange}
                                                    items={documentTemplateListItems}
                                                    display="filename"
                                                    displayStartCase={false}
                                                    filterable={true}
                                                    isClearable={true}
                                                    name="template._id"
                                                    placeholder="Find a document template"
                                                    selected={template && template._id}
                                                    //selected={this.state.clientId}
                                                    value="_id"
                                                    helpText={createdByName}
                                                />
                                            </div>
                                            :
                                            <p><small><strong>Note: </strong> You do not have any documente templates available.</small></p>
                                        }
                                    </div>
                                    <hr/>
                                    <div className="-setting yt-row space-between">
                                        <div className="-instructions yt-col">
                                            <p><strong>File name</strong></p>
                                        </div>
                                        <div className="-inputs yt-col -text-field-with-error">
                                            <div className="-inputs yt-row">
                                                <TextInput
                                                    change={this._handleFormChange}
                                                    name="filename"
                                                    placeholder="Enter new file"
                                                    required={true}
                                                    value={filename}
                                                    helpText={!isFilenameValid && filenameErrorMessage}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <hr/>
                                    <div className="-setting yt-row space-between">
                                        <div className="-instructions yt-col">
                                            <p><strong>Visibility to client</strong></p>
                                        </div>
                                        <div className="-inputs yt-col">
                                            <div className="-inputs yt-row">
                                                <SelectFromArray
                                                    items={[
                                                        'hidden'
                                                        , 'visible'
                                                    ]}
                                                    change={(e) => this.setState({ status: e.target.value })}
                                                    name="status"
                                                    value={status}
                                                    placeholder=""
                                                />
                                            </div>
                                            <div className="-inputs yt-row -checkbox-label">
                                                <div className="-inputs yt-col">
                                                    <CheckboxInput
                                                        name="DOCXFormat"
                                                        label="Create a DOCX file"
                                                        value={DOCXFormat}
                                                        change={this._handleFormChange}
                                                        checked={DOCXFormat}
                                                        classes="-label-field"
                                                    />
                                                </div>
                                                <div className="-inputs yt-col">
                                                    <CheckboxInput
                                                        name="PDFFormat"
                                                        label="Create a PDF file"
                                                        value={PDFFormat}
                                                        change={this._handleFormChange}
                                                        checked={PDFFormat}
                                                        classes="-label-field"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                            {
                                template && template._id ?
                                <div>
                                    { !showTags && <hr/> }
                                    <div className="-setting yt-row space-between">
                                        <div className="-instructions yt-col">
                                            <p><strong>Review and edit empty tags value</strong></p>
                                        </div>
                                        <div className="-inputs yt-col" style={{ textAlign: "right" }}>
                                            <button className="yt-btn xx-small info" onClick={() => this.setState({ showTags: !showTags })}>
                                                { showTags ? "Hide tags" : "View tags" }
                                            </button>
                                        </div>
                                    </div>
                                    {
                                        showTags ?
                                        <TagList
                                            template={template}
                                            handleTagsChange={this._handleTagsChange}
                                            contactListItems={contactListItems}
                                            handleContactChange={this._handleContactChange}
                                            arrTags={arrTags}
                                            tags={tags}
                                            contactIds={_.toArray(this.contactIds)}
                                            selectedClientId={selectedClientId}
                                            selectedClientIds={selectedClientIds}
                                            clientTags={this.clientTags}
                                            globalTags={this.globalTags}
                                            handleFormChange={this._handleFormChange}
                                            clientListItems={clientListItems}
                                            clientUserStoreInfo={clientUserStoreInfo}
                                            userStoreInfo={userStoreInfo}
                                        /> : null
                                    }
                                </div>
                                : null
                            }
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }
}

DocumentTemplateApplyForm.propTypes = {
    dispatch: PropTypes.func.isRequired
}

DocumentTemplateApplyForm.defaultProps = {
    selectedClient: {}
}

const mapStoreToProps = (store) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    return {
        defaultNote: store.note.defaultItem.obj
        , loggedInUser: store.user.loggedIn.user
        , documentTemplateStore: store.documentTemplate
        , userStore: store.user
        , socket: store.user.socket
        , userMap: store.user.byId
        , clientUserStore: store.clientUser
        , addressStore: store.address
        , addressMap: store.address.byId
        , firmStore: store.firm
        , clientStore: store.client
        , clientStoreMap: store.client.byId
        , phoneNumberStore: store.phoneNumber
        , phoneNumberMap: store.phoneNumber.byId
    }
}

class TagList extends Binder {
    constructor(props) {
        super(props);
        this.contentEditable = React.createRef();
        this.state = {
            template: props.template
        }
    }

    render() {
        const tags = _.cloneDeep(this.props.tags);
        const contactIds = _.cloneDeep(this.props.contactIds);
        const arrTags = _.orderBy(this.props.arrTags, [item => item.sortLoc], ['asc']);
        this.groupByContactTags = {};
        const {
            handleContactChange
            , contactListItems
            , handleTagsChange
            , clientTags
            , globalTags
            , selectedClientId
            , selectedClientIds
            , handleFormChange
            , clientListItems
            , clientUserStoreInfo
            , userStoreInfo
        } = this.props;

        const firmSection = [];
        const userSection = [];
        const clientSection = [];
        const clientPrimarySection = [];
        const clientContactSection = [];
        const clientContactGroupBy = {}
        const dateSection = [];

        arrTags.map((tag, index) => {

            if (tag.tag === "date" || tag.tag === "firm" || tag.tag === "user") {
                tag = globalTags[tag.name];
            } else {
                tag = clientTags[selectedClientId][tag.name];
            }

            let contactNumber = 'Contact#'+tag.number;

            const headTitle = {
                firm: "Firm"
                , user: "User"
                , client: "Client"
                , 'client-primary': "Client Primary Contact"
                , contact: `Client Contact#${tag.number}`
                , date: "Date"
            }

            const headElmt = 
            <div className="table-head -header" key={tag.name + '-keyHeader-' + index}>
                <div className="table-cell">{headTitle[tag.tag]}</div>
                <div className="table-cell" style={{ width: "100vw" }}></div>
            </div>;

            const elmt = <TagListItems 
                key={tag.name + '-keyRow-' + index} 
                tag={tag}
                handleTagsChange={handleTagsChange}
                clientTags={clientTags}
                selectedClientId={selectedClientId} 
            />;

            const clientHeadElmt = 
            <div className="table-head -header" key={tag.name + '-keyHeaderRow-' + index}>
                <div className="table-cell">{headTitle[tag.tag]}</div>
                {
                    selectedClientIds && selectedClientIds.length > 1  ?
                    <div className="table-cell -dropdown-box">
                        <SelectFromObject 
                            change={(e) => handleFormChange(e)}
                            display="name"
                            filterable={false}
                            name="selectedClientId"
                            value="_id"
                            items={clientListItems}
                            required={false}
                            selected={selectedClientId}
                            placeholder='Select a client'
                            isClearable={false}
                        />
                    </div>
                    : <div className="table-cell" style={{ width: "100vw" }}></div>
                }
            </div>;

            const contactHeadElmt = 
            <div className="table-head -header" key={tag.name + '-keyHeaderRow-' + index}>
                <div className="table-cell">{headTitle[tag.tag]}</div>
                <div className="table-cell -dropdown-box">
                    <SelectFromObject 
                        change={(e) => handleContactChange(e, this.groupByContactTags[contactNumber])}
                        display="displayName"
                        filterable={false}
                        name={contactNumber}
                        value="_id"
                        items={contactListItems}
                        required={false}
                        selected={clientTags[selectedClientId][contactNumber+'._id'] ? clientTags[selectedClientId][contactNumber+'._id'].value : null}
                        placeholder='Select a user'
                        signersId={contactIds}
                        isClearable={true}
                    />
                </div>
            </div>;


            if (tag.tag === "id") {
                // do nothing
                if (tag.tag === "contact") {
                    this.contactIds.push(tag.value);
                }
            } else if (tag.tag === "firm") {
                if (firmSection.length === 0) firmSection.push(headElmt)
                firmSection.push(elmt);
            } else if (tag.tag === "user") {
                if (userSection.length === 0) userSection.push(headElmt)
                userSection.push(elmt);
            } else if (tag.tag === "client") {
                if (clientSection.length === 0) clientSection.push(clientHeadElmt)
                clientSection.push(elmt);
            } else if (tag.tag === "client-primary") {
                if (clientPrimarySection.length === 0) clientPrimarySection.push(headElmt)
                clientPrimarySection.push(elmt);
            } else if (tag.tag === "contact") {

                if (this.groupByContactTags[contactNumber]) {
                    this.groupByContactTags[contactNumber].push(tag.name);
                } else {
                    this.groupByContactTags[contactNumber] = [];
                    this.groupByContactTags[contactNumber].push(tag.name);
                }

                this.groupByContactTags[tag.name] = tag.name;
                if (clientContactGroupBy[contactNumber]) {
                    clientContactGroupBy[contactNumber].push(elmt);
                } else {
                    clientContactGroupBy[contactNumber] = [];
                    clientContactGroupBy[contactNumber].push(contactHeadElmt);
                    clientContactGroupBy[contactNumber].push(elmt);
                }
            } else if (tag.tag === "date") {
                if (dateSection.length === 0) dateSection.push(headElmt)
                dateSection.push(elmt);
            }
        });

        if (!(_.has(clientContactGroupBy, _.isEmpty))) {
            Object.keys(clientContactGroupBy).sort().forEach(item => {
                if (item && clientContactGroupBy[item]) {
                    clientContactSection.push(clientContactGroupBy[item]);
                }
            });
        }

        const isFetching = (
            !clientUserStoreInfo
            || clientUserStoreInfo.isFetching
            || !userStoreInfo 
            || userStoreInfo.isFetching 
        )

        if (arrTags && arrTags.length) {
            return (
                <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table" style={{ opacity: isFetching ? '0.5' : 1 }}>
                    <br/>
                    <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 326px)", minHeight: "calc(100vh - 326px)" }}>
                        {   firmSection && firmSection.length ? firmSection : null }
                        {   userSection && userSection.length ? userSection : null }
                        {   clientSection && clientSection.length ? clientSection : null }
                        {   clientPrimarySection && clientPrimarySection.length ? clientPrimarySection : null }
                        {   clientContactSection && clientContactSection.length ? clientContactSection : null }
                        {   dateSection && dateSection.length ? dateSection : null }
                    </div>
                </div>
            )
        }
        else return null
    }
}

class TagListItems extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            tag: props.tag
        }
        this._bind(
            '_handleFormChange'
        );
    }

    componentWillReceiveProps(nextProps) {
        if(!_.isEqual(nextProps.tag, this.state.tag)) {
            this.setState({ tag: nextProps.tag });
        }
    }

    _handleFormChange(e) {
        const tag = _.cloneDeep(this.state.tag);
        tag.value = e.target.value;
        this.setState({ tag }, () => {
            if (this.props.handleTagsChange) {
                this.props.handleTagsChange(tag);
            }
        });
    }

    render() {
        const tag = _.cloneDeep(this.state.tag);
        return (
            <div className="table-row" key={this.props.key}>
                <div className="table-cell" style={tag.hasValue && tag.tag != "date" ? {} : { color: `${tag.value ? "green" : "red"}` }}>{`{{${tag.name}}}`}</div>
                <div className="table-cell" 
                    // style={tag.value ? {} : {border: "1px solid red"}}
                    // contentEditable={!tag.hasValue}
                    // onChange={(e) => console.log(e.target.value)}
                    >
                    <ContentEditable
                        innerRef={this.contentEditable}
                        html={tag.value} // innerHTML of the editable div
                        disabled={tag.hasValue && tag.tag != "date"}       // use true to disable editing
                        onChange={this._handleFormChange} // handle innerHTML change
                        tagName='div' // Use a custom HTML tag (uses a div by default)
                        style={{ border: `1px solid ${tag.value ? "transparent" : "red"}` }}
                    />
                </div>
            </div>
        )
    }
}

export default connect(mapStoreToProps)(DocumentTemplateApplyForm)
