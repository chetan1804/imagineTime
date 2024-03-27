/**
 * View component for /quick-tasks/:quickTaskId/update
 *
 * Updates a single quickTask from a copy of the selcted quickTask
 * as defined in the quickTask reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as quickTaskActions from '../quickTaskActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import QuickTaskForm from '../components/QuickTaskForm.js.jsx';
import QuickTaskLayout from '../components/QuickTaskLayout.js.jsx';

class UpdateQuickTask extends Binder {
  constructor(props) {
    super(props);
    const { match, quickTaskStore } = this.props;
    this.state = {
      quickTask: quickTaskStore.byId[match.params.quickTaskId] ?  _.cloneDeep(quickTaskStore.byId[match.params.quickTaskId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the quickTask
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(quickTaskActions.fetchSingleIfNeeded(match.params.quickTaskId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, quickTaskStore } = nextProps;
    this.setState({
      quickTask: quickTaskStore.byId[match.params.quickTaskId] ?  _.cloneDeep(quickTaskStore.byId[match.params.quickTaskId]) : {}
      // NOTE: ^ we don't want to actually change the store's quickTask, just use a copy
    })
  }

  _handleFormChange(e) {
    const newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(quickTaskActions.sendUpdateQuickTask(this.state.quickTask)).then(quickTaskRes => {
      if(quickTaskRes.success) {
        history.push(`/quick-tasks/${quickTaskRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , quickTaskStore
    } = this.props;
    const { quickTask, formHelpers } = this.state;

    const selectedQuickTask = quickTaskStore.selected.getItem();

    const isEmpty = (
      !quickTask
      || !quickTask._id
    );

    const isFetching = (
      !quickTaskStore.selected.id
      || quickTaskStore.selected.isFetching
    )

    return  (
      <QuickTaskLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <QuickTaskForm
            quickTask={quickTask}
            cancelLink={`/quick-tasks/${quickTask._id}`}
            formHelpers={formHelpers}
            formTitle="Update Quick Task"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </QuickTaskLayout>
    )
  }
}

UpdateQuickTask.propTypes = {
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
  )(UpdateQuickTask)
);
