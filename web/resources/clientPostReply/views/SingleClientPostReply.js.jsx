/**
 * View component for /client-post-replies/:clientPostReplyId
 *
 * Displays a single clientPostReply from the 'byId' map in the clientPostReply reducer
 * as defined by the 'selected' property
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


class SingleClientPostReply extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientPostReplyActions.fetchSingleIfNeeded(match.params.clientPostReplyId));
  }

  render() {
    const { clientPostReplyStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual clientPostReply object from the map
     */
    const selectedClientPostReply = clientPostReplyStore.selected.getItem();

    const isEmpty = (
      !selectedClientPostReply
      || !selectedClientPostReply._id
      || clientPostReplyStore.selected.didInvalidate
    );

    const isFetching = (
      clientPostReplyStore.selected.isFetching
    )

    return (
      <ClientPostReplyLayout>
        <h3> Single Client Post Reply </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedClientPostReply.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the ClientPostReply would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Client Post Reply </Link>
          </div>
        }
      </ClientPostReplyLayout>
    )
  }
}

SingleClientPostReply.propTypes = {
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
  )(SingleClientPostReply)
);
