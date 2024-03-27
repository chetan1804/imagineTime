/**
 * View component for /admin/share-links/new
 *
 * Creates a new shareLink from a copy of the defaultItem in the shareLink reducer
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
import * as shareLinkActions from '../../shareLinkActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminShareLinkForm from '../components/AdminShareLinkForm.js.jsx';
import AdminShareLinkLayout from '../components/AdminShareLinkLayout.js.jsx';

class AdminCreateShareLink extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      shareLink: _.cloneDeep(this.props.defaultShareLink.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the shareLink
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(shareLinkActions.fetchDefaultShareLink());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      shareLink: _.cloneDeep(nextProps.defaultShareLink.obj)

    })
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(shareLinkActions.sendCreateShareLink(this.state.shareLink)).then(shareLinkRes => {
      if(shareLinkRes.success) {
        dispatch(shareLinkActions.invalidateList());
        history.push(`/admin/share-links/${shareLinkRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { shareLink, formHelpers } = this.state;
    const isEmpty = (!shareLink || shareLink.name === null || shareLink.name === undefined);
    return (
      <AdminShareLinkLayout>
        <Helmet><title>Admin Create Share Link</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminShareLinkForm
            shareLink={shareLink}
            cancelLink="/admin/share-links"
            formHelpers={formHelpers}
            formTitle="Create Share Link"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminShareLinkLayout>
    )
  }
}

AdminCreateShareLink.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultShareLink: store.shareLink.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateShareLink)
);
