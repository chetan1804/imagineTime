/**
 * View component for /client-task-templates
 *
 * Generic clientTaskTemplate list view. Defaults to 'all' with:
 * this.props.dispatch(clientTaskTemplateActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
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
import ClientTaskTemplateListItem from '../components/ClientTaskTemplateListItem.js.jsx';

class ClientTaskTemplateList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(clientTaskTemplateActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { clientTaskTemplateStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the clientTaskTemplateList meta info here so we can reference 'isFetching'
    const clientTaskTemplateList = clientTaskTemplateStore.util.getListInfo("all");

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual clientTaskTemplate objetcs
     */
    const clientTaskTemplateListItems = clientTaskTemplateStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientTaskTemplateListItems
      || !clientTaskTemplateList
    );

    const isFetching = (
      !clientTaskTemplateListItems
      || !clientTaskTemplateList
      || clientTaskTemplateList.isFetching
    )

    return (
      <ClientTaskTemplateLayout>
        <h1> Client Task Template List </h1>
        <hr/>
        <Link to={'/client-task-templates/new'}> New Client Task Template </Link>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ul>
              {clientTaskTemplateListItems.map((clientTaskTemplate, i) =>
                <ClientTaskTemplateListItem key={clientTaskTemplate._id + i} clientTaskTemplate={clientTaskTemplate} />
              )}
            </ul>
          </div>
        }
      </ClientTaskTemplateLayout>
    )
  }
}

ClientTaskTemplateList.propTypes = {
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
  )(ClientTaskTemplateList)
);
