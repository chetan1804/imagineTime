/**
 * Wraps all ClientWorkflowTemplate components in a default container. If you want to
 * give all ClientWorkflowTemplate views a sidebar for example, you would set that here.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

class ClientWorkflowTemplateLayout extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const { header } = this.props
    return (
      <div className="template-preview-layout">
        <div className="template-preview-container -with-sidebar">
          <header className="-header fixed">
            <div className="-header-content">
              <div className="-preview-title">
                <h3>{header || 'Client Workflow Templates'}</h3>
              </div>
            </div>
          </header>
          { this.props.children}
        </div>
      </div>
    )
  }
}

export default ClientWorkflowTemplateLayout;
