/**
 * View component for /portal/:clientId/account
 */
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import ProfilePic from '../../../../global/components/navigation/ProfilePic.js.jsx';

// import form components
import { SelectFromObject, TextInput } from '../../../../global/components/forms';

// import utils
import { auth } from '../../../../global/utils';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';

// import other resource components
import AddressCard from '../../../address/components/AddressCard.js.jsx';
import AddressEditor from '../../../address/components/AddressEditor.js.jsx';
import PhoneNumberCard from '../../../phoneNumber/components/PhoneNumberCard.js.jsx';
import ClientUserPositionForm from '../../../user/practice/components/ClientUserPositionForm.js.jsx';

class ClientSettingsOverview extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      client: props.clientStore.byId[props.clientId] ? _.cloneDeep(props.clientStore.byId[props.clientId]) : {}
      , errorMessage: ''
      , isAddingAddress: false
      , isEditingSecretQuestion: false
      , isErrorModalOpen: false
      , isSetPrimaryAddressModalOpen: false
      , isSetPrimaryContactModalOpen: false
      , isSetPrimaryPhoneModalOpen: false
      , newSharedSecretPrompt: ''
      , newSharedSecretAnswer: ''
      , selectedClientUser: null
      , isEditingPosition: false
    }
    this._bind(
      '_buildContactList'
      , '_handleCancelUpdateClient'
      , '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleNewAddress'
      , '_handleUpdateSecret'
      , '_openSetClientPrimaryModal'
    )
  }

  componentDidMount() {
    const { dispatch, match, loggedInUser } = this.props;
    if(match.params.clientId && loggedInUser && loggedInUser._id) {
      dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId, '_user', loggedInUser._id)).then(cuRes => {
        if(cuRes.success && cuRes.list) {
          const selectedClientUser = cuRes.list[0];
          this.setState({
            selectedClientUser
          })
        }
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    const { clientStore, clientId } = nextProps;
    this.setState({
      client: clientStore.byId[clientId] ? _.cloneDeep(clientStore.byId[clientId]) : {}
    });
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit() {
    const { dispatch } = this.props;
    this.setState({
      isSetPrimaryAddressModalOpen: false
      , isSetPrimaryContactModalOpen: false
      , isSetPrimaryPhoneModalOpen: false
    })
    dispatch(clientActions.sendUpdateClient(this.state.client)).then(clientRes => {
      if(clientRes.success) {
        
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  _handleNewAddress(addressId) {
    const { clientId, dispatch } = this.props;
    if(addressId) {
      dispatch(addressActions.addAddressToList(addressId, '_client', clientId))
    }
    this.setState({
      isAddingAddress: false
    });
  }

  _handleCancelUpdateClient() {
    const { clientStore, clientId } = this.props;
    this.setState({
      client: _.cloneDeep(clientStore.byId[clientId])
      , isSetPrimaryAddressModalOpen: false
      , isSetPrimaryContactModalOpen: false
      , isSetPrimaryPhoneModalOpen: false
    });
  }

  _openSetClientPrimaryModal(field) {
    if(field === 'contact') {
      this.setState({
        isSetPrimaryContactModalOpen: true
      });
    } else if(field === 'address') {
      this.setState({
        isSetPrimaryAddressModalOpen: true
      });
    } else if(field === 'phone') {
      this.setState({
        isSetPrimaryPhoneModalOpen: true
      });
    }
  }

  _buildContactList(clientUserListItems) {
    const { userStore } = this.props;
    let contactListItems = [];
    for(const clientUser of clientUserListItems) {
      let contactItem = userStore.byId[clientUser._user]
      if(contactItem) {
        contactItem._clientUser = clientUser._id;
        contactItem.fullName = `${_.startCase(contactItem.firstname)} ${_.startCase(contactItem.lastname)}`
        contactListItems.push(contactItem);
      }
    }
    return contactListItems
  }

  _handleUpdateSecret() {
    const { dispatch } = this.props;
    const { client, newSharedSecretPrompt, newSharedSecretAnswer } = this.state;
    let newClient = _.cloneDeep(client);
    newClient.sharedSecretPrompt = newSharedSecretPrompt
    newClient.sharedSecretAnswer = auth.getHashFromString(_.snakeCase(newSharedSecretAnswer)) // Sanitize and hash before sending to the server.
    dispatch(clientActions.sendUpdateClient(newClient));
    this.setState({
      isEditingSecretQuestion: false
      , newSharedSecretPrompt: ''
      , newSharedSecretAnswer: ''
    })
  }

  render() {
    const {
      addressStore
      , clientUserStore
      , clientId
      , phoneNumberStore
      , userStore
    } = this.props;
    const { client, selectedClientUser, isEditingPosition } = this.state

    const addressList = addressStore.lists && addressStore.lists._client && addressStore.lists._client[clientId] ? addressStore.lists._client[clientId] : null;
    const addressListItems = addressStore.util.getList('_client', clientId);

    const clientUserList = clientUserStore.lists && clientUserStore.lists._client && clientUserStore.lists._client[clientId] ? clientUserStore.lists._client[clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', clientId);

    const contactListItems = clientUserListItems ? this._buildContactList(clientUserListItems) : []

    const primaryAddress = client ? addressStore.byId[client._primaryAddress] : null;
    const primaryPhone = client ? phoneNumberStore.byId[client._primaryPhone] : null;
    const primaryContactUserId = client && userStore.byId[client._primaryContact] ? userStore.byId[client._primaryContact]._id : null;
    const primaryContact = primaryContactUserId ? userStore.byId[primaryContactUserId] : null;

    const isEmpty = (
      !addressListItems
      || !clientUserListItems
      || !clientId
      || !client
    )

    const isFetching = (
      !addressList
      || addressList.isFetching
      || !clientUserList
      || clientUserList.isFetching
    )

    const filteredAddressList = !isEmpty ? addressListItems.filter(address => address._id !== client._primaryAddress) : []

    return (
      isEmpty ?
      (isFetching ? 
        <div className="-loading-hero">
          <div className="u-centerText">
            <div className="loading"></div>
          </div>
        </div> 
        : 
        <h2>No client found.</h2>
      )
      :
      <div className="-portal-content">
        <div className="-client-overview">
        { primaryContact ?
          <div className="-contact-card">
            <label>Primary Contact</label>
            <div className="yt-row center-vert">
            <ProfilePic user={primaryContact}/>
            <div className="-name">{primaryContact.firstname} {primaryContact.lastname}</div>
            </div>
            <small>{primaryContact.username}</small>
          </div>
          :
          <div className="-contact-card">
            <label>Primary Contact</label>
            <div className="yt-row center-vert">
              <div>
                <p><em>No primary contact found</em></p>
                <button onClick={() => this._openSetClientPrimaryModal('contact')} className="yt-btn link x-small"><i className="fal fa-plus"/> Set primary contact</button>
              </div>
            </div>
          </div>
          }
          <div>
            <label>Position</label>
            <div className="address-editor -quick-view -file-cared">
              { isEditingPosition && selectedClientUser ?
                <ClientUserPositionForm
                  close={(val) => this.setState({ selectedClientUser: val, isEditingPosition: !isEditingPosition })}
                  selectedClientUser={selectedClientUser}
                />
                :
                <div style={{paddingBottom: '1em'}}>
                  <p>{selectedClientUser && selectedClientUser.position ? selectedClientUser.position : <em>n/a</em> }</p>
                  {
                    selectedClientUser && selectedClientUser.position ? 
                    <small onClick={() => this.setState({ isEditingPosition: !isEditingPosition })} className="action-link -edit-button">
                      Edit
                    </small>
                    :
                    <button onClick={() => this.setState({ isEditingPosition: !isEditingPosition })} className="yt-btn link x-small"><i className="fal fa-plus"/> Set Position</button>
                  }
                </div>
              }
            </div>
          </div>
          <div>
            <label>Primary Phone</label>
            { primaryPhone ?
              <PhoneNumberCard
                editable={true}
                phoneNumber={primaryPhone}
              />
              :
              <div style={{paddingBottom: '1em'}}>
                <p><em>No primary phone found</em></p>
                <button onClick={() => this._openSetClientPrimaryModal('phone')} className="yt-btn link x-small"><i className="fal fa-plus"/> Set primary phone</button>
              </div>
            }
          </div>
          <div>
            <label>Primary Address</label>
            { primaryAddress ?
              <AddressCard
                address={primaryAddress}
                editable={true}
              />
              :
              <div style={{paddingBottom: '1em'}}>
                <p><em>No primary address found</em></p>
                <button onClick={() => this._openSetClientPrimaryModal('address')} className="yt-btn link x-small"><i className="fal fa-plus"/> Set primary address</button>
              </div>
            }
          </div>
          <div className="-other-addresses">
            <label>
              {`Other Addresses (${filteredAddressList.length})`}
              <small
                className="action-link -show-hide-address"
                onClick={() => this.state.showOtherAddresses ? this.setState({showOtherAddresses: false}) : this.setState({showOtherAddresses: true})}
              >
              { this.state.showOtherAddresses ? 'Hide' : 'Show' }
              </small>
            </label>
            { this.state.showOtherAddresses ?
              filteredAddressList.map((address, i) =>
                <AddressCard
                  address={address}
                  editable={true}
                  key={address._id + i}
                />
              )
              :
              null
            }
            { this.state.isAddingAddress ?
              <AddressEditor
                pointers={{_client: client._id}}
                onSubmit={this._handleNewAddress}
                editorClasses="-quick-view"
              />
              :
              <button onClick={() => this.setState({isAddingAddress: true})} className="yt-btn link x-small"><i className="fal fa-plus"/> Add address</button>
            }
          </div>
          <div className="-website">
            <label>Website</label>
            <p>{client.website}</p>
          </div>
          <div className="-portal-content">
            <label>Client Secret Question
              <small onClick={() => this.setState({isEditingSecretQuestion: true})} className="action-link -edit-button">
                Edit
              </small>
            </label>
            { !this.state.isEditingSecretQuestion ?
              <div>
              { client.sharedSecretPrompt ?
                <div>
                  <p>{client.sharedSecretPrompt}</p>
                  <input
                    style={{border: 0}}
                    disabled={true}
                    type="password"
                    value={"*******"}
                  />
                </div>
                :
                <p>
                  <em>No shared secret question set</em>
                </p>
              }
              </div>
              :
              <div className="yt-col l_50">
                <TextInput
                  change={this._handleFormChange}
                  name="newSharedSecretPrompt"
                  placeholder="Shared question"
                  required
                  value={this.state.newSharedSecretPrompt}
                />
                <TextInput
                  change={this._handleFormChange}
                  helpText="Make sure the answer is something you both know"
                  name="newSharedSecretAnswer"
                  placeholder="Shared answer"
                  required
                  value={this.state.newSharedSecretAnswer}
                />
                <button onClick={() => this.setState({isEditingSecretQuestion: false, newSharedSecretPrompt: '', newSharedSecretAnswer: ''})} className="yt-btn danger link x-small">
                  Cancel
                </button>
                <button onClick={this._handleUpdateSecret} disabled={!this.state.newSharedSecretAnswer || !this.state.newSharedSecretPrompt} className="yt-btn link info x-small">
                  Save
                </button>
              </div>
            }
            </div>
          <Modal
            isOpen={this.state.isSetPrimaryAddressModalOpen}
            closeAction={this._handleCancelUpdateClient}
            confirmAction={this._handleFormSubmit}
            cardSize="standard"
            modalHeader="Primary address"
          >
            <SelectFromObject
              items={addressListItems}
              change={this._handleFormChange}
              display={'street1'}
              displayStartCase={false}
              filterable={false}
              label=''
              name='client._primaryAddress'
              placeholder={addressListItems.length === 0 ? '-- No addresses found --' : '-- Select a primary address --'}
              value={'_id'}
            />
          </Modal>
          <Modal
            isOpen={this.state.isSetPrimaryContactModalOpen}
            closeAction={this._handleCancelUpdateClient}
            confirmAction={this._handleFormSubmit}
            cardSize="standard"
            modalHeader="Primary contact"
          >
            <SelectFromObject
              items={contactListItems}
              change={this._handleFormChange}
              display={'fullName'}
              displayStartCase={false}
              filterable={false}
              label=''
              name='client._primaryContact'
              placeholder={'-- Select a primary contact --'}
              value={'_id'}
            />
          </Modal>
          {/* <Modal
            isOpen={this.state.isSetPrimaryPhoneModalOpen}
            closeAction={this._handleCancelUpdateClient}
            confirmAction={this._handleFormSubmit}
            cardSize="standard"
            modalHeader="Set primary phone"
          >
            
            NOTE: There is no way to get a list of phone numbers by _client. Phone numbers only belong to users.
            We might want to change that.

          </Modal> */}
        </div>
      </div>
    )
  }
}

ClientSettingsOverview.propTypes = {
  clientId: PropTypes.string.isRequired
  , dispatch: PropTypes.func.isRequired
}

ClientSettingsOverview.defaultProps = {
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.address
    , clientStore: store.client
    , clientUserStore: store.clientUser
    , phoneNumberStore: store.phoneNumber
    , userStore: store.user
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
  mapStoreToProps
)(ClientSettingsOverview)
);
