import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import Binder from "../../../global/components/Binder.js.jsx";
import Modal from "../../../global/components/modals/Modal.js.jsx";

import TextInput from '../../../global/components/forms/TextInput.js.jsx';

class UserQRCodeModal extends Binder {
  constructor(props) {
    super(props)

    this.state = {
      disableConfirm: true
      , otp: ''
    }
    this._bind(
      '_close'
      , '_handleFormChange'
    )

  }

  _close() {
    this.setState({
      disableConfirm: true
    }, this.props.close());
  }

  _handleFormChange(e) {

    console.log('eee', e.target.value);
    console.log('e2', e.target.name);

    if(e.target.validity.valid) {
      let newState = _.update(this.state, e.target.name, () => {
        return e.target.value;
      });
  
      console.log('newState', newState);

      if(newState.otp.length >= 6) {
        newState = {...newState, disableConfirm: false}
      } else {
        newState = {...newState, disableConfirm: true}
      }

      this.setState({...newState});
    } else {
      e.target.value = this.state.otp;
    }
  }

  render() {
    
    const {
      isOpen
      , url
      , handleVerifyToken
    } = this.props

    const {
      disableConfirm
    } = this.state;

    const modalHeader = 'Two Factor Authentication';

    return(
      <Modal
        cardSize='standard'
        closeAction={this._close}
        isOpen={isOpen}
        modalHeader={modalHeader}
        showButtons={true}
        confirmText={'Verify'}
        confirmAction={() => { handleVerifyToken(this.state.otp)}}
        disableConfirm={disableConfirm}
      >
        <div className='qrcode-container'
            style={{
                textAlign: 'center'
            }}>
            {/* <img
                style={{
                    width: '50%'
                }} 
                src={url}>
            </img> */}
            <div
              style={{
                width: "80%",
                textAlign: "center",
                margin: "auto",
                marginBottom: "20px"
              }}
            >
              <input
                onInput={this._handleFormChange}
                pattern="[0-9]*"
                name="otp"
                maxlength="6"
                autoFocus
                style={{
                  textAlign: "center",
                  border: "0",
                  borderBottom: "3px solid #0da79d",
                  width: "100%",
                  fontSize: "30px",
                  paddingBottom: "10px",
                  letterSpacing: "25px",
                  color: "#0da79d"
                }}
              />
            </div>
            <p>
              Enter the 6 digit code from your authenticator app.
            </p>
        </div>

      </Modal>
    )
  }
}

UserQRCodeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , close: PropTypes.func.isRequired
  , url: PropTypes.string
  , handleVerifyToken: PropTypes.func
}

const mapStoreToProps = (store) => {
  return {

  }
};

export default withRouter(
  connect(
    mapStoreToProps
  )(UserQRCodeModal)
);