/**
 * View component for /admin/share-links/:shareLinkId/update
 *
 * Updates a single shareLink from a copy of the selcted shareLink
 * as defined in the shareLink reducer
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

class AdminUpdateShareLink extends Binder {
  constructor(props) {
    super(props);
    const { match, shareLinkStore } = this.props;
    this.state = {
      shareLink: shareLinkStore.byId[match.params.shareLinkId] ?  _.cloneDeep(shareLinkStore.byId[match.params.shareLinkId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
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
    const { dispatch, match } = this.props;
    dispatch(shareLinkActions.fetchSingleIfNeeded(match.params.shareLinkId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, shareLinkStore } = nextProps;
    this.setState({
      shareLink: shareLinkStore.byId[match.params.shareLinkId] ?  _.cloneDeep(shareLinkStore.byId[match.params.shareLinkId]) : {}
      // NOTE: ^ we don't want to actually change the store's shareLink, just use a copy
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
    dispatch(shareLinkActions.sendUpdateShareLink(this.state.shareLink)).then(shareLinkRes => {
      if(shareLinkRes.success) {
        history.push(`/admin/share-links/${shareLinkRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , shareLinkStore
    } = this.props;
    const { shareLink, formHelpers } = this.state;

    const selectedShareLink = shareLinkStore.selected.getItem();

    const isEmpty = (
      !shareLink
      || !shareLink._id
    );

    const isFetching = (
      !shareLinkStore.selected.id
      || shareLinkStore.selected.isFetching
    )

    return  (
      <AdminShareLinkLayout>
        <Helmet><title>Admin Update Share Link</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminShareLinkForm
            shareLink={shareLink}
            cancelLink={`/admin/share-links/${shareLink._id}`}
            formHelpers={formHelpers}
            formTitle="Update Share Link"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminShareLinkLayout>
    )
  }
}

AdminUpdateShareLink.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    shareLinkStore: store.shareLink
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateShareLink)
);
