/**
 * View component for /client-post-replies/:clientPostReplyId/update
 *
 * Updates a single clientPostReply from a copy of the selcted clientPostReply
 * as defined in the clientPostReply reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as clientPostReplyActions from '../clientPostReplyActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import ClientPostReplyForm from '../components/ClientPostReplyForm.js.jsx';
import ClientPostReplyLayout from '../components/ClientPostReplyLayout.js.jsx';

class UpdateClientPostReply extends Binder {
  constructor(props) {
    super(props);
    const { match, clientPostReplyStore } = this.props;
    this.state = {
      clientPostReply: clientPostReplyStore.byId[match.params.clientPostReplyId] ?  _.cloneDeep(clientPostReplyStore.byId[match.params.clientPostReplyId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the clientPostReply
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientPostReplyActions.fetchSingleIfNeeded(match.params.clientPostReplyId))
  }

  componentWillReceiveProps(nextProps) {
    const { match, clientPostReplyStore } = nextProps;
    this.setState({
      clientPostReply: clientPostReplyStore.byId[match.params.clientPostReplyId] ?  _.cloneDeep(clientPostReplyStore.byId[match.params.clientPostReplyId]) : {}
      // NOTE: ^ we don't want to actually change the store's clientPostReply, just use a copy
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
    dispatch(clientPostReplyActions.sendUpdateClientPostReply(this.state.clientPostReply)).then(clientPostReplyRes => {
      if(clientPostReplyRes.success) {
        history.push(`/client-post-replies/${clientPostReplyRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , clientPostReplyStore
    } = this.props;
    const { clientPostReply, formHelpers } = this.state;

    const selectedClientPostReply = clientPostReplyStore.selected.getItem();

    const isEmpty = (
      !clientPostReply
      || !clientPostReply._id
    );

    const isFetching = (
      !clientPostReplyStore.selected.id
      || clientPostReplyStore.selected.isFetching
    )

    return  (
      <ClientPostReplyLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <ClientPostReplyForm
            clientPostReply={clientPostReply}
            cancelLink={`/client-post-replies/${clientPostReply._id}`}
            formHelpers={formHelpers}
            formTitle="Update Client Post Reply"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
          />
        }
      </ClientPostReplyLayout>
    )
  }
}

UpdateClientPostReply.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientPostReplyStore: store.clientPostReply
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UpdateClientPostReply)
);
