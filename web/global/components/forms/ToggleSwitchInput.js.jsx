/**
 * Helper form component for rendering Toggle switches (restyled checkboxes)
 * Adapted from https://www.w3schools.com/howto/howto_css_switch.asp
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import third party libraries
import classNames from 'classnames';

// import components
import Binder from '../Binder.js.jsx';

class ToggleSwitchInput extends Binder {
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
    const {
      disabled
      , inputClasses
      , helpText
      , label
      , name
      , required
      , rounded
      , styles
      , value
    } = this.props;

    const switchLabel = label ? <label>{label}</label> : null

    const sliderClass = classNames(
      'slider'
      , { 'round': rounded }
      , {'-disabled': disabled}
    )

    const inputClass = classNames(
      'input-group'
      , inputClasses
    )
    return (
      <div className={inputClass} style={styles || null}>
        {switchLabel}
        <label className="switch">
          <input
            checked={value}
            disabled={disabled}
            name={name}
            onChange={this._handleInputChange}
            required={required}
            type="checkbox"
            value={value}
            />
          <span className={sliderClass}></span>
        </label>
        <div>
          <small className="help-text"><em>{helpText}</em></small>
        </div>
      </div>
    )
  }
}

ToggleSwitchInput.propTypes = {
  change: PropTypes.func.isRequired
  , checked: PropTypes.bool
  , disabled: PropTypes.bool
  , helpText: PropTypes.any 
  , inputClasses: PropTypes.string 
  , label: PropTypes.string
  , name: PropTypes.string.isRequired
  , required: PropTypes.bool
  , rounded: PropTypes.bool
  , styles: PropTypes.object
  , value: PropTypes.bool.isRequired
}

ToggleSwitchInput.defaultProps = {
  checked: false
  , disabled: false
  , helpText: null 
  , inputClasses: ''
  , label: ''
  , required: false 
  , styles: null 
}

export default ToggleSwitchInput;
