import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import Binder from "../../../global/components/Binder.js.jsx";
import Modal from "../../../global/components/modals/Modal.js.jsx";
import PDFTermsServices from '../../../global/components/helpers/PDFTermsServices.js.jsx';


class UserTermsServicesModal extends Binder {
  constructor(props) {
    super(props)

    this.state = {
      disableConfirm: false
    }
    this._bind(
      '_confirm'
      , '_close'
    )

  }

  _close() {
    this.setState({
      disableConfirm: true
    }, this.props.close());
  }

  _confirm() {
    this.props.acceptTermsService();
  }

  render() {
    
    const {
      isOpen
    } = this.props

    const {
      disableConfirm
    } = this.state;

    const modalHeader = 'Terms and Services';
    
    //const agreementLink = 'https://www.imaginetime.com/wp-content/uploads/2021/03/ImagineTimeCloudSubscriptionAgreementv8.26.20.pdf';
    
    const agreementLink = '/pdf/ImagineTimeCloudSubscriptionAgreementv8.26.20.pdf';
    
    return(
      <Modal
        cardSize='standard'
        closeAction={this._close}
        isOpen={isOpen}
        modalHeader={modalHeader}
        showButtons={true}
        confirmText={'Agree'}
        confirmAction={this._confirm}
        disableConfirm={disableConfirm}
      >
        <div className='terms-services'>
          <PDFTermsServices 
            filePath={agreementLink}
            autoScroll={false}
            onDone={() => {
              console.log("function is done");
              this.setState({disableConfirm: false})
            }}
            hidden={false}
            scale={0.9}
          />
        </div>

      </Modal>
    )
  }
}

UserTermsServicesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired
  , close: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {

  }
};

export default withRouter(
  connect(
    mapStoreToProps
  )(UserTermsServicesModal)
);