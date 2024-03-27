/**
 * View component for /firms/:firmId/settings/tags
 *
 * Displays a list of a firm's custom tags.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import actions
import * as firmActions from '../../firm/firmActions';
import * as mergeFieldActions from '../mergeFieldActions';
import * as addressActions from '../../address/addressActions';
import * as staffActions from '../../staff/staffActions';
import * as userActions from '../../user/userActions';
import * as phoneNumberActions  from '../../phoneNumber/phoneNumberActions';

// import global components
// import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
// import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import routeUtils from '../../../global/utils/routeUtils';
import { SearchInput } from  '../../../global/components/forms';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
// import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
// import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';

// import resource components
import PracticeFirmLayout from '../../firm/practice/components/PracticeFirmLayout.js.jsx';
// import PracticefolderTemplateList from '../components/PracticefolderTemplateList.js.jsx';
// import CreateFolderTemplateForm from '../components/CreateFolderTemplateForm.js.jsx';
// import SingleFolderTemplateOptions from '../components/SingleFolderTemplateOptions.js.jsx';
// import FolderTemplatesRecycleBinList from '../components/FolderTemplatesRecycleBinList.js.jsx';
// import CreateTagModal from '../components/CreateTagModal.js.jsx';

import MergeFieldsList from '../components/MergeFieldsList.js.jsx';

class DocumentMergeFields extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      query: ''
      , listArgs: {
        '_firm': props.match.params.firmId
      }
    }
    this._bind(
      '_handleQuery'
      , '_handleSetPagination'
      , '_setPerPage'
      , '_handleQuery'
    );
  }

  componentDidMount() {
    const { dispatch, match, loggedInUser } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);


    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(addressActions.fetchListIfNeeded(...listArgs));
    if(loggedInUser && loggedInUser._primaryAddress) {
      dispatch(addressActions.fetchSingleIfNeeded(loggedInUser._primaryAddress));
    }
    if (loggedInUser && loggedInUser._primaryPhone) {
      dispatch(phoneNumberActions.fetchSingleIfNeeded(loggedInUser._primaryPhone))
    }

    // if(client._primaryPhone) {
    //     dispatch(phoneNumberActions.fetchSingleIfNeeded(client._primaryPhone));
    // }
    dispatch(mergeFieldActions.fetchListIfNeeded(...listArgs)).then(json => {
      dispatch(mergeFieldActions.setQuery('', ...listArgs));
      this._handleSetPagination({page: 1, per: 100 });
    });
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    dispatch(mergeFieldActions.setPagination(newPagination, ...listArgs));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  _handleQuery(e) {
    console.log("e", e)

    const { dispatch } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);

    // always defaulting the page to page 1 so we can see our results
    let pagination = {};
    pagination.page = 1;
    pagination.per = this.state.per;
    this._handleSetPagination(pagination);

    // continue query logic
    dispatch(mergeFieldActions.setQuery(e.target.value.toLowerCase(), ...listArgs));
    this.setState({ query: e.target.value.toLowerCase() });
  }

  render() {
    const {
      match
      , mergeFieldStore
      , addressStore
      , phoneNumberStore
    } = this.props;

    const {
      query
    } = this.state;

    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);

    const mergeFieldList = mergeFieldStore.util.getSelectedStore(...listArgs);
    const mergeFieldListItems = mergeFieldStore.util.getList(...listArgs);

    const isEmpty = (
      !mergeFieldList
      || !mergeFieldListItems
      || !mergeFieldList.items
      || mergeFieldList.isFetching
      || mergeFieldList.didInvalidate
      || mergeFieldStore.selected.didInvalidate
      || addressStore.selected.didInvalidate
      || phoneNumberStore.selected.didInvalidate
    );

    const isFetching = (
      !mergeFieldList
      || !mergeFieldListItems
      || mergeFieldList.isFetching
      || mergeFieldStore.selected.isFetching
      || addressStore.selected.isFetching
      || phoneNumberStore.selected.isFetching
    );

    console.log("mergeFieldStore", this.state.query, mergeFieldList, mergeFieldStore)
    // console.log("activeStaff", activeStaff);

    return (
      <PracticeFirmLayout>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <div className="hero -empty-hero">
              <div className="u-centerText">
                <p>Looks like you don't have any merge field yet. </p>
                <p>Let's add some.</p>
              </div>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="file-list-wrapper">
              <MergeFieldsList
                mergeFieldStore={mergeFieldStore}
                mergeFieldList={mergeFieldList}
                mergeFieldListItems={mergeFieldListItems}
                setPagination={this._handleSetPagination}
                setPerPage={this._setPerPage}
                handleQuery={this._handleQuery}
                fileQuery={query}
              />
            </div>
          </div>
        }
      </PracticeFirmLayout>
    )
  }
}

DocumentMergeFields.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    mergeFieldStore: store.mergeField
    , addressStore: store.address
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(DocumentMergeFields)
);
