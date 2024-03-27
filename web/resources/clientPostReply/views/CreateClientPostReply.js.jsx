/**
 * View component for /client-post-replies/new
 *
 * Creates a new clientPostReply from a copy of the defaultItem in the clientPostReply reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientPostReplyActions from '../clientPostReplyActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';

// import clientPostReply components
import ClientPostReplyForm from '../components/ClientPostReplyForm.js.jsx';
import ClientPostReplyLayout from '../components/ClientPostReplyLayout.js.jsx';

class CreateClientPostReply extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      formHelpers: {}
      , clientPostReply: _.cloneDeep(this.props.defaultClientPostReply.obj)
      // NOTE: ^ We don't want to actually change the store's defaultItem, just use a copy
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(clientPostReplyActions.fetchDefaultClientPostReply());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      clientPostReply: _.cloneDeep(nextProps.defaultClientPostReply.obj)
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
    dispatch(clientPostReplyActions.sendCreateClientPostReply(this.state.clientPostReply)).then(clientPostReplyRes => {
      if(clientPostReplyRes.success) {
        dispatch(clientPostReplyActions.invalidateList("all"));
        history.push(`/client-post-replies/${clientPostReplyRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location } = this.props;
    const { clientPostReply } = this.state;
    const isEmpty = !clientPostReply;
    return (
      <ClientPostReplyLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        {isEmpty ?
          <h2> Loading...</h2>
          :
          <ClientPostReplyForm
            clientPostReply={clientPostReply}
            cancelLink="/clientPostReplys"
            formTitle="Create ClientPostReply"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </ClientPostReplyLayout>
    )
  }
}

CreateClientPostReply.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultClientPostReply: store.clientPostReply.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(CreateClientPostReply)
);
