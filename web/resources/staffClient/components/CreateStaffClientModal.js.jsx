/**
 * rendered at /firm/:firmId/clients/:clientId/staff
 * Modal to assign staff to a client.
 * Creates a new staffClient from a copy of the defaultItem in the staffClient reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as staffClientActions from '../staffClientActions';
import * as clientActions from '../../client/clientActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';

// import staffClient components
import StaffClientForm from '../components/StaffClientForm.js.jsx';

class CreateStaffClientModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      staffClient: _.cloneDeep(this.props.defaultStaffClient.obj)
      , progressPercent: 0
      , submitting: false
      , newStaffClient: []
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, socket } = this.props;
    dispatch(staffClientActions.fetchDefaultStaffClient());

    // to get status in multiple staffclient
    socket.on('add_status', (staffclient, status) => {
      let { newStaffClient } = this.state;
      if (staffclient) {
        newStaffClient.push(staffclient);
      }
      this.setState({ progressPercent: status, newStaffClient: newStaffClient });
    });
  }

  componentWillUnmount() {
    const { socket } = this.props;
    this.setState({ submitting: false, progressPercent: 0 });
    socket.off('add_status');
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      staffClient: _.cloneDeep(nextProps.defaultStaffClient.obj)
    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */ 
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    const { clientId, dispatch, staffMap, selectedClientId, multipleAdd, loggedInUser, progressPercent } = this.props;

    this.setState({submitting: true});
    let newStaffClient = _.cloneDeep(this.state.staffClient);
    let selectedStaff = staffMap[newStaffClient._staff]; 

    if (multipleAdd) {
      if (selectedStaff) {
        const sendData = {
          client: selectedClientId 
          , _firm: selectedStaff._firm
          , _user: selectedStaff._user
          , _staff: selectedStaff._id
        }
        
        if (e) { e.preventDefault(); }
        dispatch(staffClientActions.sendCreateStaffMultipleClient(sendData)).then(json => {
          if (json.success && json.data) {
            if (json.data.length) {
              this.props.handleNewStaffClient(json.success); 
            } else {
              this.props.handleNewStaffClient(false); 
            }
          } else {
            this.props.handleNewStaffClient(json.success); 
          }
          this.setState({ submitting: false, progressPercent: 0, staffClient: _.cloneDeep(this.props.defaultStaffClient.obj) });
        });
      }
    } else {
      newStaffClient._client = clientId;
      newStaffClient._firm = selectedStaff._firm;
      newStaffClient._user = selectedStaff._user
      newStaffClient._staff = selectedStaff._id; 
      if(e) { e.preventDefault(); }
      dispatch(staffClientActions.sendCreateStaffClient(newStaffClient)).then(staffClientRes => {
        if(staffClientRes.success) {
          if(this.props.handleNewStaffClient) {
            this.props.handleNewStaffClient(staffClientRes.item)
          }
          this.setState({submitting: false});
          this.props.close()
        } else {
          alert("ERROR - Check logs");
          this.props.close();
        }
      });
    }
  }

  render() {
    const {
      close
      , isOpen
      , staffListItems
    } = this.props;
    const { staffClient, submitting, progressPercent } = this.state;
    const isEmpty = !staffClient || !staffListItems;

    let progressClass = classNames(
      `progress-bar-${progressPercent || 0}`
    )

    staffListItems.sort((a, b) => a.fullName.localeCompare(b.fullName))

    return (
      isEmpty ?
      null
      :
      <Modal
        closeAction={close}
        closeText="Cancel"
        confirmAction={progressPercent > 0 && submitting ? close : this._handleFormSubmit}
        confirmText={progressPercent > 0 ? 'Continue in background' : submitting ? "Saving..." : "Done" }
        disableConfirm={progressPercent <= 0 && submitting || !staffClient || staffListItems.length === 0}
        isOpen={isOpen}
        modalHeader="Assign staff"
      >
        {
          progressPercent > 0 ?
            <div className="yt-container">
              <div className="upload-progress-container">
                <p>{`Import Progress ${progressPercent}%`}</p>
                <div className={progressClass} >
                  <div className="-progress">
                    <div className="-complete">
                    </div>
                  </div>
                </div>
              </div>
              <br/>
              <div className="yt-row">
                <p>Taking too long? We can finish this in the background while you do something else.</p>
              </div>
              <div className="yt-row">
                <p><strong>You'll see your import progress at the top of the page.</strong></p>
              </div>
            </div>
          :
          <StaffClientForm
            cancelLink=""
            formTitle="Assign new staff"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            showButtons={false}
            staffListItems={staffListItems}
            selected={this.state.staffClient._staff}
  
          />          
        }
      </Modal>
    )
  }
}

CreateStaffClientModal.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultStaffClient: store.staffClient.defaultItem
    , socket: store.user.socket
    , staffMap: store.staff.byId
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateStaffClientModal)
);
