/**
 * View for route /portal/:clientId/dashboard/schedule
 * Displays a list of a client's tasks filtered by date.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import third party libraries
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import { CalendarDatePicker } from '../../../global/components/forms';
import PortalClientTaskListItem from '../../../resources/clientTask/portal/components/PortalClientTaskListItem.js.jsx';

class PortalSchedule extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      selectedDate: new Date()
    };
    this._bind(
      '_handleFormChange'
      , '_filterListByDate'
    );
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _filterListByDate(clientTaskListItems) {
    const { selectedDate } = this.state;
    if(selectedDate) {
      // Filter out tasks older than the selected date. Ignore the time and only compare dates.
      return clientTaskListItems.filter(task => new Date(task.dueDate ? task.dueDate : task.created_at).setHours(0, 0, 0, 0) >= selectedDate.setHours(0, 0, 0, 0));
    } else {
      return clientTaskListItems;
    }
  }

  render() {
    const { clientTaskListItems } = this.props;

    const clientTasksFilteredByDate = this._filterListByDate(clientTaskListItems);

    const isEmpty = !clientTaskListItems || clientTaskListItems.length === 0
    return (
      <div className="-portal-content">
      { isEmpty ?
        <div>No Tasks</div>
        :
        <div className="yt-row with-gutters space-between">
          <div className="yt-col full l_60">
            <h3>Schedule</h3>
            <CalendarDatePicker
              change={this._handleFormChange}
              daySize={50}
              name="selectedDate"
              numberOfMonths={2}
              value={this.state.selectedDate}
              // Pass in an array of all task dueDates so they will be highlighted on the calendar.
              highlightedDates={clientTaskListItems.map(task => task.dueDate ? task.dueDate : task.created_at)}
            />
            <div className="activity-list">
            { clientTasksFilteredByDate.map((clientTask, i ) => {
              return (
                clientTask.status !== 'draft' ?
                <PortalClientTaskListItem
                  key={clientTask._id + "_" + i}
                  clientTask={clientTask}
                />
                :
                null
              )
            })}
            </div>
          </div>
          <div className="yt-col full s_40 m_25 portal-info-helper">
            <div className="-content-box">
              <div className="-icon">
                <i className="fal fa-lightbulb-on"/>
              </div>
              <p>Check out upcoming tasks or go back and review past assignments & activity.</p>
            </div>
          </div>
        </div>
      }
      </div>
    )
  }
}

PortalSchedule.propTypes = {
  clientTaskListItems: PropTypes.array.isRequired
}

PortalSchedule.defaultProps = {
  clientTaskListItems: []
}

export default PortalSchedule;
