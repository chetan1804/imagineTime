/**
 * Helper component to handle pagination UI on any lists
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';

// import components
import Binder from '../Binder.js.jsx';
import { SearchInput } from '../forms';

class PageTabber extends Binder {
  constructor(props) {
    super(props);
    this.state = {}
    this._bind(
      '_handleNext'
      , '_handlePrevious'
      , '_jumpToPage'
      , '_handleKeyDown'
    )
  }

  _handlePrevious() {
    var newPagination = this.props.pagination;
    newPagination.page--;
    this.props.setPagination(newPagination);
  }

  _handleNext() {
    var newPagination = this.props.pagination;
    newPagination.page++;
    this.props.setPagination(newPagination);
  }

  _jumpToPage(page) {
    var newPagination = this.props.pagination;
    newPagination.page = parseInt(page);
    this.props.setPagination(newPagination);
  }

  _handleKeyDown(e) {
    console.log('e.key', e.key);
    if (e.key === 'Enter' && this.props.handleSearch) {
      console.log('do validate');
      console.log('keydown press');
      this.props.handleSearch();
    }
  }

  render() {
    const { 
      pagination
      , totalPages
      , totalItems
      , setPerPage
      , viewingAs
      , isFiltered
      , query
      , handleQuery
      , searchText
      , showSearch
      , enableSearch
      , firmId
      , clientId
      , userId
      , folderId
      , isChanged
      , staffId
      , handleSearch
    } = this.props;
    let itemName = this.props.itemName;

    const urlQuery = new URLSearchParams(location.search);

    let before;
    let after;
    let currentPage = urlQuery.get('page') || pagination.page || 1;
    currentPage = parseInt(currentPage);
    let pageSize = urlQuery.get('per') || pagination.per || 50;
    pageSize = parseInt(pageSize);
    let startEntry = ((currentPage - 1) * pageSize) + (totalItems > 0 ? 1 : 0);
    let endEntry = Math.min((pageSize - 1 + startEntry), totalItems);
    if (currentPage >= 1 && currentPage <= 3) {
      before = 1;
      after = Math.min(5, totalPages);
    } else if ((currentPage+2) > totalPages) {
      after = Math.min(currentPage+2, totalPages);
      before = currentPage - ((totalPages-currentPage) === 0 ? 4 : 3);
    } else {
      before = currentPage - 2;
      after = Math.min(currentPage+2, totalPages);
    }

    console.log("currentPage", currentPage)

    after++;
    const arrayPages = _.range(before, after);

    //console.log("before", before)
    //console.log("after", after)
    //console.log("arrayPages", arrayPages)

    var prevClass = classNames(
      'prev-page'
      , {'disabled': currentPage === 1 }
    )

    var nextClass = classNames(
      'next-page'
      , {'disabled': (currentPage === totalPages || totalPages < 1) }
    )

    startEntry = isNaN(startEntry) ? 0 : startEntry;
    endEntry = isNaN(endEntry) ? 0 : endEntry;

    let url; 

    if (itemName === 'archived files') {
      if (window.location.pathname === `/firm/${firmId}/workspaces/${clientId}/files/archived`) {
        url = `/firm/${firmId}/workspaces/${clientId}/files/archived`
      }
      if (window.location.pathname === `/firm/${firmId}/files/${clientId}/workspace/archived`) {
        url = `/firm/${firmId}/files/${clientId}/workspace/archived`
      }
      if (window.location.pathname === `/firm/${firmId}/files/public/archived`) {
        url = `/firm/${firmId}/files/public/archived`
      }
      if (window.location.pathname === `/firm/${firmId}/files/public/${folderId}/folder/archived`) {
        url = `/firm/${firmId}/files/public/${folderId}/folder/archived`
      }
      if (window.location.pathname === `/firm/${firmId}/files/${userId}/personal/archived`) {
        url = `/firm/${firmId}/files/${userId}/personal/archived`
      }
      if (window.location.pathname === `/firm/${firmId}/files/${userId}/personal/${folderId}/folder/archived`) {
        url = `/firm/${firmId}/files/${userId}/personal/${folderId}/folder/archived`
      }
    } else if (itemName === 'archived clients') {
      if (window.location.pathname === `/firm/${firmId}/clients/archived`) {
        url = `/firm/${firmId}/clients/archived`
      }
    } else if (itemName === "workspaces") {
      if (window.location.pathname === `/firm/${firmId}/workspaces`) {
        url = `/firm/${firmId}/workspaces`
      }
    } else if (itemName === "files") {
      if (window.location.pathname === `/firm/${firmId}/files/${clientId}/workspace/archived`) {
        url = `/firm/${firmId}/files/${clientId}/workspace/archived`
      }
      if (window.location.pathname === `/firm/${firmId}/files/${clientId}/workspace/${folderId}/folder`) {
        url = `/firm/${firmId}/files/${clientId}/workspace/${folderId}/folder`
      }
      if (window.location.pathname === `/firm/${firmId}/workspaces/${clientId}/files`) {
        url = `/firm/${firmId}/workspaces/${clientId}/files`
      }
      if (window.location.pathname === `/firm/${firmId}/workspaces/${clientId}/files/${folderId}/folder`) {
        url = `/firm/${firmId}/workspaces/${clientId}/files/${folderId}/folder`
      }
      if (window.location.pathname === `/firm/${firmId}/files/${clientId}/workspace`) {
        url = `/firm/${firmId}/files/${clientId}/workspace`
      }
      if (window.location.pathname === `/firm/${firmId}/files/public`) {
        url = `/firm/${firmId}/files/public`
      }
      if (window.location.pathname === `/firm/${firmId}/files/public/${folderId}/folder`) {
        url = `/firm/${firmId}/files/public/${folderId}/folder`
      }
      if (window.location.pathname === `/firm/${firmId}/files/${userId}/personal`) {
        url = `/firm/${firmId}/files/${userId}/personal`
      }
      if (window.location.pathname === `/firm/${firmId}/files/${userId}/personal/${folderId}/folder`) {
        url = `/firm/${firmId}/files/${userId}/personal/${folderId}/folder`
      }
    } else if (itemName === "folders") {
      if (window.location.pathname === `/firm/${firmId}/files`) {
        url = `/firm/${firmId}/files`
      }     
      if (window.location.pathname === `/firm/${firmId}/files/personal`) {
        url = `/firm/${firmId}/files/personal`
      }
    } else if (itemName === "clients") {
      if (window.location.pathname === `/firm/${firmId}/clients`) {
        url = `/firm/${firmId}/clients`
      }   
    } else if (itemName === "contacts") {
      if (window.location.pathname === `/firm/${firmId}/contacts`) {
        url = `/firm/${firmId}/contacts`
      }
      if (window.location.pathname === `/firm/${firmId}/clients/${clientId}/contacts/archived`) {
        url = `/firm/${firmId}/clients/${clientId}/contacts/archived`
      }
    } else if (itemName === "signatures") {
      if (window.location.pathname === `/firm/${firmId}/signatures`) {
        url = `/firm/${firmId}/signatures`
      }
    } else if (itemName === "staff") {
      if (window.location.pathname === `/firm/${firmId}/settings/staff`) {
        url = `/firm/${firmId}/settings/staff`
      }
    } else if (itemName === 'assigned staff') {
      if (window.location.pathname === `/firm/${firmId}/clients/${clientId}/staff`) {
        url = `/firm/${firmId}/clients/${clientId}/staff`
      }
    } else if (itemName === 'portal') {
      url = `/portal/${clientId}/files`
      if (folderId) {
        url += `/folder/${folderId}`;
      }
    } else if (itemName === "adminUser") {
      url = '/admin/users';
      itemName = 'users';
    }

    return (
      <div className={`pagination -table-pagination ${viewingAs === "bottom" ? "-tp-bottom" : "-tp-top"}`}>
        <div className="yt-row -pagination-content">
          <div className="-pc-content-column">
            <div style={{ paddingLeft: 0 }}>
              {
                isFiltered ?
                <label>Matching <strong>{startEntry}-{endEntry}</strong> of {totalItems} {itemName}</label>
                :
                <label><span className="-mobile-yt-hide">Showing</span> <strong>{startEntry}-{endEntry}</strong> of {totalItems} {itemName}</label>
              }
            </div>
          </div>
          {
            setPerPage ? 
            <div className="-pc-content-column -mobile-yt-hide">
              <div style={viewingAs === "bottom" ? { padding: "4px 0 0" } : { padding: "9px 0 0" }}>|</div>
            </div>
            : null
          }
          {
            setPerPage ?
            <div className="-pc-content-column">
              <div>
                <label><span className="-mobile-yt-hide">Showing per page:</span> </label>
                <select
                  name="numPerPage"
                  onChange={(e) => setPerPage(e.target.value)}
                  value={pageSize}
                >
                  <option value={25}> 25 </option>
                  <option value={50}> 50 </option>
                  <option value={100}> 100 </option>
                </select>
              </div>
            </div>
            :
            null
          }
          {
            enableSearch && handleQuery && viewingAs === "top" ?
            <div className="-pc-content-column -search-bar">
              <div className="search" style={{ display: 'inline-flex', marginRight: '10px' }}>
                <SearchInput
                  name="query"
                  value={query}
                  change={handleQuery}
                  placeholder={searchText}
                  required={false}
                  keydown={this._handleKeyDown}
                />
                { handleSearch && <button className="yt-btn x-small rounded info" style={{ marginLeft: "10px", fontSize: '12px', padding: '3px 15px' }} onClick={handleSearch}>Apply Filter</button> }
              </div>
            </div>
            :
            null
          }
          <div className="-pagination-tabber" style={enableSearch && handleQuery && viewingAs === "top" ? {} : { marginLeft: "auto" }}>
            <ul>
              <Link to={`${url}?page=${currentPage - (currentPage == 1 ? 0 : 1)}&per=${pageSize}`} onClick={(e) => currentPage > 1 ? null : e.preventDefault()}>
                <li >
                  <a className={prevClass}
                  onClick={currentPage > 1 ? this._handlePrevious : null }>
                    <i className="fa fa-angle-double-left" /> Previous
                  </a>
                </li>
              </Link>
              { 
                arrayPages.map(page =>
                  isChanged ?
                  <Link to={`${url}?page=${page}&per=${pageSize}` }>
                    <li key={page} >
                      <a className={page == currentPage ? "current-page" : "page-num"} onClick={()=> this._jumpToPage(page)}>{page}</a>
                    </li>
                  </Link>
                  : <li key={page} >  
                  <a className={page == currentPage ? "current-page" : "page-num"} onClick={()=> this._jumpToPage(page)}>{page}</a>
                </li>
                )
              }
              <Link to={`${url}?page=${currentPage + (currentPage < totalPages ? 1 : 0)}&per=${pageSize}` } onClick={(e) => currentPage < totalPages ? null : e.preventDefault()}>
                <li >
                  <a className={nextClass}
                  onClick={currentPage < totalPages ? this._handleNext : null }>
                  Next <i className="fa fa-angle-double-right" />
                  </a>
                </li>
              </Link>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

PageTabber.propTypes = {
  pagination: PropTypes.object.isRequired
  , totalPages: PropTypes.number.isRequired
  , setPagination: PropTypes.func.isRequired
  , totalItems: PropTypes.number.isRequired
  , itemName: PropTypes.string
  , showSearch: PropTypes.bool
  , enableSearch: false
}

PageTabber.defaultProps = {
  pagination: {
    page: 1
    , per: 50
  }
  , totalPages: 1
  , itemName: "items"
  , searchText: "Search..."
  , showSearch: false
}

export default PageTabber;
