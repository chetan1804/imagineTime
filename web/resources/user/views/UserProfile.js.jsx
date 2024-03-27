/**
 * View component for /profile
 *
 * Display logged in user's own profile information and lets them update if
 * they want.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import classNames from 'classnames';
import moment from 'moment';
import { Helmet } from 'react-helmet';
import MicrosoftLogin from "react-microsoft-login";

// import actions
import * as addressActions from '../../address/addressActions';
import * as firmActions from '../../firm/firmActions';
import * as phoneNumberActions from '../../phoneNumber/phoneNumberActions';
import * as userActions from '../userActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { displayUtils } from '../../../global/utils';
import { ToggleSwitchInput } from '../../../global/components/forms';
import {
  TextInput
} from '../../../global/components/forms';

// import user components
import AddressCard from '../../address/components/AddressCard.js.jsx';
import AddressEditor from '../../address/components/AddressEditor.js.jsx';
import NewImageModal from '../../file/components/NewImageModal.js.jsx'; 
import UserProfileLayout from '../components/UserProfileLayout.js.jsx';
import UpdateProfileModal from '../components/UpdateProfileModal.js.jsx';
import UpdatePasswordModal from '../components/UpdatePasswordModal.js.jsx';
import { RECEIVE_AUTHENTICATE_SHARE_LINK } from '../../shareLink/shareLinkActions';

import { domains, appClientIds } from "../../../config/prodDomains.js";
import brandingName from '../../../global/enum/brandingName.js.jsx';

class UserProfile extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      updateModalOpen: false
      , updatePasswordModalOpen: false
      , newUserData: _.cloneDeep(this.props.loggedInUser) 
      , changeCount: 0
      , oldPass: null
      , newPass: null
      , confirmPass: null 
      , helpText: ''
      , code: ''
      , msClientId: appClientIds.default
      , redirectUri: ''
      , msalInstance: null
    }
    this._bind(
      '_closeUpdateModal'
      , '_closeUpdatePasswordModal'
      , '_handleEditAddress'
      , '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleNewAddress'
      , '_handleNewImageFile'
      , '_handlePasswordChange'
      , '_handleSubmitUpdatePassword'
      , '_handleToggleNotificationEmails'
      , '_logout'
      , '_makePrimaryAddress'
      , '_openUpdateModal'
      , '_openUpdatePasswordModal'
      , '_handleDisconnectMSAccount'
      , '_handleToggle2FA'
      , '_handleTFACode'
      , '_handleEnableTFA'
      , '_handleMSAuthCallback'
    );
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match, firmStore } = this.props;

    const selectedFirm = firmStore.selected.getItem();

    let clusters = ['cluster1','cluster2','cluster3','cluster4','cluster5','cluster6','cluster7'];

    let redirectUri = selectedFirm && selectedFirm.domain ?
      selectedFirm.domain : window.appUrl;

    let selectedCluster = clusters.filter(c => {
      if(domains[c].includes(redirectUri)) {
        return c;
      }
    })[0];

    if(redirectUri.includes('localhost')) {
      this.setState({
        redirectUri: `http://${redirectUri}/api/ms/auth`
      })
    } else {
      this.setState({
        redirectUri: `https://${redirectUri}/api/ms/auth`
      })
    }

    selectedCluster = selectedCluster ? selectedCluster : 'default';

    let selectedMSClient = appClientIds[selectedCluster];

    this.setState({
      msClientId: selectedMSClient
    });

    console.log('loggedInUser profile', loggedInUser);

    if(!loggedInUser.secret_2fa || !loggedInUser.qrcode_2fa) {
      console.log('generate 2fa');

      let updatedUser = loggedInUser;
      updatedUser.action = 'generate_qrcode';

      dispatch(userActions.sendUpdateProfile(updatedUser)).then(userRes => {
        if(userRes.success) {
          this.setState({
            newUserData: _.cloneDeep(userRes.user)
          })
        }
      });
    }

    dispatch(addressActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(phoneNumberActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(firmActions.fetchSingleFirmByDomain());
  }

  _openUpdateModal() {
    const { loggedInUser } = this.props;
    var newUserInfo = JSON.parse(JSON.stringify(loggedInUser));
    this.setState({
      updateModalOpen: true
      , newUserData: newUserInfo
    })
  }

  _closeUpdateModal(){
    this.setState({
      updateModalOpen: false
      , newUserData: {}
    });
  }

  _openUpdatePasswordModal() {
    this.setState({
      updatePasswordModalOpen: true
    })
  }

  _closeUpdatePasswordModal() {
    this.setState({
      updatePasswordModalOpen: false
    })
  }

  _handleFormChange(e) {

    let newUser = _.update( this.state.newUserData, e.target.name, () => {
      return e.target.value;
    });

    /**
     * Tell child components to rerender
     *
     * NOTE: this is hacky
     */
    let changeCount = this.state.changeCount;
    changeCount++;

    this.setState({
      newUserData: newUser
      , changeCount
    });
  }

  _handleFormSubmit(e) {
    const { dispatch } = this.props;
    var newState = this.state.newUserData;

    dispatch(userActions.sendUpdateProfile(newState)).then((action)=> {

      if(!action.success) {
        this.setState({helpText: action.error ? action.error : ''})
      }
      this._closeUpdateModal();
    });
  }

  _handlePasswordChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    })

    this.setState(newState); 
  }

  _handleSubmitUpdatePassword(e) {
    const { dispatch, loggedInUser } = this.props; 
    const { newPass, confirmPass, oldPass } = this.state; 
    dispatch(userActions.sendChangePassword(newPass, confirmPass, oldPass, loggedInUser._id)).then((json) => {
      if(json.success) {
        this._closeUpdatePasswordModal(); 
      } else {
        alert(json.error); 
      }
    })
  }

  _handleEditAddress(addressId) {
    this.setState({
      selectedAddressId: addressId
      , isEditingAddress: true
    })
  }

  _logout() {
    const { dispatch, history } = this.props;
    dispatch(userActions.sendLogout()).then((action) => {
      if(action.success) {
        localStorage.clear();
        // redirect to index
        history.push('/');
      } else {
        alert("ERROR LOGGING OUT - " + action.message);
      }
    })
  }

  _makePrimaryAddress(addressId) {
    const { dispatch, loggedInUser, match } = this.props;
    let updatedUser = _.cloneDeep(loggedInUser);
    updatedUser._primaryAddress = addressId;
    dispatch(userActions.sendUpdateProfile(updatedUser));
  }

  _handleNewAddress(addressId) {
    const { dispatch, loggedInUser, match } = this.props;
    if(addressId) {
      dispatch(addressActions.addAddressToList(addressId, '_user', loggedInUser._id))
    }
    this.setState({
      isAddingAddress: false
    });
  }

  _handleNewImageFile(file) {
    /**
     * Putting this in for future use. We eventually want the users to be able to upload a photo
     * for their profile pic.  However, we need to do some work on the google end to make that possible
     */
    const { dispatch, loggedInUser } = this.props;
    const updatedUser = _.cloneDeep(loggedInUser); 
    updatedUser._profilePic = file._id; 
    updatedUser.profilePicUrl = `/api/files/download/${loggedInUser._id}/${file.filename}`
    dispatch(fileActions.fetchSingleIfNeeded(file._id)); 
    dispatch(userActions.sendUpdateProfile(updatedUser)).then(userRes => {
      this.setState({newImageFileOpen: false}); 
    })
  }

  _handleToggleNotificationEmails(e) {
    const { dispatch, loggedInUser } = this.props;
    let updatedUser = _.cloneDeep(this.state.newUserData);
    updatedUser.sendNotifEmails = e.target.value;
    this.setState({
      newUserData: updatedUser
    })
    dispatch(userActions.sendUpdateProfile(updatedUser)).then(userRes => {
      if(userRes.success) {
        this.setState({
          newUserData: _.cloneDeep(userRes.user)
        })
      } else {
        this.setState({
          newUserData: _.cloneDeep(loggedInUser)
        })
      }
    });
  }

  _handleTFACode(e) {
    this.setState({code: e.target.value});
  }

  _handleEnableTFA(e) {
    const { dispatch, loggedInUser } = this.props;
    let updatedUser = _.cloneDeep(this.state.newUserData);
    updatedUser.enable_2fa = !loggedInUser.enable_2fa
    updatedUser.token = this.state.code;
    this.setState({
      newUserData: updatedUser
    })
    dispatch(userActions.sendUpdateProfile(updatedUser)).then(userRes => {
      if(userRes.success) {
        this.setState({
          newUserData: _.cloneDeep(userRes.user)
        })
      } else {
        alert('Invalid Security Code');
        this.setState({
          newUserData: _.cloneDeep(loggedInUser)
        })
      }
    });
  }

  _handleToggle2FA(e) {
    const { dispatch, loggedInUser } = this.props;
    let updatedUser = _.cloneDeep(this.state.newUserData);
    updatedUser.enable_2fa = !loggedInUser.enable_2fa
    this.setState({
      newUserData: updatedUser
    })
    dispatch(userActions.sendUpdateProfile(updatedUser)).then(userRes => {
      if(userRes.success) {
        this.setState({
          newUserData: _.cloneDeep(userRes.user)
        })
      }
    });
  }

  _handleDisconnectMSAccount(e) {
    const { dispatch } = this.props;
    var newState = this.state.newUserData;
    newState.MSUsername = '';
    newState.MSUniqueId = '';

    dispatch(userActions.sendUpdateProfile(newState)).then((action)=> {
      //this._closeUpdateModal();
      localStorage.clear();

      this.setState({msalInstance: null});
    });
  }

  _handleMSAuthCallback(err, data, msal) {
    const { msalInstance } = this.state;

    if(msalInstance) return;

    console.log('data.account', data.account);

    if(data && data.account) {
      this.setState({msalInstance: msal});

      const msAccount = data.account;

      const { dispatch } = this.props;
      var newState = this.state.newUserData;

      newState.MSUsername = msAccount.userName;
      newState.MSUniqueId = msAccount.accountIdentifier;

      console.log('newState', newState);
  
      dispatch(userActions.sendUpdateProfile(newState)).then((action)=> {
        console.log('update action', action);
        if(!action.success) {
          this.setState({helpText: action.error ? action.error : ''})
        } else {
          localStorage.clear();
          this.setState({msalInstance: null});
        }
        //this._closeUpdateModal();
      });
    }
  }

  render() {
    const { 
      addressStore
      , loggedInUser 
      , phoneNumberStore
    } = this.props;

    let pictureUrl = loggedInUser.profilePicUrl || '/img/defaults/profile.png';

    let isEmpty = !loggedInUser._id;


    // address  list 
    const addressList = addressStore.lists && addressStore.lists._user ? addressStore.lists._user[loggedInUser._id] : null;
    const addressListItems = addressStore.util.getList('_user', loggedInUser._id);

    // phone number list 
    const phoneNumberList = phoneNumberStore.lists && phoneNumberStore.lists._user ? phoneNumberStore.lists._user[loggedInUser._id] : null;
    const phoneNumberListItems = phoneNumberStore.util.getList('_user', loggedInUser._id);    
           

    console.log('loggedInUser', loggedInUser);

    return (
      <UserProfileLayout>
        <Helmet><title>User Profile</title></Helmet>
        <div className="flex ">
          { !isEmpty ?
            <section className="section ">
              <div className="yt-container slim">
                <div className="yt-row center-horiz">
                  <div className="yt-col _80">
                    <div className="card bordered profile-card">
                      <div className="card-header">
                        <h3>Your info</h3>
                      </div>
                      <div className="card-body">
                        <div className="-profile-card-info">
                          <div className="-info">
                            <strong>
                              <small>Avatar</small>
                            </strong>
                            {loggedInUser.profilePicUrl ? 
                              <div className="-profile-avatar">
                                <img src={pictureUrl} alt="profile pic" />
                              </div>
                              :
                              <div className="-user-initials -nav" style={{backgroundColor: displayUtils.getUserColorBG(loggedInUser), color: "#fff"}}>
                                {displayUtils.getInitials(loggedInUser)}
                              </div>
                            }
                          </div>
                          <div>
                            {/* TODO: add profile image  <button className="yt-btn xx-small link info" onClick={this._openUpdateModal}>Upload</button> */}
                          </div>
                        </div>
                        <div className="-profile-card-info">
                          <div className="-info">
                            <strong>
                              <small>Name</small>
                            </strong>
                            <p> {loggedInUser.firstname} {loggedInUser.lastname}</p>
                          </div>
                          <div>
                            <button className="yt-btn xx-small link info" onClick={this._openUpdateModal}>Edit</button>
                          </div>
                        </div>
                        <div className="-profile-card-info">
                          <div className="-info">
                            <strong>
                              <small>Email</small>
                            </strong>
                            <p> {loggedInUser.username} </p>
                          </div>
                          <div>
                            <small className="u-muted"><em>Cannot edit at this time</em></small>
                          </div>
                        </div>
                        <div className="-profile-card-info">
                          <div className="-info">
                            <strong>
                              <small>Password</small>
                            </strong>
                            <br/>
                            <button className="yt-btn xx-small info" onClick={() => this.setState({updatePasswordModalOpen: true})}>Change password</button>
                          </div>
                          <div>
                          </div>
                        </div>
                        <div className="-profile-card-info">
                          <div className="-info">
                            <strong>
                              <small>Notification Preferences</small>
                            </strong>
                            <br/>
                            <ToggleSwitchInput
                              change={this._handleToggleNotificationEmails}
                              disabled={false}
                              label={this.state.newUserData.sendNotifEmails ? 'Emails On' : 'Emails Off'}
                              styles={{fontSize: '0.8rem'}}
                              name={'sendNotifEmails'}
                              rounded={true}
                              value={this.state.newUserData.sendNotifEmails}
                            />
                          </div>
                        </div>
                        {/* <div className="-profile-card-info">
                          <div className="-info">
                            <strong>
                              <small>Two Factor Authentication</small>
                            </strong>
                            <br/>
                            <ToggleSwitchInput
                              change={this._handleToggle2FA}
                              disabled={false}
                              label=''
                              styles={{fontSize: '0.8rem'}}
                              name={'enable_2fa'}
                              rounded={true}
                              value={this.state.newUserData.enable_2fa}
                            />
                          </div>
                        </div> */}
                        <div className="-profile-card-info">
                          <div className="-info">
                            <strong>
                              <small>Connect your Microsoft Account</small>                           
                            </strong>
                            {
                              loggedInUser.MSUsername ? 
                              <p> {loggedInUser.MSUsername} </p>
                              :
                              // <TextInput
                              //   name="MSUsername"
                              //   label="Microsoft Username"
                              //   value={this.state.newUserData.MSUsername}
                              //   change={this._handleFormChange}
                              //   required={false}
                              //   helpText={this.state.helpText}
                              // />
                              <div>
                                <MicrosoftLogin 
                                  debug={false}
                                  clientId={this.state.msClientId}
                                  authCallback={this._handleMSAuthCallback}
                                  redirectUri={this.state.redirectUri}
                                  useLocalStorageCache={true}
                                  prompt="login"
                                />
                              </div>
                            }
                            {
                              loggedInUser.MSUsername ? 
                              <div>
                                <button 
                                  className="yt-btn xx-small info" 
                                  onClick={this._handleDisconnectMSAccount}>
                                    Disconnect
                                  </button>
                              </div>
                              :
                              null
                              // <div>
                              //   <button 
                              //     className="yt-btn xx-small info" 
                              //     onClick={this._handleFormSubmit}>
                              //       Connect
                              //     </button>
                              // </div>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="yt-col _80">
                    <div className="card bordered profile-card">
                      <div className="card-header">
                        <h3>Your addresses</h3>
                      </div>
                      <div className="card-body">
                        <div className="-profile-card-info">
                          <div className="-info">
                            <strong>
                              <small>Primary address</small>
                            </strong>
                            { loggedInUser._primaryAddress && addressStore.byId[loggedInUser._primaryAddress] ? // make sure the primary address actually exists in the store.
                              <AddressCard
                                address={addressStore.byId[loggedInUser._primaryAddress]}
                                editable={true}
                                handleEditAddress={this._handleEditAddress}
                                isPrimary={true}
                              />
                              :
                              <p>
                                <em>No primary address on file</em>
                              </p>
                            }
                          </div>
                        </div>
                        { addressListItems && addressListItems.length > 0 ?
                          <div className="-profile-card-info">
                            <div className="-info">
                              <strong>
                                <small>Additional addresses</small>
                              </strong>
                              {addressListItems.map((address, i) => 
                                address._id !== loggedInUser._primaryAddress ? // The primary address will already be listed above.
                                <div key={"address_" + address._id + i} >
                                  <AddressCard
                                    address={address}
                                    editable={true}
                                    handleEditAddress={this._handleEditAddress}
                                    isPrimary={false }
                                    makePrimary={this._makePrimaryAddress}
                                  />
                                  <hr/>
                                </div>
                                :
                                null
                              )}
                            </div>
                          </div>
                          :
                          null 
                        }
                        { this.state.isAddingAddress ?
                          <AddressEditor
                            pointers={{_user: loggedInUser._id}}
                            onSubmit={this._handleNewAddress}
                            editorClasses="-quick-view"
                          />
                          :
                          <button onClick={() => this.setState({isAddingAddress: true})} className="yt-btn link info x-small"><i className="fal fa-plus"/> Add address</button>
                        }
                      </div>
                    </div>
                  </div>
                  <div className="yt-col _80">
                    <div className="card bordered profile-card">
                      <div className="card-header">
                        <h3>Two Factor Authentication {loggedInUser.enable_2fa ? 'is enabled' : ''}</h3>
                      </div>
                      <div className="card-body">
                        <div className="-profile-card-info">
                          {
                            !loggedInUser.enable_2fa ? (
                              <div>
                                <p>
                                  <strong>Scan the QR code in Google Authenticator</strong>
                                </p>
                                <div className="-info"
                                  style={{
                                    fontStyle: "normal",
                                    display: "flex",
                                    justifyContent: "space-between"
                                  }}
                                >
                                  
                                  <div style={{
                                    width: "50%"
                                  }}>
                                    <img src={loggedInUser.qrcode_data} alt="" 
                                      style={{
                                        width: "80%"
                                      }}
                                    />
                                  </div>
                                  <div style={{
                                    width: "50%",
                                    paddingTop: "30px"
                                  }}>
                                    <p>
                                      <strong>
                                        Secret Key
                                      </strong>
                                    </p>
                                    <p
                                      style={{
                                        fontWeight: 'bold',
                                        color: "#f5684d",
                                        wordBreak: 'break-word'
                                      }}
                                    >{loggedInUser.secret_2fa}</p>
                                    <br/>
                                    <TextInput
                                      name='code'
                                      label='Security Code'
                                      value={this.state.code}
                                      change={this._handleTFACode}
                                      maxLength="6"
                                    />
                                    <button 
                                      onClick={this._handleEnableTFA} 
                                      className="yt-btn info x-small"
                                      disabled={this.state.code.length < 6}
                                    ><i className="fal"/>
                                      Enable TFA
                                    </button>
                                  </div>
                                </div>
                                <br/>
                                <br/>
                                <div className="-info"
                                  style={{
                                    fontStyle: "normal"
                                  }}
                                >
                                  <p>
                                    <strong>Setting Up Authenticator</strong>
                                  </p>
                                  <br/>
                                  <p>
                                    Download and install any authenticator application (Google Authenticator) on your mobile device.
                                    You can find it in the App Store (for iOS) or Google Play (for Android).
                                  </p>
                                  <br/>
                                  <p><strong>1. </strong>Open the mobile application then click the【+】symbol (<strong>Google Authenticator</strong>). </p>
                                  <p><strong>2. </strong>Scan the QR Code on the left side of the screen using your authenticator application. </p>
                                  <p><strong>3. </strong>Enter the 6 digit numbers from your authenticator application into the Security code text box ({brandingName.title}). </p>
                                  <p><strong>4. </strong>Click the 'Enable TFA'.</p>
                                  <p><strong>Note: </strong>Save the Secret Key somewhere safe which can be used if you have lost your access to your authenticator.</p>
                                  <br/>
                                  <p>Everytime you login, {brandingName.title} application will ask for the code that will be generated on your authenticator.</p>
                                </div>
                              </div>
                            )
                            :
                            (
                              <button 
                                onClick={this._handleToggle2FA} 
                                className="yt-btn info x-small"
                                style={{
                                  backgroundColor: "#ff2900",
                                  color: "#ffffff"
                                }}
                              ><i className="fal"/>
                                Disable TFA
                              </button>
                            )
                          }
                        </div>
                      </div>
                    </div>
                    <br/>
                    <button className="yt-btn small link " onClick={this._logout}>Log out</button>
                  </div>
                </div>
              </div>
            {/* TODO:  un-comment this when we figure out profile photos               
              <NewImageModal
                close={() => this.setState({newImageFileOpen: false})}
                handleUploaded={this._handleNewImageFile}
                isOpen={this.state.newImageFileOpen}
                filePointers={{_user: loggedInUser._id}}
              /> */}
              <UpdateProfileModal
                newUserData={this.state.newUserData}
                isModalOpen={this.state.updateModalOpen}
                closeModal={this._closeUpdateModal}
                changeCount={this.state.changeCount}
                handleFormChange={this._handleFormChange}
                handleFormSubmit={this._handleFormSubmit}
              />
              <UpdatePasswordModal
                newUserData={this.state.newUserData}
                isModalOpen={this.state.updatePasswordModalOpen}
                closeModal={this._closeUpdatePasswordModal}
                changeCount={this.state.changeCount}
                handleFormChange={this._handlePasswordChange}
                handleFormSubmit={this._handleSubmitUpdatePassword}
                newPass={this.state.newPass}
                oldPass={this.state.oldPass}
                confirmPass={this.state.confirmPass}
              />
            </section>
            :
            null
          }

        </div>
      </UserProfileLayout>
    )
  }
}

UserProfile.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    addressStore: store.address
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber
    , firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UserProfile)
);
