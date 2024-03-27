/**
 * View component for /notes/:noteId
 *
 * Displays a single note from the 'byId' map in the note reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as noteActions from '../noteActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import NoteLayout from '../components/NoteLayout.js.jsx';


class SingleNote extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(noteActions.fetchSingleIfNeeded(match.params.noteId));
  }

  render() {
    const { noteStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual note object from the map
     */
    const selectedNote = noteStore.selected.getItem();

    const isEmpty = (
      !selectedNote
      || !selectedNote._id
      || noteStore.selected.didInvalidate
    );

    const isFetching = (
      noteStore.selected.isFetching
    )

    return (
      <NoteLayout>
        <h3> Single Note </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedNote.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the Note would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Note </Link>
          </div>
        }
      </NoteLayout>
    )
  }
}

SingleNote.propTypes = {
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
  )(SingleNote)
);
