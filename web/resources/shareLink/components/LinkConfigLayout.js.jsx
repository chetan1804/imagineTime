/**
 * Wraps all non-admin User components in a default view wrapper
 * is a class in case you want some extra special logic...
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import DefaultLayout from '../../../global/components/layouts/DefaultLayout.js.jsx';

class LinkConfigLayout extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="linkconfig-main-layout">
        <DefaultLayout isLinkConfigLayout={true}>
          {this.props.children}
        </DefaultLayout>
      </div>
    )
  }
}

export default LinkConfigLayout;
