/**
 * View component for /client-workflows
 *
 * Generic clientWorkflow list view. Defaults to 'all' with:
 * this.props.dispatch(clientWorkflowActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as clientWorkflowActions from '../../clientWorkflowActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';
import * as tagActions from '../../../tag/tagActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

// import resource components
import PortalClientWorkflowList from '../components/PortalClientWorkflowList.js.jsx';

// import utils
import routeUtils from '../../../../global/utils/routeUtils';

class ClientClientWorkflows extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      query: ''
      , clientWorkflowListArgsObj: {
        '_client': props.match.params.clientId
        , 'status': 'published'
      }
    }
    this._bind(
      '_handleSetFilter'
      , '_handleSetPagination'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props
    // fetch a list of your choice
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
        dispatch(staffActions.fetchListIfNeeded('_firm', clientRes.item._firm));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', clientRes.item._firm));
      }
    })
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId));
    // dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));

    const clientWorkflowListArgsObj = routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj) // computed from the object
    this._handleSetPagination({page: 1, per: 50}); 
    dispatch(clientWorkflowActions.fetchListIfNeeded(...clientWorkflowListArgsObj));

    // dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    // dispatch(tagActions.fetchListIfNeeded('~client', match.params.clientId))
  }
  
  componentDidUpdate(prevProps, prevState) {
    // catch for state change and re-fetch clientWorkflow list if it happens
    // compare computed listArgs object
    if(routeUtils.listArgsFromObject(prevState.clientWorkflowListArgsObj) !== routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj)) {
      this.props.dispatch(clientWorkflowActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj)))
    }
  }


  _handleSetFilter(e) {
    let newClientWorkflowListArgsObj = { ...this.state.clientWorkflowListArgsObj }
    newClientWorkflowListArgsObj[e.target.name] = e.target.value;

    // console.log("next obj: ", newClientWorkflowListArgsObj)
    // console.log(routeUtils.listArgsFromObject(newClientWorkflowListArgsObj))
    this.setState({ clientWorkflowListArgsObj: newClientWorkflowListArgsObj })
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const clientWorkflowListArgs = routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj);
    dispatch(clientWorkflowActions.setPagination(newPagination, ...clientWorkflowListArgs));
  }


  render() {
     // console.log("RENDERING")
     const {
      clientStore 
      , clientUserStore 
      , clientWorkflowStore
      , firmStore
      , location 
      , loggedInUser
      , match 
      , staffStore 
      , staffClientStore 
      , tagStore
      , userStore 
    } = this.props;
    
    const clientWorkflowListArgs = routeUtils.listArgsFromObject(this.state.clientWorkflowListArgsObj) // computed from the object

    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    // clientUsers(contacts) list 
    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[match.params.clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId);

    // staffClient  list 
    // const staffClientList = staffClientStore.lists && staffClientStore.lists._client ? staffClientStore.lists._client[match.params.clientId] : null;
    // const staffClientListItems = staffClientStore.util.getList('_client', match.params.clientId);

    // const allTags = tagStore.util.getList('~client', match.params.clientId) || []


    {/** TODO: make this work like files */}
    // activity  list
    const clientWorkflowListItems = clientWorkflowStore.util.getList(...clientWorkflowListArgs);
    // console.log("filelistitems", clientWorkflowListItems)
    // TODO: this is a good way to do this arbitrarily going forward. if clientWorkflowListItems isn't null, then we know the list is at least defined
    const clientWorkflowList = clientWorkflowListItems ? clientWorkflowListArgs.reduce((obj, nextKey) => obj[nextKey], clientWorkflowStore.lists) : null


    const isEmpty = (
      clientStore.selected.didInvalidate
      || !clientWorkflowListItems
      || !clientWorkflowList
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
    );

    const isFetching = (
      !clientWorkflowListItems
      || !clientWorkflowList
      || clientWorkflowList.isFetching
      || clientStore.selected.isFetching
      || !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
      // || !staffClientListItems
      // || !staffClientList
      // || staffClientList.isFetching
    )


    return (
      <PortalLayout>
        <Helmet><title>Workflows</title></Helmet>
        <h1>Workflows</h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <em>No clientWorkflows.</em>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-row with-gutters space-between">
              <div className="yt-col full s_60 m_70">
                <PortalClientWorkflowList
                  // allTags={allTags}
                  selectedTagIds={this.state.clientWorkflowListArgsObj._tags || []}
                  clientWorkflowList={clientWorkflowList}
                  handleFilter={this._handleSetFilter}
                  handleOpenUploadModal={() => this.setState({isUploadFilesModalOpen: true})}
                  handleQuery={() => console.log('handle queery')}
                  handleSetPagination={this._handleSetPagination}
                  handleSort={() => console.log('handle sort')}
                  sortedAndFilteredList={clientWorkflowListItems} // TODO: update this 
                />
              </div>
              <div className="yt-col full s_40 m_25 portal-info-helper">
                <div className="-content-box">
                  <div className="-icon">
                    <i className="fal fa-lightbulb-on"/>
                  </div>
                  <p>Automated Requests are a collection of action items between you and the {selectedFirm ? selectedFirm.name : null} team. They provide you with an easy way to understand exactly what you need to deliver and when you need to deliver it.</p>
                </div>
                {/* <div className="-need-help" style={{marginTop: '32px'}}>
                  <p className="u-centerText">Need help?</p>
                  <button className="yt-btn bordered block x-small info">Schedule a call</button>
                </div> */}
              </div>
            </div>
          </div>
        }
      </PortalLayout>
    )
  }
}

ClientClientWorkflows.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientStore: store.client
    , clientUserStore: store.clientUser
    , firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff
    , staffClientStore: store.staffClient
    , tagStore: store.tag
    , clientWorkflowStore: store.clientWorkflow
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientClientWorkflows)
);
