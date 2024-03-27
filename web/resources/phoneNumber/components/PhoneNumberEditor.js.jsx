/**
 * A reusable component to add a phone number to any user. If no phoneNumberId is passed,
 * it fetches its own default and saves the new phone number with the supplied userId.
 * If a phoneNumberId is passed, it edits that phone number.
 * 
 * All it needs from the parent is a userId OR an phoneNumberId. It MUST have one.
 *  <PhoneNumberEditor
 *    userId={match.params.userId}
 *    phoneNumberId={phoneNumber._id}
 *    onSubmit={} // Called when an phoneNumber is created/updated (to add the item to lists, etc...).
 *  />
 * 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';

// import actions
import * as phoneNumberActions from '../phoneNumberActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import PhoneNumberForm from './PhoneNumberForm.js.jsx';

class PhoneNumberEditor extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: null
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    const { phoneNumberId, dispatch, match } = this.props;
    if(phoneNumberId) {
      dispatch(phoneNumberActions.fetchSingleIfNeeded(phoneNumberId)).then(phoneNumberRes => {
        if(phoneNumberRes.success) {
          this.setState({
            phoneNumber: _.cloneDeep(phoneNumberRes.item)
          });
        }
      });
    } else if(this.props.userId) {
      dispatch(phoneNumberActions.fetchDefaultPhoneNumber()).then(phoneNumberRes => {
        if(phoneNumberRes.success) {
          this.setState({
            phoneNumber: _.cloneDeep(phoneNumberRes.defaultObj)
          });
        }
      });
    } else if(this.props.clientId) {
      dispatch(phoneNumberActions.fetchDefaultPhoneNumber()).then(phoneNumberRes => {
        if(phoneNumberRes.success) {
          this.setState({
            phoneNumber: _.cloneDeep(phoneNumberRes.defaultObj)
          });
        }
      });
    } else {
      alert("ERROR: Missing required props in PhoneNumberEditor.")
    }
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    const { dispatch } = this.props;
    const { phoneNumber } = this.state;
    if(e) {
      e.preventDefault();
    }
    let newPhoneNumber = _.cloneDeep(phoneNumber);
    newPhoneNumber.number = newPhoneNumber.number.trim()
    
    if(newPhoneNumber.number) {
    /**
     * NOTE: react-phone-number-input doesn't add a + to the beginning of the number
     * but its formatPhoneNumber function that we use to display phone numbers requires
     * a + before the number to format it correctly.
     */
      if(newPhoneNumber.number[0] !== '+') {
        let phonePrefix = '+'
        if(newPhoneNumber.number[0] !== '1') {
          phonePrefix += '1'
        }
        newPhoneNumber.number = phonePrefix.concat(newPhoneNumber.number)
      }
      if(this.props.phoneNumberId) {
        // the presence of phoneNumberId means we are editing an existing phoneNumber.
        // send update phoneNumber
        dispatch(phoneNumberActions.sendUpdatePhoneNumber(newPhoneNumber)).then(phoneNumberRes => {
          if(phoneNumberRes.success) {
            if(this.props.onSubmit) {
              this.props.onSubmit(phoneNumberRes.item._id)
            }
          } else {
            alert("ERROR - Check logs");
          }
        })
      } else if(this.props.userId) {
        // if we aren't editing an existing phoneNumber, we must have a userId to save the new one.
        newPhoneNumber._user = this.props.userId
        dispatch(phoneNumberActions.sendCreatePhoneNumber(newPhoneNumber)).then(phoneNumberRes => {
          if(phoneNumberRes.success) {
            if(this.props.onSubmit) {
              this.props.onSubmit(phoneNumberRes.item._id)
            }
          } else {
            alert("ERROR - Check logs");
          }
        })
      } else if(this.props.clientId) {
        newPhoneNumber._client = this.props.clientId
        dispatch(phoneNumberActions.sendCreatePhoneNumber(newPhoneNumber)).then(phoneNumberRes => {
          if(phoneNumberRes.success) {
            if(this.props.onSubmit) {
              this.props.onSubmit(phoneNumberRes.item._id)
            }
          } else {
            alert("ERROR - Check logs");
          }
        })
      } else {
        // We have no phoneNumberId and no userId. We can't do anything.
        alert("ERROR - Unable to save phoneNumber.")
      }
    } else {
      // PhoneNumber has no content. Nothing to save.
      if(this.props.onSubmit) {
        this.props.onSubmit()
      }
    }
  }

  render() {
    const { phoneNumber } = this.state;
    const { editorClasses } = this.props;

    const isEmpty = !phoneNumber;

    const isDisabled = (
      !phoneNumber
      || !phoneNumber.number
      || phoneNumber.number.length < 10
    )

    let editorClass = classNames(
      "phone-number-editor yt-row"
      , editorClasses
    )

    return (
      isEmpty ?
      <div className="u-centerText">
        <div className="loading -small"></div>
      </div>
      :
      <div className={editorClass}>
        <PhoneNumberForm
          phoneNumber={phoneNumber}
          disabled={isDisabled}
          handleFormChange={this._handleFormChange}
          handleFormSubmit={this._handleFormSubmit}
          formType={this.props.userId || this.props.clientId ? 'create' : 'update'}
          onCancel={() => this.props.onSubmit()}
        />
      </div>
    )
  }
}

PhoneNumberEditor.propTypes = {
  dispatch: PropTypes.func.isRequired
  , phoneNumberId: PropTypes.number
  , userId: PropTypes.number
}

PhoneNumberEditor.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {

  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PhoneNumberEditor)
);