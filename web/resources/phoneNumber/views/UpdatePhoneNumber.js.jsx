/**
 * View component for /phone-numbers/:phoneNumberId/update
 *
 * Updates a single phoneNumber from a copy of the selcted phoneNumber
 * as defined in the phoneNumber reducer
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

class UpdatePhoneNumber extends Binder {
  constructor(props) {
    super(props);
    const { match, phoneNumberStore } = this.props;
    this.state = {
      phoneNumber: phoneNumberStore.byId[match.params.phoneNumberId] ?  _.cloneDeep(phoneNumberStore.byId[match.params.phoneNumberId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
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
    const { dispatch, match } = this.props;
    dispatch(phoneNumberActions.fetchSingleIfNeeded(match.params.phoneNumberId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, phoneNumberStore } = nextProps;
    this.setState({
      phoneNumber: phoneNumberStore.byId[match.params.phoneNumberId] ?  _.cloneDeep(phoneNumberStore.byId[match.params.phoneNumberId]) : {}
      // NOTE: ^ we don't want to actually change the store's phoneNumber, just use a copy
    })
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(phoneNumberActions.sendUpdatePhoneNumber(this.state.phoneNumber)).then(phoneNumberRes => {
      if(phoneNumberRes.success) {
        history.push(`/phone-numbers/${phoneNumberRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , phoneNumberStore
    } = this.props;
    const { phoneNumber, formHelpers } = this.state;

    const selectedPhoneNumber = phoneNumberStore.selected.getItem();

    const isEmpty = (
      !phoneNumber
      || !phoneNumber._id
    );

    const isFetching = (
      !phoneNumberStore.selected.id
      || phoneNumberStore.selected.isFetching
    )

    return  (
      <PhoneNumberLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <PhoneNumberForm
            phoneNumber={phoneNumber}
            cancelLink={`/phone-numbers/${phoneNumber._id}`}
            formHelpers={formHelpers}
            formTitle="Update Phone Number"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </PhoneNumberLayout>
    )
  }
}

UpdatePhoneNumber.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    phoneNumberStore: store.phoneNumber
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UpdatePhoneNumber)
);
