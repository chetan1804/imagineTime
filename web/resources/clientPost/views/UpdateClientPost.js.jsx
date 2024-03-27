/**
 * View component for /client-posts/:clientPostId/update
 *
 * Updates a single clientPost from a copy of the selcted clientPost
 * as defined in the clientPost reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientPostActions from '../clientPostActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import ClientPostForm from '../components/ClientPostForm.js.jsx';
import ClientPostLayout from '../components/ClientPostLayout.js.jsx';

class UpdateClientPost extends Binder {
  constructor(props) {
    super(props);
    const { match, clientPostStore } = this.props;
    this.state = {
      clientPost: clientPostStore.byId[match.params.clientPostId] ?  _.cloneDeep(clientPostStore.byId[match.params.clientPostId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the clientPost
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientPostActions.fetchSingleIfNeeded(match.params.clientPostId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, clientPostStore } = nextProps;
    this.setState({
      clientPost: clientPostStore.byId[match.params.clientPostId] ?  _.cloneDeep(clientPostStore.byId[match.params.clientPostId]) : {}
      // NOTE: ^ we don't want to actually change the store's clientPost, just use a copy
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
    dispatch(clientPostActions.sendUpdateClientPost(this.state.clientPost)).then(clientPostRes => {
      if(clientPostRes.success) {
        history.push(`/client-posts/${clientPostRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , clientPostStore
    } = this.props;
    const { clientPost, formHelpers } = this.state;

    const selectedClientPost = clientPostStore.selected.getItem();

    const isEmpty = (
      !clientPost
      || !clientPost._id
    );

    const isFetching = (
      !clientPostStore.selected.id
      || clientPostStore.selected.isFetching
    )

    return  (
      <ClientPostLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <ClientPostForm
            clientPost={clientPost}
            cancelLink={`/client-posts/${clientPost._id}`}
            formHelpers={formHelpers}
            formTitle="Update Client Post"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </ClientPostLayout>
    )
  }
}

UpdateClientPost.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientPostStore: store.clientPost
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UpdateClientPost)
);
