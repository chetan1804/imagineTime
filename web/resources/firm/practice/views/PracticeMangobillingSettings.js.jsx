/**
 * View component for /firms/:firmId
 *
 * Displays a single firm from the 'byId' map in the firm reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import _, { rest } from 'lodash'; 
import _uniqueId from 'lodash/uniqueId';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import actions
import * as firmActions from '../../firmActions';
import * as fileActions from '../../../file/fileActions'; 
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { SelectFromArray, SelectFromObject, TextInput, ToggleSwitchInput } from '../../../../global/components/forms';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import resource components
import PracticeFirmLayout from '../components/PracticeFirmLayout.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

class PracticeMangobillingSeettings extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      apiKey: ""
      , mangoApiKey: ""
      , connecting: false
      , error: ''
      , isConnected: false
      , confirmModalOpen: false
    }
    this._bind(
      '_handleFormChange'
      , '_generateAPIKey'
      , '_copyToClipboard'
      , '_connecToMango'
      , '_saveFirmKeys'
      , '_setupConnection'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;

    dispatch(firmActions.fetchSingleFirmById(match.params.firmId)).then(firmRes => {
      if (firmRes.success && firmRes.item) {
        this._setupConnection(firmRes.item);
      }
    });

  }
  
  _setupConnection(firm) {
    if(!!firm) {
      const newFirm = firm;

      this.setState({apiKey: firm.apiKey, mangoApiKey: firm.mangoApiKey});
      
      if(!firm.mangoApiKey || !firm.apiKey) return;

      this.setState({connecting: true})
      axios({
        method: 'POST',
        url: 'https://secure.mangobilling.com/api/dms/IS/validateapiKey',
        data: {
          "ishareAPIKey": firm.apiKey,
          "mangoAPIKey": firm.mangoApiKey,
          "CompanyIDImagineShare": firm._id
        }
      })
      .then((mangoRes) => {
        this.setState({isConnected: true});
        console.log("mangoRes.data", mangoRes.data);

        const resData = mangoRes.data;

        if(resData && resData.data) {

          const mangoCompany = resData.data;

                
          newFirm.mangoCompanyID = mangoCompany.CompanyID;
          newFirm.mangoApiKey = mangoCompany.APIKeyMangoIS;
          
          this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
            if(json.success) {
              this.setState({isConnected: true});
            } else {
              this.setState({error: 'Unable to connect to mangobilling'});
              this.setState({connecting: false});
            }
          })
                        
          // this.setState({isConnected: true});
        } else {
          this.setState({error: 'Unable to connect to mangobilling'});
          this.setState({isConnected: false});
        }

      })
      .catch((error) => {
        console.log('error', error);
        this.setState({error: 'Unable to connect to mangobilling'});
      })
      .finally(() => {
        this.setState({connecting: false})
      }) 
    }
  }

  _saveFirmKeys(e) {

    const {apiKey, mangoApiKey} = this.state;

    let newFirm = _.cloneDeep(this.props.firmStore.selected.getItem());
    console.log("this.state", this.state);
    
    newFirm.apiKey = apiKey;
    newFirm.mangoApiKey = mangoApiKey;

    console.log('newFirm', newFirm);

    this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
      console.log('new firm json', json.error);

      if(json.error) {
        this.setState({error: json.error});
      } else {
        this.setState({error: ''});
      }

    })
  }

  _handleFormChange(e) {
    this.setState({isConnected: false});
    let newState = _.update( this.state, e.target.name, function() {
      return e.target.value;
    });
    this.setState({newState});
  }

  _copyToClipboard() {
    const el = this.keyInput;
    el.select();
    document.execCommand('copy');
  }

  _generateAPIKey() {

    this.setState({confirmModalOpen: false});

    let newFirm = _.cloneDeep(this.props.firmStore.selected.getItem());

    if(newFirm && newFirm._id) {

      const newApiKey = uuidv4();

      newFirm.apiKey = newApiKey;

      console.log('---newApiKey---', newApiKey);

      console.log('---newFirm---', newFirm);

      this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
        console.log('new firm json', json);
  
        if(json.error) {
          this.setState({error: json.error});
        } else {
          this.setState({error: ''});
        }
      })
  
      this.setState({isConnected: false, apiKey: newApiKey}) 
    }
  }

  _connecToMango() {

    const {mangoApiKey, apiKey} = this.state;

    let newFirm = _.cloneDeep(this.props.firmStore.selected.getItem());
    console.log("this.state", this.state);

    newFirm.apiKey = apiKey ? apiKey : newFirm.apiKey;
    newFirm.mangoApiKey = mangoApiKey ? mangoApiKey : newFirm.mangoApiKey;

    this.setState({connecting: true, error: ''});

    axios({
      method: 'POST',
      url: 'https://secure.mangobilling.com/api/dms/IS/validateapiKey',
      data: {
        "ishareAPIKey": apiKey,
        "mangoAPIKey": mangoApiKey,
        "ishareCompanyID": newFirm._id
      }
    })
    .then((mangoRes) => {
      console.log("mangoRes.data", mangoRes.data);
      const resData = mangoRes.data;

      if(resData && resData.data) {
        const mangoCompany = resData.data;

        if(newFirm.mangoCompanyID == mangoCompany.CompanyID) {
      
          newFirm.mangoCompanyID = mangoCompany.CompanyID;
          newFirm.mangoApiKey = mangoCompany.APIKeyMangoIS;
          
          this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
            if(json.success) {
              this.setState({isConnected: true});
            } else {
              this.setState({error: 'Unable to connect to mangobilling'});
              this.setState({connecting: false});
            }
          })
        } else if(!newFirm.mangoCompanyID) {
          //update both
          newFirm.mangoCompanyID = mangoCompany.CompanyID;
          newFirm.mangoApiKey = mangoCompany.APIKeyMangoIS;

          this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
            if(json.success) {
              this.setState({isConnected: true});
            } else {
              this.setState({error: 'Unable to connect to mangobilling'});
              this.setState({connecting: false});
            }
          })
        } else {
          this.setState({isConnected: false});
        }

      } else {
        this.setState({error: 'Unable to connect to mangobilling'});
        this.setState({isConnected: false});
      }
    })
    .catch((error) => {
      console.log('error', error);
      this.setState({error: 'Unable to connect to mangobilling'});
    })
    .finally(() => {
      this.setState({connecting: false})
    }) 

    // this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
    //   if(json.success) {

    //   } else {
    //     console.log('error', error);
    //     this.setState({error: 'Unable to connect to mangobilling'});
    //     this.setState({connecting: false});
    //   }
    // })
  }

  render() {
    const { 
      firmStore 
    } = this.props;

    const { 
      apiKey
      , mangoApiKey
      , error
      , connecting
      , isConnected } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual firm object from the map
     */
    const selectedFirm = firmStore.selected.getItem();

    const isEmpty = (
      !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const isFetching = (
      firmStore.selected.isFetching
    )

    const apiKeyMessage = 'Generating a new API key will invalidate your current key. This may impact any applications or services currently using the old key.'

    const apiKeyWarningTitle = 'Warning: Generating a New API Key';

    return (
      <PracticeFirmLayout>
        <Helmet><title>Firm Settings</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero three-quarter ">
              <div className="yt-container slim">
                <h2>Hmm.  Something's wrong here. </h2>
                <p>Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>.</p>
              </div>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-row ">
              <div className="yt-col _50">
                <div className="-practice-content">
                  <div>
                    <div className="yt-row space-between">
                      <TextInput
                        change={this._handleFormChange}
                        label={`${brandingName.title} API Key`}
                        name="apiKey"
                        required={false}
                        value={apiKey}
                        readOnly={false}
                        cusRef={(input) => this.keyInput = input}
                      />
                      <div className="input-group">
                        <div className="yt-row space-between">
                          <div></div>
                          <div>
                            <button className="yt-btn x-small info" style={{"marginRight": "20px", "marginBottom": "1em"}} onClick={() => this.setState({confirmModalOpen: true})}>
                              Generate API Key
                            </button>
                            <button className="yt-btn x-small info" style={{"marginRight": "20px", "marginBottom": "1em"}} onClick={() => this._copyToClipboard()}>
                              Copy Key
                            </button>
                            <button className="yt-btn x-small info" onClick={() => this._saveFirmKeys()}>
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <TextInput
                        change={this._handleFormChange}
                        label="Mango Billing API Key"
                        name="mangoApiKey"
                        required={false}
                        value={mangoApiKey}
                        readOnly={false}
                        helpText='Paste API Key from Mango Billing Settings'
                      />
                      <div className="input-group">
                        <div className="yt-row space-between">
                          <div style={{ "marginBottom": "1em" }}>
                            {
                              isConnected ?
                              <button 
                                className="yt-btn x-small info"
                                style={{"pointerEvents": "none"}}>
                                Connected
                              </button> :
                              <button 
                                className="yt-btn x-small info" 
                                onClick={() => {this._connecToMango()}}
                                disabled={connecting}>
                                {connecting ? `Connecting....` : `Connect`}
                              </button>
                            }
                          </div>
                          <p style={{"color": "red", "fontWeight": "bold", "margin": "20px 0"}}>
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        <AlertModal
          alertMessage={apiKeyMessage}
          alertTitle={apiKeyWarningTitle}
          closeAction={() => {this.setState({confirmModalOpen: false})}}
          confirmText={'OK'}
          confirmAction={() => this._generateAPIKey()}
          declineText={'Cancel'}
          declineAction={() => {this.setState({confirmModalOpen: false})}}
          isOpen={this.state.confirmModalOpen}
          type={'warning'}
        >

        </AlertModal>
      </PracticeFirmLayout>
    )
  }
}

PracticeMangobillingSeettings.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */

  return {
    firmStore: store.firm
    , staffStore: store.staff 
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeMangobillingSeettings)
);
