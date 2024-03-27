/**
 * View component for /client-task-templates/new
 *
 * Creates a new clientTaskTemplate from a copy of the defaultItem in the clientTaskTemplate reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientTaskTemplateActions from '../clientTaskTemplateActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';

// import clientTaskTemplate components
import ClientTaskTemplateForm from '../components/ClientTaskTemplateForm.js.jsx';
import ClientTaskTemplateLayout from '../components/ClientTaskTemplateLayout.js.jsx';

class CreateClientTaskTemplate extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      formHelpers: {}
      , clientTaskTemplate: _.cloneDeep(this.props.defaultClientTaskTemplate.obj)
      // NOTE: ^ We don't want to actually change the store's defaultItem, just use a copy
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(clientTaskTemplateActions.fetchDefaultClientTaskTemplate());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientTaskTemplate: _.cloneDeep(nextProps.defaultClientTaskTemplate.obj)
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
    dispatch(clientTaskTemplateActions.sendCreateClientTaskTemplate(this.state.clientTaskTemplate)).then(clientTaskTemplateRes => {
      if(clientTaskTemplateRes.success) {
        dispatch(clientTaskTemplateActions.invalidateList("all"));
        history.push(`/client-task-templates/${clientTaskTemplateRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location } = this.props;
    const { clientTaskTemplate } = this.state;
    const isEmpty = !clientTaskTemplate;
    return (
      <ClientTaskTemplateLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        {isEmpty ?
          <h2> Loading...</h2>
          :
          <ClientTaskTemplateForm
            clientTaskTemplate={clientTaskTemplate}
            cancelLink="/clientTaskTemplates"
            formTitle="Create ClientTaskTemplate"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </ClientTaskTemplateLayout>
    )
  }
}

CreateClientTaskTemplate.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultClientTaskTemplate: store.clientTaskTemplate.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateClientTaskTemplate)
);
