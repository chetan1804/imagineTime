/**
 * Helper component for rendering textarea inputs
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import components
import Binder from '../Binder.js.jsx';

class TextAreaInput extends Binder {
  constructor(props) {
    super(props);
    this._bind('_handleInputChange');
  }

  _handleInputChange(e) {
    this.props.change(e);
  }

  render() {
    const {
      autoFocus
      , cols
      , disabled
      , helpText
      , label
      , maxlength
      , name
      , placeholder
      , required
      , rows
      , value
      , wrap 
      , className
    } = this.props;

    return (
      <div className="input-group">
        <label htmlFor={name}> {label} {required ? <sup className="-required">*</sup> : null}</label>
        <textarea
          autoFocus={autoFocus}
          cols={cols}
          disabled={disabled}
          maxLength={maxlength}
          name={name}
          onChange={this._handleInputChange}
          onBlur={(e) => this.props.blur ? this.props.blur(e) : null}
          placeholder={placeholder}
          required={required}
          rows={rows}
          type="text"
          value={value}
          wrap={wrap}
          className={className}
        >
        </textarea>
        <small className="help-text"><em>{helpText}</em></small>
      </div>
    )
  }
}

TextAreaInput.propTypes = {
  change: PropTypes.func.isRequired
  , cols: PropTypes.number
  , helpText: PropTypes.any
  , label: PropTypes.string
  , maxlength: PropTypes.number
  , name: PropTypes.string.isRequired
  , placeholder: PropTypes.string
  , required: PropTypes.bool
  , rows: PropTypes.string
  , value: PropTypes.string.isRequired
  , wrap: PropTypes.string 
}

TextAreaInput.defaultProps = {
  helpText: null
  , label: ''
  , placeholder: ''
  , required: false
  , rows: '4'
  , wrap: 'soft'
  , value: ''
}

export default TextAreaInput;
