/**
 * Helper component to provide a background clickable area to close modals,
 * dropdowns, etc.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import components
import Binder from '../Binder.js.jsx';

class CloseWrapper extends Binder {
  constructor(props) {
    super(props);
    this._bind('_handleCloseAction');
  }

  _handleCloseAction(e) {
    /**
     * NOTE: If CloseWrapper is nested inside of another component that has a click handler, this event will propagate up
     * and also trigger the click action on the parent. We probably never want that to happen, but just in case it breaks something
     * we'll pass the event through the close action so we can use stopPropagation where needed. It's currently being done on FileTableListItem.
     */
    // e.stopPropagation();
    this.props.closeAction(e);
  }

  render() {
    if(this.props.isOpen) {
      return(
        <div className="close-wrapper" onClick={this._handleCloseAction} onContextMenu={this._handleCloseAction}></div>
      )
    } else {
      return null;
    }
  }
}

CloseWrapper.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , closeAction: PropTypes.func.isRequired
}

export default CloseWrapper;
