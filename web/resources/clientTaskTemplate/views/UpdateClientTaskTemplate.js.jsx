/**
 * View component for /client-task-templates/:clientTaskTemplateId/update
 *
 * Updates a single clientTaskTemplate from a copy of the selcted clientTaskTemplate
 * as defined in the clientTaskTemplate reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientTaskTemplateActions from '../clientTaskTemplateActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import ClientTaskTemplateForm from '../components/ClientTaskTemplateForm.js.jsx';
import ClientTaskTemplateLayout from '../components/ClientTaskTemplateLayout.js.jsx';

class UpdateClientTaskTemplate extends Binder {
  constructor(props) {
    super(props);
    const { match, clientTaskTemplateStore } = this.props;
    this.state = {
      clientTaskTemplate: clientTaskTemplateStore.byId[match.params.clientTaskTemplateId] ?  _.cloneDeep(clientTaskTemplateStore.byId[match.params.clientTaskTemplateId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the clientTaskTemplate
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientTaskTemplateActions.fetchSingleIfNeeded(match.params.clientTaskTemplateId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, clientTaskTemplateStore } = nextProps;
    this.setState({
      clientTaskTemplate: clientTaskTemplateStore.byId[match.params.clientTaskTemplateId] ?  _.cloneDeep(clientTaskTemplateStore.byId[match.params.clientTaskTemplateId]) : {}
      // NOTE: ^ we don't want to actually change the store's clientTaskTemplate, just use a copy
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
    dispatch(clientTaskTemplateActions.sendUpdateClientTaskTemplate(this.state.clientTaskTemplate)).then(clientTaskTemplateRes => {
      if(clientTaskTemplateRes.success) {
        history.push(`/client-task-templates/${clientTaskTemplateRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , clientTaskTemplateStore
    } = this.props;
    const { clientTaskTemplate, formHelpers } = this.state;

    const selectedClientTaskTemplate = clientTaskTemplateStore.selected.getItem();

    const isEmpty = (
      !clientTaskTemplate
      || !clientTaskTemplate._id
    );

    const isFetching = (
      !clientTaskTemplateStore.selected.id
      || clientTaskTemplateStore.selected.isFetching
    )

    return  (
      <ClientTaskTemplateLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <ClientTaskTemplateForm
            clientTaskTemplate={clientTaskTemplate}
            cancelLink={`/client-task-templates/${clientTaskTemplate._id}`}
            formHelpers={formHelpers}
            formTitle="Update Client Task Template"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </ClientTaskTemplateLayout>
    )
  }
}

UpdateClientTaskTemplate.propTypes = {
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
  )(UpdateClientTaskTemplate)
);
