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
import * as folderTemplateActions from '../../folderTemplateActions';

// import global components
import Binder from "../../../../global/components/Binder.js.jsx";
import Modal from '../../../../global/components/modals/Modal.js.jsx';

// import file components;
import AttachFolderTemplateList from './AttachFolderTemplateList.js.jsx';

// import utils
import routeUtils from '../../../../global/utils/routeUtils';

class AttachFolderTemplatesModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      templateIds: this.props.selectedTemplateIds || []
      , folderTemplatesListArgsObj: {
        '_firm': props.match.params.firmId
      }
      , submitting: false
      , per: 50
    }
    this._bind(
      '_close'
      , '_handleFormSubmit'
      , '_handleFolderSelect'
      , '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    const folderTemplatesListArgsObj = routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj) // computed from the object
    dispatch(folderTemplateActions.fetchListIfNeeded(...folderTemplatesListArgsObj));  
    this._handleSetPagination({page: 1, per: 50});
  }

  // componentDidUpdate(prevProps, prevState) {
  //   // catch for state change and re-fetch file list if it happens
  //   // compare computed listArgs object
  //   if(routeUtils.listArgsFromObject(prevState.folderTemplatesListArgsObj) !== routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj)) {
  //     this.props.dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj)))
  //   }
  //   if(this.props.selectedTemplateIds.length !== prevProps.selectedTemplateIds.length) {
  //     console.log("update file list to this", this.props.selectedTemplateIds);

  //     this.setState({
  //       attachFilesModalOpen: this.props.selectedTemplateIds.length < 1
  //       , templateIds: this.props.selectedTemplateIds
  //     })
  //   }
  // }

  _handleFolderSelect(templateIds) {
    console.log('handle file select')
    let newTemplateIds = _.cloneDeep(this.state.templateIds);
    // Don't allow mutliple selections if this.props.multiple is false.
    if(this.props.multiple) {
      if(newTemplateIds.indexOf(templateIds) === -1) {
        // console.log("add file")
        newTemplateIds.push(templateIds)
      } else {
        // console.log('remove file');
        newTemplateIds.splice(newTemplateIds.indexOf(templateIds), 1);
      }
      newTemplateIds = _.uniq(newTemplateIds); // dedupe list 
    } else {
      if(newTemplateIds.indexOf(templateIds) === -1) {
        // Only one file is allowed, replace the old one.
        // console.log("add file")
        newTemplateIds = [templateIds]
      } else {
        // console.log('remove file');
        newTemplateIds = []
      }
    }
      // console.log(newTemplateIds);
      this.setState({
        templateIds: newTemplateIds
      })
  }

  _handleFormSubmit(e) {
    const { onSubmit } = this.props;
    console.log('submit')
    if(e) {
      e.preventDefault();
    }
    this.setState({submitting: true})
    onSubmit(this.state.templateIds)
    this._close();
  }

  _close() {
    this.setState({
      templateIds: []
      , submitting: false
    }, () => this.props.close())
  }

  _handleSetFilter(e) {
    let nextFileListArgsObj = { ...this.state.folderTemplatesListArgsObj }
    nextFileListArgsObj[e.target.name] = e.target.value;

    // console.log("next obj: ", nextFileListArgsObj)
    // console.log(routeUtils.listArgsFromObject(nextFileListArgsObj))
    this.setState({ folderTemplatesListArgsObj: nextFileListArgsObj }
    , () => this._handleSetPagination({page: 1, per: this.state.per})
    )
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const folderTemplatesListArgsObj = routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj);
    dispatch(folderTemplateActions.setPagination(newPagination, ...folderTemplatesListArgsObj));
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
      folderTemplateStore
      , isOpen
      , match
    } = this.props;
    const { 
      templateIds
      , submitting 
    } = this.state;

    const folderTemplateList = folderTemplateStore.util.getListInfo(...routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj));
    const folderTemplateListItems = folderTemplateStore.util.getList(...routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj));
    // const staffListItems = staffStore.util.getList('_firm', match.params.firmId);
    // const activeStaff = staffListItems ? staffListItems.filter(s => s.status === 'active') : [];

    console.log("templateIds", templateIds)

    const isEmpty = (
      !folderTemplateList
      || !folderTemplateList.items
      || folderTemplateStore.selected.didInvalidate
    );

    const isFetching = (
      !folderTemplateStore
      || folderTemplateStore.selected.isFetching
    );
    
    return (
      <Modal
        cardSize="jumbo"
        closeAction={this._close}
        closeText="Cancel"
        confirmAction={templateIds.length > 0 ? this._handleFormSubmit : null}
        confirmText={submitting ? "Submitting..." : "Done" }
        disableConfirm={submitting || !templateIds || templateIds.length < 1}
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
            <AttachFolderTemplateList
              folderTemplateList={folderTemplateList}
              handleFilter={this._handleSetFilter}
              handleSelectTemplate={this._handleFolderSelect}
              handleQuery={() => console.log('handle queery')}
              handleSetPagination={this._handleSetPagination}
              handleSort={() => console.log('handle sort')}
              multiple={false}
              selectedTemplateIds={templateIds}
              setPerPage={this._setPerPage}
              showActions={false}
              sortedAndFilteredList={folderTemplateListItems.sort((a,b) => a.updated_at > b.updated_at ? -1 : 1)} // TODO: update this
              viewingAs={this.props.viewingAs}
              totalListInfo={folderTemplateList}
            />
          }
        </div>
      </Modal>
    )
  }
}

AttachFolderTemplatesModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , multiple: PropTypes.bool
  , selectedTemplateIds: PropTypes.array 
  , viewingAs: PropTypes.string
}

AttachFolderTemplatesModal.defaultProps = {
  multiple: true
  , selectedTemplateIds: []
  , viewingAs: "staff" // or "client" to hide files.
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    folderTemplateStore: store.folderTemplate
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AttachFolderTemplatesModal)
);
