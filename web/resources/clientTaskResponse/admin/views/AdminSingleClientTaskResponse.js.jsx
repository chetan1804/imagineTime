/**
 * View component for /admin/client-task-responses/:clientTaskResponseId
 *
 * Displays a single clientTaskResponse from the 'byId' map in the clientTaskResponse reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as clientTaskResponseActions from '../../clientTaskResponseActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientTaskResponseLayout from '../components/AdminClientTaskResponseLayout.js.jsx';


class AdminSingleClientTaskResponse extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientTaskResponseActions.fetchSingleIfNeeded(match.params.clientTaskResponseId));
  }

  render() {
    const { location, clientTaskResponseStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual clientTaskResponse object from the map
     */
    const selectedClientTaskResponse = clientTaskResponseStore.selected.getItem();

    const isEmpty = (
      !selectedClientTaskResponse
      || !selectedClientTaskResponse._id
      || clientTaskResponseStore.selected.didInvalidate
    );

    const isFetching = (
      clientTaskResponseStore.selected.isFetching
    )

    return (
      <AdminClientTaskResponseLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single ClientTask Response </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedClientTaskResponse.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the ClientTaskResponse would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update ClientTask Response </Link>
          </div>
        }
      </AdminClientTaskResponseLayout>
    )
  }
}

AdminSingleClientTaskResponse.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientTaskResponseStore: store.clientTaskResponse
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleClientTaskResponse)
);
