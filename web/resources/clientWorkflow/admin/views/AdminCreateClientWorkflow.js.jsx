/**
 * View component for /admin/client-workflows/new
 *
 * Creates a new clientWorkflow from a copy of the defaultItem in the clientWorkflow reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { Helmet } from 'react-helmet'; 

// import actions
import * as clientWorkflowActions from '../../clientWorkflowActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientWorkflowForm from '../components/AdminClientWorkflowForm.js.jsx';
import AdminClientWorkflowLayout from '../components/AdminClientWorkflowLayout.js.jsx';

class AdminCreateClientWorkflow extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      clientWorkflow: _.cloneDeep(this.props.defaultClientWorkflow.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the clientWorkflow
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(clientWorkflowActions.fetchDefaultClientWorkflow());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientWorkflow: _.cloneDeep(nextProps.defaultClientWorkflow.obj)

    })
  }
  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(clientWorkflowActions.sendCreateClientWorkflow(this.state.clientWorkflow)).then(clientWorkflowRes => {
      if(clientWorkflowRes.success) {
        dispatch(clientWorkflowActions.invalidateList());
        history.push(`/admin/client-workflows/${clientWorkflowRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { clientWorkflow, formHelpers } = this.state;
    const isEmpty = (!clientWorkflow || clientWorkflow.name === null || clientWorkflow.name === undefined);
    return (
      <AdminClientWorkflowLayout>
        <Helmet><title>Admin Create Client Workflow</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminClientWorkflowForm
            clientWorkflow={clientWorkflow}
            cancelLink="/admin/client-workflows"
            formHelpers={formHelpers}
            formTitle="Create ClientWorkflow"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminClientWorkflowLayout>
    )
  }
}

AdminCreateClientWorkflow.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultClientWorkflow: store.clientWorkflow.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateClientWorkflow)
);
