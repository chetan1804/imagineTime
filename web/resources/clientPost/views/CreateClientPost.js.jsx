/**
 * View component for /client-posts/new
 *
 * Creates a new clientPost from a copy of the defaultItem in the clientPost reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientPostActions from '../clientPostActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';

// import clientPost components
import ClientPostForm from '../components/ClientPostForm.js.jsx';
import ClientPostLayout from '../components/ClientPostLayout.js.jsx';

class CreateClientPost extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      formHelpers: {}
      , clientPost: _.cloneDeep(this.props.defaultClientPost.obj)
      // NOTE: ^ We don't want to actually change the store's defaultItem, just use a copy
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(clientPostActions.fetchDefaultClientPost());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientPost: _.cloneDeep(nextProps.defaultClientPost.obj)
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
    dispatch(clientPostActions.sendCreateClientPost(this.state.clientPost)).then(clientPostRes => {
      if(clientPostRes.success) {
        dispatch(clientPostActions.invalidateList("all"));
        history.push(`/client-posts/${clientPostRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location } = this.props;
    const { clientPost } = this.state;
    const isEmpty = !clientPost;
    return (
      <ClientPostLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        {isEmpty ?
          <h2> Loading...</h2>
          :
          <ClientPostForm
            clientPost={clientPost}
            cancelLink="/clientPosts"
            formTitle="Create ClientPost"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </ClientPostLayout>
    )
  }
}

CreateClientPost.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultClientPost: store.clientPost.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateClientPost)
);
