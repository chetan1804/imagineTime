/**
 * Living style-guide for this Yote application
 *
 * TODO:  This needs a lot of work
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import global components
import Binder from '../../components/Binder.js.jsx';
import Breadcrumbs from '../../components/navigation/Breadcrumbs.js.jsx';

// import admin components
import AdminLayout from '../components/AdminLayout.js.jsx';

import { ADMIN_NAV_ITEMS } from '../../../config/adminNavItems.js';

class AdminDashboard extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const { location } = this.props;
    return  (
      <AdminLayout>
        <Helmet><title>Admin Dashboard</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <div className="yt-row with-gutters">
          <div className="yt-col full m_60 -widget">
            <div className="card">
              <div className="card-header">
                <strong>Firms</strong>
                <Link to="/admin/firms/new" className="yt-btn x-small info">Create new firm</Link>
              </div>
              <div className="card-body">
                <div className="empty-state-hero">
                  <em>stats to go here</em>
                </div>
              </div>
              <div className="card-footer">
                <Link to="/admin/firms" className="yt-btn x-small block link">View all firms</Link>
              </div>
            </div>
          </div>
          <div className="yt-col full m_40 -widget">
            <div className="card">
              <div className="card-header">
                <strong>Quick links</strong>
              </div>
              <div className="card-body">
                <ul>
                  { ADMIN_NAV_ITEMS.map((item, i) =>
                    <li key={i}>
                      <Link to={item.path}>{item.display}</Link>
                    </li>
                  )}
                </ul>
              </div>
              <div className="card-footer">
                
              </div>
            </div>
          </div>
        </div>
       
      </AdminLayout>
    )
  }
}

AdminDashboard.propTypes = {
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
    , loggedInUser: store.user.loggedIn.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminDashboard)
);
