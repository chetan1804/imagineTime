/**
 * View component for /quick-tasks/new
 *
 * Creates a new quickTask from a copy of the defaultItem in the quickTask reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as quickTaskActions from '../quickTaskActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';

// import quickTask components
import QuickTaskForm from '../components/QuickTaskForm.js.jsx';
import QuickTaskLayout from '../components/QuickTaskLayout.js.jsx';

class CreateQuickTask extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      formHelpers: {}
      , quickTask: _.cloneDeep(this.props.defaultQuickTask.obj)
      // NOTE: ^ We don't want to actually change the store's defaultItem, just use a copy
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(quickTaskActions.fetchDefaultQuickTask());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      quickTask: _.cloneDeep(nextProps.defaultQuickTask.obj)
    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    const newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(quickTaskActions.sendCreateQuickTask(this.state.quickTask)).then(quickTaskRes => {
      if(quickTaskRes.success) {
        dispatch(quickTaskActions.invalidateList("all"));
        history.push(`/quick-tasks/${quickTaskRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location } = this.props;
    const { quickTask } = this.state;
    const isEmpty = !quickTask;
    return (
      <QuickTaskLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        {isEmpty ?
          <h2> Loading...</h2>
          :
          <QuickTaskForm
            quickTask={quickTask}
            cancelLink="/quickTasks"
            formTitle="Create QuickTask"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </QuickTaskLayout>
    )
  }
}

CreateQuickTask.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultQuickTask: store.quickTask.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateQuickTask)
);
