/**
 * View component for /firm/:firmId/clients/:clientId/contacts
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, Route, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries
import { Helmet } from 'react-helmet';


// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';

// import resource components
import ClientSettingsLayout from '../../../client/practice/components/ClientSettingsLayout.js.jsx';
import ClientUserList from '../../../clientUser/components/ClientUserList.js.jsx';
import ContactQuickView from './ContactQuickView.js.jsx';

class ClientSettingsContacts extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      page: 1
      , per: 50
      , query: ''
    };
    this._bind(
      '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    // These two fetches should live on every top-level practice view.
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 

    dispatch(addressActions.fetchListIfNeeded('_client', match.params.clientId)); // client's addresses 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId)).then(cuRes => {
      if(cuRes.success) {
        cuRes.list.forEach(cu => {
          dispatch(addressActions.fetchListIfNeeded('_user', cu._user));
          dispatch(phoneNumberActions.fetchListIfNeeded('_user', cu._user));
        })
      }
    });

    this._handleSetPagination({page: 1, per: 50});
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(phoneNumberActions.fetchListIfNeeded('_client', match.params.clientId)); // client's phone numbers 
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_clientArchivedUser', match.params.clientId));
  }

  _handleSetFilter(e) {
    console.log('Apply filters ', e);
    
    // let nextFileListArgsObj = { ...this.state.fileListArgsObj }
    // nextFileListArgsObj[e.target.name] = e.target.value;

    // // console.log("next obj: ", nextFileListArgsObj)
    // // console.log(routeUtils.listArgsFromObject(nextFileListArgsObj))
    // this.setState({ fileListArgsObj: nextFileListArgsObj}
    // , () => this._handleSetPagination({page: 1, per: this.state.per})
    // )
  }

  _handleSetPagination(newPagination) {
    const { dispatch, match } = this.props;
    dispatch(clientUserActions.setPagination(newPagination, '_client', match.params.clientId));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  render() {
    const {
      addressStore
      , clientStore 
      , clientUserStore 
      , firmStore
      , location 
      , loggedInUser
      , match 
      , staffStore 
      , staffClientStore 
      , userStore 
    } = this.props;
    
    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    // clientUsers(contacts) list 
    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[match.params.clientId] : null;
    let clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId);

   
    const isEmpty = (
      !selectedClient
      || !selectedClient._id
      || clientStore.selected.didInvalidate
      || !clientUserList
      || !clientUserListItems
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
    );

    const isFetching = (
      clientStore.selected.isFetching
      || !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
    )

    const isArchived = (match.params.contactsStatus && match.params.contactsStatus == "archived");


    if (clientUserListItems && clientUserListItems.length) {
      clientUserListItems = clientUserListItems.filter(clientUser => {
        return (clientUser.status === "active" && !isArchived) || (clientUser.status === "archived" && isArchived)
      });
    }

    return (
      <ClientSettingsLayout>
        <Helmet>
          <title>Contact Settings</title>
        </Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <em>No Contacts.</em>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ClientUserList
              clientUserList={clientUserList}
              clientUserListItems={clientUserListItems}
              handleFilter={this._handleSetFilter}
              handleOpenUploadModal={() => this.setState({isUploadFilesModalOpen: true})}
              handleQuery={() => console.log('handle queery')}
              handleSetPagination={this._handleSetPagination}
              handleSort={() => console.log('handle sort')}
              setPerPage={this._setPerPage}
              archived={isArchived}
            />
          </div>
        }
        <TransitionGroup>
          <CSSTransition
            key={location.key}
            classNames="slide-from-right"
            timeout={300}
          >
            <Switch location={location}>
              <YTRoute 
                breadcrumbs={[{display: 'All clients', path: `/firm/${match.params.firmId}/clients`}, {display: 'Workspace', path: `/firm/${match.params.firmId}/clients/${match.params.clientId}`}, {display: 'Contacts', path: null}]}
                exact 
                path="/firm/:firmId/clients/:clientId/contacts/quick-view/:userId" 
                login={true} 
                component={ContactQuickView}
              />
              <Route render={() => <div/>} />
            </Switch>
          </CSSTransition>
        </TransitionGroup>
      </ClientSettingsLayout>
    )
  }
}

ClientSettingsContacts.propTypes = {
  dispatch: PropTypes.func.isRequired
}

ClientSettingsContacts.defaultProps = {

}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.activity 
    , clientStore: store.client 
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff 
    , staffClientStore: store.staffClient 
    , userStore: store.user 
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ClientSettingsContacts)
);
