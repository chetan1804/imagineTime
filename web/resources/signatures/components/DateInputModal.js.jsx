/**
 * Modal component for taking a date input
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import third-party libraries
import { DateTime } from 'luxon';


// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import {SingleDatePickerInput} from '../../../global/components/forms';

class DateInputModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      expireDate: DateTime.local().plus({days: 7}).toMillis()
      , inProgress: false
      , progressPercent: 0
    }
    this._bind(
      'onClose'
      , 'onFormChange'
      , 'onUpdate'
    )
  }

  componentDidMount() {
    
    const { socket } = this.props;

    socket.on('start_progress', (actionText) => {
      // console.log('STARTING UPLOAD');
      this.setState({ inProgress: true });
    })

    socket.on('progress_status', progressPercent => {
      console.log('progressPercent', progressPercent);
      this.setState({ progressPercent });
    });

    socket.on('finish_progress', (actionText) => {
      this.onClose();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    ;
  }

  onFormChange(e) {
    // event.target.value = date.valueOf(); has the date object
    console.log('Event Object: ', e.target.value);
    this.setState({...this.state, expireDate: e.target.value});
  }

  onClose() {
    console.log('onClose')

    // back to default
    this.setState({
      expireDate: DateTime.local().plus({days: 7}).toMillis()
      , inProgress: false
      , progressPercent: 0
    }, () => {
      this.props.onClose();
    });
  }

  onUpdate() {
    this.props.onSave(this.state.expireDate);
  }

  render() {
    const {
      isOpen
    } = this.props; 
    
    const {
      progressPercent
      , inProgress
    } = this.state;

    return (
      <div>
        <Modal
          cardSize="small"
          closeAction={this.onClose}
          closeText="Cancel"
          confirmAction={inProgress ? this.onClose : this.onUpdate}
          confirmText={inProgress ? "Continue in background" : "Update"}
          isOpen={isOpen}
          modalHeader='Set Expiry Date'
        > 
            <div>
              <div className="inputFormSection">
                <div>
                  {
                    inProgress ? 
                    <div className="yt-container">
                      <div className="upload-progress-container">
                        <p>{`Import Progress ${progressPercent}%`}</p>
                        <div className={"progress-bar-"+progressPercent} >
                          <div className="-progress">
                            <div className="-complete">
                            </div>
                          </div>
                        </div>
                      </div>
                      <br/>
                      <div className="yt-row">
                        <p>Taking too long? We can finish this in the background while you do something else.</p>
                      </div>
                      <div className="yt-row">
                        <p><strong>You'll see your progress at the top of the page.</strong></p>
                      </div>
                    </div>
                    : 
                    <div className="yt-row space-between">
                      <div style={{paddingTop: 9}}>
                        Expiry Date
                      </div>
                      <div className="-inputs yt-col">
                        <SingleDatePickerInput
                          anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
                          change={this.onFormChange}
                          enableOutsideDays={false}
                          initialDate={this.state.expireDate} // epoch/unix time in milliseconds
                          inputClasses="-right"
                          minDate={DateTime.local().toMillis()}
                          name='expireDate'
                          numberOfMonths={1}
                          placeholder={""}
                        />
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
        </Modal>
      </div>
    )
  }
}

DateInputModal.propTypes = {
  onClose: PropTypes.func.isRequired 
  , onSave: PropTypes.func.isRequired 
  , isOpen: PropTypes.bool.isRequired
}

DateInputModal.defaultProps = {
  isOpen: false
}

export default DateInputModal;
