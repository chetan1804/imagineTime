/**
 * View component for /admin/tags/new
 *
 * Creates a new tag from a copy of the defaultItem in the tag reducer
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

class AdminCreateTag extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      tag: _.cloneDeep(this.props.defaultTag.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
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
    const { dispatch } = this.props;
    dispatch(tagActions.fetchDefaultTag());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      tag: _.cloneDeep(nextProps.defaultTag.obj)

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
    dispatch(tagActions.sendCreateTag(this.state.tag)).then(tagRes => {
      if(tagRes.success) {
        dispatch(tagActions.invalidateList());
        history.push(`/admin/tags/${tagRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { tag, formHelpers } = this.state;
    const isEmpty = !tag;
    return (
      <AdminTagLayout>
        <Helmet><title>Admin Create Tag</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminTagForm
            tag={tag}
            cancelLink="/admin/tags"
            formHelpers={formHelpers}
            formTitle="Create Tag"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminTagLayout>
    )
  }
}

AdminCreateTag.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultTag: store.tag.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateTag)
);
