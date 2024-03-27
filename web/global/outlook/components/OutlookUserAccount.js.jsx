import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import OutlookLoading from './OutlookLoading.js.jsx';
import OutlookNotAllowed from '../components/OutlookNotAllowed.js.jsx';
import OutlookWelcome from '../components/OutlookWelcome.js.jsx';

import Binder from '../../components/Binder.js.jsx';

import * as firmActions from '../../../resources/firm/firmActions';
import * as staffActions from '../../../resources/staff/staffActions';

import brandingName from '../../enum/brandingName.js.jsx';

class OutlookUserAccount extends Binder {
  constructor(props) {
    super(props)

    this.state = {
      errorMessage: null,
    };

    this._bind(
      '_handleOnClick'
    );
  }

  _handleOnClick(selectedStaffId, e) {
    const { history } = this.props;
    /**
     * NOTE: We are setting the firm and staff object on localStorage here which
     * is only cleared when a user logs out via OutlookSettings. This means that
     * we are likely to be looking at an old firm and staff object that doesn't
     * match the db. This is probably causing the reported issue where the Signature Request
     * button is disabled when the firm has eSigAccess.
     * 
     * Maybe we could just save the firmId and staffId here. Then we could make the firm and staff
     * fetches by user when the plugin loads and modify OutlookRoute to pull the objects from the 
     * map using the ids in localStorage. -Wes
     */
    localStorage.setItem('emitenigami', JSON.stringify({
      selectedStaffId
    }));

    history.replace('/');
  }

  componentDidMount() {
    const { dispatch, loggedInUser } = this.props;
    
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchListIfNeeded('_user', loggedInUser._id, 'status', 'active')).then(response => {
      if (response.success && response.list && response.list.length === 1) {
        // TODO: save the single entry to localStorage.setItem
      }
    });
  }

  render() {
    const { firmStore, loggedInUser, staffStore } = this.props;

    const firmList = firmStore.lists && firmStore.lists._user ? firmStore.lists._user[loggedInUser._id] : null;
    const firmListItems = firmStore.util.getList('_user', loggedInUser._id);

    const staffList = staffStore.lists && staffStore.lists._user ? staffStore.lists._user[loggedInUser._id] : null;
    const staffListItems = staffStore.util.getList('_user', loggedInUser._id, 'status', 'active');

    if (!firmListItems ||
      !firmList ||
      !staffListItems ||
      !staffList) {
      return (<OutlookWelcome />);
    }

    if (firmList.isFetching ||
      staffList.isFetching) {
      return (<OutlookLoading />);
    }

    const title = brandingName.title == 'ImagineTime' ? 'ImagineShare': 'LexShare';

    if (staffListItems && staffListItems.length > 0) {
      const { errorMessage } = this.state;

      return (
        <div>
          <h4>Confirm the account you'd like to use for {title}. </h4>
          <hr />
          <br />
          {errorMessage && (
            <div className="input-group">
              <div className="-error-message">{errorMessage}</div>
            </div>
          )}
          <div className="-account-forward ">
            <section className="section -firm-list">
              <div className="-select-account">
                <ul className="-account-list -outlook-account-list">
                  {staffListItems.map((staff, i) => (
                    <li key={staff._id + i}>
                      <a className="-account-select-link" onClick={() => this._handleOnClick(staff._id)}>
                        <span>{firmStore.byId[staff._firm] ? firmStore.byId[staff._firm].name : ''}</span>
                        <i className="-icon fal fa-angle-right" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      );
    } else {
      return (<OutlookNotAllowed />);
    }

  }
}

OutlookUserAccount.propTypes = {
  dispatch: PropTypes.func.isRequired
  , history: PropTypes.object.isRequired
};

const mapStoreToProps = store => ({
  firmStore: store.firm
  , loggedInUser: store.user.loggedIn.user
  , staffStore: store.staff
});

export default withRouter(connect(mapStoreToProps)(OutlookUserAccount));
