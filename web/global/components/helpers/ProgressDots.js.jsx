/**
 * Helper component for displaying user progress as a series of dots.
 * It takes two props: currentStep and totalSteps
 * It creates an <li/> for each step and assigns a class of 'active'
 * on currentStep and all previous steps.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

const ProgressDots = ({
  currentStep
  , totalSteps
}) => {
  const listItems = [];
  for(let i = 1; i <= totalSteps; i++) {
    listItems.push(<li key={`progress_dot_${i}`}className={i <= currentStep ? 'active' : ''}></li>)
  }
  return (
    <ul className="progress-dots">
      {listItems}
    </ul>
  )
}

ProgressDots.propTypes = {
  currentStep: PropTypes.number.isRequired
  , totalSteps: PropTypes.number.isRequired
}

ProgressDots.defaultProps = {
  currentStep: 1
}

export default ProgressDots;
