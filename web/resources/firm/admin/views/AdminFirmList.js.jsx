/**
 * View component for /admin/firms
 *
 * Generic firm list view. Defaults to 'all' with:
 * this.props.dispatch(firmActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

import _ from 'lodash'; 

// import actions
import * as firmActions from '../../firmActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminFirmLayout from '../components/AdminFirmLayout.js.jsx';
import AdminFirmListItem from '../components/AdminFirmListItem.js.jsx';

class FirmList extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_handleFilter'
    )
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(firmActions.fetchListIfNeeded('all')); // defaults to 'all'
    this.props.dispatch(firmActions.setFilter({query: '', sortBy: 'name'}, 'all')); 
  }

  _handleFilter(sortBy) {
    const { dispatch, firmStore } = this.props; 
    const firmList = firmStore.lists ? firmStore.lists.all : null;
    let newFilter = firmList.filter;
    if(firmList.filter.sortBy && firmList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(firmActions.setFilter(newFilter, 'all'));
  }

  render() {
    const { location, firmStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the firmList meta info here so we can reference 'isFetching'
    const firmList = firmStore.lists ? firmStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual firm objetcs
     */
    const firmListItems = firmStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !firmListItems
      || !firmList
    );

    const isFetching = (
      !firmListItems
      || !firmList
      || firmList.isFetching
    )

    const filter = firmList ? firmList.filter : null; 
    const sortBy = filter ? filter.sortBy : 'name'; 

    let orderedList = []; 

    switch(sortBy) {
      case 'name': 
        orderedList = _.orderBy(firmListItems, [item => item.name.toLowerCase()], ['asc']); 
        break;
      case '-name':
        orderedList = _.orderBy(firmListItems, [item => item.name.toLowerCase()], ['desc']); 
        break;
      case 'updated':
        orderedList = _.orderBy(firmListItems, [item => item.updated_at], ['asc']); 
        break;
      case '-updated':
        orderedList = _.orderBy(firmListItems, [item => item.updated_at], ['desc']); 
        break;
      default:
        orderedList = _.orderBy(firmListItems, [item => item.name.toLowerCase()], ['asc']); 
    }

    return (
      <AdminFirmLayout>
        <Helmet><title>Admin Firm List</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Firm List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/firms/new'}> New Firm</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th className="-title sortable" onClick={() => this._handleFilter('name')}>Name
                      {sortBy && sortBy == 'name' ? 
                        <i className="fad fa-sort-down"></i>
                      : sortBy && sortBy == '-name' ?
                        <i className="fad fa-sort-up"></i>
                      : 
                        <i className="fad fa-sort"></i>
                      }
                    </th>
                    <th className="-title sortable" onClick={() => this._handleFilter('updated')}>Last modified
                      {sortBy && sortBy == 'updated' ? 
                        <i className="fad fa-sort-up"></i>
                      : sortBy && sortBy == '-updated' ?
                        <i className="fad fa-sort-down"></i>
                      : 
                        <i className="fad fa-sort"></i>
                      }
                    </th>
                    <th className="-title sortable">Created By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orderedList.map((firm, i) =>
                    <AdminFirmListItem key={firm._id} firm={firm} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminFirmLayout>
    )
  }
}

FirmList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(FirmList)
);
