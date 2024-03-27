/**
 * View component for /admin/client-task-responses/:clientTaskResponseId/update
 *
 * Updates a single clientTaskResponse from a copy of the selcted clientTaskResponse
 * as defined in the clientTaskResponse reducer
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

class AdminUpdateClientTaskResponse extends Binder {
  constructor(props) {
    super(props);
    const { match, clientTaskResponseStore } = this.props;
    this.state = {
      clientTaskResponse: clientTaskResponseStore.byId[match.params.clientTaskResponseId] ?  _.cloneDeep(clientTaskResponseStore.byId[match.params.clientTaskResponseId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
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
    const { dispatch, match } = this.props;
    dispatch(clientTaskResponseActions.fetchSingleIfNeeded(match.params.clientTaskResponseId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, clientTaskResponseStore } = nextProps;
    this.setState({
      clientTaskResponse: clientTaskResponseStore.byId[match.params.clientTaskResponseId] ?  _.cloneDeep(clientTaskResponseStore.byId[match.params.clientTaskResponseId]) : {}
      // NOTE: ^ we don't want to actually change the store's clientTaskResponse, just use a copy
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
    dispatch(clientTaskResponseActions.sendUpdateClientTaskResponse(this.state.clientTaskResponse)).then(clientTaskResponseRes => {
      if(clientTaskResponseRes.success) {
        history.push(`/admin/client-task-responses/${clientTaskResponseRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , clientTaskResponseStore
    } = this.props;
    const { clientTaskResponse, formHelpers } = this.state;

    const selectedClientTaskResponse = clientTaskResponseStore.selected.getItem();

    const isEmpty = (
      !clientTaskResponse
      || !clientTaskResponse._id
    );

    const isFetching = (
      !clientTaskResponseStore.selected.id
      || clientTaskResponseStore.selected.isFetching
    )

    return  (
      <AdminClientTaskResponseLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminClientTaskResponseForm
            clientTaskResponse={clientTaskResponse}
            cancelLink={`/admin/client-task-responses/${clientTaskResponse._id}`}
            formHelpers={formHelpers}
            formTitle="Update ClientTask Response"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminClientTaskResponseLayout>
    )
  }
}

AdminUpdateClientTaskResponse.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    clientTaskResponseStore: store.clientTaskResponse
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateClientTaskResponse)
);
