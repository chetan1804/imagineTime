
/**
 * View component for /client-workflows/:clientWorkflowId
 *
 * Displays a single clientWorkflow from the 'byId' map in the clientWorkflow reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientTaskActions from '../../../clientTask/clientTaskActions';
import * as clientTaskResponseActions from '../../../clientTaskResponse/clientTaskResponseActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as clientWorkflowActions from '../../clientWorkflowActions';
import * as fileActions from '../../../file/fileActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as tagActions from '../../../tag/tagActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import PortalLayout from '../../../../global/portal/components/PortalLayout.js.jsx';

// import utils
import routeUtils from '../../../../global/utils/routeUtils';

// import resource components
import PortalClientTaskViewer from '../../../clientTask/portal/components/PortalClientTaskViewer.js.jsx';


class SingleClientClientWorkflow extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewing: 'tasks'
      , refetch: null
      , submitting: false
    }
    this._bind(
      '_handleFinalizeSignature'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props
    let clientTaskId = routeUtils.objectFromQueryString(this.props.location.search)['clientTask']
    if(clientTaskId) {
      // This means we were just redirected from signing a document.
      let envelopeStatus = routeUtils.objectFromQueryString(this.props.location.search)['envelopeStatus']
      if(envelopeStatus) {
        this._handleFinalizeSignature(clientTaskId, envelopeStatus)
      }
    }
    // fetch a list of your choice
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
        dispatch(staffActions.fetchListIfNeeded('_firm', clientRes.item._firm));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', clientRes.item._firm));
      }
    })
    // TODO:  Make this dynamic 
    dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));
    
    dispatch(clientWorkflowActions.fetchSingleIfNeeded(match.params.clientWorkflowId));
    dispatch(clientWorkflowActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
    dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
    dispatch(clientTaskResponseActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
    // dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    // dispatch(tagActions.fetchListIfNeeded('~client', match.params.clientId))
  }

  componentDidUpdate(prevProps, prevState) {
    const { dispatch, match } = this.props;
    if(prevProps.match.params.clientWorkflowId !== match.params.clientWorkflowId || this.state.refetch) {
      dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));
      dispatch(clientWorkflowActions.fetchSingleIfNeeded(match.params.clientWorkflowId));
      dispatch(clientWorkflowActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
      dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
      dispatch(clientTaskResponseActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
      this.setState({
        refetch: false
      })
    }
  }

  _handleFinalizeSignature(clientTaskId, envelopeStatus) {
    const { dispatch, history, loggedInUser, match } = this.props;
    this.setState({ submitting: true })
    if(envelopeStatus === "EnvelopeCompleted") {
      dispatch(clientTaskActions.sendFinalizeSignature(clientTaskId)).then(clientTaskRes => {
        if(!clientTaskRes.success) {
          alert("Error finalizing signature. Please refresh the page and try again.")
        } else {
          dispatch(clientTaskActions.invalidateList('_clientWorkflow', match.params.clientWorkflowId))
          dispatch(clientTaskResponseActions.invalidateList('_clientWorkflow', match.params.clientWorkflowId))
          dispatch(fileActions.invalidateList('~client', match.params.clientId));
          // The component is about to update. Set refetch to true so componentDidUpdate knows to refetch.
          this.setState({
            refetch: true
            , submitting: false
          }, () => history.push(match.url))
        }
      });
    } else {
      // The document still requires at least one signature. Create a task response here via the regular mechanism since the above method tries to download a completed document.
      let newClientTaskResponse = {
        _user: loggedInUser._id
        , _clientTask: clientTaskId 
        , _clientWorkflow: match.params.clientWorkflowId
      }
      dispatch(clientTaskResponseActions.sendCreateClientTaskResponse(newClientTaskResponse)).then(trRes => {
        dispatch(clientTaskResponseActions.invalidateList('_clientWorkflow', match.params.clientWorkflowId));
        this.setState({
          refetch: true
          , submitting: false
        }, () => history.push(match.url))
      })
    }
  }

  render() {
    const {
      clientStore 
      , clientNoteStore
      , clientTaskResponseStore
      , clientTaskStore
      , clientUserStore 
      , clientWorkflowStore
      , firmStore
      , location 
      , loggedInUser
      , match
      , staffStore 
      , staffClientStore 
      , tagStore
      , userStore 
    } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual clientWorkflow object from the map
     */
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const selectedClientWorkflow = clientWorkflowStore.selected.getItem();

    const clientTaskListItems = clientTaskStore.util.getList('_clientWorkflow', match.params.clientWorkflowId);
    // Filter out clientTasks with a status of 'draft' so that they aren't included in the progress percent calculation.
    const activeClientTaskListItems = clientTaskListItems ? clientTaskListItems.filter(clientTask => clientTask.status !== 'draft') : [];
    // Filter out clientTasks that have a status other than 'completed'.
    const completeClientTaskListItems = activeClientTaskListItems ? activeClientTaskListItems.filter(clientTask => clientTask.status === 'completed') : []

    const clientTaskResponseList = clientTaskResponseStore.lists && clientTaskResponseStore.lists._clientWorkflow ? clientTaskResponseStore.lists._clientWorkflow[match.params.clientWorkflowId] : null;
    const clientTaskResponseListItems = clientTaskResponseStore.util.getList("_clientWorkflow", match.params.clientWorkflowId);

    const groupedResponses = clientTaskResponseListItems ? _.groupBy(clientTaskResponseListItems, '_clientTask') : {};
    // console.log(groupedResponses);

    const isEmpty = (
      clientStore.selected.didInvalidate
      || clientWorkflowStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || !selectedClientWorkflow
      || !selectedClientWorkflow._id
    );

    const isFetching = (
      clientWorkflowStore.selected.isFetching
      || firmStore.selected.isFetching
      || clientStore.selected.isFetching
      || this.state.submitting
    )

    const progressPercent = !selectedClientWorkflow ? 0 : Math.floor(completeClientTaskListItems.length / activeClientTaskListItems.length) * 100;

    let progressClass = classNames(
      `progress-bar-${progressPercent || 0}`
    )

    return (
      <PortalLayout>
        <Helmet><title>Workflow details</title></Helmet>
        <Link className="-back-link" to={`/portal/${match.params.clientId}/client-workflows`}>
          <span className="-icon"><i className="fal fa-angle-left"/> </span> Back to tasks
        </Link>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <em>Client workflow not found.</em>
          )
          :
          selectedClientWorkflow.status === 'published' ?
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedClientWorkflow.title }</h1>
            <hr/>
            <p> { selectedClientWorkflow.description} </p>
            <div className="-portal-content">
              <div className="yt-row with-gutters space-between">
                <div className="yt-col full s_60 m_50">
                  <div className="-client-workflow-info">
                    { selectedClientWorkflow.dueDate ?
                      <div className="-due-date">
                        <div className="-icon">
                          <i className="fal fa-calendar fa-lg"/>
                        </div>
                          <div className="-text">
                            <strong>Due Date</strong> 
                            <p className="-date">{DateTime.fromISO(selectedClientWorkflow.dueDate).toRelative()}</p>
                          </div>
                      </div> 
                      :
                      null 
                    }
                    <p><small>Completed {completeClientTaskListItems.length} of {activeClientTaskListItems.length} </small></p>
                    <div className={progressClass} >
                      <div className="-progress">
                        <div className="-complete">
                        </div>
                      </div>
                    </div>

                    {/* { taskListItems && Object.keys(groupedResponses).length == taskListItems.length ? */}
                    {/* { progressPercent == 100 && selectedClientWorkflow.status === 'published' ?
                      <div className="yt-row space-between center-vert" style={{marginTop: "8px"}}>
                        <button className="yt-btn bordered x-small info" onClick={this._handleSubmitForReview}>Submit for review</button>
                      </div>
                      :
                      null 
                    }  */}
                  </div>
                  { this.state.viewing === 'tasks' ? 
                    <div className="-task-wrapper">
                      { selectedClientWorkflow.items && selectedClientWorkflow.items.length > 0 ?
                        // selectedClientWorkflow.items.map((item, i) => {
                        //   console.log('item', item);
                        //   return <div key={'item_' + i}>{i}</div>
                        // })

                        selectedClientWorkflow.items.map((item, i) => 
                          <div key={item._clientTask ? item._clientTask + '_' + i : item._clientWorkflow + '_' + i}>
                            { item._clientTask && clientTaskStore.byId[item._clientTask] && clientTaskStore.byId[item._clientTask].status !== 'draft' ?
                              <PortalClientTaskViewer
                                clientWorkflowStatus={selectedClientWorkflow.status}
                                clientTask={clientTaskStore.byId[item._clientTask]}
                                clientTaskResponses={groupedResponses[item._clientTask]}
                              />
                              :
                              item._clientWorkflow ?
                              <Link to={`/portal/${match.params.clientId}/client-workflows/${item._clientWorkflow}`}>{clientWorkflowStore.byId[item._clientWorkflow] ? clientWorkflowStore.byId[item._clientWorkflow].title : 'Sub-task' }</Link>
                              :
                              null
                            }
                          </div>
                        )
                        :
                        <em>No tasks yet</em>
                      }
                    </div>
                    :
                    <div className="-notes -task-notes">
                      <p className="u-muted"><em>Notes</em></p>
                    </div>
                  }
                </div>
                <div className="yt-col full s_40 m_25 portal-info-helper">
                  <div className="-content-box">
                    <div className="-icon">
                      <i className="fal fa-lightbulb-on"/>
                    </div>
                    <p>Automated Requests are a collection of action items between you and the {selectedFirm ? selectedFirm.name : null} team. They provide you with an easy way to understand exactly what you need to deliver and when you need to deliver it.</p>
                  </div>
                  {/* <div className="-need-help" style={{marginTop: '32px'}}>
                    <p className="u-centerText">Need help?</p>
                    <button className="yt-btn bordered block x-small info">Schedule a call</button>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
          :
          <div>
            <h1>Oops!</h1>
            <hr/>
            <p>This clientWorkflow is no longer available.</p>
          </div>
        }
      </PortalLayout>
    )
  }
}

SingleClientClientWorkflow.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientStore: store.client
    , clientNoteStore: store.clientNote
    , clientTaskResponseStore: store.clientTaskResponse
    , clientTaskStore: store.clientTask 
    , clientUserStore: store.clientUser
    , clientWorkflowStore: store.clientWorkflow
    , fileStore: store.file
    , firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff
    , staffClientStore: store.staffClient
    , tagStore: store.tag
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SingleClientClientWorkflow)
);
