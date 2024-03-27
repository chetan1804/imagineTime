/**
 * View component for /admin/client-workflow-templates/new
 *
 * Creates a new clientWorkflowTemplate from a copy of the defaultItem in the clientWorkflowTemplate reducer
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
import * as clientWorkflowTemplateActions from '../../clientWorkflowTemplateActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientWorkflowTemplateForm from '../components/AdminClientWorkflowTemplateForm.js.jsx';
import AdminClientWorkflowTemplateLayout from '../components/AdminClientWorkflowTemplateLayout.js.jsx';

class AdminCreateClientWorkflowTemplate extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      clientWorkflowTemplate: _.cloneDeep(this.props.defaultClientWorkflowTemplate.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the clientWorkflowTemplate
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(clientWorkflowTemplateActions.fetchDefaultClientWorkflowTemplate());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientWorkflowTemplate: _.cloneDeep(nextProps.defaultClientWorkflowTemplate.obj)
    });
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
    dispatch(clientWorkflowTemplateActions.sendCreateClientWorkflowTemplate(this.state.clientWorkflowTemplate)).then(clientWorkflowTemplateRes => {
      if(clientWorkflowTemplateRes.success) {
        dispatch(clientWorkflowTemplateActions.invalidateList());
        history.push(`/admin/client-workflow-templates/${clientWorkflowTemplateRes.item._id}/update`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { clientWorkflowTemplate, formHelpers } = this.state;
    const isEmpty = !clientWorkflowTemplate;
    return (
      <AdminClientWorkflowTemplateLayout>
        <Helmet><title>Admin Create Workflow Template</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminClientWorkflowTemplateForm
            clientWorkflowTemplate={clientWorkflowTemplate}
            cancelLink="/admin/client-workflow-templates"
            formHelpers={formHelpers}
            formTitle="Create ClientWorkflow Template"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminClientWorkflowTemplateLayout>
    )
  }
}

AdminCreateClientWorkflowTemplate.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultClientWorkflowTemplate: store.clientWorkflowTemplate.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateClientWorkflowTemplate)
);
