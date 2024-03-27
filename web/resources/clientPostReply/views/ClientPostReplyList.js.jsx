/**
 * View component for /client-post-replies
 *
 * Generic clientPostReply list view. Defaults to 'all' with:
 * this.props.dispatch(clientPostReplyActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as clientPostReplyActions from '../clientPostReplyActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import ClientPostReplyLayout from '../components/ClientPostReplyLayout.js.jsx';
import ClientPostReplyListItem from '../components/ClientPostReplyListItem.js.jsx';

class ClientPostReplyList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(clientPostReplyActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { clientPostReplyStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the clientPostReplyList meta info here so we can reference 'isFetching'
    const clientPostReplyList = clientPostReplyStore.lists ? clientPostReplyStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual clientPostReply objetcs
     */
    const clientPostReplyListItems = clientPostReplyStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientPostReplyListItems
      || !clientPostReplyList
    );

    const isFetching = (
      !clientPostReplyListItems
      || !clientPostReplyList
      || clientPostReplyList.isFetching
    )

    return (
      <ClientPostReplyLayout>
        <h1> Client Post Reply List </h1>
        <hr/>
        <Link to={'/client-post-replies/new'}> New Client Post Reply </Link>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ul>
              {clientPostReplyListItems.map((clientPostReply, i) =>
                <ClientPostReplyListItem key={clientPostReply._id + i} clientPostReply={clientPostReply} />
              )}
            </ul>
          </div>
        }
      </ClientPostReplyLayout>
    )
  }
}

ClientPostReplyList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientPostReplyStore: store.clientPostReply
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientPostReplyList)
);
