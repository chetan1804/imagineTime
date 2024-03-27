/**
 * View component for /quick-tasks/:quickTaskId
 *
 * Displays a single quickTask from the 'byId' map in the quickTask reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as quickTaskActions from '../quickTaskActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import QuickTaskLayout from '../components/QuickTaskLayout.js.jsx';


class SingleQuickTask extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(quickTaskActions.fetchSingleIfNeeded(match.params.quickTaskId));
  }

  render() {
    const { quickTaskStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual quickTask object from the map
     */
    const selectedQuickTask = quickTaskStore.selected.getItem();

    const isEmpty = (
      !selectedQuickTask
      || !selectedQuickTask._id
      || quickTaskStore.selected.didInvalidate
    );

    const isFetching = (
      quickTaskStore.selected.isFetching
    )

    return (
      <QuickTaskLayout>
        <h3> Single Quick Task </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedQuickTask.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the QuickTask would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Quick Task </Link>
          </div>
        }
      </QuickTaskLayout>
    )
  }
}

SingleQuickTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    quickTaskStore: store.quickTask
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SingleQuickTask)
);
