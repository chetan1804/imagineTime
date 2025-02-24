/**
 * Wraps all ClientTask components in a default container. If you want to
 * give all ClientTask views a sidebar for example, you would set that here.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import DefaultLayout from '../../../global/components/layouts/DefaultLayout.js.jsx';

class ClientTaskLayout extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <DefaultLayout>
        {this.props.children}
      </DefaultLayout>
    )
  }
}

export default ClientTaskLayout;
