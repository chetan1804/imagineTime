/**
 * Wraps all Tag components in a default container. If you want to
 * give all Tag views a sidebar for example, you would set that here.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import AdminLayout from '../../../../global/admin/components/AdminLayout.js.jsx';

class AdminTagLayout extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <AdminLayout>
        {this.props.children}
      </AdminLayout>
    )
  }
}

export default AdminTagLayout;
