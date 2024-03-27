/**
 * Resuable modal component for managing subscription licenses. 
 *
 * Edits number of available licenses for a firm. Adjusts message text depending on 
 * current active staff members. 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as subscriptionActions from '../subscriptionActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';

import { 
  NumberInput
} from '../../../global/components/forms';

class ManagelicensesModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newLicenses: this.props.subscription.licenses + 1
      , submitting: false 
    }
    this._bind(
      '_handleFormChange'
      , '_saveLicenses'
    )
  }

  _handleFormChange(e) {
    let newState = _.update( this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState})
  }

  _saveLicenses() {
    this.setState({submitting: true});
    const { close, dispatch, subscription } = this.props;
    let newSub = _.cloneDeep(subscription);
    newSub.licenses = this.state.newLicenses;
    dispatch(subscriptionActions.sendUpdateSubscription(newSub)).then(subRes => {
      if(subRes.success) {
        this.setState({
          newLicenses: subRes.item.licenses + 1
          , submitting: false
        });
        close();
      } else {
        alert(`ERROR: ${subRes.error}`);
      }
    });
  }

  render() {
    const { close, isOpen, numActiveStaff, subscription } = this.props;
    const { newLicenses, submitting } = this.state;
    const diff = newLicenses - subscription.licenses;
    return (
      <Modal 
        closeAction={close}
        isOpen={isOpen}
        confirmAction={this._saveLicenses}
        closeText="Cancel"
        confirmText={submitting ? "Saving..." : diff < 0 ? "Remove licenses" : "Add licenses"}
        disableConfirm={newLicenses == subscription.licenses || submitting || newLicenses < numActiveStaff}
        modalHeader="Manage licenses"
      >
        <p>This subscription currently has {subscription.licenses} licenses ($30.00 per license/month)</p>
        <br/>
        <p><strong>New license total:</strong></p>
        <div className="yt-col _50 s_40 m_30 ">
          <NumberInput
            change={this._handleFormChange}
            firefoxDisplayFix={true}
            helpText={<p><strong>Change:</strong> {newLicenses - subscription.licenses > 0 ? "+" : null}{newLicenses - subscription.licenses}</p>}
            min="0"
            name="newLicenses"
            required={false}
            step="1"
            value={newLicenses}
          />
        </div>
        { numActiveStaff > newLicenses ? 
          <p className="u-danger">This plan must have at least {numActiveStaff} licenses. You may not have fewer licenses than team members, and this account has {subscription.licenses} licenses by default.</p>
          :
          null 
        }
      </Modal>
    )
  }
}

ManagelicensesModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , isOpen: PropTypes.bool.isRequired
  , numActiveStaff: PropTypes.number 
  , subscription: PropTypes.object.isRequired 
}

ManagelicensesModal.defaultProps = {
  numActiveStaff: 0
}


const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    loggedInUser: store.user.loggedIn.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ManagelicensesModal)
);