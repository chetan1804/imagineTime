/**
 * View component for /notes/new
 *
 * Creates a new note from a copy of the defaultItem in the note reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as noteActions from '../noteActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';

// import note components
import NoteForm from '../components/NoteForm.js.jsx';
import NoteLayout from '../components/NoteLayout.js.jsx';

class CreateNote extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      formHelpers: {}
      , note: _.cloneDeep(this.props.defaultNote.obj)
      // NOTE: ^ We don't want to actually change the store's defaultItem, just use a copy
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(noteActions.fetchDefaultNote());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      note: _.cloneDeep(nextProps.defaultNote.obj)
    })
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
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(noteActions.sendCreateNote(this.state.note)).then(noteRes => {
      if(noteRes.success) {
        dispatch(noteActions.invalidateList("all"));
        history.push(`/notes/${noteRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location } = this.props;
    const { note } = this.state;
    const isEmpty = !note;
    return (
      <NoteLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        {isEmpty ?
          <h2> Loading...</h2>
          :
          <NoteForm
            note={note}
            cancelLink="/notes"
            formTitle="Create Note"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </NoteLayout>
    )
  }
}

CreateNote.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultNote: store.note.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateNote)
);
