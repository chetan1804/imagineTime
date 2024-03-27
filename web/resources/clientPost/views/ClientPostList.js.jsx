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

// import actions
import * as clientPostActions from '../clientPostActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import ClientPostLayout from '../components/ClientPostLayout.js.jsx';
import ClientPostListItem from '../components/ClientPostListItem.js.jsx';

class ClientPostList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(clientPostActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { clientPostStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the clientPostList meta info here so we can reference 'isFetching'
    const clientPostList = clientPostStore.lists ? clientPostStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual clientPost objetcs
     */
    const clientPostListItems = clientPostStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientPostListItems
      || !clientPostList
    );

    const isFetching = (
      !clientPostListItems
      || !clientPostList
      || clientPostList.isFetching
    )

    return (
      <ClientPostLayout>
        <h1> Client Post List </h1>
        <hr/>
        <Link to={'/client-posts/new'}> New Client Post </Link>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ul>
              {clientPostListItems.map((clientPost, i) =>
                <ClientPostListItem key={clientPost._id + i} clientPost={clientPost} />
              )}
            </ul>
          </div>
        }
      </ClientPostLayout>
    )
  }
}

ClientPostList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientPostStore: store.clientPost
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientPostList)
);
