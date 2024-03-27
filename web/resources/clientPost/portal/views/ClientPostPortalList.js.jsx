/**
 * View component for /client-posts
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
import * as clientActions from '../../../client/clientActions';
import * as clientPostActions from '../../clientPostActions';
import * as clientPostReplyActions from '../../../clientPostReply/clientPostReplyActions'; 
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions'; 
import * as userActions from '../../../user/userActions'; 

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { TextAreaInput, TextInput } from '../../../../global/components/forms';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

// import resource components
import ClientPostLayout from '../../components/ClientPostLayout.js.jsx';
import ClientPostListItem from '../../components/ClientPostListItem.js.jsx';

class ClientPostPortalList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      clientPost: _.cloneDeep(this.props.defaultClientPost.obj)
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    // fetch a list of your choice
    const { dispatch, match } = this.props;
    /**
     * add this to each portal view 
     */
    dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(match.params.clientId));
   
    dispatch(clientPostActions.fetchDefaultClientPost());
    dispatch(clientPostReplyActions.fetchDefaultClientPostReply());
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then((json) => {
      if(json.success) {
        dispatch(firmActions.fetchSingleIfNeeded(json.item._firm)); 
        dispatch(clientPostActions.fetchListIfNeeded('_firm', json.item._firm, '_client', match.params.clientId));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', json.item._firm));
        dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));

        /** 
         * Fetching this way because fetching by each post could end up being
         * quite a few calls at once. we may change this when we implement 
         * pagination
         */
        dispatch(clientPostReplyActions.fetchListIfNeeded('_firm', json.item._firm, '_client', match.params.clientId)); 
      }
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
    const { dispatch, history, match, loggedInUser, userStore, firmStore, clientStore } = this.props;
    e.preventDefault();
    const selectedFirm = firmStore.selected.getItem();
    const selectedClient = clientStore.selected.getItem();
    const newPost = _.cloneDeep(this.state.clientPost); 
    newPost._firm = selectedFirm._id;
    newPost._client = selectedClient._id;
    newPost._createdBy = loggedInUser._id;
    dispatch(clientPostActions.sendCreateClientPost(newPost)).then(clientPostRes => {
      if(clientPostRes.success) {
        dispatch(clientPostActions.addClientPostToList(clientPostRes.item, '_firm', clientPostRes.item._firm, '_client', clientPostRes.item._client))
        this.setState({clientPost: _.cloneDeep(this.props.defaultClientPost.obj)}); 
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { clientPostStore, firmStore, clientStore, match, userStore, loggedInUser } = this.props;
    const { clientPost } = this.state;

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
    const clientPostListItems = selectedFirm && selectedFirm._id && selectedClient && selectedClient._id && clientPostStore.util.getList('_firm', selectedFirm._id, '_client', selectedClient._id);

    // get the clientPostList meta info here so we can reference 'isFetching'
    const clientPostList = clientPostListItems ? clientPostStore.lists._firm[selectedFirm._id]._client[selectedClient._id] : null;

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
      <PortalLayout>
        <Helmet><title>Message Board</title></Helmet>
        <h1>Message board</h1>
        <hr/>
        <div className="-portal-content">
          { isEmpty ?
            (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
            :
            <div style={{ opacity: isFetching ? 0.5 : 1 }}>
              <div className="yt-row with-gutters space-between">
                <div className="yt-col full l_60">
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
                
                  { clientPostListItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((post, i) =>
                    <ClientPostListItem 
                      key={'clientPost_' + post._id + '_' + i} 
                      clientPost={post} 
                      createdBy={userStore.byId[post._createdBy]}
                      loggedInUser={loggedInUser}
                      client={selectedClient}
                      firm={selectedFirm}
                    />
                  )}
                </div>
                <div className="yt-col full s_40 m_25 portal-info-helper">
                  <div className="-content-box">
                    <div className="-icon">
                      <i className="fal fa-lightbulb-on"/>
                    </div>
                    <p>Ask a question, start a conversation, or send a message to your assigned staff. </p>
                  </div>
                  {/* <div className="-need-help" style={{marginTop: '32px'}}>
                    <p className="u-centerText">Need to chat?</p>
                    <button className="yt-btn bordered block x-small info">Schedule a call</button>
                  </div> */}
                </div>
              </div>
            </div>
          }
        </div>
      </PortalLayout>
    )
  }
}

ClientPostPortalList.propTypes = {
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
    , defaultClientPost: store.clientPost.defaultItem
    , firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientPostPortalList)
);
