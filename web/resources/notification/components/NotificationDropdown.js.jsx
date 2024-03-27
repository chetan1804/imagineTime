import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { CSSTransition, TransitionGroup } from 'react-transition-group';


class NotificationDropdown extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
    this._bind(
      '_closeAndDismiss'
    )
  }

  _closeAndDismiss(notificationId) {
    this.props.dismissNotifications(notificationId);
    this.props.close();
  }

  render() {
    const {
      dismissNotifications
      , newNotificationIds
      , notifications
    } = this.props;

    return (
      <TransitionGroup >
        {this.props.isOpen ?
          <CSSTransition
            classNames="dropdown-anim"
            timeout={250}
          >
            <div className="-notification-menu">
              <div className="-header">
                <div className="yt-row center-vert space-between">
                  <strong>Notifications</strong>
                  { newNotificationIds && newNotificationIds.length > 0 ?
                    <button className="yt-btn x-small link info" onClick={() => dismissNotifications(newNotificationIds)}>Dismiss All</button>
                    :
                    null
                  }
                </div>
              </div>
              <div className="-body">
                { notifications && notifications.length > 0 ? 
                  notifications.map((n, i) => 
                    <div key={i} className="-notification">
                      <span onClick={() => this._closeAndDismiss(n._id)}>
                        {n.link ? 
                          <Link className="-notif-text" to={n.link}>{n.content}</Link>
                        : 
                          <p>{n.content}</p>
                        }
                      </span>
                      <div className="yt-row space-between">
                        <small className="u-muted">{_.startCase(DateTime.fromISO(n.created_at).toRelativeCalendar())}</small>
                        { !n.acknowledged ?
                          <span className="action-link" onClick={() => dismissNotifications(n._id)}><small>Dismiss</small></span>
                          :
                          null
                        }
                      </div>
                    </div>
                  )
                  : 
                  <div className="-empty"><em>All caught up!</em></div>
                }
              </div>
            </div>
          </CSSTransition>
          :
          null
        }
      </TransitionGroup>
    )
  }
}

NotificationDropdown.propTypes = {
  close: PropTypes.func.isRequired
  , dismissNotifications: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , notifications: PropTypes.arrayOf(PropTypes.object)
}

NotificationDropdown.defaultProps = {
  notifications: []
}

export default NotificationDropdown;