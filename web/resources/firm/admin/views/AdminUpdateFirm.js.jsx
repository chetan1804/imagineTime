/**
 * View component for /admin/firms/:firmId/update
 *
 * Updates a single firm from a copy of the selcted firm
 * as defined in the firm reducer
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

class AdminUpdateFirm extends Binder {
  constructor(props) {
    super(props);
    const { match, firmStore } = this.props;
    this.state = {
      firm: firmStore.byId[match.params.firmId] ?  _.cloneDeep(firmStore.byId[match.params.firmId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
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
    const { dispatch, match } = this.props;
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, firmStore } = nextProps;
    this.setState({
      firm: firmStore.byId[match.params.firmId] ?  _.cloneDeep(firmStore.byId[match.params.firmId]) : {}
      // NOTE: ^ we don't want to actually change the store's firm, just use a copy
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
    dispatch(firmActions.sendUpdateFirm(this.state.firm)).then(firmRes => {
      if(firmRes.success) {
        history.push(`/admin/firms/${firmRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , firmStore
    } = this.props;
    const { firm, formHelpers } = this.state;

    const selectedFirm = firmStore.selected.getItem();

    const isEmpty = (
      !firm
      || !firm._id
    );

    const isFetching = (
      !firmStore.selected.id
      || firmStore.selected.isFetching
    )

    return  (
      <AdminFirmLayout>
        <Helmet><title>Admin Update Firm</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminFirmForm
            firm={firm}
            cancelLink={`/admin/firms/${firm._id}`}
            formHelpers={formHelpers}
            formTitle="Update Firm"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminFirmLayout>
    )
  }
}

AdminUpdateFirm.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateFirm)
);
