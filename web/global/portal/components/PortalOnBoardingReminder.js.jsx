/**
 * Displayed at portal/:clientId/dashboard if the user or client is not onboarded.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import third-party libraries
import classNames from 'classnames';

// import actions

// import utils
import { onBoardUtils } from '../../../global/utils/index';

// import global components
import Binder from '../../components/Binder.js.jsx';

// import resource components

class PortalOnBoardingReminder extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      complete: 0
      , incomplete: 0
    }
    this._bind(
      '_setOnBoardedProgress'
    )
  }

  componentDidMount() {    
    this._setOnBoardedProgress()    
  }

  _setOnBoardedProgress() {
    const { user, client } = this.props;
    const onBoardingProgress = onBoardUtils.getOnBoardedProgress(user, client)
    const requiredFields = Object.keys(onBoardingProgress)
    let complete = this.state.complete;
    let incomplete = this.state.incomplete;
    requiredFields.forEach(field => {
      if(onBoardingProgress[field]) {
        complete += 1;
      } else {
        incomplete += 1;
      }
    });
    this.setState({
      complete: complete
      , incomplete: incomplete
    });
  }

  render() {
    const {
      complete
      , incomplete
    } = this.state;

    const { closeAction, confirmAction } = this.props;

    const progressPercent = complete / (complete + incomplete) * 100;

    const progressClass = classNames(
      `progress-bar-${progressPercent || 0}`
    )

    return (
      <div className="yt-row">
        <div className="onboarding-reminder-wrapper">
          <div className="yt-row center-vert space-between">
            <h3>Continue setting up your account</h3>
            <button className="yt-btn xx-small link" onClick={closeAction}>
              <i className="far fa-times" />
            </button>
          </div>
          <p style={{marginBottom: "1em"}}>We need a few more pieces of information to get your account up and running.</p>
          <p><small>Completed {complete} of {complete + incomplete} </small></p>
          <div className={progressClass} style={{marginBottom: "1em"}} >
            <div className="-progress">
              <div className="-complete">
              </div>
            </div>
          </div>
          <button onClick={confirmAction} className="yt-btn xx-small u-pullRight">Continue</button>
        </div>
      </div>
    )
  }
}

PortalOnBoardingReminder.propTypes = {
  user: PropTypes.object.isRequired
  , client: PropTypes.object.isRequired
  , closeAction: PropTypes.func.isRequired
}

PortalOnBoardingReminder.defaultProps = {
}

export default PortalOnBoardingReminder;
