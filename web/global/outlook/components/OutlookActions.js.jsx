import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import Binder from '../../components/Binder.js.jsx';

// import actions
import * as clientActions from '../../../resources/client/clientActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as staffActions from '../../../resources/staff/staffActions';
import * as staffClientActions from '../../../resources/staffClient/staffClientActions';

class OutlookActions extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      canConvertAttachments: false 
    }
  }
  componentDidMount() {
    const { isIframeInitialized } = this.props;
    /**
     * Hide convert attachments as an option for now.  Support on Desktop Outlook is very inconsistent.
     * 
     * TODO: Periodically check the MS Office API docs for this feature to determine if desktop outlook 
     * can consistently support this feature
     */
    if (!isIframeInitialized) {
      if (Office.context.requirements.isSetSupported("Mailbox", "1.8")) {
        console.log('convert attachment supported');
        this.setState({canConvertAttachments:true})
      } else {
        console.log('convert attachment is not supported');
        this.setState({
          errorMessage: 'Error code 515 - Attachments are not supported for this version of Outlook.',
        });
      }
    }
    const { dispatch, history, loggedInUser, selectedStaff, selectedStaffId } = this.props;
    
    // Fetch staff using the stored selectedStaffId so we can make sure it matches the logged in user.
    dispatch(staffActions.fetchSingleIfNeeded(selectedStaffId)).then(staffRes => {
      const staff = staffRes.item;
      if(!staff || staff._user != loggedInUser._id) {
        // NOTE: we have a missing or stale staff id in localStorage.
        localStorage.clear(); // clear the account selection
        history.replace('/'); // foward back to select an account.
      }
    });
    /**
     * If the user is already logged in they will start here. Previously we would access their staff and
     * firm object from localStorage. Now that we're only storing the selectedStaffId in local storage,
     * we'll have to fetch their staff and firm objects so we can check permissions below.
     */
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchListIfNeeded('_user', loggedInUser._id));
    if(selectedStaff) {
      dispatch(clientActions.fetchListIfNeeded('_firm', selectedStaff._firm));
    }
  }

  componentDidUpdate(prevProps) {
    const { dispatch, loggedInUser, selectedStaff } = this.props;
    if(selectedStaff && (!prevProps.selectedStaff || !prevProps.selectedStaff._id || prevProps.selectedStaff._id != selectedStaff._id)) {
      dispatch(clientActions.fetchListIfNeeded('_firm', selectedStaff._firm));
      dispatch(staffClientActions.fetchListIfNeeded('_firm', selectedStaff._firm, '_user', loggedInUser._id, '~staff.status', 'active'));
    }
  }

  render() {
    const { loggedInUser, selectedFirm, selectedStaff } = this.props;
    // console.log(firm);
    return (
      <div>
        <div className="yt-row center-vert space-between">
          <h4>Hello, {loggedInUser.firstname}</h4>
          <Link to="/settings" >
            <i className="fal fa-cog" />
          </Link>
        </div>
        <hr />
        <br />
        <div className="-outlook-action-btns">
          {/* NOTE: Removing this here too just to be thorough */}
          {this.state.canConvertAttachments ?
            <Link to="/attach" className="-btn">
              <div className="-icon">
                <i className="fas fa-paperclip " />
              </div>
              <div className="-text">
                Convert Attachments
              </div>
            </Link>
            :
            null 
          }
          <Link to="/upload/share" className="-btn">
            <div className="-icon">
              <i className="fad fa-paper-plane " />
            </div>
            <div className="-text">
              Send files
            </div>
          </Link>
          <Link to="/request" className="-btn">
            <div className="-icon">
              <i className="fad fa-mail-bulk " />
            </div>
            <div className="-text">
              Request files
            </div>
          </Link>
          { selectedFirm && selectedFirm.eSigAccess && selectedStaff && selectedStaff.eSigAccess ? 
            <Link to="/upload/signature" className="-btn">
              <div className="-icon">
                <i className="fad fa-file-signature" />
              </div>
              <div className="-text">
                Request Signature
              </div>
            </Link>
            :
            <div to="/upload/signature" className="-btn -disabled">
              <div className="-icon">
                <i className="fad fa-file-signature" />
              </div>
              <div className="-text">
                Request Signature | <i className="fas fa-lock"/>
              </div>
            </div>
          }

        </div>

      </div>
    );
  }
}

OutlookActions.propTypes = {
  dispatch: PropTypes.func.isRequired
  , history: PropTypes.object.isRequired
  , selectedStaffId: PropTypes.number.isRequired
};

const mapStoreToProps = (store, props) => {
  const { selectedStaffId } = props;
  const staffStore = store.staff;
  const firmStore = store.firm;
  const selectedStaff = staffStore.byId[selectedStaffId]
  const selectedFirm = selectedStaff && firmStore.byId[selectedStaff._firm];

  return {
    firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , selectedFirm
    , selectedStaff
    , staffStore: store.staff
  }
};

export default withRouter(connect(mapStoreToProps)(OutlookActions));
