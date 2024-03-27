/**
 * Helper form component for rendering email inputs.  This handles it's own state
 * and validation. Will only return email to parent component if valid.
 *
 * NOTE: sample regex email validator
 *  _validateEmail(email) {
 *    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
 *    return re.test(email);
 *  }
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';

// import components
import Binder from '../Binder.js.jsx';

// import utils
import { validationUtils } from '../../utils'

class EmailInput extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      email: this.props.value || ""
      , errorMessage: ""
      , isValid: true
    };
    this._bind(
      '_handleInputChange'
    );
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.value !== this.props.value) {
      this.setState({
        email: nextProps.value
      })
    }
  }

  _handleInputChange(e) {
    let newState = _.update( this.state, e.target.name, function() {
      return e.target.value;
    });
    // See if we need to check for an email (comment).
    // Create a new version of the email with the comment stripped out so we can see if it's valid.
    let newEmail = this.props.allowComment ? validationUtils.stripEmailComment(newState.email) : newState.email;

    // Checks for ____@____.__
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    newState.isValid = re.test(newEmail);
    newState.errorMessage = !newState.isValid ? "Please enter a valid email" : null;
    var event = {
      target: {
        name: this.props.name
        , value: "" // return empty email by default
      }
    };
    if(newState.isValid) {
      event.target.value = newState.email; // return valid email
      // only tell parent about a change event if the new value is valid
      this.props.change(event);
    }
    this.setState(newState);
  }

  render() {
    const { autoFocus, disabled, label, value, placeholder, name, required, helpText } = this.props;
    const { email, errorMessage, isValid } = this.state;
    let inputClass = classNames({ "-error": !isValid });

    return (
      <div className="input-group">
        <label htmlFor={name}> {label} {required && label ? <sup className="-required">*</sup> : null}</label>
        <input
          autoFocus={autoFocus}
          className={inputClass}
          disabled={disabled}
          name="email"
          onChange={this._handleInputChange}
          placeholder={placeholder}
          required={required}
          // inputs with type 'email' don't allow parentheses. We'll need to use type "text" when allowing (comments)
          type={this.props.allowComment ? "text" : "email"}
          value={email}
        />
        { !isValid ?
          <div className="-error-message">{errorMessage}</div>
          :
          null
        }
        <small className="help-text"><em>{helpText}</em></small>
      </div>
    )
  }
}

EmailInput.propTypes = {
  allowComment: PropTypes.bool
  , autoFocus: PropTypes.bool
  , change: PropTypes.func.isRequired
  , helpText: PropTypes.any
  , label: PropTypes.string
  , name: PropTypes.string.isRequired
  , placeholder: PropTypes.string
  , required: PropTypes.bool
  , value: PropTypes.string.isRequired
}

EmailInput.defaultProps = {
  allowComment: false
  , autoFocus: false
  , helpText: null
  , label: ''
  , placeholder: ''
  , required: false
}

export default EmailInput;
