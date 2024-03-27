/**
 * Wrapper for 'react-dates' SingleDatePicker component.  YT default props &
 * styles
 *
 * NOTE: 'react-dates' uses momentjs objects internally. Yote currently uses
 * luxon for datetime management. To accommodate the two, ALL dates passed into
 * and out of date inputs MUST be expoch/unix time in milliseconds.  Makes things
 * agnostic on the parent components.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import third-party libraries
import classNames from 'classnames';
import moment from 'moment';
import { DateTime } from 'luxon';
import { SingleDatePicker, isInclusivelyAfterDay } from 'react-dates';


import Binder from '../../Binder.js.jsx';

class SingleDatePickerInput extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      /**
       * NOTE: 'date' must converted to a moment object for use in
       * 'react-dates'
       */
      date: !this.props.initialDate ? null : moment(this.props.initialDate)
      , focused: this.props.autoFocus
    }
    this._bind(
      '_onDateChange'
      , '_onFocusChange'
    )
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.initialDate !== this.props.initialDate) {
      this.setState({date: moment(nextProps.initialDate)})
    }
  }

  _onDateChange(date) {
    /**
     * NOTE: 'date' is a moment object passed around automatically by 'react-dates'
     * This component assumes that the parent knows and can handle this.
     * -- i.e. parent will need to have a dedicated handler for the date change
     */
    // console.log(date);
    this.setState({date});
    if(date) {
      // console.log('update props');
      let event = { target: {}};
      event.target.name = this.props.name;
      event.target.value = date.valueOf();
      this.props.change(event);
    }
  }

  _onFocusChange({focused}) {
    this.setState({focused});
  }

  render() {
    const {
      anchorDirection
      , disabled
      , enableOutsideDays
      , helpText
      , inputClasses
      , label
      , minDate
      , name
      , numberOfMonths
      , placeholder
      , required
    } = this.props;

    const { focused, date } = this.state;

    const inputClass = classNames(
      'input-group date-picker-wrapper -single'
      , inputClasses
    )

    return(
      <div className={inputClass} >
        <label htmlFor={name}> {label} {required ? <sup className="-required">*</sup> : null}</label>
        <SingleDatePicker
          anchorDirection={anchorDirection || 'left'}
          id="date_input"
          date={date}
          disabled={disabled}
          enableOutsideDays={enableOutsideDays}
          focused={focused}
          onDateChange={this._onDateChange}
          onFocusChange={this._onFocusChange}
          placeholder={placeholder || null}
          isOutsideRange={!minDate ? () => false : (day) => !isInclusivelyAfterDay(day, moment(minDate)) }
          noBorder
          numberOfMonths={numberOfMonths}
        />
        <div>
          <small className="help-text"><em>{helpText}</em></small>
        </div>
      </div>
    )
  }
}

SingleDatePickerInput.propTypes = {
  autoFocus: PropTypes.bool
  , change: PropTypes.func.isRequired
  , enableOutsideDays: PropTypes.bool
  , helpText: PropTypes.any
  , initialDate: PropTypes.number // epoch/unix time in milliseconds
  , inputClasses: PropTypes.string
  , label: PropTypes.string
  , minDate: PropTypes.number // epoch/unix time in milliseconds
  , name: PropTypes.string.isRequired
  , numberOfMonths: PropTypes.number
  , required: PropTypes.bool
}

SingleDatePickerInput.defaultProps = {
  autoFocus: false
  , enableOutsideDays: true
  , helpText: null
  , initialDate: DateTime.local().valueOf()
  , inputClasses: ''
  , label: ''
  , minDate: null
  , numberOfMonths: 2
  , required: false
}

export default SingleDatePickerInput;
