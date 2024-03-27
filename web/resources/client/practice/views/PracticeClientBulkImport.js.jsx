/**
 * View for route /firm/:firmId/clients/import
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import classNames from 'classnames';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import FileInput from '../../../../global/components/forms/FileInput.js.jsx';
import SelectFromObject from '../../../../global/components/forms/SelectFromObject.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import ActiveStaffListItem from '../../../staff/components/ActiveStaffListItem.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import actions
import * as clientActions from '../../clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';

// import utils
import { inviteUtils, routeUtils } from '../../../../global/utils';


// import component
import PracticeClientImportResult from '../components/PracticeClientImportResult.js.jsx';
import ClientNotificationForm from '../../../notification/components/ClientNotificationForm.js.jsx';
import StaffNotificationForm from '../../../notification/components/StaffNotificationForm.js.jsx';

class PracticeClientBulkImport extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      bulkClientObj: null
      , progressPercent: 0
      , responseData: {} 
      , submitting: false
      , isOpen: true
      , unhandledErrors: null
      , warningModal: false
      , isNotificationSetting: false
      , clientNotification: {
        sN_upload: true
        , sN_viewed: true
        , sN_downloaded: true
        , sN_sendMessage: true
        , sN_leaveComment: true
        , sN_autoSignatureReminder: true
      }
      , staffNotification: {
        sN_upload: true
        , sN_viewed: true
        , sN_downloaded: true
        , sN_leaveComment: true
        , sN_sendMessage: true
        , sN_viewSignatureRequest: true
        , sN_signingCompleted: true
        , sN_autoSignatureReminder: true
      }
      , checkAll: true
      , staffClientArgs: { _firm: props.match.params.firmId, '~staff.status': "active" }
      , assignedStaffUser: {}
      , setStaff: false


      , step: 'import-client'
      , selectedStaffIds: []
    }
    this._bind(
      '_close'
      , '_exportErrorReport'
      , '_exportResultsReport'
      , '_handleFilesChange'
      , '_handleInviteClients'
      , '_startOver'
      , '_handleCheckBox'
      , '_handleFormChange'
      , '_handleNotificationChange'
    );
    this._unmounted = true;
  }

  componentDidMount() {
    const { dispatch, match, socket, loggedInUser } = this.props;

    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    const staffClientArgs = routeUtils.listArgsFromObject(this.state.staffClientArgs);
    dispatch(staffClientActions.fetchListIfNeeded(...staffClientArgs));
    dispatch(staffClientActions.fetchDefaultStaffClient());

    // To make the upload progress meter work this component needs to listen for specific socket events.
    socket.on('upload_status', progressPercent => {
      this.setState({
        progressPercent: progressPercent
        , step: 'progress'
      })
    });

    socket.on('finish_upload', stats => {
      console.log("finish_uploadstats", stats)
      this.setState({ 
        progressPercent: 100
        , submitting: false
        , responseData: stats
        , step: 'import-result'
      });
      dispatch(clientActions.invalidateList('_firm', match.params.firmId, 'status', 'visible'));
      dispatch(clientActions.invalidateList('engagement-types', match.params.firmId));
      dispatch(userActions.invalidateList('_firm', match.params.firmId));
    });

    socket.on('upload_error', error => {
      // console.log('UPLOAD ERROR', error);
      this.setState({
        submitting: false
      })
      alert(error)
      this._close()
    });
    
  }

  componentWillUnmount() {
    // Remove event listeners
    this._unmounted = false;
    const { socket, dispatch, match } = this.props;
    socket.off('upload_status');
    socket.off('finish_upload');
    socket.off('upload_error');
    dispatch(clientActions.fetchList('_firm', match.params.firmId));
    dispatch(userActions.fetchList('_firm', match.params.firmId));
    dispatch(clientUserActions.fetchList('_firm', match.params.firmId));
    // dispatch(staffClientActions.fetchListIfNeeded('_firm', match.params.firmId, '~staff.status', 'active'));
  }

  _handleFilesChange(files) {
    const { match } = this.props;
    // set state to submitting
    this.setState({
      step: 'preparing'
    });
    let submitObj = {};
    submitObj.firmId = match.params.firmId
    let file = files[0];
    // create new reader variable
    let reader = new FileReader();
    // when a file is loaded run this function
    reader.onload = () => {
      // call util function for our submitObj
      console.log('reader.result', reader.result);
      const bulkClientObj = inviteUtils.getCSVSubmitObj(reader.result, submitObj);
      console.log("bulkClientObj", bulkClientObj)
      // check if our util was successful
      if(bulkClientObj.success) {
        this.setState({
          bulkClientObj
          , step: 'import-review'
          , unhandledErrors: bulkClientObj.errors && bulkClientObj.errors.length > 0 ? true : false
        });
      } else if (bulkClientObj && bulkClientObj.newClients) {
        // show alert message
        alert(bulkClientObj.message);
        // set state to stop loading
        this.setState({ step: 'import-review' });
      } else {
        alert(bulkClientObj.message);
        this.setState({ step: 'import-client' });
      }
    }
    // start reading the file. When it is done, calls the onload event defined above.
    reader.readAsBinaryString(file);
  }

  _handleInviteClients(uploadOnly) {
    this.setState({ step: 'submitting' });
    const { 
      dispatch
      , match
      , staffStore
      , userStore
      , staffMap
    } = this.props;

    const { 
      bulkClientObj
      , selectedStaffIds
      , clientNotification
      , staffNotification
    } = this.state;
    
    if(bulkClientObj) {
      const newBulkClientObj = _.cloneDeep(bulkClientObj);
      newBulkClientObj.clientNotification = clientNotification;
      newBulkClientObj.staffNotification = staffNotification;
      newBulkClientObj.uploadOnly = uploadOnly;

      this.setState({
        submitting: true
        , warningModal: false
        , bulkClientObj: newBulkClientObj
      });

      console.log('staffMap', staffMap);
      console.log('selectedStaffIds', selectedStaffIds);

      if (selectedStaffIds && selectedStaffIds.length) {
        newBulkClientObj.selectedStaffs = selectedStaffIds.map(id => id && staffMap && staffMap[id]);
      }

      console.log('newBulkClientObj', newBulkClientObj)
  
      dispatch(clientActions.sendBulkInviteClients(newBulkClientObj)).then(clientRes => {
        // The server is going to return immediately and let the sockets handle everything else.
        // We'll only get a failure if the user doesn't have permission.
        this.setState({
          step: 'import-result'
        })
        if(!clientRes.success) {
          alert("ERROR - Check logs");
        }
      });
    } else {
      this.setState({
        submitting: false
      });
      alert("Please upload a valid CSV and try again.")
    }
  }

  _startOver() {
    this.setState({
      bulkClientObj: null
      , responseData: null
      , submitting: false
    })
  }

  _close() {
    const { history, match } = this.props;
    this.setState({
      bulkClientObj: null
      , continueInBackground: null
      , responseData: null
      , submitting: false
      , isOpen: false
      , clientNotification: {
        sN_upload: true
        , sN_viewed: true
        , sN_downloaded: true
        , sN_sendMessage: true
        , sN_leaveComment: true 
        , sN_autoSignatureReminder: true
      }
      , staffNotification: {
        sN_upload: true
        , sN_viewed: true
        , sN_downloaded: true
        , sN_leaveComment: true
        , sN_sendMessage: true
        , sN_viewSignatureRequest: true
        , sN_signingCompleted: true
        , sN_autoSignatureReminder: true
      }
      , step: 'import-client'
    }, () => history.push(`${match.url.substring(0, match.url.indexOf('/import'))}`))
  }

  _exportErrorReport() {
    const { bulkClientObj } = this.state;

    let csv = inviteUtils.generateErrorReport(bulkClientObj.errors);
    const filename = `CLIENT_IMPORT_ERRORS_${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}.csv`
    // download as a file when the user clicks the button
    let csvFile = new Blob([csv], {type: 'text/csv'});
    let data = URL.createObjectURL(csvFile)
    let link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
    // Now that they've downloaded the errors, let them continue with submitting the valid clients.
    this.setState({
      unhandledErrors: false
    })
  }

  _exportResultsReport() {
    const { responseData } = this.state;
    let csv = inviteUtils.generateResultsReport(responseData);
    const filename = `CLIENT_IMPORT_RESULTS_${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}.csv`
    // download as a file when the user clicks the button
    let csvFile = new Blob([csv], {type: 'text/csv'});    
    let data = URL.createObjectURL(csvFile)
    let link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
  }

  _handleCheckBox() {
    const checkAll = _.cloneDeep(this.state.checkAll);
    this.setState({
      checkAll: !checkAll
      , clientNotification: {
        sN_upload: !checkAll
        , sN_viewed: !checkAll
        , sN_downloaded: !checkAll
        , sN_sendMessage: !checkAll
        , sN_leaveComment: !checkAll
        , sN_autoSignatureReminder: !checkAll
      }
    })  
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState, message: "" });
  }

  nextStep = (newStep) => {
    console.log('newStep', newStep);
    this.setState({ step: newStep });
  }

  showWarningModal = () => {
    console.log('showWarningModal')
    this.setState({ warningModal: true });
  }

  _handleNotificationChange(name, value) {
    let newState = _.update(this.state, name, () => {
      return value;
    });
    this.setState({ newState, message: "" });
  }

  render() {
    const {
      bulkClientObj
      , progressPercent
      , responseData
      , submitting
      , clientNotification
      , staffNotification
      , checkAll
      , assignedStaffUser
      // , setStaff
      // , setNotification

      , step
      , unhandledErrors
      , isOpen
      , warningModal
    } = this.state;
    const { 
      location
      , staffClientStore
      , staffStore
      , userStore
      , match
      , staffMap
    } = this.props;
    const errorCount = bulkClientObj ? bulkClientObj.errors.length : null;
    const lineCount = bulkClientObj ? bulkClientObj.newClients.length + bulkClientObj.errors.length : null;
    const staffListItems = staffStore.util.getList('_firm', match.params.firmId);
    const availableStaff = step === 'assign-staff' && staffListItems && staffListItems.length ? staffListItems.flatMap(staff => {
      let item = staff;
      let fullName = userStore.byId[staff._user] ? `${userStore.byId[staff._user].firstname} ${userStore.byId[staff._user].lastname}` : '';
      let userName = userStore.byId[staff._user] ? userStore.byId[staff._user].username : '';
      item.displayName = `${fullName} | ${userName}`;
      item.fullName = fullName;
      item.userName = userName;
      return staff && staff.status === "active" ? item : [];
    }) : [];


    let progressClass = classNames(
      `progress-bar-${progressPercent || 0}`
    )

    const stepUi = {
      'import-client': {
        confirmAction: null
        , confirmText: null
        , closeText: null
        , modalHeader: 'Step 1 of 5'
        , cardSize: 'standard'
      }
      , preparing: {
        confirmAction: null
        , confirmText: null
        , closeText: null
        , modalHeader: 'Step 1 of 5'
        , cardSize: 'standard'
      }
      , 'import-review': {
        confirmAction: () => this.nextStep('assign-staff')
        , confirmText: 'Next'
        , closeText: 'Cancel'
        , modalHeader: 'Step 2 of 5'
        , cardSize: 'jumbo'
      }
      , 'assign-staff': {
        confirmAction: () => this.nextStep('set-notification')
        , confirmText: 'Next'
        , closeText: 'Cancel'
        , modalHeader: 'Step 3 of 5'
        , cardSize: 'jumbo'
      }
      , 'set-notification': {
        confirmAction: bulkClientObj && bulkClientObj.hasContactEmail ? () => this.showWarningModal() : this._handleInviteClients
        , confirmText: 'Continue importing'
        , closeText: 'Cancel'
        , modalHeader: 'Step 4 of 5'
        , cardSize: 'jumbo'
      }
      , submitting: {
        confirmAction: null
        , confirmText: null
        , closeText: null
        , modalHeader: 'Step 4 of 5'
        , cardSize: 'standard'
      }
      , progress: {
        confirmAction: this._close
        , confirmText: 'Continue in background'
        , closeText: 'Cancel'
        , modalHeader: 'Step 4 of 5'
        , cardSize: 'standard'
      }
      , 'import-result': {
        confirmAction: this._close
        , confirmText: 'Okay'
        , closeText: 'Cancel'
        , modalHeader: 'Step 5 of 5'
        , cardSize: 'jumbo'
      }
    }

    return (
      <PracticeLayout>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <Modal
          btnColor="info"
          closeAction={this._close}
          isOpen={isOpen}
          // If they've already submitted the import it's too late to cancel. Get rid of the cancel button
          // disableConfirm={this.state.unhandledErrors || (!submitting && (bulkClientObj ? bulkClientObj.newClients.length ? false : true : false))}
          modalClasses="info client-import-modal"
          cardSize={stepUi[step]['cardSize']}
          closeText={stepUi[step]['closeText']}
          confirmAction={stepUi[step]['confirmAction']}
          confirmText={stepUi[step]['confirmText']}
          modalHeader={stepUi[step]['modalHeader']}
        >
          { 
            // submitting ?
            // SUBMITTING LOADING
            step === 'preparing' || step === 'submitting' ?
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>
            :
            step === 'progress' ?
            <div className="yt-container">
              <div className="upload-progress-container">
                <p>{`Import Progress ${progressPercent}%`}</p>
                <div className={progressClass} >
                  <div className="-progress">
                    <div className="-complete">
                    </div>
                  </div>
                </div>
              </div>
              <br/>
              <div className="yt-row">
                <p>Taking too long? We can finish this in the background while you do something else.</p>
              </div>
              <div className="yt-row">
                <p><strong>You'll see your import progress at the top of the page.</strong></p>
              </div>
            </div>
            :
            step === 'import-client' ? 
            <div className="yt-container -modal-importing">
              <div className="yt-row">
                <h3 style={{ margin: '1em 0' }}>Upload your CSV file</h3>
                {/* <div className="alert-message warning -left"><strong>WARNING: </strong> This will automatically send invitations to all emails listed in the CSV.</div> */}
                <div className="yt-col full ">
                  <br/>
                  <div className="yt-row">
                    <p>Import data into {brandingName.title} from CSV files. <a href="/client_bulk_import_template_csv.csv" target="_blank" download>Click here to download a CSV template.</a></p>
                  </div>
                  <div className="yt-row">
                    <div className="yt-col full">
                    { submitting ?
                      <div className="-loading-hero hero">
                        <div className="u-centerText">
                          <div className="loading"></div>
                        </div>
                      </div>
                      :
                      <FileInput
                        accepts={[".csv"]}
                        multiple={false}
                        change={this._handleFilesChange}
                        required={true}
                      />
                    }
                    </div>
                  </div>
                </div>
              </div>
            </div>
            :
            step === 'import-review' ? 
            <div className="table-wrapper -invitation-results">
              <h3 style={{ margin: '1em 0' }}>Review Import</h3>
              { unhandledErrors ?
                <a onClick={this._exportErrorReport} className="yt-btn warn u-pullRight small">
                  Download error report
                </a>
                :
                null
              }
              <p><strong>Clients to import: </strong> {bulkClientObj.newClients.length}</p>
              { unhandledErrors ?
                <p><strong>Errors found: </strong> {errorCount || '0'}</p>
                :
                null
              }
              { unhandledErrors ?
                <div>
                  <strong>
                    <p className="u-danger">
                      { errorCount && lineCount ?
                        `We found errors with ${errorCount} of the ${lineCount} clients in your csv file!`
                        :
                        null
                      }
                    </p>
                  </strong>
                  <p>
                    {`Don't worry, you can still import the other ${bulkClientObj.newClients.length} clients, but first click above to download an error report in the same format as your upload.`}
                  </p>
                  <p>
                    You can fix the errors and import those clients later.
                  </p>
                </div>
                :
                <p className="u-success"><strong>Ready to import!</strong></p>
              }
              <table className="yt-table -multiple-data">
                <thead>
                  <tr>
                    <th></th>
                    <th>Client ID</th>
                    <th>Client Name</th>
                    <th>Engagement Type</th>
                    <th>Contact Address</th>
                    <th>Contact Number</th>
                    <th>Contact Name</th>
                    <th>Contact Email</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  { this.state.unhandledErrors ?
                    bulkClientObj.errors.map((client, i) =>
                    <tr key={'errorClient_' + i} >
                      <td><i className="u-danger fas fa-times-octagon"/></td>
                      <td>{client.clientIdentifier}</td>
                      <td>{client.clientName}</td>
                      <td>{client.engagementTypes[0]}</td>
                      <td>
                        <p>{!client.street1 && !client.city && !client.state && !client.postal && !client.country  ? "-" : `${client.street1} ${client.city} ${client.state} ${client.postal} ${client.country}`}</p>
                      </td>
                      <td>
                        <p>{!client.number ? "-" : `${client.number}`}</p>
                      </td>
                      <td>
                        {
                          client.primaryContact.map((contact, j) => 
                            <p key={j}>{!contact.firstname && !contact.lastname ? "-" : `${contact.firstname} ${contact.lastname}`}</p>
                          )
                        }
                      </td>
                      <td>
                        {
                          client.primaryContact.map((contact, j) => 
                            <p key={j}>{contact.email || "-"}</p>
                          )
                        }
                      </td> 
                      <td>
                        {
                          client.error ? client.error
                          : client.primaryContact.map((contact, j) => <p key={j}>{contact.error || "-"}</p>)
                        }
                      </td>
                    </tr>
                    )
                    :
                    null
                  }
                  { bulkClientObj.newClients.map((client,i) =>
                    <tr key={'newClient_' + i} >
                      <td><i className="u-success fas fa-check"/></td>
                      <td>{client.clientIdentifier}</td>
                      <td>{client.clientName}</td>
                      <td>{client.engagementTypes[0]}</td>
                      <td>
                        <p>{!client.street1 && !client.city && !client.state && !client.postal && !client.country  ? "-" : `${client.street1} ${client.city} ${client.state} ${client.postal} ${client.country}`}</p>
                      </td>
                      <td>
                        <p>{!client.number ? "-" : `${client.number}`}</p>
                      </td>
                      <td>
                        {
                          client.primaryContact.map((contact, j) => 
                            <p key={j}>{!contact.firstname && !contact.lastname ? "-" : `${contact.firstname} ${contact.lastname}`}</p>
                          )
                        }
                      </td>
                      <td>
                        {
                          client.primaryContact.map((contact, j) => 
                            <p key={j}>{contact.email || "-"}</p>
                          )
                        }
                      </td>
                      <td>{client.error || ''}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div> 
            :
            step === 'assign-staff' ?
            <div className="table-wrapper -invitation-results">
              <h3 style={{ margin: '1em 0' }}>Assign Staff</h3>
              <ActiveStaffListItem
                staffListItems={availableStaff}
                staffMap={staffMap}
                viewingAs="single-client"
                handleNewStaffClient={() => console.log('hello world')}
                handleSelectStaff={(staffs) => this.setState({ selectedStaffIds: staffs })}
              />
            </div>
            :
            step === 'set-notification' ?
            <div className="table-wrapper -invitation-results">
              <h3 style={{ margin: '1em 0' }}>Set Notification</h3>
              <ClientNotificationForm
                handleFormChange={this._handleNotificationChange}
                clientNotification={clientNotification}
                allowedToUpdate={true}
              />
              <StaffNotificationForm
                handleFormChange={this._handleNotificationChange}
                staffNotification={staffNotification}
                allowedToUpdate={true}
                noTopMargin={true}
                multiple={true}
              />
            </div>
            :
            step === 'import-result' ?
            <div className="table-wrapper -invitation-results">
              <h3 style={{ margin: '1em 0' }}>Import Results</h3>
              <br/>
              <p><strong>Clients submitted: </strong> {(responseData && responseData.results) ? responseData.results.length : ''}</p>
              <p><strong>Invitations sent: </strong> {(responseData && responseData.successfulInvites) ? responseData.successfulInvites : ''}</p>
              <p><strong>Existing Clients: </strong> {(responseData && responseData.existingClients) ? responseData.existingClients : ''}</p>
              <p><strong>Existing Users: </strong> {(responseData && responseData.existingUsers) ? responseData.existingUsers : ''}</p>
              <p><strong>Errors: </strong> {(responseData && responseData.errors) ? responseData.errors : ''}</p>
              {
                responseData && responseData.selectedStaffs && responseData.selectedStaffs.length ?
                <div className="yt-row">
                  <h4>Assigned Staff:</h4>
                  {
                    responseData.selectedStaffs.map(staff =>
                      <div className="yt-row" style={{ paddingLeft: "1em" }}>
                        <label className="u-muted">
                          {`${staff.fullName} | ${staff.userName}`}
                        </label>
                      </div>
                    )
                  }
                </div>
                : null
              }
              <ClientNotificationForm
                handleFormChange={this._handleNotificationChange}
                clientNotification={clientNotification}
                allowedToUpdate={false} // viewing only
              />
              <StaffNotificationForm
                handleFormChange={this._handleNotificationChange}
                staffNotification={staffNotification}
                allowedToUpdate={false}
                noTopMargin={true}
                multiple={true}
              />
              <button className="yt-btn x-small u-pullRight" onClick={this._exportResultsReport}>Download Report</button>
              <table className="yt-table -multiple-data">
                <caption>Total: {(responseData && responseData.results) ? responseData.results.length: ''}</caption>
                <thead>
                  <tr>
                    <th></th>
                    <th>Client ID</th>
                    <th>Client Name</th>
                    <th>Engagement Type</th>
                    <th>Contact Address</th>
                    <th>Contact Number</th>
                    <th>Contact Name</th>
                    <th>Contact Email</th>
                    <th>Result</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  { responseData.results.map((result,i) =>
                    <PracticeClientImportResult result={result} index={i} key={i} bulkClientObj={bulkClientObj}  />
                  )}
                  { !responseData.results || responseData.results.length === 0 ?
                    <tr>
                      <td colSpan="3" className="u-centerText"><em>No results</em></td>
                    </tr>
                    :
                    null 
                  } 
                </tbody>
              </table>
            </div>
            :
            null
          }
        </Modal>
        <AlertModal
          alertMessage={<div> <h4>Are you sure?</h4> This will send an invitation email to all contacts uploaded.</div> }
          alertTitle="Invite clients"
          closeAction={() => this.setState({warningModal: false})}
          confirmAction={this._handleInviteClients}
          confirmText="Yes, upload and send invites"
          // declineAction={this._closeDeleteModal}
          // declineText="Never mind"
          isOpen={warningModal}
          type="danger"
          addConfirmText="Upload only"
          addConfirmAction={this._handleInviteClients.bind(this, true)}
          addFooterClass="-bulk-upload"
        />
      </PracticeLayout>
    )
  }
}

PracticeClientBulkImport.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeClientBulkImport.defaultProps = {
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    socket: store.user.socket
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user 
    , staffClientStore: store.staffClient
    , staffStore: store.staff
    , defaultStaffClient: store.staffClient.defaultItem
    , staffMap: store.staff.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeClientBulkImport)
);
