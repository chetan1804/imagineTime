/**
 * View component for /notes/:noteId/update
 *
 * Updates a single note from a copy of the selcted note
 * as defined in the note reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as noteActions from '../noteActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import NoteForm from '../components/NoteForm.js.jsx';
import NoteLayout from '../components/NoteLayout.js.jsx';

class UpdateNote extends Binder {
  constructor(props) {
    super(props);
    const { match, noteStore } = this.props;
    this.state = {
      note: noteStore.byId[match.params.noteId] ?  _.cloneDeep(noteStore.byId[match.params.noteId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the note
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(noteActions.fetchSingleIfNeeded(match.params.noteId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, noteStore } = nextProps;
    this.setState({
      note: noteStore.byId[match.params.noteId] ?  _.cloneDeep(noteStore.byId[match.params.noteId]) : {}
      // NOTE: ^ we don't want to actually change the store's note, just use a copy
    })
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(noteActions.sendUpdateNote(this.state.note)).then(noteRes => {
      if(noteRes.success) {
        history.push(`/notes/${noteRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , noteStore
    } = this.props;
    const { note, formHelpers } = this.state;

    const selectedNote = noteStore.selected.getItem();

    const isEmpty = (
      !note
      || !note._id
    );

    const isFetching = (
      !noteStore.selected.id
      || noteStore.selected.isFetching
    )

    return  (
      <NoteLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <NoteForm
            note={note}
            cancelLink={`/notes/${note._id}`}
            formHelpers={formHelpers}
            formTitle="Update Note"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </NoteLayout>
    )
  }
}

UpdateNote.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    noteStore: store.note
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UpdateNote)
);
