/**
 * View component for /phone-numbers/new
 *
 * Creates a new phoneNumber from a copy of the defaultItem in the phoneNumber reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as phoneNumberActions from '../phoneNumberActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import PhoneNumberForm from '../components/PhoneNumberForm.js.jsx';
import PhoneNumberLayout from '../components/PhoneNumberLayout.js.jsx';

class CreatePhoneNumber extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: _.cloneDeep(this.props.defaultPhoneNumber.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the phoneNumber
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(phoneNumberActions.fetchDefaultPhoneNumber());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      phoneNumber: _.cloneDeep(nextProps.defaultPhoneNumber.obj)

    })
  }
  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(phoneNumberActions.sendCreatePhoneNumber(this.state.phoneNumber)).then(phoneNumberRes => {
      if(phoneNumberRes.success) {
        dispatch(phoneNumberActions.invalidateList());
        history.push(`/phone-numbers/${phoneNumberRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { phoneNumber, formHelpers } = this.state;
    const isEmpty = (!phoneNumber || phoneNumber.name === null || phoneNumber.name === undefined);
    return (
      <PhoneNumberLayout>
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <PhoneNumberForm
            phoneNumber={phoneNumber}
            cancelLink="/phone-numbers"
            formHelpers={formHelpers}
            formTitle="Create Phone Number"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </PhoneNumberLayout>
    )
  }
}

CreatePhoneNumber.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultPhoneNumber: store.phoneNumber.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreatePhoneNumber)
);
