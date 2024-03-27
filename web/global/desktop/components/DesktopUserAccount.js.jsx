import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import DesktopLoading from './DesktopLoading.js.jsx';
import DesktopNotAllowed from '../components/DesktopNotAllowed.js.jsx';
import DesktopWelcome from '../components/DesktopWelcome.js.jsx';

import Binder from '../../components/Binder.js.jsx';

import * as firmActions from '../../../resources/firm/firmActions';
import * as staffActions from '../../../resources/staff/staffActions';

class DesktopUserAccount extends Binder {
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

    localStorage.setItem('emitenigami', JSON.stringify({
      selectedStaffId
    }));

    history.replace('/');
  }

  componentDidMount() {
    const { dispatch, loggedInUser } = this.props;

    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchListIfNeeded('_user', loggedInUser._id)).then(response => {
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
    const staffListItems = staffStore.util.getList('_user', loggedInUser._id);

    if (!firmListItems ||
      !firmList ||
      !staffListItems ||
      !staffList) {
      return (<DesktopWelcome />);
    }

    if (firmList.isFetching ||
      staffList.isFetching) {
      return (<DesktopLoading />);
    }

    if (staffListItems && staffListItems.length > 0) {
      const { errorMessage } = this.state;

      return (
        <div>
          <h2>Select account </h2>
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
                <ul className="-account-list -desktop-account-list">
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
    }

    return (<DesktopNotAllowed />);
  }
}

DesktopUserAccount.propTypes = {
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};

const mapStoreToProps = store => ({
  firmStore: store.firm
  , loggedInUser: store.user.loggedIn.user
  , staffStore: store.staff
});

export default withRouter(connect(mapStoreToProps)(DesktopUserAccount));
