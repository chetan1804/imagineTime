/**
 * A reusable component to attach existing files to any resource.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as fileActions from '../fileActions';
import * as tagActions from '../../tag/tagActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';

// import file components;
import AttachFilesList from './AttachFilesList.js.jsx';

// import utils
import routeUtils from '../../../global/utils/routeUtils';

class AttachFilesModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      fileIds: this.props.selectedFileIds || []
      , fileListArgsObj: this.props.fileListArgsObj
      , submitting: false
      , per: 50
    }
    this._bind(
      '_close'
      , '_handleFormSubmit'
      , '_handleFileSelect'
      , '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
    );
  }

  componentDidMount() {
    const { dispatch, match, listArgs } = this.props;

    dispatch(fileActions.fetchListIfNeeded(...listArgs));
    dispatch(fileActions.setPagination({page: 1, per: 50}, ...listArgs));
    dispatch(fileActions.setFilter({query: '', sortBy: '-date'}, ...listArgs));
    dispatch(fileActions.setQuery('', ...listArgs));
    dispatch(tagActions.fetchListIfNeeded(...listArgs));
    this._handleSetPagination({ page: 1, per: 50 });
  }

  componentDidUpdate(prevProps, prevState) {
    // catch for state change and re-fetch file list if it happens
    // compare computed listArgs object
    // if(routeUtils.listArgsFromObject(prevState.fileListArgsObj) !== routeUtils.listArgsFromObject(this.state.fileListArgsObj)) {
    //   this.props.dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.fileListArgsObj)))
    // }
    if(this.props.selectedFileIds.length !== prevProps.selectedFileIds.length) {
      console.log("update file list to this", this.props.selectedFileIds);

      this.setState({
        attachFilesModalOpen: this.props.selectedFileIds.length < 1
        , fileIds: this.props.selectedFileIds
      })
    }
  }

  _handleFileSelect(fileId) {
    console.log('handle file select')
    let newFileIds = _.cloneDeep(this.state.fileIds);
    // Don't allow mutliple selections if this.props.multiple is false.
    if(this.props.multiple) {
      if(newFileIds.indexOf(fileId) === -1) {
        // console.log("add file")
        newFileIds.push(fileId)
      } else {
        // console.log('remove file');
        newFileIds.splice(newFileIds.indexOf(fileId), 1);
      }
      newFileIds = _.uniq(newFileIds); // dedupe list 
    } else {
      if(newFileIds.indexOf(fileId) === -1) {
        // Only one file is allowed, replace the old one.
        // console.log("add file")
        newFileIds = [fileId]
      } else {
        // console.log('remove file');
        newFileIds = []
      }
    }
      // console.log(newFileIds);
      this.setState({
        fileIds: newFileIds
      })
  }

  _handleFormSubmit(e) {
    const { onSubmit } = this.props;
    console.log('submit')
    if(e) {
      e.preventDefault();
    }
    this.setState({submitting: true})
    onSubmit(this.state.fileIds)
    this._close();
  }

  _close() {
    this.setState({
      fileIds: []
      , submitting: false
    }, () => this.props.close())
  }

  _handleSetFilter(e) {
    // let nextFileListArgsObj = { ...this.state.fileListArgsObj }
    // nextFileListArgsObj[e.target.name] = e.target.value;
    
    // // console.log("next obj: ", nextFileListArgsObj)
    // // console.log(routeUtils.listArgsFromObject(nextFileListArgsObj))
    // this.setState({ fileListArgsObj: nextFileListArgsObj }
    // , () => this._handleSetPagination({page: 1, per: this.state.per})
    // )
  }

  _handleSetPagination(newPagination) {
    const { dispatch, listArgs } = this.props;
    dispatch(fileActions.setPagination(newPagination, ...listArgs));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: per});
  }


  render() {
    const { 
      fileStore
      , isOpen
      , match
      , tagStore
      , listArgs 
      , isConfigScreenView
    } = this.props;
    const { 
      fileIds
      , submitting
    } = this.state;

    // totalListInfo is the original fetched list. We'll use it to keep track of total item quantity.
    // const totalFileListInfo = fileStore.lists && fileStore.lists._client ? fileStore.lists._client[match.params.clientId] : null;
    // const fileList = fileListItems ? listArgs.reduce((obj, nextKey) => obj[nextKey], fileStore.lists) : null;
    const allTags = match.params.firmId ? tagStore.util.getList('~firm', match.params.firmId) : tagStore.util.getList('~client', match.params.clientId);
    console.log('allTags', allTags);
    const utilFileStore = fileStore.util.getSelectedStore(...listArgs);
    let fileListItems = fileStore.util.getList(...listArgs);

    // filter file list
    if (fileListItems) {

      // filter if public or personal
      if (match.params.userId) {
        //fileListItems = fileListItems.filter(file => match.params.userId == file._personal && file.category != "folder");

        fileListItems = fileListItems.filter(file => match.params.userId == file._personal);
      } else {
        //fileListItems = fileListItems.filter(file => !file._personal && file.category != "folder");

        fileListItems = fileListItems.filter(file => !file._personal);
      }

      // filter if root or associated with folder
      if (match.params.folderId) {
        fileListItems = fileListItems.filter(file => match.params.folderId == file._folder);
      } else {
        fileListItems = fileListItems.filter(file => !file._folder);
      }

      fileListItems = fileListItems.sort((a,b) => a.created_at > b.created_at ? -1 : 1);
    }

    const isEmpty = (
      !fileListItems
      || !utilFileStore
    )

    const isFetching = (
      !fileListItems
      || !utilFileStore
      || utilFileStore.isFetching
    )

    console.log("loadAttachFilesModal", utilFileStore, fileListItems)
    
    return (
      <Modal
        cardSize="jumbo"
        closeAction={this._close}
        closeText="Cancel"
        confirmAction={fileIds.length > 0 ? this._handleFormSubmit : null}
        confirmText={submitting ? "Submitting..." : "Done" }
        disableConfirm={submitting || !fileIds || fileIds.length < 1}
        fixed={true}
        isOpen={isOpen}
        modalHeader={this.props.multiple ? "Select files" : "Select a file" }
      >
        <div style={{ opacity: isFetching ? 0.5 : 1 }}>
          {isEmpty ?
            (isFetching ? 
              <div className="-loading-hero hero">
                <div className="u-centerText">
                  <div className="loading"></div>
                </div>
              </div>  
              : 
              <h2>Empty.</h2>
            )
            :
            <AttachFilesList
              allTags={allTags}
              fileList={utilFileStore}
              handleFilter={this._handleSetFilter}
              handleSelectFile={this._handleFileSelect}
              handleQuery={() => console.log('handle queery')}
              handleSetPagination={this._handleSetPagination}
              handleSort={() => console.log('handle sort')}
              multiple={this.props.multiple}
              selectedTagIds={[]} // this.state.fileListArgsObj._tags || []}
              selectedFileIds={fileIds}
              setPerPage={this._setPerPage}
              showActions={false}
              sortedAndFilteredList={fileListItems} // TODO: update this 
              totalListInfo={utilFileStore}
              viewingAs={this.props.viewingAs}
              isConfigScreenView={this.props.isConfigScreenView}
            />
          }
        </div>
      </Modal>
    )
  }
}

AttachFilesModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , fileListArgsObj: PropTypes.object.isRequired
  , isOpen: PropTypes.bool.isRequired
  , multiple: PropTypes.bool
  , selectedFileIds: PropTypes.array 
  , viewingAs: PropTypes.string
  , isConfigScreenView: PropTypes.bool
}

AttachFilesModal.defaultProps = {
  multiple: true
  , selectedFileIds: []
  , viewingAs: "staff" // or "client" to hide files.
  , isConfigScreenView: false
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    fileStore: store.file
    , tagStore: store.tag
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AttachFilesModal)
);
