import React from 'react';
import PropTypes from 'prop-types'
import classNames from 'classnames';


const DisplayAsButtons = ({ displayAs, displayGrid, displayTable }) => {

  let tableButtonClass = classNames(
    'far fa-list'
    , { 'active': displayAs === 'table'}
  )

  let gridButtonClass = classNames(
    'fas fa-th-large'
    , { 'active': displayAs === 'grid'}
  )
  return (
    <div className="display-as-buttons">
      <i className={tableButtonClass}
        onClick={() => displayTable()}
      />
      <i className={gridButtonClass}
        onClick={() => displayGrid()}
      />
    </div>
  )
}

DisplayAsButtons.propTypes = {
  displayAs: PropTypes.string.isRequired
  , displayGrid: PropTypes.func.isRequired
  , displayTable: PropTypes.func.isRequired
}

export default DisplayAsButtons;
