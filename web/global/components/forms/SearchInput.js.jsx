/**
 * Helper function for rendering stylized search inputs
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import components
import Binder from '../Binder.js.jsx';

class SearchInput extends Binder {
  constructor(props) {
    super(props);
  }

  render() {

    const { name, placeholder, value, className, keydown } = this.props;

    return (
      <div className="search-input">
        <div className="input-add-on">
          <i className="item fal fa-search"/>
          <input
            autoComplete="off"
            type="search"
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={this.props.change}
            onFocus={this.props.focus}
            onKeyDown={this.props.keydown}
            className={this.props.showButton ? 'no-border' : ''}
          />
          {
            this.props.showButton ? 
            <i 
              className="item right fal fa-search"
              onClick={this.props.click}
            />
            :
            ''
          }

        </div>
      </div>
    )
  }
}

SearchInput.propTypes = {
  change: PropTypes.func.isRequired
  , focus: PropTypes.func
  , name: PropTypes.string.isRequired
  , placeholder: PropTypes.string
  , value: PropTypes.string.isRequired
  , keydown: PropTypes.func
  , click: PropTypes.func
  , showButton: PropTypes.bool
}

SearchInput.defaultProps = {
  focus: () => {console.log('focus')}
  , placeholder: 'Search...'
  , showButton: false
}

export default SearchInput;
