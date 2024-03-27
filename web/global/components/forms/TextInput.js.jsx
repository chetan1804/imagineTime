/**
 * Helper component for rendering basic text inputs
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import components
import Binder from "../Binder.js.jsx";
import { validationUtils } from "../../../global/utils";

import classNames from 'classnames';

class TextInput extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_handleInputChange'
      , '_handleKeyDown'
    );
  }

  _handleInputChange(e) {
    this.props.change(e);
  }

  _handleKeyDown(e) {
    if(e.key === 'Enter') {
      if(validationUtils.checkFilenameIsValid(e.target.value)) {
        this.props.onSubmit(); 
      }
    }
  }

  render() {
    const {
      autoComplete
      , autoFocus
      , classes 
      , disabled
      , helpText
      , label
      , maxLength
      , name
      , placeholder
      , prefix 
      , required
      , suffix
      , value
      , onSubmit
      , readOnly 
      , cusRef
      , type
      , showLabel
    } = this.props;
    const inputClass = classNames(
      'input-group'
      , classes
    )

    let prefixAddon = prefix ? <span className="item">{prefix}</span> : null;
    let suffixAddon = suffix ? <span className="item">{suffix}</span> : null;
    
    return (
      <div className={inputClass}>
        { showLabel ? <label htmlFor={name}> {label} {required && label ? <sup className="-required">*</sup> : null}</label> : null }
        <div className="input-add-on">
          {prefixAddon}
          <input
            autoComplete={autoComplete}
            disabled={disabled}
            maxLength={maxLength}
            name={name}
            onChange={this._handleInputChange}
            onBlur={(e) => this.props.blur ? this.props.blur(e) : null}
            placeholder={placeholder}
            required={required}
            type={type ? type : "text"}
            value={value}
            onKeyDown={onSubmit ? this._handleKeyDown : null}
            autoFocus={autoFocus}
            readOnly = {readOnly}
            ref={cusRef}
            data-lpignore="true"
          />
          {suffixAddon}
        </div>
        <small className="help-text"><em>{helpText}</em></small>
      </div>
    )
  }
}

TextInput.propTypes = {
  autoFocus: PropTypes.bool
  , blur: PropTypes.func 
  , change: PropTypes.func.isRequired
  , classes: PropTypes.string 
  , disabled: PropTypes.bool
  , helpText: PropTypes.any
  , label: PropTypes.string
  , maxLength: PropTypes.string
  , name: PropTypes.string.isRequired
  , placeholder: PropTypes.string
  , required: PropTypes.bool
  , value: PropTypes.string.isRequired
  , cusRef: PropTypes.func
  , type: PropTypes.string
  , showLabel: PropTypes.bool
}

TextInput.defaultProps = {
  autoFocus: false
  , blur: null 
  , classes: ''
  , disabled: false
  , helpText: null
  , label: ''
  , placeholder: ''
  , required: false
  , value: ''
  , readOnly: false
  , showLabel: true
  , cusRef: () => {}
}

export default TextInput;
