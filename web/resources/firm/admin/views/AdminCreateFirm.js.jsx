/**
 * View component for /admin/firms/new
 *
 * Creates a new firm from a copy of the defaultItem in the firm reducer
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
import * as firmActions from '../../firmActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminFirmForm from '../components/AdminFirmForm.js.jsx';
import AdminFirmLayout from '../components/AdminFirmLayout.js.jsx';

class AdminCreateFirm extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      firm: _.cloneDeep(this.props.defaultFirm.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the firm
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(firmActions.fetchDefaultFirm());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      firm: _.cloneDeep(nextProps.defaultFirm.obj)

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
    const newFirm = {...this.state.firm}; 
    dispatch(firmActions.sendCreateFirm(newFirm)).then(firmRes => {
      if(firmRes.success) {
        dispatch(firmActions.invalidateList());
        history.push(`/admin/firms/${firmRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { firm, formHelpers } = this.state;
    const isEmpty = (!firm);
    return (
      <AdminFirmLayout>
        <Helmet><title>Admin Create Firm</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminFirmForm
            firm={firm}
            cancelLink="/admin/firms"
            formHelpers={formHelpers}
            formTitle="Create Firm"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminFirmLayout>
    )
  }
}

AdminCreateFirm.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultFirm: store.firm.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateFirm)
);
