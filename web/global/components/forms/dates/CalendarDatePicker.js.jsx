/**
 * Helper component for picking dates from a calendar.
 * Currently only works for picking single dates, but could be expanded in the future.
 * Returns a synthetic event structured like the output of our other form input components.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import react-dates components
import 'react-dates/initialize';
import { DayPickerSingleDateController, isSameDay } from 'react-dates';
// react-dates uses moment
import moment from 'moment';

// import components
import Binder from '../../Binder.js.jsx';

class CalendarDatePicker extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      focused: true
      , date: moment() // Today will be selected by default.
    };
    this._bind(
      '_onDateChange'
      , '_onFocusChange'
    );
  }

  _onDateChange(date) {
    this.setState({ date });
    let event = {}
    event.target = {}
    event.target.name = this.props.name
    event.target.value = date.toDate()
    this.props.change(event)
  }

  _onFocusChange() {
    // Force the focused states to always be truthy so that date is always selectable
    this.setState({ focused: true });
  }

  render() {
    const { date, focused } = this.state;
    return (
      <DayPickerSingleDateController
        date={date}
        daySize={this.props.daySize} // This is the only way to affect the overall size of the calendar
        focused={focused}
        hideKeyboardShortcutsPanel={true}
        isDayHighlighted={this.props.highlightedDates ? day1 => this.props.highlightedDates.some(day2 => isSameDay(day1, moment(day2))) : () => null}
        numberOfMonths={this.props.numberOfMonths}
        onDateChange={this._onDateChange}
        onFocusChange={this._onFocusChange}
      />
    )
  }
}

CalendarDatePicker.propTypes = {
  change: PropTypes.func.isRequired
  , daySize: PropTypes.number
  , highlightedDates: PropTypes.array
  , name: PropTypes.string.isRequired
  , numberOfMonths: PropTypes.number
  , value: PropTypes.instanceOf(Date).isRequired
}
CalendarDatePicker.defaultProps = {
  daySize: 50
  , numberOfMonths: 2
}

export default CalendarDatePicker;
