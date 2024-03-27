/**
 * A reusable component to add notes to any resource. If no noteId is passed,
 * it fetches its own default and saves the new note with the supplied pointers.
 * If a noteId is passed, it edits that note (Future functionality. For now it just creates new notes).
 * 
 * All it needs from the parent is a "pointers" object OR a noteId. It MUST have one.
 *  <FolderTemplateApplyForm
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

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';

// import form components
import { TextAreaInput, ToggleSwitchInput } from '../../../../global/components/forms';
import FolderTemplateDeliveryListItem from './FolderTemplateDeliveryListItem.js.jsx';
import AttachFolderTemplatesModal from './AttachFolderTemplatesModal.js.jsx';

// import actions
import * as folderTemplateActions from '../../folderTemplateActions';
import * as userActions from '../../../user/userActions';
import * as fileActions from '../../../file/fileActions';

class FolderTemplateApplyForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            submitting: false
            , templateIds: []
            , attachTemplateModalOpen: false
            , associated: true
        }
        this._bind (
            '_handleFormChange'
            , '_handleFormSubmit'
            , '_handleRemoveTemplate'
            , '_handleAttactTemplate'
            , '_handleClose'
        )
    }

    componentDidMount() {
        const {  socket, dispatch, match } = this.props;
        dispatch(folderTemplateActions.fetchListIfNeeded("_firm", match.params.firmId));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
        socket.on('folder_template_progress', (file) => {
            dispatch(fileActions.addSingleFileToMap(file));
            dispatch(fileActions.addFileToList(file, ...this.props.listArgs));
        });
    }

    componentWillUnmount() {
        const { socket } = this.props;
        socket.off('folder_template_progress');
    }

    _handleClose() {
        const { close } = this.props;
        this.setState({
            submitting: false
            , templateIds: []
            , attachTemplateModalOpen: false
            , associated: true
        }, () => {
            close();
        });
    }

    _handleFormChange(e) {
        let newState = _.update(this.state, e.target.name, () => {
            return e.target.value;
        });
        this.setState(newState);
    }

    _handleRemoveTemplate(templateId) {
        const newTempltes = this.state.templateIds;
        console.log(newTempltes);
        const index = newTempltes.indexOf(templateId);
        newTempltes.splice(index, 1);
        this.setState({ templateIds: newTempltes });
    }

    _handleFormSubmit() {
        const { templateIds, associated } = this.state;
        const { dispatch, match, selectedClient, firm, viewingAs, selectedClientId, handleSetInvalidList } = this.props;

        const sendData = { 
            templateIds
            , associated 
            , _firm: match.params.firmId
            , mangoCompanyID: firm && firm.mangoCompanyID ? firm.mangoCompanyID : null
        }

        this.setState({ submitting: true });
        if (viewingAs === "client-setting") {
            sendData.selectedClientId = selectedClientId;
            dispatch(folderTemplateActions.sendBulkApplyFolderTemplate(sendData)).then(response => {
                if (response.success) {
                    if (handleSetInvalidList) {
                        handleSetInvalidList();
                    }
                    this._handleClose();
                } else {
                    this.setState({ submitting: false }, () => {
                        alert(response.message);
                    });
                }
            });
        } else {

            sendData._client = match.params.clientId;
            sendData._folder = match.params.folderId;
            sendData._personal = match.params.userId;
            sendData.mangoClientID = selectedClient && selectedClient.mangoClientID ? selectedClient.mangoClientID : null 
    
            dispatch(folderTemplateActions.sendApplyFolderTemplate(sendData)).then(response => {
                if (response.success) {
                    if (handleSetInvalidList) {
                        handleSetInvalidList();
                    }
                    this._handleClose();
                } else {
                    this.setState({ submitting: false }, () => {
                        alert(response.message);
                    });
                }
            });
        }
    }

    _handleAttactTemplate(templateIds) {
        this.setState({ templateIds });
    }

    render() {
        const { 
            isOpen
            , closeAction
            , selectedClient
            , folderTemplateStore
            , userStore
        } = this.props;

        const {
            submitting
            , templateIds
            , attachTemplateModalOpen
            , associated
        } = this.state;


        const isEmpty = (
            folderTemplateStore.selected.didInvalidate
            || userStore.selected.didInvalidate
        );

        const isFetching = (
            folderTemplateStore.selected.isFetching
            || userStore.selected.isFetching
        )

        return (
            <Modal
                isOpen={isOpen}
                closeAction={this._handleClose}
                closeText="Cancel"
                confirmAction={this._handleFormSubmit}
                confirmText={"Apply Template"}
                disableConfirm={submitting || templateIds.length === 0}
                modalHeader="Apply folder template"
                showButtons={true}
                cardSize="large"
            >
                {
                    isEmpty ?
                    isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>
                    : 
                    <div>

                    </div>
                }
                <div className="-share-link-configuration">
                    <div className="-body">
                        {   templateIds.map((templateId, i) => 
                                <FolderTemplateDeliveryListItem
                                    key={i}
                                    folder={folderTemplateStore.byId[templateId]}
                                    folderPath={null}
                                    removeFolder={this._handleRemoveTemplate}
                                    allowRemove={true} // When this modal is opened from PracticeSingleFile view it doesn't make sense to let them delete the single file from the list.
                                />
                        )}
                        <button className="yt-btn small info link block" onClick={() => this.setState({attachTemplateModalOpen: true})}>
                            Select folder template
                        </button>
                    </div>
                </div>
                <div className="-share-link-configuration">
                    <div className="-body">
                        <div className="-setting yt-row space-between">
                            <div className="-instructions yt-col">
                                <p><strong>Associate with the template</strong></p>
                            </div>
                            <div className="-inputs yt-col">
                                <ToggleSwitchInput
                                    change={this._handleFormChange}
                                    disabled={false}
                                    inputClasses="-right"
                                    name="associated"
                                    required={false}
                                    rounded={true}
                                    value={associated}
                                />
                            </div>
                            <div className="-inputs yt-row">
                                <small>Folders created using the selected template will be associated with the selected template.</small>
                                <br/>
                                <small>Changes from the selected template will affect the associated folders.</small>
                                <br/>
                                <small>Associated folders cannot be renamed, moved and archived.</small>
                                <br/>
                                <small>Only the root folder can be moved and archived.</small>
                                <br/>
                                <small>If the selected template is deleted, all instances of that folder within workspace, 
                                    and all files contained within said folders, will be archived.
                                </small>
                                <br/>
                                <small>Folders deleted from a change to the template can be reinstate from the archive list.</small>
                            </div>
                        </div>
                    </div>
                </div>
                <AttachFolderTemplatesModal
                    close={() => this.setState({attachTemplateModalOpen: false})}
                    isOpen={isOpen && attachTemplateModalOpen}
                    onSubmit={this._handleAttactTemplate}
                    multiple={false}
                    selectedTemplateIds={templateIds}
                />
            </Modal>
        )
    }
}

FolderTemplateApplyForm.propTypes = {
    dispatch: PropTypes.func.isRequired
}

FolderTemplateApplyForm.defaultProps = {
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
        , folderTemplateStore: store.folderTemplate
        , userStore: store.user
        , socket: store.user.socket
    }
}

export default connect(mapStoreToProps)(FolderTemplateApplyForm)
