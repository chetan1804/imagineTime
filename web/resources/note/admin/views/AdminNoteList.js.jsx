/**
 * View component for /admin/notes
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
import * as noteActions from '../../noteActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminNoteLayout from '../components/AdminNoteLayout.js.jsx';
import AdminNoteListItem from '../components/AdminNoteListItem.js.jsx';

class NoteList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(noteActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, noteStore } = this.props;

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
      <AdminNoteLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Note List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/notes/new'}> New Note</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {noteListItems.map((note, i) =>
                    <AdminNoteListItem key={note._id + i} note={note} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminNoteLayout>
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

  // manipulate store items here

  return {
    noteStore: store.note
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(NoteList)
);
