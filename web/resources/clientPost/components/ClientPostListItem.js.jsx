// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux'; 

import _ from 'lodash'; 
import  { DateTime } from 'luxon';
import * as clientPostReplyActions from '../../clientPostReply/clientPostReplyActions'; 

import Binder from '../../../global/components/Binder.js.jsx';
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';
import { TextAreaInput } from '../../../global/components/forms';

class ClientPostListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newClientPostReplyOpen: false
      , clientPostReply: _.cloneDeep(this.props.defaultClientPostReply.obj)
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
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
    const { dispatch, firm, client, loggedInUser, clientPost, userStore } = this.props; 
    const newClientPostReply = _.cloneDeep(this.state.clientPostReply);
    newClientPostReply._firm = firm._id;
    newClientPostReply._client = client._id;
    newClientPostReply._createdBy = loggedInUser._id;
    newClientPostReply._clientPost = clientPost._id; 
    dispatch(clientPostReplyActions.sendCreateClientPostReply(newClientPostReply)).then((json) => {
      dispatch(clientPostReplyActions.addClientPostReplyToList(json.item, '_firm', firm._id, '_client', client._id));
      this.setState({clientPostReply: _.cloneDeep(this.props.defaultClientPostReply.obj), newClientPostReplyOpen: false}); 
    })
  }
  
  render() {
    const { clientPost, clientPostReplyStore, createdBy, loggedInUser, client, firm, userStore } = this.props; 
    const { newClientPostReplyOpen, clientPostReply } = this.state; 
    
    const clientPostReplyList = clientPostReplyStore.util.getList('_firm', firm._id, '_client', client._id).filter(reply => reply._clientPost === clientPost._id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return (
      <div className="post-card">
        <div className="-post-header">
          <h4 className="-post-header">{clientPost.subject}</h4>
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
            <Link to={`${this.props.match.url}/${clientPost._id}`} className="-date">{DateTime.fromISO(clientPost.created_at).toLocaleString(DateTime.DATETIME_MED)}</Link>
          </div>
        </div>
        <div className="card-body">
          {clientPost.content}
        </div>
        {clientPostReplyList && clientPostReplyList.length > 2 ?
          <div className="-post-footer">
            <Link to={`${this.props.match.url}/${clientPost._id}`}  className="-length">
              <p className="-date">+{clientPostReplyList.length - 1}</p>
            </Link>
          </div>
        : null
        }
        <div>
          {clientPostReplyList && clientPostReplyList.length > 0 ? 
            <div>
              { clientPostReplyList.length > 2 ? 
                <div className="reply-card">
                  {userStore.byId[clientPostReplyList[clientPostReplyList.length - 1]._createdBy] ?
                    <div className="-author">
                      <div className="-profile-pic">
                        <ProfilePic user={userStore.byId[clientPostReplyList[clientPostReplyList.length - 1]._createdBy]}/>
                      </div>
                      <div>
                        <h5>{userStore.byId[clientPostReplyList[clientPostReplyList.length - 1]._createdBy].firstname} {userStore.byId[clientPostReplyList[clientPostReplyList.length - 1]._createdBy].lastname}</h5>
                        <p className="-date">{DateTime.fromISO(clientPostReplyList[clientPostReplyList.length - 1].created_at).toLocaleString(DateTime.DATETIME_MED)}</p>
                      </div>
                    </div>
                  : null
                  }
                  <div className="card-body">
                    <p>{clientPostReplyList[clientPostReplyList.length - 1].content}</p>
                  </div>
                </div>
              : clientPostReplyList.map((reply, i) =>
                <div className="reply-card" key={'clientPostReply_' + reply._id + '_' + i}>
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
    )
  }
}

ClientPostListItem.propTypes = {
  clientPost: PropTypes.object.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientPostStore: store.clientPost
    , clientPostReplyStore: store.clientPostReply
    , defaultClientPostReply: store.clientPostReply.defaultItem
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientPostListItem)
);
