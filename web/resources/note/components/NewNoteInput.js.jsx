/**
 * A reusable component to add notes to any resource. If no noteId is passed,
 * it fetches its own default and saves the new note with the supplied pointers.
 * If a noteId is passed, it edits that note (Future functionality. For now it just creates new notes).
 * 
 * All it needs from the parent is a "pointers" object OR a noteId. It MUST have one.
 *  <NewNoteInput
 *    pointers={{"_file": match.params.fileId}}
 *    noteId={note._id}
 *    onSubmit={} // A callback that is called when a note is created/updated (to add the item to lists, etc...)
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

// import form components
import { TextAreaInput } from '../../../global/components/forms';

// import actions
import * as noteActions from '../noteActions';

class NewNoteInput extends Binder {
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
    // console.log('fired');
    this.setState({submitting: true})
    const { defaultNote, dispatch, history, loggedInUser, pointers } = this.props;
    if(e) {
      e.preventDefault();
    }
    let newNote = {
      content: this.state.content 
    }
    if(newNote.content) {
      if(pointers) {
        // if we aren't editing an existing note, we must have pointers to save the new one.
        newNote._user = loggedInUser._id
        // Add all pointers
        Object.keys(pointers).forEach(key => {
          newNote[key] = pointers[key]
        })
        dispatch(noteActions.sendCreateNote(newNote)).then(noteRes => {
          if(noteRes.success) {
            if(this.props.onSubmit) {
              this.props.onSubmit(noteRes.item._id)
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
            placeholder="Leave a note..."
            // onEnter={this.props.submitOnEnter ? this._handleSaveNote : null}
            value={content}
          />
          <div className="yt-row right">
            <button className="yt-btn xx-small info" onClick={this._handleSaveNote} disabled={!content || content.trim().length < 2 || submitting}>Comment</button>
          </div>
        </div> 
        <hr/>
      </div>
    )
  }
}

NewNoteInput.propTypes = {
  dispatch: PropTypes.func.isRequired
  , defaultNote: PropTypes.object
  , noteId: PropTypes.string // not used yet. In the future it will allow editing a note.
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
    defaultNote: store.note.defaultItem.obj
    , loggedInUser: store.user.loggedIn.user
  }
}

export default connect(mapStoreToProps)(NewNoteInput)
