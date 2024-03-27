/**
 * View component for /client-posts/:clientPostId
 *
 * Displays a single clientPost from the 'byId' map in the clientPost reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { DateTime } from 'luxon'

// import actions
import * as clientPostActions from '../clientPostActions';
import * as clientActions from '../../client/clientActions';
import * as firmActions from '../../firm/firmActions';
import * as userActions from '../../user/userActions'; 
import * as clientPostReplyActions from '../../clientPostReply/clientPostReplyActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';
import { TextAreaInput } from '../../../global/components/forms';

// import resource components
import ClientPostLayout from '../components/ClientPostLayout.js.jsx';
import ClientPostListItem from '../components/ClientPostListItem.js.jsx'; 

class SingleClientPost extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newClientPostReplyOpen: false
      , clientPostReply: _.cloneDeep(this.props.defaultClientPostReply.obj)
    }
    this._bind(
      '_goBack'
      , '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientPostActions.fetchSingleIfNeeded(match.params.clientPostId)).then((json) => {
      if(json.success) {
        dispatch(firmActions.fetchSingleIfNeeded(json.item._firm)); 
        dispatch(clientActions.fetchSingleIfNeeded(json.item._client)); 
        dispatch(userActions.fetchListIfNeeded('_firm', json.item._firm)); 
        dispatch(userActions.fetchListIfNeeded('_client', json.item._client));
        dispatch(clientPostReplyActions.fetchDefaultClientPostReply());
        dispatch(clientPostReplyActions.fetchList('_clientPost', match.params.clientPostId));
        // dispatch(userActions.fetchListIfNeeded('_firmStaff', json.item._firm));
        // dispatch(userActions.fetchListIfNeeded('_client', json.item._client));
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientPostReply: _.cloneDeep(nextProps.defaultClientPostReply.obj)
    })
  }

  _goBack() {
    this.props.history.goBack(); 
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { dispatch, loggedInUser, clientPost, userStore, match } = this.props; 
    const newClientPostReply = _.cloneDeep(this.state.clientPostReply);
    newClientPostReply._firm = match.params.firmId;
    newClientPostReply._client = match.params.clientId;
    newClientPostReply._createdBy = loggedInUser._id;
    newClientPostReply._clientPost = match.params.clientPostId
    dispatch(clientPostReplyActions.sendCreateClientPostReply(newClientPostReply)).then((json) => {
      dispatch(clientPostReplyActions.addClientPostReplyToList(json.item, '_clientPost', match.params.clientPostId));
      this.setState({clientPostReply: _.cloneDeep(this.props.defaultClientPostReply.obj), newClientPostReplyOpen: false}); 
    })
  }

  render() {
    const { clientPostStore, clientPostReplyStore, clientStore, firmStore, userStore, loggedInUser, match } = this.props;
    const { newClientPostReplyOpen, clientPostReply } = this.state; 
    /**
     * use the selected.getItem() utility to pull the actual clientPost object from the map
     */
    const selectedClientPost = clientPostStore.selected.getItem();
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem(); 

    const clientPostReplyList = clientPostReplyStore.util.getList('_clientPost', match.params.clientPostId);

    const isEmpty = (
      !selectedClientPost
      || !selectedClientPost._id
      || !selectedFirm
      || !selectedClient
      || !clientPostReplyList
      // || clientPostStore.selected.didInvalidate
    );

    const isFetching = (
      clientPostStore.selected.isFetching
    )

    let createdBy = selectedClientPost && userStore.byId[selectedClientPost._createdBy]; 

    return (
      <ClientPostLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div>
              <button onClick={this._goBack} className="yt-btn link success">{"< All Messages"}</button>
            </div>
            <div className="post-card">
              <div className="-post-header">
                <h4 className="-post-header">{selectedClientPost.subject}</h4>
              </div>
              <div className="-author">
                <div className="-profile-pic">
                  { createdBy ? 
                    <ProfilePic user={createdBy}/>
                  : null
                  }
                </div>
                <div>
                  { createdBy ? 
                    <h5>{createdBy._id === loggedInUser._id ? "You" : `${createdBy.firstname} ${createdBy.lastname}`}</h5>
                  :
                    <b>Unknown User</b>
                  }
                  <Link to={`${this.props.match.url}/${selectedClientPost._id}`} className="-date">{DateTime.fromISO(selectedClientPost.created_at).toLocaleString(DateTime.DATETIME_MED)}</Link>
                </div>
              </div>
              <div className="card-body">
                {selectedClientPost.content}
              </div>
              <div>
                {clientPostReplyList && clientPostReplyList.length > 0 ? 
                  <div>
                    { clientPostReplyList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((reply, i) =>
                      <div className="reply-card" key={reply._id + '_' + i}>
                        {userStore.byId[reply._createdBy] ?
                          <div className="-author">
                            <div className="-profile-pic">
                              <ProfilePic user={userStore.byId[reply._createdBy]}/>
                            </div>
                            <div>
                              <h5>{userStore.byId[reply._createdBy].firstname} {userStore.byId[reply._createdBy].lastname}</h5>
                              <p className="-date">{DateTime.fromISO(reply.created_at).toLocaleString(DateTime.DATETIME_MED)}</p>
                            </div>
                          </div>
                        : null
                        }
                        <div className="card-body">
                          <p>{reply.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  : null
                }
              </div>
              <div className="reply-card">
                { loggedInUser ? 
                  <div className="-author">
                    <div className="-profile-pic">
                      <ProfilePic user={loggedInUser}/>
                    </div>
                    { !newClientPostReplyOpen ?
                      <button className="-reply-button" onClick={() => this.setState({newClientPostReplyOpen: !this.state.newClientPostReplyOpen})}>
                        <p className="-text">Reply to Message</p>
                      </button>
                      : null 
                    }
                  </div>
                : null
                }
                { newClientPostReplyOpen && clientPostReply ? 
                  <div className="-card-body">
                      <TextAreaInput
                        change={this._handleFormChange}
                        name="clientPostReply.content"
                        placeholder="Reply to message..."
                        required={false}
                        value={clientPostReply.content}
                      />
                    <button className="yt-btn small link" onClick={() => this.setState({newClientPostReplyOpen: !this.state.newClientPostReplyOpen})}>Cancel</button>
                    <button className="yt-btn small success" disabled={!clientPostReply.content || !clientPostReply.content.trim()} onClick={() => this._handleFormSubmit()}>Submit</button>
                  </div>
                  : null
                }
              </div>
            </div>
          </div>
        }
      </ClientPostLayout>
    )
  }
}

SingleClientPost.propTypes = {
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
    , clientPostReplyStore: store.clientPostReply
    , defaultClientPostReply: store.clientPostReply.defaultItem
    , firmStore: store.firm
    , userStore: store.user
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SingleClientPost)
);
