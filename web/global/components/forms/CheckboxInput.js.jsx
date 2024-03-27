/**
 * Helper form component for rendering checkboxes
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import components
import Binder from '../Binder.js.jsx';
import classNames from 'classnames';

class CheckboxInput extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isChecked: this.props.checked
    };
    this._bind('_handleInputChange');
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.value !== this.state.isChecked) {
      this.setState({isChecked: !this.state.isChecked})
    }
  }

  _handleInputChange(e) {
    const event = e;
    const checked = e.target.checked;
    const value = checked;
    const name = e.target.name;
    event.target = Object.assign({}, e.target, {
      checked: checked
      , name: name
      , value: checked
    });
    this.props.change(event);
  }

  render() {
    const { label, value, name, checked, disabled, helpText, classes } = this.props;
    
    const inputClass = classNames(
      'input-group'
      , classes
    )

    return (
      <div className={inputClass}>
        <input
          checked={value}
          disabled={disabled}
          name={name}
          onChange={this._handleInputChange}
          type="checkbox"
          value={value}
        />
        <label htmlFor={name}> {label} </label>
        <br/>
        <small className="help-text"><em>{helpText}</em></small>
      </div>
    )
  }
}

CheckboxInput.propTypes = {
  change: PropTypes.func.isRequired
  , checked: PropTypes.bool
  , disabled: PropTypes.bool
  , helpText: PropTypes.string
  , label: PropTypes.string
  , name: PropTypes.string.isRequired
  , value: PropTypes.bool.isRequired
}

CheckboxInput.defaultProps = {
  checked: false
  , disabled: false
  , helpText: ''
  , label: ''
}

export default CheckboxInput;
