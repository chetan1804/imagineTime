/**
 * View for /user/finish/review-account
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries


// import actions
import * as addressActions from '../../../address/addressActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as clientActions from '../../../client/clientActions';

// import utils
import { onBoardUtils } from '../../../../global/utils/index';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import ProgressDots from '../../../../global/components/helpers/ProgressDots.js.jsx';

// import resource components
import UserLayout from '../../components/UserLayout.js.jsx';
import UserReviewAccountForm from '../components/UserReviewAccountForm.js.jsx';


class UserFinishReviewAccount extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      address: null
      , client: null
      , errorMessage: ''
      , isErrorModalOpen: false
      , phoneNumber: null
      , submitting: false
      , totalSteps: null
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_toggleErrorModal'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    // fire actions
    // Start by fetching the loggedInUser's client.
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        const client = clientRes.item
        const onBoardedProgress = onBoardUtils.getOnBoardedProgress(loggedInUser, client)
        this.setState({
          client: client
          , onBoardedProgress: onBoardedProgress
          , totalSteps: Object.keys(onBoardedProgress).length
        })
        // if there's a primary address, fetch it. Otherwise fetch the default.
        if(client._primaryAddress) {
          dispatch(addressActions.fetchSingleIfNeeded(client._primaryAddress)).then(addressRes => {
            if(addressRes.success) {
              this.setState({
                address: _.cloneDeep(addressRes.item)
              })
            }
          })
        } else {
          dispatch(addressActions.fetchDefaultAddress()).then(defaultAddressRes => {
            if(defaultAddressRes.success) {
              // set the client on the blank address object.
              let newAddress = _.cloneDeep(defaultAddressRes.defaultObj)
              newAddress._client = client._id
              this.setState({
                address: _.cloneDeep(defaultAddressRes.defaultObj)
              });
            }
          })
        }
        // if there's a primary phoneNumber, fetch it. Otherwise fetch the default.
        if(client._primaryPhone) {
          dispatch(phoneNumberActions.fetchSingleIfNeeded(client._primaryPhone)).then(phoneNumberRes => {
            if(phoneNumberRes.success) {
              this.setState({
                phoneNumber: _.cloneDeep(phoneNumberRes.item)
              });
            }
          })
        } else {
          dispatch(phoneNumberActions.fetchDefaultPhoneNumber()).then(defaultPhoneRes => {
            if(defaultPhoneRes.success) {
              // set the user on the blank phone number object.
              let newPhoneNumber = _.cloneDeep(defaultPhoneRes.defaultObj)
              newPhoneNumber._user = loggedInUser._id
              this.setState({
                phoneNumber: _.cloneDeep(newPhoneNumber)
              });
            }
          });
        }
      }
    });;
    dispatch(addressActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(phoneNumberActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_user', loggedInUser._id, '_client', match.params.clientId));
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    e.preventDefault();
    this.setState({submitting: true});
    /**
     * NOTE: There's a lot going on here. We have to save info on three resources: address, phoneNumber, and client.
     * Also, we don't know if we need to sendUpdate or sendCreate for address and phoneNumber.
     * If either of these two resources are new, we need to save a reference to it on
     * the client (_primaryPhone and _primaryAddress).
     * This means we have 4 possibitlies to account for:
     *  1. Has primary phone AND address - Send updates on all.
     *  2. Has primary address - Send update on address, send create on phone, save phone reference on client. 
     *  3. Has primary phone - Send update on phone, send create on address, save address reference on client.
     *  4. Has neither - Send create on phone AND address, save each as a reference on client.
     * 
     * To avoid a massive wall of if statements and nested actions I made a method to deal with each resource.
     * we'll start with address.
     */

    this._handleSaveAddress();

    /*
     * ALTERNATIVE: We might want to deal with some of this complexity on the server.
     */
  }

  _toggleErrorModal() {
    this.setState({isErrorModalOpen: !this.state.isErrorModalOpen});
  }

  _handleSaveAddress() {
    // console.log('Saving address')
    const { dispatch, match } = this.props;
    const { address } = this.state;
    // Check if we need to sendUpdate or sendCreate for this resource.
    if(address._id) {
      // address has an id so it must have already existed. Send update.
      dispatch(addressActions.sendUpdateAddress(address)).then(addressRes => {
        if(addressRes.success) {
          this._handleSavePhoneNumber(addressRes.item._id)
        } else {
          this.setState({errorMessage: addressRes.error});
          this._toggleErrorModal();
        }
      })
    } else if(
      address && (
        address.city
        || address.country
        || address.postal
        || address.state
        || address.street1
      )
      ) {
      // address is new and has at least SOME data. Send create.
      let newAddress = _.cloneDeep(address);
      address._client = match.params.clientId;
      dispatch(addressActions.sendCreateAddress(newAddress)).then(addressRes => {
        if(addressRes.success) {
          this._handleSavePhoneNumber(addressRes.item._id)
        } else {
          this.setState({errorMessage: addressRes.error});
          this._toggleErrorModal();
        }
      })
    } else {
      // No address info was entered.
      this._handleSavePhoneNumber(null)
    }
  }

  _handleSavePhoneNumber(addressId) {
    // console.log('Saving phone. AddressId is: ', addressId)
    const { dispatch, match } = this.props;
    const { phoneNumber} = this.state;
    // Check if we need to sendUpdate or sendCreate for this resource.
    if(phoneNumber._id) {
      // phoneNumber has an id so it must have already existed. Send update.
      dispatch(phoneNumberActions.sendUpdatePhoneNumber(phoneNumber)).then(phoneNumberRes => {
        if(phoneNumberRes.success) {
          this._handleSaveClient(addressId, phoneNumberRes.item._id)
        } else {
          this.setState({errorMessage: phoneNumberRes.error});
          this._toggleErrorModal();
        }
      })
    } else if(phoneNumber && phoneNumber.number) {
      // phoneNumber is new. Send create.
      let newPhone = _.cloneDeep(phoneNumber);
      newPhone._client = match.params.clientId
      dispatch(phoneNumberActions.sendCreatePhoneNumber(newPhone)).then(phoneNumberRes => {
        if(phoneNumberRes.success) {
          this._handleSaveClient(addressId, phoneNumberRes.item._id)
        } else {
          this.setState({errorMessage: phoneNumberRes.error});
          this._toggleErrorModal();
        }
      })
    } else {
      // No phone number was entered.
      this._handleSaveClient(addressId, null)
    }
  }

  _handleSaveClient(addressId, phoneNumberId) {
    // console.log('Saving client. ', phoneNumberId, addressId)
    const { dispatch, history, loggedInUser, match } = this.props;
    const { client } = this.state;
    let newClient = _.cloneDeep(client);
    // check if we need to save _primaryAddress or _primaryPhone on client.
    if(!newClient._primaryAddress && addressId) {
      newClient._primaryAddress = addressId
    }
    if(!newClient._primaryPhone && phoneNumberId) {
      newClient._primaryPhone = phoneNumberId
    }
    if(!newClient._primaryContact) {
      newClient._primaryContact = loggedInUser._id
    }
    dispatch(clientActions.sendUpdateClient(newClient)).then(clientRes => {
      if(clientRes.success) {
        this.setState({
          submitting: false
        }, () => history.push(`/portal/${match.params.clientId}/dashboard`))
      } else {
        this.setState({errorMessage: clientRes.error});
        this._toggleErrorModal();
      }
    })
  }
  
  render() {
    const {
      clientStore
      , closeAction
      , isOpen
    } = this.props;
    const {
      address
      , client
      , phoneNumber
    } = this.state;

    const isEmpty = (
      !address
      || !client
      || !phoneNumber
    )

    const isFetching = (
      !clientStore
      || !clientStore.selected
      || clientStore.selected.isFetching
    )

    return (
      <UserLayout>
      { isFetching ?
        <div className="-loading-hero">
          <div className="u-centerText">
            <div className="loading"></div>
          </div>
        </div>
        :
        isEmpty ?
        <div>Empty.</div>
        :
        <div style={{height: '100vh'}} className="yt-row center-vert">
          <div style={{height: '80%'}} className="yt-col full">
            <div className="yt-container user-finish">
              <ProgressDots
                currentStep={3}
                totalSteps={3}
              />
              <UserReviewAccountForm
                client={client}
                address={address}
                handleFormChange={this._handleFormChange}
                handleFormSubmit={this._handleFormSubmit}
                phoneNumber={phoneNumber}
                submitting={this.state.submitting}
              />
            </div>
          </div>
          <AlertModal
            alertMessage={
              <div>
                <strong>
                  {this.state.errorMessage}
                </strong>
                <br/>
                <div>Please try again.</div>
              </div>
            }
            alertTitle="Error"
            closeAction={this._toggleErrorModal}
            confirmAction={this._toggleErrorModal}
            confirmText="Try again"
            isOpen={this.state.isErrorModalOpen}
            type="danger"
          />
        </div>
      }
      </UserLayout>
    )
  }
}

UserFinishReviewAccount.propTypes = {
  dispatch: PropTypes.func.isRequired
}

UserFinishReviewAccount.defaultProps = {
}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientStore: store.client
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(UserFinishReviewAccount)
);
