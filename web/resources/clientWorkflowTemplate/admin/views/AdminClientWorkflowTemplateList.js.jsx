/**
 * View component for /admin/client-workflow-templates
 *
 * Generic clientWorkflowTemplate list view. Defaults to 'all' with:
 * this.props.dispatch(clientWorkflowTemplateActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as clientWorkflowTemplateActions from '../../clientWorkflowTemplateActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientWorkflowTemplateLayout from '../components/AdminClientWorkflowTemplateLayout.js.jsx';
import AdminClientWorkflowTemplateListItem from '../components/AdminClientWorkflowTemplateListItem.js.jsx';

class ClientWorkflowTemplateList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(clientWorkflowTemplateActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, clientWorkflowTemplateStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the clientWorkflowTemplateList meta info here so we can reference 'isFetching'
    const clientWorkflowTemplateList = clientWorkflowTemplateStore.lists ? clientWorkflowTemplateStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual clientWorkflowTemplate objetcs
     */
    const clientWorkflowTemplateListItems = clientWorkflowTemplateStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientWorkflowTemplateListItems
      || !clientWorkflowTemplateList
    );

    const isFetching = (
      !clientWorkflowTemplateListItems
      || !clientWorkflowTemplateList
      || clientWorkflowTemplateList.isFetching
    )

    return (
      <AdminClientWorkflowTemplateLayout>
        <Helmet><title>Admin Workflow Template List</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> ClientWorkflow Template List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/client-workflow-templates/new'}> New ClientWorkflow Template</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clientWorkflowTemplateListItems.map((clientWorkflowTemplate, i) =>
                    <AdminClientWorkflowTemplateListItem key={clientWorkflowTemplate._id + i} clientWorkflowTemplate={clientWorkflowTemplate} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminClientWorkflowTemplateLayout>
    )
  }
}

ClientWorkflowTemplateList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientWorkflowTemplateStore: store.clientWorkflowTemplate
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientWorkflowTemplateList)
);
