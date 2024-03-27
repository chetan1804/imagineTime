/**
 * View component for /quick-tasks
 *
 * Generic quickTask list view. Defaults to 'all' with:
 * this.props.dispatch(quickTaskActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
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
import QuickTaskListItem from '../components/QuickTaskListItem.js.jsx';

class QuickTaskList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(quickTaskActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { quickTaskStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the quickTaskList meta info here so we can reference 'isFetching'
    const quickTaskList = quickTaskStore.util.getListInfo("all");

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual quickTask objetcs
     */
    const quickTaskListItems = quickTaskStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !quickTaskListItems
      || !quickTaskList
    );

    const isFetching = (
      !quickTaskListItems
      || !quickTaskList
      || quickTaskList.isFetching
    )

    return (
      <QuickTaskLayout>
        <h1> Quick Task List </h1>
        <hr/>
        <Link to={'/quick-tasks/new'}> New Quick Task </Link>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ul>
              {quickTaskListItems.map((quickTask, i) =>
                <QuickTaskListItem key={quickTask._id + i} quickTask={quickTask} />
              )}
            </ul>
          </div>
        }
      </QuickTaskLayout>
    )
  }
}

QuickTaskList.propTypes = {
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
  )(QuickTaskList)
);
