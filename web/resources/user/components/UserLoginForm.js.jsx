// import primary libraries
import React from 'react';
import MicrosoftLogin from "react-microsoft-login";
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

// import form components
import Binder from '../../../global/components/Binder.js.jsx';
import { EmailInput, PasswordInput } from '../../../global/components/forms';
import brandingName from '../../../global/enum/brandingName.js.jsx';

import { domains, appClientIds } from "../../../config/prodDomains.js";

class UserLoginForm extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      // usePassword: false  
      usePassword: true ,
      msClientId: appClientIds.default,
      redirectUri: ''
    }
  }

  componentDidMount() {
    const { selectedFirm } = this.props;

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
  }

  render() {
    const {
      handleFormChange
      , handleFormSubmit
      , handleMSAuthCallback
      , history 
      , location
      , user
      , logoUrl 
      , magicLinkSent 
      , sendMagicLink
      , showPoweredBy
      , selectedFirm = {}
    } = this.props; 

    // console.log('selectedFirm', selectedFirm);

    // let redirectUri = selectedFirm && selectedFirm.domain ?
    //   `https://${selectedFirm.domain}/api/ms/auth` : !window.appUrl.includes('localhost') ?
    //   `https://${window.appUrl}/api/ms/auth` :
    //   `http://${window.appUrl}/api/ms/auth`

    // console.log('redirectUri', redirectUri);
    let firmLogo = brandingName.image.logoBlack;
    
    return(
      <div className="form-container -skinny" style={{marginTop: '64px'}}>
        <form name="userForm" className="user-form" onSubmit={handleFormSubmit}>
          { logoUrl ?
            <div style={{maxWidth: "66%", margin: 'auto'}}>
              <img src={logoUrl}/>
            </div>
            :
            null
          }
          <h2> Sign In </h2>
          <hr/>
          { magicLinkSent ?
            <div>
              <div className="u-centerText">
                <h3>We sent you a magic link!</h3>
                <p>We sent an email to <strong>{user.username}</strong></p>
                <p>It contains a magic link that'll log you in.</p>
                <button className="yt-btn block link" type="button" onClick={() => history.replace(location.pathname)}><i className="far fa-angle-left"/> Back</button>
              </div>
            </div>
            :
            <div>
              <EmailInput
                name="username"
                label="Email Address"
                value={user.username}
                change={handleFormChange}
                required={true}
              />
              { this.state.usePassword ?
                <PasswordInput
                  name="password"
                  label="Password"
                  value={user.password}
                  change={handleFormChange}
                  required={true}
                  password={true}
                />
                :
                null 
              }
              { this.state.usePassword ?
                <div className="input-group">
                  <button className="yt-btn info block" type="submit" > Sign in </button>
                  <p style={{
                    margin: "20px 0",
                    textAlign: "center"
                  }}>
                    Or log in with:
                  </p>
                  <div
                    style={{
                      textAlign: "center"
                    }}
                  >
                    <MicrosoftLogin 
                      debug={false}
                      clientId={this.state.msClientId}
                      authCallback={handleMSAuthCallback}
                      redirectUri={this.state.redirectUri}
                      useLocalStorageCache={true}
                      prompt="login"
                    />
                  </div>

                  {/* <button className="yt-btn block link" type="button" onClick={() => this.setState({usePassword: false})}><i className="far fa-angle-left"/> Back</button> */}
                  <br/>
                  <Link to="/user/forgot-password">
                    <em>
                      Forgot Password?
                    </em>
                  </Link>
                </div>
                :
                <div className="input-group">
                  <button className="yt-btn info block" type="button" onClick={sendMagicLink} disabled={!user.username}><i className="far fa-magic"/> Send magic link</button>
                  <button className="yt-btn block link" type="button" onClick={() => this.setState({usePassword: true})}>Use password instead</button>
                </div>
              }
            </div>
          }
          
        </form>
        { showPoweredBy ?
          <div className="yt-container" style={{padding: "20px"}}>
            <div className="yt-row right center-vert">
              <span style={{marginRight: '8px'}}><em>powered by </em></span><a className="footer-logo" href={brandingName.url} target="_blank"><img src={firmLogo} /></a>
            </div>
          </div>
          : 
          null 
        }
      </div>
    )
  }
}

UserLoginForm.propTypes = {
  handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , user: PropTypes.object.isRequired
  , location: PropTypes.object
  , logoUrl: PropTypes.string
  , magicLinkSent: PropTypes.bool.isRequired
  , sendMagicLink: PropTypes.func.isRequired
  , showPoweredBy: PropTypes.bool 
}

UserLoginForm.defaultProps = {
  logoUrl: null 
  , showPoweredBy: false 
}

export default withRouter(UserLoginForm);
