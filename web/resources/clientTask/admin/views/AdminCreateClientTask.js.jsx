/**
 * View component for /admin/client-tasks/new
 *
 * Creates a new task from a copy of the defaultItem in the task reducer
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

class AdminCreateClientTask extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      clientTask: _.cloneDeep(this.props.defaultClientTask.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {
        ...this.props.clientTaskStore.formHelpers
      }
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
    const { dispatch } = this.props;
    dispatch(taskActions.fetchDefaultTask());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientTask: _.cloneDeep(nextProps.defaultClientTask.obj)

    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(taskActions.sendCreateClientTask(this.state.task)).then(taskRes => {
      if(taskRes.success) {
        dispatch(taskActions.invalidateList());
        history.push(`/admin/client-tasks/${taskRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { task, formHelpers } = this.state;
    const isEmpty = (!task);
    return (
      <AdminClientTaskLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminClientTaskForm
            task={task}
            cancelLink="/admin/client-tasks"
            formHelpers={formHelpers}
            formTitle="Create ClientTask"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminClientTaskLayout>
    )
  }
}

AdminCreateClientTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultClientTask: store.clientTask.defaultItem
    , clientTaskStore: store.task
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateClientTask)
);
