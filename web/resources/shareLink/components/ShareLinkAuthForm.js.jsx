/**
 * Reusable stateless form component for ShareLink
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { PasswordInput } from '../../../global/components/forms';

import { displayUtils } from '../../../global/utils';

const  ShareLinkAuthForm = ({
  handleFormChange
  , handleFormSubmit
  , password 
  , prompt
  , shareLink 
}) => {
  return (
    <div className="form-container -skinny">
      <form name="shareLinkForm" className="shareLink-form" onSubmit={handleFormSubmit}>
        {/*  TODO:  swap this image out with an original or something we have rights to */}
        <img src="https://cdn.dribbble.com/users/39953/screenshots/5948124/webauthn.png"/>
        <h3>{displayUtils.getShareLinkAuthPrompt(shareLink.authType)}</h3>
        <hr/>
        { prompt ? 
          <p><strong>{prompt}</strong></p>
          :
          null 
        }
        {
          shareLink ?
            shareLink.type === 'share' && shareLink.attempt >= 5 ?
              <p style={{ color: 'red' }}>You have exceeded the allowed number of authentication attempts. Your service provider has been notified.</p> 
              :
              <div>
                <PasswordInput
                  change={handleFormChange}
                  label={displayUtils.getShareLinkAuthLabel(shareLink.authType)}
                  name="password"
                  placeholder={shareLink.authType === 'secret-question' ? 'Answer' : 'Link password'}
                  required={true}
                  value={password}
                />
                <div className="input-group">
                  <div className="yt-row right">
                    <button className="yt-btn small info" type="submit" disabled={!password}> Continue</button>
                  </div>
                </div>
              </div>
            : null
        }
      </form>
    </div>
  )
}

ShareLinkAuthForm.propTypes = {
  handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , password: PropTypes.string
  , prompt: PropTypes.string 
  , shareLink: PropTypes.object.isRequired
}

ShareLinkAuthForm.defaultProps = {
  password: ''
  , prompt: ''
}

export default ShareLinkAuthForm;
