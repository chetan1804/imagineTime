/**
 * View component for /admin/tags/:tagId/update
 *
 * Updates a single tag from a copy of the selcted tag
 * as defined in the tag reducer
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
import * as tagActions from '../../tagActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminTagForm from '../components/AdminTagForm.js.jsx';
import AdminTagLayout from '../components/AdminTagLayout.js.jsx';

class AdminUpdateTag extends Binder {
  constructor(props) {
    super(props);
    const { match, tagStore } = this.props;
    this.state = {
      tag: tagStore.byId[match.params.tagId] ?  _.cloneDeep(tagStore.byId[match.params.tagId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the tag
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(tagActions.fetchSingleIfNeeded(match.params.tagId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, tagStore } = nextProps;
    this.setState({
      tag: tagStore.byId[match.params.tagId] ?  _.cloneDeep(tagStore.byId[match.params.tagId]) : {}
      // NOTE: ^ we don't want to actually change the store's tag, just use a copy
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
    dispatch(tagActions.sendUpdateTag(this.state.tag)).then(tagRes => {
      if(tagRes.success) {
        history.push(`/admin/tags/${tagRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , tagStore
    } = this.props;
    const { tag, formHelpers } = this.state;

    const selectedTag = tagStore.selected.getItem();

    const isEmpty = (
      !tag
      || !tag._id
    );

    const isFetching = (
      !tagStore.selected.id
      || tagStore.selected.isFetching
    )

    return  (
      <AdminTagLayout>
        <Helmet><title>Admin Update Tag</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminTagForm
            tag={tag}
            cancelLink={`/admin/tags/${tag._id}`}
            formHelpers={formHelpers}
            formTitle="Update Tag"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </AdminTagLayout>
    )
  }
}

AdminUpdateTag.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    tagStore: store.tag
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateTag)
);
