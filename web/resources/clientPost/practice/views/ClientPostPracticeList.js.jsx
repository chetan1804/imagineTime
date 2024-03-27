/**
 * View component for /firm/:firmId/workspaces/:clientId/messages
 *
 * Generic clientPost list view. Defaults to 'all' with:
 * this.props.dispatch(clientPostActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import _ from 'lodash'; 
import { Helmet } from 'react-helmet';

// import actions
import * as clientPostActions from '../../clientPostActions';
import * as clientPostReplyActions from '../../../clientPostReply/clientPostReplyActions'; 
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions'; 
import * as userActions from '../../../user/userActions'; 

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { TextAreaInput, TextInput } from '../../../../global/components/forms';

// import resource components
import ClientPostLayout from '../../components/ClientPostLayout.js.jsx';
import ClientPostListItem from '../../components/ClientPostListItem.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';

class ClientPostPracticeList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newPostModalOpen: false 
      , clientPost: _.cloneDeep(this.props.defaultClientPost.obj)
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    // fetch a list of your choice
    const { dispatch, match } = this.props;
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(clientPostActions.fetchDefaultClientPost());
    dispatch(clientPostReplyActions.fetchDefaultClientPostReply());
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId)).then((json) => {
      dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then((json) => {
        dispatch(clientPostActions.fetchListIfNeeded('_firm', match.params.firmId, '_client', match.params.clientId));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
        dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));

        /** 
         * Fetching this way because fetching by each post could end up being
         * quite a few calls at once. we may change this when we implement 
         * pagination
         */
        dispatch(clientPostReplyActions.fetchListIfNeeded('_firm', match.params.firmId, '_client', match.params.clientId)); 
      })
    })
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientPost: _.cloneDeep(nextProps.defaultClientPost.obj)
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
    const { dispatch, history, loggedInUser, match } = this.props;
    e.preventDefault();
    const newPost = _.cloneDeep(this.state.clientPost); 
    newPost._firm = parseInt(match.params.firmId);
    newPost._client = parseInt(match.params.clientId);
    newPost._createdBy = loggedInUser._id;
    dispatch(clientPostActions.sendCreateClientPost(newPost)).then(clientPostRes => {
      if(clientPostRes.success) {
        dispatch(clientPostActions.addClientPostToList(clientPostRes.item, '_firm', match.params.firmId, '_client', match.params.clientId))
        this.setState({clientPost: _.cloneDeep(this.props.defaultClientPost.obj)}); 
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { clientPostStore, clientStore, firmStore, userStore, match, loggedInUser } = this.props;
    const { newPostModalOpen, clientPost } = this.state; 

    const selectedFirm = firmStore.selected.getItem();
    const selectedClient = clientStore.selected.getItem(); 

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual clientPost objetcs
     */
    const clientPostListItems = selectedFirm && selectedFirm._id && selectedClient && clientPostStore.util.getList('_firm', selectedFirm._id, '_client', selectedClient._id);

    // get the clientPostList meta info here so we can reference 'isFetching'
    const clientPostList = clientPostListItems && clientPostStore.lists && clientPostStore.lists._firm && clientPostStore.lists._firm[selectedFirm._id] && clientPostStore.lists._firm[selectedFirm._id]._client && clientPostStore.lists._firm[selectedFirm._id]._client[selectedClient._id]
    ? clientPostStore.lists._firm[selectedFirm._id]._client[selectedClient._id] : null;

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientPostListItems
      || !clientPostList
      || !selectedFirm
      || !selectedClient
    );

    const isFetching = (
      !clientPostListItems
      || !clientPostList
      || clientPostList.isFetching
      || selectedFirm.isFetching
      || selectedClient.isFetching
    )

    return (
      <WorkspaceLayout>
        <Helmet><title>Message Board</title></Helmet>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="-mob-layout-ytcol100 yt-row with-gutters space-between">
              <div className="yt-col _75 -message-list">
                { clientPost ?
                  <div className="new-post">
                    <div className="-content">
                      <TextAreaInput
                        change={this._handleFormChange}
                        name="clientPost.subject"
                        placeholder={"Subject..."}
                        // required={true}
                        value={clientPost.subject}
                        rows={1}
                      />
                    </div>
                    <div className="-content">
                      <TextAreaInput
                        change={this._handleFormChange}
                        name="clientPost.content"
                        placeholder="Start a conversation..."
                        // required={true}
                        value={clientPost.content}
                      />
                    </div>
                    <div className="-footer">
                      <button disabled={!clientPost.content || !clientPost.content.trim()} className="yt-btn small success" onClick={this._handleFormSubmit}>Send</button>
                    </div>
                  </div>
                : 
                  null
                }
                {clientPostListItems.length > 0 && clientPostListItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((clientPost, i) =>
                  <ClientPostListItem 
                    key={'clientPost_' + clientPost._id + '_' + i} 
                    clientPost={clientPost} 
                    createdBy={userStore.byId[clientPost._createdBy]}
                    loggedInUser={loggedInUser}
                    client={selectedClient}
                    firm={selectedFirm}
                  />
                )}
              </div>
            </div>
          </div>
        }
      </WorkspaceLayout>
    )
  }
}

ClientPostPracticeList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientPostStore: store.clientPost
    , clientStore: store.client
    , firmStore: store.firm
    , defaultClientPost: store.clientPost.defaultItem
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientPostPracticeList)
);
