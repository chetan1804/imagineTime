
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../global/components/forms';

// import utilities
import filterUtils from '../../../global/utils/filterUtils';
import templateUtils from '../../../global/utils/templateUtils.js';

// import resource components
import DocumentTemplatesListItems from './DocumentTemplatesListItems.js.jsx';

class DocumentTemplatesList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs 
    }
    this._bind(
      '_handleDownloadTemplates'
    )
  }

  _handleDownloadTemplates() {

    const { selectedTemplateIds, documentTemplateMap } = this.props;

    // download files
    let templateLinks = selectedTemplateIds.filter(id => id && documentTemplateMap[id] )
    .map(item => templateUtils.getDownloadLink(documentTemplateMap[item]));
    this._downloadSelectedFiles(templateLinks, 0);
  }

  _downloadSelectedFiles(downloadlinks, index) {

    if(index < downloadlinks.length) {
      var a  = document.createElement("a"); 
      a.setAttribute('href', `${downloadlinks[index]}`); 
      a.setAttribute('download', '');
      a.setAttribute('target', '_blank');       
      a.click();
      index++;
      setTimeout(() => {
        this._downloadSelectedFiles(downloadlinks, index); 
      }, 500);
    }
  }

  render() {
    const {
      handleSetPagination
      , paginatedList
      , sortedAndFilteredList
      , documentTemplateList
      , userMap
      , match
      , setPagination
      , setPerPage
      , handleQuery
      , fileQuery
      , handleOpenModal
      , handleToggleSelectAll
      , selectedTemplateIds
      , handleSelectTemplate
    } = this.props;
    

    // const isFiltered = documentTemplateStore && documentTemplateStore.query && documentTemplateStore.query.length > 0;
    const allTemplatesSelected = selectedTemplateIds && selectedTemplateIds.length ? paginatedList.every(p => selectedTemplateIds.includes(p._id)) : false; 

    return (
      <div className="file-list-wrapper">
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-options -left">
              <div className="tab-bar-nav" style={{ marginTop: 0 }}>
                <ul className="navigation">
                  <li>
                    <NavLink exact 
                      to={`/firm/${match.params.firmId}/settings/documents`} className="-link-border-none active">
                      Templates
                    </NavLink>
                    <NavLink exact 
                      to={`/firm/${match.params.firmId}/settings/documents/merge-fields`} className="-link-border-none">
                      Merge Fields
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>
            <div className="yt-tools -right">
              <button 
                disabled={selectedTemplateIds && selectedTemplateIds.length === 0}
                className="yt-btn x-small link info -download-option" 
                onClick={this._handleDownloadTemplates}>
                Download { selectedTemplateIds && selectedTemplateIds.length > 0 ? <span> &mdash; {selectedTemplateIds.length }</span> : null
                }
              </button>
              <button className="yt-btn x-small info" onClick={() => handleOpenModal("document_editor", null)}>Create template</button>
              <button className="yt-btn x-small info" onClick={() => handleOpenModal("document_template_upload", null)}>Upload new template</button>
            </div>
          </div>
        </div>
        <hr className="-mobile-yt-hide" style={{ margin: 0 }} />
        <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
          <div className="table-caption">
            <PageTabber
              totalItems={sortedAndFilteredList.length}
              totalPages={Math.ceil(sortedAndFilteredList.length / documentTemplateList.pagination.per)}
              pagination={documentTemplateList.pagination}
              setPagination={setPagination}
              setPerPage={setPerPage}
              viewingAs="top"
              itemName="templates"
              searchText="Search..."
              handleQuery={handleQuery}
              query={fileQuery}
              enableSearch={true}
            />
          </div>
          <div className="-table-horizontal-scrolling">
            <div className="table-head" >
            <div className="table-cell">
                { handleToggleSelectAll ? 
                  <CheckboxInput
                    name="file"
                    value={allTemplatesSelected}
                    change={() => handleToggleSelectAll(paginatedList, allTemplatesSelected)}
                    checked={allTemplatesSelected}
                  />
                  :
                  null
                }
              </div>
              <div></div>
              <div className="table-cell -title" style={{ minWidth: "400px" }}>Name</div>
              <div className="table-cell _30">Created By</div>
              <div className="table-cell -date _15">Date Created</div>
            </div>
            {
              paginatedList && paginatedList.length ? 
              paginatedList.map((template, i) => 
                <DocumentTemplatesListItems
                  key={i}
                  template={template}
                  handleSelectTemplate={handleSelectTemplate}
                  checked={selectedTemplateIds.includes(template._id)}
                  handleOpenModal={handleOpenModal}
                />
              )
              :
              <div className="table-head empty-state">
                <div className="table-cell" colSpan="3">
                  <em>No document template</em>
                </div>
              </div>
            }
          </div>
        </div>
        <PageTabber
          totalItems={sortedAndFilteredList.length}
          totalPages={Math.ceil(sortedAndFilteredList.length / documentTemplateList.pagination.per)}
          pagination={documentTemplateList.pagination}
          setPagination={setPagination}
          setPerPage={setPerPage}
          viewingAs="bottom"
          itemName="templates"
        />
      </div>
    )
  }
}

DocumentTemplatesList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , handleFilter: PropTypes.func
  , handleQuery: PropTypes.func 
  , paginatedList: PropTypes.array.isRequired
  , sortedAndFilteredList: PropTypes.array
  , documentTemplateStore: PropTypes.object
  , viewingAs: PropTypes.string 
}

DocumentTemplatesList.defaultProps = {
  alldocumentTemplates: null 
  , handleFilter: null
  , handleQuery: null 
  , handleSort: null 
  , sortedAndFilteredList: []
  , viewingAs: 'table'
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  const { documentTemplateStore, documentTemplateListItems } = props;
  const userMap = store.user && store.user.byId;
  let paginatedList = [];
  let sortedAndFilteredList = documentTemplateListItems;

  if(sortedAndFilteredList) {
    const documentTemplateMap = store.documentTemplate.byId;
    const query = documentTemplateStore.query;

    console.log('documentTemplateMap', documentTemplateMap)
    console.log('query', query)

    // FILTER BY QUERY
    let queryTestString = ("" + query).toLowerCase().trim();
    queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers

    if (queryTestString && query) {
      sortedAndFilteredList = sortedAndFilteredList.filter(file => {
        const user = userMap && userMap[file._user] ? userMap[file._createdBy] : ""
        file.fullname = user ? `${user.firstname} ${user.lastname}` : "";
        file.username = user ? user.username : "";
        return filterUtils.filterFile(queryTestString, file);
      });
    }


    if (sortedAndFilteredList) {
      sortedAndFilteredList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['desc']);
    }

    const pagination = documentTemplateStore.pagination || {page: 1, per: 50};

    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(sortedAndFilteredList, start, end);      
  }
  
  console.log('paginatedList', paginatedList, sortedAndFilteredList)

  return {
    paginatedList: paginatedList
    , sortedAndFilteredList: sortedAndFilteredList
    , userMap: store.user.byId
    , documentTemplateMap: store.documentTemplate.byId
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(DocumentTemplatesList)
);