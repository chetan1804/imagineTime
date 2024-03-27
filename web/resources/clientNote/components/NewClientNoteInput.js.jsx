/**
 * A reusable component to add clientNotes to any resource. If no clientNoteId is passed,
 * it fetches its own default and saves the new clientNote with the supplied pointers.
 * If a clientNoteId is passed, it edits that clientNote (Future functionality. For now it just creates new clientNotes).
 * 
 * All it needs from the parent is a "pointers" object OR a clientNoteId. It MUST have one.
 *  <NewClientNoteInput
 *    pointers={{"_file": match.params.fileId}}
 *    clientNoteId={clientNote._id}
 *    onSubmit={} // A callback that is called when a clientNote is created/updated (to add the item to lists, etc...)
 *  />
 * 
 * NOTE: For _user we use loggedInUser by default.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import permissions from '../../../global/utils/permissions.js';

// import form components
import { TextAreaInput } from '../../../global/components/forms';


// import actions
import * as clientNoteActions from '../clientNoteActions';

class NewClientNoteInput extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      content: ''
      , submitting: false 
    }
    this._bind (
      '_handleFormChange'
      , '_handleSaveNote'
    )
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleSaveNote(e) {

    const { defaultClientNote, dispatch, history, loggedInUser, pointers, match, clientUserStore } = this.props;
    const isClientuser = permissions.isClientUser(clientUserStore, loggedInUser, parseInt(pointers._client));


    // console.log('fired');
    this.setState({submitting: true})

    if(e) {
      e.preventDefault();
    }
    let newClientNote = {
      content: this.state.content 
      , isClientuser: isClientuser ? true : false
    }
    if(newClientNote.content) {
      if(pointers) {
        // if we aren't editing an existing clientNote, we must have pointers to save the new one.
        newClientNote._user = loggedInUser._id
        // Add all pointers
        Object.keys(pointers).forEach(key => {
          newClientNote[key] = pointers[key]
        });
        dispatch(clientNoteActions.sendCreateClientNote(newClientNote)).then(clientNoteRes => {
          if(clientNoteRes.success) {
            if(this.props.onSubmit) {
              this.props.onSubmit(clientNoteRes.item._id)
            }
            this.setState({content: '', submitting: false})
          } else {
            alert("ERROR - Check logs");
          }
        })
      } else {
        // We have no pointers. We can't do anything.
      }
    } else {
      // Note has no content. Nothing to save.
      if(this.props.onSubmit) {
        this.props.onSubmit()
      }
    }
  }

  render() {
    const { content, submitting } = this.state;
    return (
      <div className="note-editor">
        <div className="-note-input">
          <TextAreaInput
            autoFocus={true}
            change={this._handleFormChange}
            name="content"
            rows="2"
            placeholder="Send a question or comment..."
            // onEnter={this.props.submitOnEnter ? this._handleSaveNote : null}
            value={content}
          />
          <div className="yt-row right">
            <button className="yt-btn xx-small info" onClick={this._handleSaveNote} disabled={!content || !content.trim() || submitting}>Comment</button>
          </div>
        </div> 
        <hr/>
      </div>
    )
  }
}

NewClientNoteInput.propTypes = {
  dispatch: PropTypes.func.isRequired
  , defaultClientNote: PropTypes.object
  , clientNoteId: PropTypes.string // not used yet. In the future it will allow editing a clientNote.
  , onSubmit: PropTypes.func
  , pointers: PropTypes.object
  , submitOnEnter: PropTypes.bool
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultClientNote: store.clientNote.defaultItem.obj
    , loggedInUser: store.user.loggedIn.user
    , clientUserStore: store.clientUser 
  }
}

export default connect(mapStoreToProps)(NewClientNoteInput)
