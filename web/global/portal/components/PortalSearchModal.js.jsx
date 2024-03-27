/**
 * Search modal component for the Client Portal.  Only searches client's files,
 * workflows & tasks. 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as clientActions from '../../../resources/client/clientActions';

// import global components
import Binder from '../../components/Binder.js.jsx';
import { SearchInput } from '../../components/forms';
import { routeUtils } from '../../utils';
import fileUtils from '../../utils/fileUtils';

// import resource components 
import ClientTaskSearchItem from '../../../resources/clientTask/components/ClientTaskSearchItem.js.jsx';
import ClientWorkflowSearchItem from '../../../resources/clientWorkflow/components/ClientWorkflowSearchItem.js.jsx';
import FileSearchItem from '../../../resources/file/components/FileSearchItem.js.jsx';

class PortalSearchModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      searchObj: {
        value: ''
      }
      , searched: false 
      , query: ''
      , viewing: 'files'
    }
    this._bind(
      '_handleClose'
      , '_handleClearSearch'
      , '_handleFormChange'
      , '_handleSubmit'
    )
  }

  _handleClearSearch() {
    this.setState({
      query: ''
      // , searched: false 
    })
  }

  _handleClose() {
    this.setState({
      searchObj: {
        value: ''
      }
      , query: ''
      , searched: false 
    })
    this.props.close();
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleSubmit(e) {
    const { dispatch, history, match } = this.props;
    e.preventDefault();
    let newQuery = this.state.query;
    if(newQuery.length > 0) {
      newQuery = newQuery.replace(/&/, '-AMPERSAND-');
      let searchObj = { value: newQuery };
      let searchObjString = routeUtils.queryStringFromObject(searchObj)
      // to execute, you need two queries, one for direct objects and the other for objects matching a text-searched Tag
      // this is because these lists will be different and we might want to display them differently
      // lists could also be combined when you display them if not
      dispatch(clientActions.fetchListIfNeeded('search', match.params.clientId, 'by-objects', searchObjString))
      dispatch(clientActions.fetchListIfNeeded('search', match.params.clientId, 'by-tags', searchObjString))
      this.setState({
        searched: true
        , searchObj: searchObj
      })
    }
  }

  render() {
    const { 
      clientStore 
      , clientTaskStore 
      , clientWorkflowStore 
      , isOpen
      , fileStore 
      , match 
      , userStore
      , firmStore
    } = this.props;

    const { searchObj, searched } = this.state;

    /**
     * This conditional tells the HTML <body> that there is a modal open, so we
     * should prevent scrolling behind the modal 
     */
    if(isOpen) {
      document.body.classList.toggle('modal-open', true);
    } else {
      document.body.classList.toggle('modal-open', false);
    }

    const searchObjString = searchObj.value ? routeUtils.queryStringFromObject(this.state.searchObj): null;
    const objListArgs = searched ? routeUtils.listArgsFromObject({
      'search': match.params.clientId
      , 'by-objects': searchObjString
    }) : null; 
    const tagListArgs = searched ? routeUtils.listArgsFromObject({
      'search': match.params.clientId
      , 'by-tags': searchObjString
    }) : null; 

    // compile file things 
    const selectedFirm = firmStore && firmStore.selected && firmStore.selected.getItem();
    const fileObjListItems = searched ? fileStore.util.getList(...objListArgs) : null;
    const fileTagListItems = searched ? fileStore.util.getList(...tagListArgs) : null;
    const fileObjList = fileObjListItems ? objListArgs.reduce((obj, nextKey) => obj[nextKey], fileStore.lists) : null
    const fileTagList = fileTagListItems ? tagListArgs.reduce((obj, nextKey) => obj[nextKey], fileStore.lists) : null
    // combine results
    const fileList = fileObjListItems && fileTagListItems ? fileObjListItems.concat(fileTagListItems) : [];
    const fileListItems = fileUtils.getGroupByFilename(selectedFirm, "default", fileList, {});

    // compile clientTask things 
    // const clientTaskObjListItems = searched ? clientTaskStore.util.getList(...objListArgs) : null;
    // const clientTaskObjList = clientTaskObjListItems ? objListArgs.reduce((obj, nextKey) => obj[nextKey], clientTaskStore.lists) : null
    // // combine results
    // const clientTaskListItems = clientTaskObjListItems || [];

    // // compile clientWorkflow things 
    // const clientWorkflowObjListItems = searched ? clientWorkflowStore.util.getList(...objListArgs) : null;
    // const clientWorkflowTagListItems = searched ? clientWorkflowStore.util.getList(...tagListArgs) : null;
    // const clientWorkflowObjList = clientWorkflowObjListItems ? objListArgs.reduce((obj, nextKey) => obj[nextKey], clientWorkflowStore.lists) : null
    // const clientWorkflowTagList = clientWorkflowTagListItems ? tagListArgs.reduce((obj, nextKey) => obj[nextKey], clientWorkflowStore.lists) : null
    // // combine results
    // const clientWorkflowListItems = clientWorkflowObjListItems && clientWorkflowTagListItems ?  clientWorkflowObjListItems.concat(clientWorkflowTagListItems) : [];
    

    const isFetching = (
      // !clientTaskObjListItems 
      // || clientTaskObjList.isFetching 
      // || !clientWorkflowObjListItems 
      // || !clientWorkflowTagListItems 
      // || clientWorkflowObjList.isFetching 
      // || clientWorkflowTagList.isFetching
      !fileObjListItems 
      || !fileTagListItems 
      || fileObjList.isFetching 
      || fileTagList.isFetching
    )

    return (
      <TransitionGroup>
        {isOpen ?
          <CSSTransition
            timeout={500}
            classNames="modal-anim"
          >
            <div className="portal-search-modal">
              <div className="portal-search-input">
                <button className="yt-btn large link -close" onClick={this._handleClose}><i className="far fa-times"/></button>
                <div className="yt-container skinny">
                  <form  name="portal-search" onSubmit={this._handleSubmit}>
                    <h1>Search Files and Tasks</h1>
                    <div className="input-add-on">
                      <input
                        autoComplete="off"
                        autoFocus={true}
                        type="search"
                        name="query"
                        value={this.state.query}
                        onChange={this._handleFormChange}
                      />
                      { this.state.searched ? 
                        <button 
                          type="button" 
                          className="item" 
                          onClick={this._handleClearSearch}
                        >
                          <i className="fal fa-times"/>
                        </button>
                        :
                        <button type="submit" className="item" onClick={this._handleSubmit}>
                          <i className=" fal fa-search"/>
                        </button>
                      }
                    </div>
                  </form>
                </div>
                <div className=" -results-tab">
                  <div className="yt-container skinny">
                    { searched ? 
                      <div className="tab-bar-nav">
                        <ul className="navigation">
                          <li>
                            <span className={`action-link ${this.state.viewing === 'files' ? 'active' : null}`} onClick={() => this.setState({viewing: 'files'})}>Files ({fileListItems.length}) </span>
                          </li>
                          {/* <li>
                            <span className={`action-link ${this.state.viewing === 'tasks' ? 'active' : null}`} onClick={() => this.setState({viewing: 'tasks'})}>Tasks ({clientTaskListItems.length}) </span>
                          </li>
                          <li>
                            <span className={`action-link ${this.state.viewing === 'workflows' ? 'active' : null}`} onClick={() => this.setState({viewing: 'workflows'})}>Workflows ({clientWorkflowListItems.length}) </span>
                          </li> */}
                        </ul>
                      </div>
                      :
                      null 
                    }
                  </div>
                </div>
              </div>
              <div className="portal-search-results">
                <div className="yt-container skinny">
                  { searched && isFetching ? 
                    <div className="-loading-hero">
                      <div className="u-centerText">
                        <div className="loading"></div>
                      </div>
                    </div>  
                    : searched ? 
                    <div className="-results-wrapper">
                     
                      { this.state.viewing === 'files' ? 
                        <div className="-search-results">
                          { fileListItems.length > 0 ?
                            fileListItems.map((file,i) =>
                              <FileSearchItem
                                file={file}
                                key={'file_' + file._id + i}
                                searchClasses="portal-search-item"
                                path={`/portal/${match.params.clientId}/files/${file._id}`}
                                userStore={userStore}
                              />
                            )
                            : 
                            <div className="-no-results">
                              <i className="far fa-exclamation-circle"/> No file results 
                            </div>
                          }
                        </div>
                        // : this.state.viewing === 'tasks' ? 
                        // <div className="-search-results">
                        //   { clientTaskListItems.length > 0 ?
                        //     clientTaskListItems.map((clientTask,i) => 
                        //       <ClientTaskSearchItem
                        //         key={'clientTask_' + clientTask._id + i}
                        //         clientTask={clientTask}
                        //         path={`/portal/${match.params.clientId}/client-workflows/${clientTask._clientWorkflow}`}
                        //         searchClasses="portal-search-item"
                        //       />
                        //     )
                        //     : 
                        //     <div className="-no-results">
                        //       <i className="far fa-exclamation-circle"/> No task results 
                        //     </div>
                        //   }
                        // </div>
                        // : this.state.viewing === 'workflows' ? 
                        // <div className="-search-results">
                        //   { clientWorkflowListItems.length > 0 ?
                        //     clientWorkflowListItems.map((clientWorkflow,i) => 
                        //       <ClientWorkflowSearchItem
                        //         key={'clientWorkflow_' + clientWorkflow._id + i}
                        //         clientWorkflow={clientWorkflow}
                        //         path={`/portal/${match.params.clientId}/client-workflows/${clientWorkflow._id}`}
                        //         searchClasses="portal-search-item"
                        //       />
                        //     )
                        //     : 
                        //     <div className="-no-results">
                        //       <i className="far fa-exclamation-circle"/> No workflow results 
                        //     </div>
                        //   }
                        // </div>
                        :
                        null 
                      }
                    </div>
                    :
                    null 
                  }
                </div>
              </div>
            </div>
          </CSSTransition>
          :
          null
        }
      </TransitionGroup>
    )
  }
}

PortalSearchModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired 
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client
    , clientTaskStore: store.clientTask 
    , clientWorkflowStore: store.clientWorkflow 
    , fileStore: store.file 
    , userStore: store.userStore
    , firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalSearchModal)
);