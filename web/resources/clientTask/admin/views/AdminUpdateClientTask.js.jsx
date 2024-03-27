/**
 * View component for /admin/client-tasks/:clientTaskId/update
 *
 * Updates a single task from a copy of the selcted task
 * as defined in the task reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as taskActions from '../../clientTaskActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientTaskForm from '../components/AdminClientTaskForm.js.jsx';
import AdminClientTaskLayout from '../components/AdminClientTaskLayout.js.jsx';

class AdminUpdateClientTask extends Binder {
  constructor(props) {
    super(props);
    const { match, clientTaskStore } = this.props;
    this.state = {
      clientTask: clientTaskStore.byId[match.params.clientTaskId] ?  _.cloneDeep(clientTaskStore.byId[match.params.clientTaskId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the task
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(taskActions.fetchSingleIfNeeded(match.params.clientTaskId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, clientTaskStore } = nextProps;
    this.setState({
      clientTask: clientTaskStore.byId[match.params.clientTaskId] ?  _.cloneDeep(clientTaskStore.byId[match.params.clientTaskId]) : {}
      // NOTE: ^ we don't want to actually change the store's task, just use a copy
    })
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(taskActions.sendUpdateClientTask(this.state.task)).then(taskRes => {
      if(taskRes.success) {
        history.push(`/admin/client-tasks/${taskRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , clientTaskStore
    } = this.props;
    const { task, formHelpers } = this.state;

    const selectedTask = clientTaskStore.selected.getItem();

    const isEmpty = (
      !task
      || !clientTask._id
    );

    const isFetching = (
      !clientTaskStore.selected.id
      || clientTaskStore.selected.isFetching
    )

    return  (
      <AdminClientTaskLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminClientTaskForm
            task={task}
            cancelLink={`/admin/client-tasks/${clientTask._id}`}
            formHelpers={formHelpers}
            formTitle="Update ClientTask"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminClientTaskLayout>
    )
  }
}

AdminUpdateClientTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    clientTaskStore: store.task
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateClientTask)
);
