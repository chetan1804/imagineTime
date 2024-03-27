/**
 * View for route /portal/:clientId/dashboard/due-soon
 * Displays a list of a client's OPEN tasks filtered by date.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import third party libraries
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import PortalClientTaskListItem from '../../../resources/clientTask/portal/components/PortalClientTaskListItem.js.jsx';


class PortalDueSoon extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      numDaysAhead: 30 // Hard to name. This number dictates how many days forward the due soon list should go. Defaults to a month.
    };
    this._bind(
      '_filterListByDate'
    );
  }

  _filterListByDate(clientTaskList) {
    const currentDate = new Date(new Date().setHours(0, 0, 0, 0));
    const cutoffDate = new Date().setDate(currentDate.getDate() + this.state.numDaysAhead);
    // Filter out tasks with a due date past the cutoff date.
    return clientTaskList.filter(task => new Date(task.dueDate).setHours(0, 0, 0, 0) <= cutoffDate);
  }

  render() {
    const { clientTaskListItems, groupItemsByDate } = this.props;
    
    const clientTasksDueSoon = clientTaskListItems ? this._filterListByDate(clientTaskListItems) : [];
    const dueSoonGroupedByDate = clientTasksDueSoon ? groupItemsByDate(clientTasksDueSoon, 'dueDate') : [];

    const isEmpty = !clientTaskListItems || clientTaskListItems.length === 0;

    return (
      <div className="-portal-content">
      { isEmpty ?
        <div>No Tasks</div>
        :
        <div className="yt-row with-gutters space-between">
          <div className="yt-col full s_60 m_50">
            <h3>Due Soon</h3>
            <div className="activity-list">
            { Object.keys(dueSoonGroupedByDate).map((key, i) => {
                return (
                  <div className="activity-day-group" key={key + "_" + i}>
                    <div className="-day">{key}</div>
                    { dueSoonGroupedByDate[key].map((clientTask, i) =>
                        <PortalClientTaskListItem
                          key={clientTask._id + "_" + i}
                          clientTask={clientTask}
                        />
                      )
                    }
                  </div>
                )
              })}
            </div>
          </div>
          <div className="yt-col full s_40 m_25 portal-info-helper">
            <div className="-content-box">
              <div className="-icon">
                <i className="fal fa-lightbulb-on"/>
              </div>
              <p>These are all of your tasks that are due within the next 30 days.</p>
            </div>
            
          </div>
        </div>
      }
      </div>
    )
  }
}

PortalDueSoon.propTypes = {
  clientTaskListItems: PropTypes.array.isRequired
  , groupItemsByDate: PropTypes.func
}

PortalDueSoon.defaultProps = {
  clientTaskListItems: []
}

export default PortalDueSoon;
