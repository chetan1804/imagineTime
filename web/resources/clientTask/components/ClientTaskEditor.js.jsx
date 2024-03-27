/**
 * Reusable component for editing details of a task
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
// import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import { 
  FileInput 
  , SingleDatePickerInput
  , TextInput
  , ToggleSwitchInput
} from '../../../global/components/forms';

// import resource components 
import ClientTaskOptionsMenu from './ClientTaskOptionsMenu.js.jsx';

// import other components
import AttachFilesModal from '../../file/components/AttachFilesModal.js.jsx';
import UploadFilesModal from '../../file/components/UploadFilesModal.js.jsx';
import FileDeliveryListItem from '../../file/components/FileDeliveryListItem.js.jsx';
import PrepDocForESignatureModal from '../practice/components/PrepDocForESignatureModal.js.jsx';

// import utils 
import { displayUtils } from '../../../global/utils/index.js';

// import actions 
import * as clientTaskActions from '../clientTaskActions';
import * as fileActions from '../../file/fileActions';

class ClientTaskEditor extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newTask: _.cloneDeep(props.clientTask)
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {
        ...props.clientTaskStore.formHelpers
        , edited: false
      }
      , attachFilesModalOpen: false
      , eSigModalOpen: false
      , uploadFilesModalOpen: false
      , files: []
      , taskOptionsOpen: false
      , submitting: false
    }
    this._bind(
      '_handleChange'
      , '_handleCreate'
      , '_handleDelete'
      , '_handleAttachFiles'
      , '_handleUploadedFiles'
      , '_handlePublish'
      , '_handleRemoveFile'
      , '_handleSave'
      , '_reorderItem'
      , '_setButtonText'
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if(!prevState.newTask && this.props.clientTask) {
      this.setState({
        newTask: _.cloneDeep(this.props.clientTask)
      })
    }
  }

  _handleChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    newState.formHelpers.edited = true;

    if(e.target.name !== 'newTask.dueDate' && e.target.name !== 'newTask.needsApproval') {
      this.setState(newState)
    } else {
      // if this was a date change we need to save the clientTask AFTER we update state.
      this.setState(newState, () => {
        this._handleSave();
      });
    }
  }

  _handleCreate(args) {
    this.setState({taskOptionsOpen: false})
    this.props.handleCreate(...args);
  }

  _handleDelete(args) {
    this.props.handleDelete(...args);
  }

  _handleAttachFiles(fileIds) {
    const { dispatch } = this.props;
    let newClientTask = _.cloneDeep(this.state.newTask);
    newClientTask._files = newClientTask._files.concat(fileIds);
    dispatch(clientTaskActions.sendUpdateClientTask(newClientTask)).then(taskRes => {
      if(taskRes.success) {
        this.setState({
          newTask: taskRes.item
        });
      }
    });
  }

  _handleUploadedFiles(files) {
    const fileIds = files.map(file => file._id);
    this._handleAttachFiles(fileIds)
    this.setState({
      uploadFilesModalOpen: false
    });
    files.map(file => {
      this.props.dispatch(fileActions.addSingleFileToMap(file))
    })
  }

  _handleRemoveFile(fileId) {
    const { dispatch } = this.props;
    let newClientTask = _.cloneDeep(this.state.newTask)
    const fileIndex = newClientTask._files.indexOf(fileId)
    if(fileIndex !== -1) {
      newClientTask._files.splice(fileIndex, 1)
      dispatch(clientTaskActions.sendUpdateClientTask(newClientTask)).then(taskRes => {
        if(taskRes.success) {
          this.setState({
            newTask: taskRes.item
          });
        }
      });
    }
  }

  _handlePublish() {
    let newClientTask = _.cloneDeep(this.state.newTask)
    newClientTask.status = 'open'
    let newFormHelpers = {...this.state.formHelpers, edited: true}    
    this.setState({
      newTask: newClientTask
      , formHelpers: newFormHelpers
    }, () => this._handleSave())
  }

  _handleSave() {
    const { dispatch, loggedInUser, match } = this.props;
    const { files } = this.state;

    if(this.state.formHelpers.edited) {
      let newClientTask = _.cloneDeep(this.state.newTask);
      if(newClientTask.dueDate) {
        newClientTask.dueDate = new Date(newClientTask.dueDate);
      }
      if(files.length < 1) {
        dispatch(clientTaskActions.sendUpdateClientTask(newClientTask)).then(taskRes => {
          if(taskRes.success) {
            this.setState({
              newTask: taskRes.item
              , formHelpers: {
                ...this.state.formHelpers 
                , edited: false 
              }
            });
          } else {
            alert("ERROR - Check logs");
          }
        });
      }
    } else {
      console.log("No edits to save.")
    }
  }

  _reorderItem(fromIndex, toIndex) {    
    this.props.reorderItem(fromIndex, toIndex)
  }
  
  // This allows the status button text to change from 'Draft' to 'Publish' on hover.
  _setButtonText(text) {
    const { formHelpers } = this.state;
    let newFormHelpers = _.cloneDeep(formHelpers);
    newFormHelpers.buttonText = text || 'Draft'
    this.setState({ formHelpers: newFormHelpers });
  }

  render() {
    const { newTask, formHelpers, submitting } = this.state;
    const { index, clientTask, clientWorkflow, fileStore, loggedInUser, match } = this.props;
    // Determines available actions.
    const isDraft = clientTask && clientTask.status === 'draft' || clientWorkflow && clientWorkflow.status === 'draft';

    const taskEditorClass = classNames(
      '-task-editor'
      , {'-draft': clientTask && clientTask.status === 'draft'}
    )
    
    return (
      <div className={taskEditorClass}>
        { clientTask && newTask ?
          <div>
            <CloseWrapper
              isOpen={(this.state.taskOptionsOpen )}
              closeAction={() => this.setState({taskOptionsOpen: false})}
            />
            <div>
              { clientWorkflow.status === 'draft' || clientTask.status === 'draft' ?
                <button onClick={() => this._handleDelete(['task', index])} className="yt-btn link xx-small u-pullRight"><i className="far fa-times"></i></button>
                :
                null
              }
              { index > 0 ?
                <button onClick={() => this._reorderItem(index, index - 1)} className="yt-btn link xx-small"><i className="far fa-arrow-up"></i></button>
                :
                null
              }
              { index < clientWorkflow.items.length -1 ?
                <button onClick={() => this._reorderItem(index, index + 1)} className="yt-btn link xx-small"><i className="far fa-arrow-down"></i></button>
                :
                null
              }
            </div>
            <div className="-task-title">
              <div className={`-task-type -${clientTask.type}`}>
                <span className="-icon"><i className={displayUtils.getTaskIcon(clientTask.type)}/></span><span className="-index">{index + 1}</span>
              </div>
              <div className="-task-input">
                <TextInput
                  blur={this._handleSave}
                  change={this._handleChange}
                  name="newTask.title"
                  placeholder={displayUtils.getTaskPlaceholder(clientTask.type)}
                  value={newTask.title || ''}
                />
                { clientTask.type === 'document-delivery' ?
                <div>
                  { isDraft ?
                    <div className="yt-row">
                      <button className="yt-btn link xx-small" onClick={() => this.setState({uploadFilesModalOpen: true})}>
                        Upload files
                      </button>
                      <button className="yt-btn link xx-small" onClick={() => this.setState({attachFilesModalOpen: true})}>
                        or select existing files...
                      </button>
                    </div>
                    :
                    null
                  }
                  { newTask._files && newTask._files.length > 0 ?
                    newTask._files.map((fileId, i) => 
                      <FileDeliveryListItem
                        key={fileId + '_' + i}
                        file={fileStore.byId[fileId]}
                        filePath={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${fileId}`}
                        removeFile={this._handleRemoveFile}
                        allowRemove={isDraft}
                      />
                    )
                    :
                    null
                  }
                </div>
                : clientTask.type === 'signature-request' ?
                <div>
                  { isDraft && (!newTask._files || newTask._files < 1) ?
                    <div className="yt-row">
                      <button className="yt-btn link xx-small" onClick={() => this.setState({uploadFilesModalOpen: true})}>
                        Upload a file
                      </button>
                      <button className="yt-btn link xx-small" onClick={() => this.setState({attachFilesModalOpen: true})}>
                        or select an existing file...
                      </button>
                    </div>
                    :
                    null
                  }
                  { newTask._files && newTask._files.length > 0 ?
                    newTask._files.map((fileId, i) => 
                      <FileDeliveryListItem
                        key={fileId + '_' + i}
                        file={fileStore.byId[fileId]}
                        filePath={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files/${fileId}`}
                        removeFile={this._handleRemoveFile}
                        allowRemove={isDraft}
                      />
                    )
                    :
                    null
                  }
                  {/* Disable the esig modal until they upload or attach a file. */}
                  <button onClick={() => this.setState({eSigModalOpen: true})} className="yt-btn xx-small u-pullLeft" disabled={!newTask._files || newTask._files.length === 0 || newTask.status !== "draft"}>
                  { clientTask.signingLinks && clientTask.signingLinks.length > 0 ?
                    "Edit signature options"
                    :
                    "Prep for signature"
                  }
                  </button>
                </div>
                :
                null
                }
              </div>
              <div className="yt-col">
                <ToggleSwitchInput
                  change={this._handleChange}
                  disabled={clientTask.status === 'completed'}
                  label={'Needs Approval'}
                  name={'newTask.needsApproval'}
                  required={false}
                  rounded={true}
                  styles={{textAlign: 'center', paddingLeft: '12px', paddingRight: '12px', whiteSpace: 'nowrap'}}
                  value={newTask.needsApproval}
                />
              </div>
              <div className="-editor-due-date">
                {/* { clientTask ?
                  <div className="input-group -status">
                    <label>Status</label>
                  { clientTask.status === 'draft' ?
                      <button
                        className="yt-btn xx-small bordered -draft"
                        disabled={!newTask || !newTask.title || newTask.title.length < 2} // Don't allow users to publish clientTasks without a title.
                        onClick={this._handlePublish}
                        onMouseOver={() => this._setButtonText('Publish')}
                        onMouseOut={() => this._setButtonText('Draft')}
                      >
                        {formHelpers.buttonText || 'Draft'}
                      </button>
                    :
                    clientTask.status === 'open' ?
                      <button className="yt-btn xx-small -open" disabled>Open</button>
                    :
                    clientTask.status === 'awaitingApproval' ?
                      <button className="yt-btn xx-small -awaiting-approval" disabled>Awaiting Approval</button>
                    :
                    clientTask.status === 'completed' ?
                      <button className="yt-btn xx-small -completed" disabled>Completed</button>
                    :
                    null
                  }
                  </div>
                  :
                  null
                } */}
                
                <SingleDatePickerInput
                  anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
                  change={this._handleChange}
                  initialDate={DateTime.fromISO(newTask.dueDate).toMillis() || ''} // epoch/unix time in milliseconds
                  label="Due Date"
                  name='newTask.dueDate'
                  numberOfMonths={1}
                  placeholder={""}
                />
              </div>
            </div>
            <div className="add-new-task" onClick={() => this.setState({taskOptionsOpen: true})}>
              {/* <i className="far fa-plus-circle fa-lg"/> */}
              <span className="-icon">
                <i className="far fa-plus"/>
              </span>
            </div>
            <div className="dropdown">
              <ClientTaskOptionsMenu 
                handleCreate={this._handleCreate}
                index={index + 1}
                isOpen={this.state.taskOptionsOpen}
              />
            </div>
            <UploadFilesModal
              close={() => this.setState({uploadFilesModalOpen: false})}
              handleUploaded={this._handleUploadedFiles}
              isOpen={this.state.uploadFilesModalOpen}
              filePointers={{
                _client: match.params.clientId
                , _firm: match.params.firmId
                , _user: loggedInUser._id
                , status: 'visible'
              }}
              multiple={clientTask.type === 'document-delivery'} // signature requests should probably only allow one file.
              showStatusOptions={false}
            />
            <AttachFilesModal
              close={() => this.setState({attachFilesModalOpen: false})}
              fileListArgsObj={{'~client': match.params.clientId}}              
              isOpen={this.state.attachFilesModalOpen}
              multiple={clientTask.type === 'document-delivery'}
              onSubmit={this._handleAttachFiles}
              viewingAs="workspace"
              isConfigScreenView={true}
            />
            <PrepDocForESignatureModal
              attachFiles={() => this.setState({attachFilesModalOpen: true})}
              clientTask={newTask}
              close={() => this.setState({eSigModalOpen: false})}
              formHelpers={this.state.formHelpers}
              handleFilesChange={this._handleFilesChange}
              handleSave={this._handleSave}
              isOpen={this.state.eSigModalOpen}
              setUpdatedTask={(newTask) => this.setState({ newTask })}
              uploadFiles={() => this.setState({uploadFilesModalOpen: true})}
            />
          </div>
          :
          null 
        }
      </div>
    )
  }
}


ClientTaskEditor.propTypes = {
  clientTask: PropTypes.object
  , dispatch: PropTypes.func.isRequired
  , handleCreate: PropTypes.func.isRequired
  , handleDelete: PropTypes.func.isRequired
  , index: PropTypes.number 
  , reorderItem: PropTypes.func.isRequired
}

ClientTaskEditor.defaultProps = {
  index: null 
  , clientTask: null 
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientTaskStore: store.clientTask
    , fileStore: store.file
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientTaskEditor)
);