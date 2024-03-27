/**
 * View component for /notes
 *
 * Generic note list view. Defaults to 'all' with:
 * this.props.dispatch(noteActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
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
import NoteListItem from '../components/NoteListItem.js.jsx';

class NoteList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(noteActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { noteStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the noteList meta info here so we can reference 'isFetching'
    const noteList = noteStore.lists ? noteStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual note objetcs
     */
    const noteListItems = noteStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !noteListItems
      || !noteList
    );

    const isFetching = (
      !noteListItems
      || !noteList
      || noteList.isFetching
    )

    return (
      <NoteLayout>
        <h1> Note List </h1>
        <hr/>
        <Link to={'/notes/new'}> New Note </Link>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ul>
              {noteListItems.map((note, i) =>
                <NoteListItem key={note._id + i} note={note} />
              )}
            </ul>
          </div>
        }
      </NoteLayout>
    )
  }
}

NoteList.propTypes = {
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
  )(NoteList)
);
