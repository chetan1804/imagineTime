/**
 * View component for /admin/staff
 *
 * Generic staff list view. Defaults to 'all' with:
 * this.props.dispatch(staffActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as staffActions from '../../staffActions';
import * as userActions from '../../../user/userActions'; 
import * as firmActions from '../../../firm/firmActions'; 

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminStaffLayout from '../components/AdminStaffLayout.js.jsx';
import AdminStaffListItem from '../components/AdminStaffListItem.js.jsx';

class StaffList extends Binder {
  constructor(props) {
    super(props);

    this.state = {
      sending: false
      , success: false
      , selectedStaff: ""
      , selectedFirm: ""
    }
    this._bind(
      '_handleFilter'
      ,'_handleResendInvite'
    )
  }

  componentDidMount() {
    const { dispatch } = this.props;
    // fetch a list of your choice
    // NOTE: We can't fetch users and firms this way with postgres. Need a better way to do these fetches.
    // dispatch(staffActions.fetchListIfNeeded('all')).then((json) => {
    //   if(json.success) {
    //     const userIds = json.list.map((item => item._user));
    //     this.props.dispatch(userActions.fetchListIfNeeded('_id', userIds)); 

    //     const firmIds = json.list.map((item => item._firm));
    //     this.props.dispatch(firmActions.fetchListIfNeeded('_id', firmIds)); 
    //   }
    // })
    // Fetching all will definitely turn in to a bad time, but until we find a better way...
    dispatch(staffActions.fetchListIfNeeded('all'))
    dispatch(staffActions.setFilter({query: '', sortBy: 'name'}, 'all')); 
    dispatch(userActions.fetchListIfNeeded('all'))
    dispatch(firmActions.fetchListIfNeeded('all'))

  }

  _handleFilter(sortBy) {
    const { dispatch, staffStore } = this.props; 
    const staffList = staffStore.lists ? staffStore.lists.all : null;
    let newFilter = staffList.filter;
    if(staffList && staffList.filter && staffList.filter.sortBy && staffList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(staffActions.setFilter(newFilter, 'all'));
  }

  _handleResendInvite(user, owner, firm = null) {

    this.setState({sending: true});
    this.setState({selectedStaff: user._id});
    const { dispatch, firmStore } = this.props;

    if(!firm)
      firm = firmStore.selected.getItem();

    this.setState({selectedFirm: firm._id});

    const sendData = {
      invitations: [
        {
          email: user.username,
          fullName: user.firstname + " " + user.lastname,
          owner: owner
        }
      ]
      , personalNote: '' 
    }

    try {
      dispatch(staffActions.sendInviteStaff(firm._id, sendData)).then(staffRes => {
        this.setState({sending: false});
        if(staffRes.success) {
          this.setState({success: true});
          setTimeout(() => {
            this.setState({success: false});
            this.setState({selectedStaff: ""});
          }, 2000)
          console.log("Successfully Resend the invite");
        } else {
          this.setState({selectedStaff: ""});
          alert("ERROR - Check logs");
        }
      });
    } catch (err) {
      this.setState({sending: false});
      this.setState({selectedStaff: ""});
    }
  }

  render() {
    const { location, staffStore, userStore, firmStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the staffList meta info here so we can reference 'isFetching'
    const staffList = staffStore.lists ? staffStore.lists.all : null;
    const userList = userStore.lists ? userStore.lists.all : null; 

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual staff objetcs
     */
    const staffListItems = staffStore.util.getList("all");
    const userListItems = userStore.util.getList("all"); 

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !staffListItems
      || !staffList
      || !userListItems
      || !userList
    );

    const isFetching = (
      !staffListItems
      || !staffList
      || staffList.isFetching
    )

    let orderedList = []; 
    let filter = staffList && staffList.filter; 
    let sortBy = filter && filter.sortBy ? filter.sortBy : 'name'; 
    
    if(staffListItems && userListItems && userListItems.length > 0) {
      switch(sortBy) {
        case 'name': 
          orderedList = _.orderBy(staffListItems, [item => userStore.byId[item._user].firstname.toLowerCase()], ['asc']); 
          break;
        case '-name':
          orderedList = _.orderBy(staffListItems, [item => userStore.byId[item._user].firstname.toLowerCase()], ['desc']);
          break;
        case 'email':
          orderedList = _.orderBy(staffListItems, [item => userStore.byId[item._user].username.toLowerCase()], ['asc']);
          break;
        case '-email':
          orderedList = _.orderBy(staffListItems, [item => userStore.byId[item._user].username.toLowerCase()], ['desc']);
          break; 
        case 'active':
          orderedList = staffListItems.filter(item => item.status == "active");
          break;
        case '-active':
          orderedList = staffListItems.filter(item => item.status != "active");
          break;
        default:
          orderedList = _.orderBy(staffListItems, [item => userStore.byId[item._user].firstname.toLowerCase()], ['asc']);
      }
    }

    return (
      <AdminStaffLayout>
        <Helmet><title>Admin Staff List</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Staff List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              {/* <Link to={'/admin/staff/new'}> New Staff</Link>    // this view is not built out yet. Staff need to be invited, not just created. */}
              <table className="yt-table striped">
                <thead>
                  <tr>
                  <th className="-title sortable" onClick={() => this._handleFilter('name')}>Name
                    {sortBy && sortBy == 'name' ? 
                      <i class="fad fa-sort-down"></i>
                    : sortBy && sortBy == '-name' ?
                      <i class="fad fa-sort-up"></i>
                    : 
                      <i class="fad fa-sort"></i>
                    }
                  </th>
                  <th className="-title sortable" onClick={() => this._handleFilter('email')}>Email
                    {sortBy && sortBy == 'email' ? 
                      <i class="fad fa-sort-down"></i>
                    : sortBy && sortBy == '-email' ?
                      <i class="fad fa-sort-up"></i>
                    : 
                      <i class="fad fa-sort"></i>
                    }
                  </th>
                  <th>Firm</th>
                  <th>Permissions</th>
                  <th className="-title sortable" onClick={() => this._handleFilter('active')}>Status</th>
                  <th></th>
                  <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orderedList.map((staff, i) =>
                    <AdminStaffListItem 
                      key={staff._id + '_' + i} 
                      staff={staff} 
                      user={userStore.byId[staff._user]}
                      firm={firmStore.byId[staff._firm]}
                      handleResendInvite={this._handleResendInvite}
                      sending={this.state.sending}
                      success={this.state.success}
                      selectedStaff={this.state.selectedStaff}
                      selectedFirm={this.state.selectedFirm}
                    />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminStaffLayout>
    )
  }
}

StaffList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    staffStore: store.staff
    , userStore: store.user
    , firmStore: store.firm 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(StaffList)
);
