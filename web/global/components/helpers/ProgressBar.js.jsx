/**
 * Resusable component for displaying a progess bar.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

const ProgressBar = ({
  progress
}) => {
  return (
    <div className="progress-container">
      <p><small><strong>{progress.message}</strong></small>{` - ${progress.percent || 0}%`}</p>
      <div className={`progress-bar-${progress.percent || 0}`} >
        <div className="-progress">
          <div className="-complete">
          </div>
        </div>
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  progress: PropTypes.object.isRequired
}

ProgressBar.defaultProps = {
  progress: {
    message: 'Waiting'
    , percent: 0
  }
}

export default ProgressBar;
