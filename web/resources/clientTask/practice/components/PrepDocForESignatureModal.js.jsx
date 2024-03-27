/**
 * Modal for setting up a signature request task.
 * Allows user to choose a template and choose signers.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import actions
import * as clientTaskActions from '../../clientTaskActions';
import * as userActions from '../../../user/userActions';

// import third-party libraries
import _ from 'lodash';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { SelectFromObject, TextInput, FileInput } from '../../../../global/components/forms/index';


class PrepDocForESignatureModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false 
      , templateId: null
      , signers:[]
    }
    this._bind(
      '_prepareForSignature'
      , '_getSignerList'
      , '_handleChange'
      , '_generateSignerInputs'
    )
  }
  componentDidMount() {
    const { clientTask, dispatch } = this.props;
    dispatch(userActions.fetchListIfNeeded('_client', clientTask._client))
  }

  _handleChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    if(e.target.name === 'templateId') {
      // Reset signers array when the template changes.
      newState.signers = []
    }
    this.setState(newState);
  }

  _prepareForSignature() {
    const { clientTask, dispatch } = this.props;
    // Put together a bit of a strange request body.
    this.setState({
      submitting: true
    })
    const eSigRequest = {
      _id: clientTask._id
      , templateId: this.state.templateId
      , signers: this.state.signers
    }
    dispatch(clientTaskActions.sendPrepareClientTaskForSignature(eSigRequest)).then(taskRes => {
      if(taskRes.success) {
        this.props.setUpdatedTask(_.cloneDeep(taskRes.item))
        this.setState({
          submitting: false
        }, () => this.props.close())

      } else {
        alert(taskRes.error)
        this.setState({
          submitting: false
        }, () => this.props.close())
      }
    })
  }

  _getSignerList() {
    const { clientTask, userStore } = this.props;
    const userListItems = userStore.util.getList('_client', clientTask._client)
    const signerList = userListItems ? userListItems.map(user => {
      return {
        displayName: `${user.firstname} ${user.lastname}`
        , _id: user._id
       }
    })
    :
    []
    return signerList
  }

  _generateSignerInputs(signerCount) {
    let signerInputs = []
    for(let i = 0; i < signerCount; i++) {
      const signer = {
        label: `Signer #${i + 1}`
        , name: `signers[${i}]`
      }
      signerInputs.push(signer);
    }
    return signerInputs;
  }

  render() {
    const { 
      formHelpers
      , isOpen
    } = this.props;

    const signerListItems = this._getSignerList();
    const selectedTemplate = this.state.templateId ? formHelpers.assureSignTemplates.filter(template => template.id === this.state.templateId)[0] : null
    const signerInputs = selectedTemplate ? this._generateSignerInputs(selectedTemplate.signerCount) : null

    return (
      <Modal
        cardSize="standard"
        closeAction={this.props.close}
        disableConfirm={!selectedTemplate || this.state.signers.length < selectedTemplate.signerCount || this.state.submitting}
        isOpen={isOpen}
        modalHeader={"Prep document for e-signature"}
        showButtons={true}
        confirmAction={this._prepareForSignature}
        confirmText={this.state.submitting ? "Preparing..." : "Submit"}
      >
        <div className="form-container -slim" style={{ opacity: this.state.submitting ? 0.5 : 1 }}>
          <form name="eSigForm" className="e-sig-form" onSubmit={this._prepareForSignature}>
          { this.state.submitting ?
            <div className="-loading-hero hero -overlay">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>
            :
            null
          }
            <h3>{!this.state.submitting ? "Prepare for e-signature" : "Preparing for e-signature..."}</h3>
            <SelectFromObject 
              change={this._handleChange}
              display={'name'}
              filterable={false}
              label="Choose a template"
              name="templateId"
              value={'id'}
              items={formHelpers.assureSignTemplates}
              selected={this.state.templateId}
            />
            { signerInputs ?
              signerInputs.map((signer, i) => 
                <SelectFromObject 
                  change={this._handleChange}
                  display={'displayName'}
                  filterable={false}
                  key={`${signer.name}_${i}`}
                  label={signer.label}
                  name={signer.name}
                  value={'_id'}
                  items={signerListItems}
                  selected={this.state[signer.name]}
                />
              )
              :
              null
            }
          </form>
        </div>
      </Modal>
    )
  }
}

PrepDocForESignatureModal.propTypes = {
  clientTask: PropTypes.object.isRequired
  , close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    loggedInUser: store.user.loggedIn.user 
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PrepDocForESignatureModal)
);