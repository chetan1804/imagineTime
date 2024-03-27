/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as firmActions from '../../../resources/firm/firmActions';

// import global components
import Binder from '../../components/Binder.js.jsx';
import CloseWrapper from '../../components/helpers/CloseWrapper.js.jsx';
import { routeUtils } from '../../utils';
import fileUtils from '../../utils/fileUtils';
import PracticeMagicSearchFilter from './PracticeMagicSearchFilter.js.jsx';

import { 
  SearchInput 
  , SelectFromObject
  , ToggleSwitchInput 
  , SingleDatePickerInput
  , CheckboxInput
  , DateRangePickerInput
  , TextInput
} from '../../components/forms';

// import resource components 
import ClientTaskSearchItem from '../../../resources/clientTask/components/ClientTaskSearchItem.js.jsx';
import ClientWorkflowSearchItem from '../../../resources/clientWorkflow/components/ClientWorkflowSearchItem.js.jsx';
import FileSearchItem from '../../../resources/file/components/FileSearchItem.js.jsx';
import QuickTaskSearchItem from '../../../resources/quickTask/components/QuickTaskSearchItem.js.jsx';
import _ from 'lodash';

class PracticeMagicSearchBox extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      filter: {
        resource: null 
        , userId: null
        , clientId: this.props.match.params.clientId || null
      }
      , searchObj: {
        value: ''
      }
      , query: ''
      , searching: false 
      , searched: false 
      , showResults: false 
      , loading: true // testing
      , viewing: 'files'
    }
    this._bind(
      '_handleClose'
      , '_handleClearSearch'
      , '_handleInputChange'
      , '_handleSearch'
      , '_handleFormChange'
      , '_handleFilterChange'
      , '_handleKeyDown'
      , '_handleSearchClick'
    )

    this.fileFilter = {
      dateCreated: {
        startDate: DateTime.local().minus({ days: 30 }).toMillis()
        , endDate: DateTime.local().toMillis()
      }
      , clientName: ""
      , creatorName: ""
      , status: {
        visible: true
        , hidden: true
        , archived: true
      }
      , typeName: ""
    }
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    // fire actions
  }

  _handleClearSearch() {
    this.setState({
      query: ''
    })
  }

  _handleClose() {
    this.setState({
      searchObj: {
        value: ''
      }
      , query: ''
      , searched: false 
      , showResults: false
      , filter: {
        resource: null 
        , userId: null
        , clientId: this.props.match.params.clientId || null
      }
    })
    // this.props.close();
  }


  _handleInputChange(e) {
    let origState = _.cloneDeep(this.state);
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
    // if(newState.query.length !== origState.query.length) {
    //   this._handleSearch()
    // }
  }

  _handleKeyDown(e) {
    console.log('e.key', e.key);
    if (e.key === 'Enter') {
      console.log('do validate');
      console.log('keydown press');
      this._handleSearch()
    }
  }

  _handleSearchClick() {
    this._handleSearch()
  }

  _handleSearch(e) {
    console.log("start search");
    const { dispatch, history, match } = this.props;
    if(e) {
      e.preventDefault();
    }
    
    const { dateCreated, clientName, creatorName, status, typeName } = _.cloneDeep(this.fileFilter);
    let newQuery = this.state.query;
    if(newQuery.length > 0) {
      newQuery = newQuery.replace(/&/, '-AMPERSAND-');
      let searchObj = { value: newQuery };
      let searchObjString = routeUtils.queryStringFromObject(searchObj)
      let newState = {...this.state};
      newState.searchObj = { value: newQuery };
      newState.searched = true;
      newState.searching = true;
      this.setState(newState);

      console.log("searchObjString", searchObjString);
      console.log("newState", newState)
      // to execute, you need two queries, one for direct objects and the other for objects matching a text-searched Tag
      // this is because these lists will be different and we might want to display them differently
      // lists could also be combined when you display them if not

      const sendQuery = {
        query: searchObjString
        // , dateCreated
        , clientName
        , creatorName
        , status
        , typeName
        , _firm: match.params.firmId
      }

      // original search
      // const sendQuery = {
      //   query: searchObjString
      //   // , dateCreated
      //   // , clientName
      //   // , creatorName
      //   , status
      //   // , typeName
      //   , _firm: match.params.firmId
      // }
      console.log("this.fileFilter", this.fileFilter);
      console.log("this.fileFilter", sendQuery);
      
      console.log("searchObjString", searchObjString)
      dispatch(firmActions.fetchListIfNeeded('search', match.params.firmId, 'by-objects', searchObjString));
      dispatch(firmActions.fetchListIfNeeded('search', match.params.firmId, 'by-tags', searchObjString));
      dispatch(firmActions.fetchFileListFromSearch(sendQuery, ['search', match.params.firmId, 'by-objects', searchObjString])).then(fileSearch => {
        this.setState({ searching: false });
      });
      this.setState({showResults: true})
    }
  }

  _handleFormChange(e) {
    let newState = _.update( this.state, e.target.name, function() {
      return e.target.value;
    });
    if (e.target.name === "type.enable" && !e.target.value) {
      newState["type"].name = "";
    }
    this.setState(newState);
  }

  _handleFilterChange(filter) {
    console.log("filter1", filter)
    this.fileFilter = _.cloneDeep(filter);
  }

  render() {
    const { 
      clientStore 
      , clientTaskStore 
      , clientWorkflowStore 
      , isOpen
      , fileStore 
      , match 
      , quickTaskStore
      , userStore
      , firmStore
    } = this.props;

    const { 
      searchObj
      , searched
      , searching
      , advanceSearch
    } = this.state;

    // console.log('-------------------- render', render);
    // console.log(this.state);

    const selectedFirm = firmStore && firmStore.selected && firmStore.selected.getItem();
    const searchObjString = searchObj.value ? routeUtils.queryStringFromObject(this.state.searchObj): null;
    // console.log(searchObjString);
    const objListArgs = searched ? routeUtils.listArgsFromObject({
      'search': match.params.firmId
      , 'by-objects': searchObjString
    }) : null; 
    const tagListArgs = searched ? routeUtils.listArgsFromObject({
      'search': match.params.firmId
      , 'by-tags': searchObjString
    }) : null; 
    // console.log(objListArgs);
    // compile file things 
    const fileObjListItems = searched ? fileStore.util.getList(...objListArgs) : null;
    const fileTagListItems = searched ? fileStore.util.getList(...tagListArgs) : null;
    const fileObjList = fileObjListItems ? objListArgs.reduce((obj, nextKey) => obj[nextKey], fileStore.lists) : null
    const fileTagList = fileTagListItems ? tagListArgs.reduce((obj, nextKey) => obj[nextKey], fileStore.lists) : null
    // combine results
    const fileList = fileObjListItems && fileTagListItems ? fileObjListItems.concat(fileTagListItems) : [];
    let fileListItems = fileUtils.getGroupByFilename(selectedFirm, "global", fileList, { clientStore });
    if (fileListItems && fileListItems.length) {
      fileListItems = _.orderBy(fileListItems, [item => item.filename.toLowerCase()], ['asc']); 
      fileListItems = fileListItems.sort((a,b) => {
        let aIndex = a.category === "folder" ? 0 : 1;
        let bIndex = b.category === "folder" ? 0 : 1;
        return aIndex - bIndex;
      });
    }

    // compile client things 
    let clientObjListItems = searched ? clientStore.util.getList(...objListArgs) : null;
    if (clientObjListItems && clientObjListItems.length) {
      clientObjListItems = _.orderBy(clientObjListItems, [item => item.name.toLowerCase()], ['asc']); 
    }
    const clientObjList = clientObjListItems ? objListArgs.reduce((obj, nextKey) => obj[nextKey], clientStore.lists) : null;

    // combine results
    const clientListItems = (clientObjListItems || []).map(c => {
      let newItem = {
        ...c
        , itemType: 'client'
        , itemDisplay: 'Client'
        , location: c.name
      }
      return newItem;
    });

    // const quickTaskObjListItems = searched ? quickTaskStore.util.getList(...objListArgs) : null;
    // const quickTaskObjList = quickTaskObjListItems ? objListArgs.reduce((obj, nextKey) => obj[nextKey], quickTaskStore.lists) : null
    // // combine results
    // const quickTaskListItems = (quickTaskObjListItems || []).map(qT => {
    //   let newItem = {
    //     ...qT
    //     , itemType: 'quick-task'
    //     , itemDisplay: 'Quick Task'
    //     , location: quickTaskStore.byId[qT._client] ? quickTaskStore.byId[qT._client].name : 'Workspace'
    //   }
    //   return newItem; 
    // });
    
    // combine all results and sort by date 
    const allSearchResults = clientListItems.concat(fileListItems);

    const isFetching = (
      // !clientTaskObjListItems 
      // || clientTaskObjList.isFetching 
      // || !clientWorkflowObjListItems 
      // || !clientWorkflowTagListItems 
      // || clientWorkflowObjList.isFetching 
      // || clientWorkflowTagList.isFetching
      !clientObjListItems 
      || clientObjList.isFetching 
      || !fileObjListItems 
      || !fileTagListItems 
      || fileObjList.isFetching 
      || fileTagList.isFetching
      // || !quickTaskListItems
    )

    const resultsClass = classNames(
      '-results'
      , { '-hidden': !this.state.showResults }
    )

    return (
      <div className="-practice-magic-search-wrapper">
        <div className="-search" >
          <SearchInput
            change={this._handleInputChange}
            // focus={() => this.setState({showResults: true})}
            name="query"
            placeholder="Search"
            required={false}
            value={this.state.query}
            keydown={this._handleKeyDown}
            click={this._handleSearchClick}
            showButton={true}
          />
        </div>
        <CloseWrapper
          isOpen={this.state.showResults}
          closeAction={this._handleClose}
        />
        <div className={resultsClass}>
            <div style={{display: 'flex', flexDirection: 'column', maxHeight: '80vh'}}>
              {/* <div className="-results-instructions">
                <p>Press <strong>enter</strong> to select, <strong>↑ ↓</strong> or <strong>tab</strong> to navigate, <strong>esc</strong> to dismiss</p>
              </div> */}
              <PracticeMagicSearchFilter 
                handleSearch={this._handleSearch}
                handleFilterChange={this._handleFilterChange}
              />
              <div className="-results-body">
                { searched && isFetching || searching ?
                  <div className="-search-results">
                    <p className="u-muted"><strong>Searching...</strong></p>                  
                    <div className="u-centerText">
                      <div className="loading -small"></div>
                    </div>
                  </div>
                  : searched ? 
                  <div className="-search-results">
                    <p><strong>Search results ({allSearchResults.length})</strong></p>
                    { allSearchResults.length > 0 ?
                      allSearchResults.map((item,i) =>
                      // {
                      //   console.log(item);
                      //   return (<div key={'item_' + i}>item</div>)
                      // }
                        !item ? null :
                        <div key={'item_' + item.itemType + '_' + item._id + '_' + i} onClick={this._handleClose} style={{marginBottom: '32px'}}>
                          <p className="u-muted">{item.itemDisplay} - {item.location} - {DateTime.fromISO(item.updated_at).toRelativeCalendar()}</p>
                          { item.itemType === 'file' ?
                            <FileSearchItem
                              file={item}
                              // path={item._client ? `/firm/${match.params.firmId}/workspaces/${item._client}/files/${item._id}` : item._personal ? `/firm/${match.params.firmId}/files/${item._personal}/personal/${item._id}` : `/firm/${match.params.firmId}/files/public/${item._id}`}
                              path={
                                item._client ? `/firm/${match.params.firmId}/workspaces/${item._client}/files/${item._id}`
                                : item._personal ? `/firm/${match.params.firmId}/files/${item._personal}/personal/${item._id}`
                                : `/firm/${match.params.firmId}/files/public/${item._id}`
                              }
                              searchClasses="portal-search-item"
                              userStore={userStore}
                            />
                            // : item.itemType === 'client-workflow' ? 
                            // <ClientWorkflowSearchItem
                            //   clientWorkflow={item}
                            //   path={`/firm/${match.params.firmId}/workspaces/${item._client}/client-workflows/${item._id}`}
                            //   searchClasses="portal-search-item"
                            // />
                            // : item.itemType === 'client-task' ? 
                            // <ClientTaskSearchItem
                            //   clientTask={item}
                            //   path={`/firm/${match.params.firmId}/workspaces/${item._client}/client-workflows/${item._clientWorkflow}`}
                            //   searchClasses="portal-search-item"
                            // />
                            // : item.itemType === 'quick-task' ? 
                            //   <QuickTaskSearchItem
                            //     quickTask={item}
                            //     path={`/firm/${match.params.firmId}/workspaces/${item._client}/quick-tasks/quick-view/${item._id}`}
                            //     searchClasses="portal-search-item"
                            //   />
                            : item.itemType === 'client' ? 
                            <div className="firm-search-item">
                              <h4 style={{ marginTop: "0.7em" }}>{item.name} {item.status !== 'visible' ? '(' + item.status + ')' : null}</h4>
                              <Link to={`/firm/${match.params.firmId}/workspaces/${item._id}/files`}>Go to client workspace</Link>
                              <br/>
                              <Link to={`/firm/${match.params.firmId}/clients/${item._id}`}>Go to client settings</Link>
                            </div>
                            :
                            null 
                          }
                        </div> 
                      )
                      : 
                      <div className="-no-results">
                        <i className="far fa-exclamation-circle"/> No results. Perhaps try something less specific.  
                      </div>
                    }
                  </div>
                  :
                  null 
                }
              </div>
              {/* <div className="-results-footer">
                <p>Press <strong>Ctrl+K</strong> to access search faster.</p>
              </div> */}
            </div>

        </div>
      </div>
    )
  }
}

PracticeMagicSearchBox.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeMagicSearchBox.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientStore: store.client
    , clientTaskStore: store.clientTask 
    , clientWorkflowStore: store.clientWorkflow 
    , fileStore: store.file 
    , quickTaskStore: store.quickTask 
    , userStore: store.user 
    , firmStore: store.firm
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeMagicSearchBox)
);
