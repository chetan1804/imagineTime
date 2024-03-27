/**
 * Wrapper for 'react-dates' DateRangePicker component.  YT default props &
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
import moment from 'moment';
import { DateTime } from 'luxon';
import { DateRangePicker, isInclusivelyAfterDay } from 'react-dates';


import Binder from '../../Binder.js.jsx';

const START_DATE = 'startDate';
const END_DATE = 'endDate';

class DateRangePickerInput extends Binder {
  constructor(props) {
    super(props);

    let focusedInput = null;
    if (props.autoFocus) {
      focusedInput = START_DATE;
    } else if (props.autoFocusEndDate) {
      focusedInput = END_DATE;
    }
    this.state = {
      /**
       * NOTE: all dates must converted to a moment object for use in
       * 'react-dates'
       */
      dateRange: {
        endDate: !this.props.dateRange.endDate ? null : moment(this.props.dateRange.endDate)
        , startDate: !this.props.dateRange.startDate ? null : moment(this.props.dateRange.startDate)
      }
      , focusedInput
    }
    this._bind(
      '_onDatesChange'
      , '_onFocusChange'
    )
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.initialDate !== this.props.initialDate) {
      this.setState({date: moment(nextProps.initialDate)})
    }
  }

  _onDatesChange(dateRange) {
    /**
     * NOTE: 'dateRange' is composed of a startDate momentjs object and an
     * endDate momentjs object i.e.
     * { startDate: <momentObj>, endDate: <momentObj> }
     *
     * this component converts these values to unix/epoch time and passes the
     * object back up a the event.target.value
     */
    this.setState({dateRange});
    
    let event = { target: {}};
    event.target.name = this.props.name;
    event.target.value = {
      endDate: dateRange.endDate ? dateRange.endDate.valueOf() : null
      , startDate: dateRange.startDate ? dateRange.startDate.valueOf() : null
    };
    this.props.change(event);
  }

  _onFocusChange(focusedInput) {
    this.setState({focusedInput});
  }

  render() {
    const {
      endDateId
      , endDatePlaceholderText
      , helpText
      , label
      , minDate
      , name
      , required
      , startDateId
      , startDatePlaceholderText
      , disabled
    } = this.props;

    const { focusedInput, dateRange } = this.state;
    return(
      <div className="input-group date-picker-wrapper -single">
        <label htmlFor={name}> {label} {required ? <sup className="-required">*</sup> : null}</label>
        <DateRangePicker
          endDate={dateRange.endDate}
          endDateId={endDateId}
          endDatePlaceholderText={endDatePlaceholderText}
          focusedInput={focusedInput}
          isOutsideRange={(day) => !isInclusivelyAfterDay(day, moment(minDate))}
          onDatesChange={this._onDatesChange}
          onFocusChange={this._onFocusChange}
          noBorder
          startDate={dateRange.startDate}
          startDateId={startDateId}
          startDatePlaceholderText={startDatePlaceholderText}
          small={true}
          disabled={disabled}
        />
        <div>
          <small className="help-text"><em>{helpText}</em></small>
        </div>
      </div>
    )
  }
}

DateRangePickerInput.propTypes = {
  autoFocus: PropTypes.bool
  , autoFocusEndDate: PropTypes.bool
  , change: PropTypes.func.isRequired
  , dateRange: PropTypes.shape({
    endDate: PropTypes.number // epoch/unix time in milliseconds
    , startDate: PropTypes.number // epoch/unix time in milliseconds
  })
  , endDateId: PropTypes.string
  , endDatePlaceholderText: PropTypes.string
  , helpText: PropTypes.any
  , label: PropTypes.string
  , minDate: PropTypes.number // epoch/unix time in milliseconds
  , name: PropTypes.string.isRequired
  , required: PropTypes.bool
  , startDateId: PropTypes.string
  , startDatePlaceholderText: PropTypes.string
}

DateRangePickerInput.defaultProps = {
  autoFocus: false
  , autoFocusEndDate: false
  , dateRange: { endDate: null, startDate: null }
  , endDateId: END_DATE
  , endDatePlaceholderText: 'End Date'
  , helpText: null
  , label: ''
  , minDate: DateTime.local().valueOf()
  , required: false
  , startDateId: START_DATE
  , startDatePlaceholderText: 'Start Date'
}

export default DateRangePickerInput;
