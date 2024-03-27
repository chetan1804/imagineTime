/**
 * A reusable component to add notes to any resource. If no noteId is passed,
 * it fetches its own default and saves the new note with the supplied pointers.
 * If a noteId is passed, it edits that note (Future functionality. For now it just creates new notes).
 * 
 * All it needs from the parent is a "pointers" object OR a noteId. It MUST have one.
 *  <RequestListApplyForm
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
import Binder from '../../../global/components/Binder.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';

// import form components
import { TextAreaInput, ToggleSwitchInput } from '../../../global/components/forms';
import RequestListDeliveryListItem from './RequestListDeliveryListItem.js.jsx';
import AttachRequestListModal from './AttachRequestListModal.js.jsx';
import ProgressBar from '../../../global/components/helpers/ProgressBar.js.jsx';

// import actions
import * as requestActions from '../requestActions';
import * as userActions from '../../user/userActions';

class RequestListApplyForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            requestId: null
            , attachRequestModalOpen: false
            , submitting: false
            , progress: {
                message: 'In Progress'
                , percent: 0
            }
        }
        this._bind (
            '_handleFormChange'
            , '_handleClose'
            , '_handleAttachRequest'
            , '_handleFormSubmit'
        )
    }

    componentDidMount() {
        const { socket } = this.props;
        socket.on('upload_status', (percent) => {
            this.setState({ progress: { message: 'In Progress', percent } });
        });
    }

    componentWillUnmount() {
        // const { socket } = this.props;
        // socket.off('folder_template_progress');
        // this._handleClose();
        const { socket, match } = this.props;
        // Remove the event listeners defined in the constructor since they will be attached every time the modal is opened.
        socket.off('upload_status');
    }

    _handleClose() {
        const { close } = this.props;
        this.setState({
            requestId: null
            , submitting: false
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

    _handleRemoveTemplate(requestId) {
        console.log(requestId);
        // const index = newTempltes.indexOf(templateId);
        // newTempltes.splice(index, 1);
        // this.setState({ requestId: newTempltes });
    }

    _handleFormSubmit() {
        const { match, dispatch } = this.props;        
        const selectedClientId = _.cloneDeep(this.props.selectedClientId);
        const requestId = _.cloneDeep(this.state.requestId);

        this.setState({ submitting: true });

        const data = {
            selectedClientId
            , requestId
            , firmId: match.params.firmId
        }

        dispatch(requestActions.sendBulkCreateRequest(data)).then(json => {
            if (json.success) {
                this._handleClose();
            } else {
                alert(json.message);
            }
        });
    }

    _handleAttachRequest(requestId) {
        this.setState({ requestId });
    }

    render() {
        const { 
            isOpen
            , requestStore
            , userStore
        } = this.props;

        const {
            submitting
            , requestId
            , attachRequestModalOpen
            , progress
        } = this.state;


        return (
            <Modal
                isOpen={isOpen}
                closeAction={this._handleClose}
                closeText="Cancel"
                confirmAction={this._handleFormSubmit}
                confirmText={"Apply Template"}
                disableConfirm={submitting || !requestId}
                modalHeader="Apply folder template"
                showButtons={true}
                cardSize="standard"
            >
                <div className="-share-link-configuration">
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
                            requestId && requestStore && requestStore.byId && requestStore.byId[requestId] ? 
                            <RequestListDeliveryListItem
                                key={requestId}
                                request={requestStore.byId[requestId]}
                                userStore={userStore}
                            />
                            : null
                        }
                        <button className="yt-btn small info link block" onClick={() => this.setState({attachRequestModalOpen: true})}>
                            Select request list
                        </button>
                    </div>
                </div>
                <AttachRequestListModal
                    close={() => this.setState({attachRequestModalOpen: false})}
                    isOpen={isOpen && attachRequestModalOpen}
                    onSubmit={this._handleAttachRequest}
                    multiple={false}
                />
            </Modal>
        )
    }
}

RequestListApplyForm.propTypes = {
    dispatch: PropTypes.func.isRequired
}

RequestListApplyForm.defaultProps = {
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
        , requestStore: store.request
        , userStore: store.user
        , socket: store.user.socket
    }
}

export default connect(mapStoreToProps)(RequestListApplyForm)
