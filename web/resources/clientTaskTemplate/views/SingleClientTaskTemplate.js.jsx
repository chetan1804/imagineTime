/**
 * View component for /client-task-templates/:clientTaskTemplateId
 *
 * Displays a single clientTaskTemplate from the 'byId' map in the clientTaskTemplate reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as clientTaskTemplateActions from '../clientTaskTemplateActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import ClientTaskTemplateLayout from '../components/ClientTaskTemplateLayout.js.jsx';


class SingleClientTaskTemplate extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientTaskTemplateActions.fetchSingleIfNeeded(match.params.clientTaskTemplateId));
  }

  render() {
    const { clientTaskTemplateStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual clientTaskTemplate object from the map
     */
    const selectedClientTaskTemplate = clientTaskTemplateStore.selected.getItem();

    const isEmpty = (
      !selectedClientTaskTemplate
      || !selectedClientTaskTemplate._id
      || clientTaskTemplateStore.selected.didInvalidate
    );

    const isFetching = (
      clientTaskTemplateStore.selected.isFetching
    )

    return (
      <ClientTaskTemplateLayout>
        <h3> Single Client Task Template </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedClientTaskTemplate.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the ClientTaskTemplate would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Client Task Template </Link>
          </div>
        }
      </ClientTaskTemplateLayout>
    )
  }
}

SingleClientTaskTemplate.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientTaskTemplateStore: store.clientTaskTemplate
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SingleClientTaskTemplate)
);
