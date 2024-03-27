/**
 * Set up routing for all File views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Switch, withRouter  } from 'react-router-dom';
import { connect } from 'react-redux';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';
import * as requestActions from '../requestActions.js'
import * as requestTaskActions from '../../requestTask/requestTaskActions.js'

// import view
import PortalRequest from './view/PortalRequest.js.jsx';
import PortalRequestTask from './view/PortalRequestTask.js.jsx';
import PortalRequestTask2 from '../../requestTask/portal/view/PortalRequestTask.js.jsx';

class RequestPortalRouter extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      requestList: ''
      , requestTask: ''
    };
    this._bind(
      'setPathNames'
    );
  }

  componentDidMount() {
    this.setPathNames(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setPathNames(nextProps);
  }

  setPathNames(props) {
    const {dispatch, location} = props;

    const pathElements = location.pathname.split('/');
    const requestListId = pathElements.length > 4 ? parseInt(pathElements[4]) : null;
    //console.log('In componentWillReceiveProps - requestListId:', requestListId);
    if(!!requestListId) {
      dispatch(requestActions.fetchSingleIfNeeded(requestListId)).then(requestList => {
        //console.log('In componentWillReceiveProps - requestActions.fetchSingleIfNeeded - requestList:', requestList);
        this.setState({requestList: requestList.item});
      });
    }
    const requestTaskId = pathElements.length > 6 ? parseInt(pathElements[6]) : null;
    //console.log('In componentWillReceiveProps - requestTaskId:', requestTaskId);
    if(!!requestTaskId) {
      dispatch(requestTaskActions.fetchSingleIfNeeded(requestTaskId)).then(requestTask => {
        //console.log('In componentWillReceiveProps - requestTaskActions.fetchSingleIfNeeded - requestTask:', requestTask);
        this.setState({requestTask: requestTask.item});
      });
    }
  }

  render() {
    const {requestList, requestTask} = this.state;

    const requestListName = (!!requestList ? requestList.name : '');
    const requestTaskDescription = (!!requestTask ? requestTask.description : '');

    const pathElements = this.props.location.pathname.split('/');
    const clientId = pathElements[2];
    const requestListId = pathElements.length > 4 ? parseInt(pathElements[4]) : null;
    const requestTaskStatus = (!!requestTask ? requestTask.status : pathElements.length > 5 ? pathElements[5] : null);

    const { breadcrumbs } = this.props;

    return (
      <Switch>
        <YTRoute 
          breadcrumbs={[{display: 'Request Lists', path: null }]} 
          exact 
          clientUser={true} 
          path="/portal/:clientId/request" 
          component={PortalRequest}
        />
        <YTRoute 
          breadcrumbs={[{display: 'Request Lists', path: `/portal/${clientId}/request`}, {display: `${requestListName}`, path: null}]}
          exact 
          clientUser={true} 
          path="/portal/:clientId/request/:requestId/:requestTaskStatus"
          component={PortalRequestTask} 
        />
        <YTRoute 
          breadcrumbs={[{display: 'Request Lists', path: `/portal/${clientId}/request`}, {display: `${requestListName}`, path: `/portal/${clientId}/request/${requestListId}/${requestTaskStatus}`}, {display: requestTaskDescription, path: null}]}
          //breadcrumbs={breadcrumbs}
          exact
          clientUser={true}
          path="/portal/:clientId/request/:requestId/requestTask/:requestTaskId/" 
          //path="/portal/:clientId/request-task/:requestTaskId"
          component={PortalRequestTask2}
        />
        <YTRoute
          breadcrumbs={[{display: 'Request Lists', path: `/portal/${clientId}/request`}, {display: `${requestListName}`, path: `/portal/${clientId}/request/${requestListId}/${requestTaskStatus}`}, {display: requestTaskDescription, path: null}]}
          //breadcrumbs={[{ fromPortal: true }]}
          exact
          clientUser={true}
          path="/portal/:clientId/request/:requestId/requestTask/:requestTaskId/:viewingAs"
          //path="/portal/:clientId/request-task/:requestTaskId/:viewingAs"
          component={PortalRequestTask2}
        />
      </Switch>
    )
  }
}

RequestPortalRouter.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {

  let breadcrumbs = [];
  return {
      breadcrumbs
      , requestStore: store.request
      , requestTaskStore: store.requestTask
    }  
}

export default withRouter(
  connect(
  mapStoreToProps
)(RequestPortalRouter)
);
