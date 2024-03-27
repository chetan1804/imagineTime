// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

const ClientWorkflowStatusIndicator = ({
  status
}) => {
  const description = status === "draft" ? "Not yet published" : _.startCase(status)
  return (
    <div className="status-indicator">
      <div className="-status">
        <p><small>{description}</small></p>
      </div>
      <div className="-status-dot-wrapper">
        <span className={`-status-dot -${status}`}/>
      </div>
    </div>
  )
}

ClientWorkflowStatusIndicator.propTypes = {
  status: PropTypes.string.isRequired
}

ClientWorkflowStatusIndicator.defaultProps = {
  status: "draft"
}

export default ClientWorkflowStatusIndicator;
