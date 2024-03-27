/**
 * View component for /admin/client-task-responses/new
 *
 * Creates a new clientTaskResponse from a copy of the defaultItem in the clientTaskResponse reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientTaskResponseActions from '../../clientTaskResponseActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientTaskResponseForm from '../components/AdminClientTaskResponseForm.js.jsx';
import AdminClientTaskResponseLayout from '../components/AdminClientTaskResponseLayout.js.jsx';

class AdminCreateClientTaskResponse extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      clientTaskResponse: _.cloneDeep(this.props.defaultClientTaskResponse.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the clientTaskResponse
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(clientTaskResponseActions.fetchDefaultClientTaskResponse());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientTaskResponse: _.cloneDeep(nextProps.defaultClientTaskResponse.obj)

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
    dispatch(clientTaskResponseActions.sendCreateClientTaskResponse(this.state.clientTaskResponse)).then(clientTaskResponseRes => {
      if(clientTaskResponseRes.success) {
        dispatch(clientTaskResponseActions.invalidateList());
        history.push(`/admin/client-task-responses/${clientTaskResponseRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { clientTaskResponse, formHelpers } = this.state;
    const isEmpty = (!clientTaskResponse || clientTaskResponse.name === null || clientTaskResponse.name === undefined);
    return (
      <AdminClientTaskResponseLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminClientTaskResponseForm
            clientTaskResponse={clientTaskResponse}
            cancelLink="/admin/client-task-responses"
            formHelpers={formHelpers}
            formTitle="Create ClientTask Response"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminClientTaskResponseLayout>
    )
  }
}

AdminCreateClientTaskResponse.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultClientTaskResponse: store.clientTaskResponse.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateClientTaskResponse)
);
