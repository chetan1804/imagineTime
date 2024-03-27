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
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import CheckboxInput from '../../../../global/components/forms/CheckboxInput.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../staffActions';
import * as userActions from '../../../user/userActions';
import * as subscriptionActions from '../../../subscription/subscriptionActions';

// import utils
import inviteUtils from '../../../../global/utils/inviteUtils';

// import component
import PracticeClientImportResult from '../../../client/practice/components/PracticeClientImportResult.js.jsx';

class PracticeStaffBulkImport extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      bulkStaffObj: null
      , progressPercent: 0
      , responseData: null 
      , submitting: false
      , isOpen: true
      , unhandledErrors: null
      , warningModal: false
      , startUpload: false
      , subscription: null
      , exceedWarning: null 
    }
    this._bind(
      '_close'
      , '_exportErrorReport'
      , '_exportResultsReport'
      , '_handleFilesChange'
      , '_handleInviteStaffs'
      , '_handleFormChange'
    );
    // this._unmounted = true;
  }

  componentDidMount() {
    const { dispatch, match, socket, loggedInUser } = this.props;

    // get subscription
    dispatch(subscriptionActions.fetchListIfNeeded('_firm', match.params.firmId)).then(json => {
      if (json.success) {
        dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId)).then(staffRes => {
          if (staffRes.success) {
            const activeStaff = staffRes.list.filter(staff => staff.status === "active");
            const subscription = json.list && json.list[0] ? _.cloneDeep(json.list[0]) : null;
            if (subscription) {
              subscription["licenses"] = subscription.licenses - activeStaff.length;
              this.setState({ subscription });
            }
          }
        });
      }          
    });

    // To make the upload progress meter work this component needs to listen for specific socket events.
    socket.on('upload_status', progressPercent => {
      this.setState({
        progressPercent: progressPercent
        , startUpload: true
      })
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
    // this._unmounted = false;
    const { socket, dispatch, match } = this.props;
    socket.off('upload_status');
    socket.off('finish_upload');
    socket.off('upload_error');
  }

  _handleFilesChange(files) {
    const { match } = this.props;
    const subscription = _.cloneDeep(this.state.subscription);

    // set state to submitting
    this.setState({ 
      submitting: true
      , exceedWarning: null
    });

    let submitObj = {};
    submitObj.firmId = match.params.firmId
    let file = files[0];
    // create new reader variable
    let reader = new FileReader();
    // when a file is loaded run this function
    reader.onload = () => {

      // call util function for our submitObj
      const bulkStaffObj = inviteUtils.getCSVSubmitStaffObj(reader.result, submitObj, subscription);
      
      // check if our util was successful
      if (bulkStaffObj.success) {
        this.setState({
          bulkStaffObj
          , submitting: false
          , unhandledErrors: bulkStaffObj.errors && bulkStaffObj.errors.length > 0 ? true : false
        });     
      } else {
        if (bulkStaffObj.exceedList) {
          this.setState({ submitting: false, exceedWarning: true });
        } else {
          // show alert message
          alert(bulkStaffObj.message);
          this.setState({ submitting: false });
        }
      }
    }

    // start reading the file. When it is done, calls the onload event defined above.
    reader.readAsBinaryString(file);
  }

  _handleInviteStaffs(uploadOnly) {
    const { dispatch, match } = this.props;
    let bulkStaffObj = _.cloneDeep(this.state.bulkStaffObj);
    
    this.setState({
      submitting: true
      , warningModal: false 
    });

    if(bulkStaffObj) {
      bulkStaffObj.uploadOnly = uploadOnly;
      dispatch(staffActions.sendBulkInviteStaffs(bulkStaffObj)).then(staffRes => {
        if(!staffRes.success) {
          alert("ERROR - Check logs");
        } else {
          this.setState({ 
            progressPercent: 100
            , submitting: false
            , startUpload: false
            , responseData: staffRes.item });
            dispatch(firmActions.fetchList(match.params.firmId));
            dispatch(userActions.fetchList('_firmStaff', match.params.firmId))
            dispatch(staffActions.fetchList('_firm', match.params.firmId))
            dispatch(subscriptionActions.fetchList('_firm', match.params.firmId));
            // dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));               
        }
      })
    } else {
      this.setState({ submitting: false });
      alert("Please upload a valid CSV and try again.")
    }
  }

  _close() {
    const { history, match } = this.props;
    this.setState({
      bulkStaffObj: null
      , continueInBackground: null
      , responseData: null
      , submitting: false
      , isOpen: false
    }, () => history.push(`${match.url.substring(0, match.url.indexOf('/import'))}`))
  }

  _exportErrorReport() {
    const { bulkStaffObj } = this.state;

    let csv = inviteUtils.generateStaffErrorReport(bulkStaffObj.errors);
    const filename = `STAFF_IMPORT_ERRORS_${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}.csv`
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
    let csv = inviteUtils.generateStaffResultsReport(responseData);
    const filename = `STAFF_IMPORT_RESULTS_${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}.csv`
    // download as a file when the user clicks the button
    let csvFile = new Blob([csv], {type: 'text/csv'});    
    let data = URL.createObjectURL(csvFile)
    let link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
  }

  _handleFormChange() {
    // do nothing
  }

  render() {
    const {
      bulkStaffObj 
      , progressPercent
      , responseData
      , submitting
      , startUpload
      , unhandledErrors
      , isOpen
      , warningModal
      , subscription
      , exceedWarning
    } = this.state;
    const { location } = this.props;
    const errorCount = bulkStaffObj ? bulkStaffObj.errors.length : null;
    const lineCount = bulkStaffObj ? bulkStaffObj.newStaffs.length + bulkStaffObj.errors.length : null;

    let progressClass = classNames(
      `progress-bar-${progressPercent || 0}`
    )

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
          cardSize={!bulkStaffObj || submitting ? "standard" : "jumbo"}
          closeAction={this._close}
          confirmAction={responseData || submitting || progressPercent > 0 ? this._close : bulkStaffObj ? bulkStaffObj.hasContactEmail ? () => this.setState({ warningModal: true }) : this._handleInviteStaffs : null}
          confirmText={progressPercent === 100 ? 'Okay' : submitting && 100 > progressPercent ? 'Continue in background' : bulkStaffObj ? 'Continue Importing' : null}
          // If they've already submitted the import it's too late to cancel. Get rid of the cancel button
          closeText={!responseData && (progressPercent === 0 && !submitting) ? "Cancel" : null}
          disableConfirm={unhandledErrors}
          isOpen={isOpen}
          modalClasses="info client-import-modal"
          modalHeader={
            <span>
            { responseData ?
              'Step 3 of 3'
              :
              bulkStaffObj ?
              'Step 2 of 3'
              :
              'Step 1 of 3'
            }
            </span>
          }
        >
          {
            !subscription ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>            
            : submitting && bulkStaffObj ? // loading display when submitting import 
              progressPercent === 0 && !startUpload ?
                <div className="-loading-hero hero">
                  <div className="u-centerText">
                    <div className="loading"></div>
                  </div>
                </div>
                :
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
            : bulkStaffObj && !responseData ? // preview display
              <div className="table-wrapper -invitation-results">
                <h3>Review Import</h3>
                { unhandledErrors ?
                  <a onClick={this._exportErrorReport} className="yt-btn warn u-pullRight small">
                    Download error report
                  </a>
                  :
                  null
                }
                <p><strong>Staffs to import: </strong> {bulkStaffObj.newStaffs.length}</p>
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
                          `We found errors with ${errorCount} of the ${lineCount} staffs in your csv file!`
                          :
                          null
                        }
                      </p>
                    </strong>
                    <p>
                      {`Don't worry, you can still import the other ${bulkStaffObj.newStaffs.length} staffs, but first click above to download an error report in the same format as your upload.`}
                    </p>
                    <p>
                      You can fix the errors and import those clients later.
                    </p>
                  </div>
                  :
                  <p className="u-success"><strong>Ready to import!</strong></p>
                }
                <table className="yt-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Contact Email</th>
                      <th>Staff Name</th>
                      <th>Owner Privileges</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    { unhandledErrors ?
                      bulkStaffObj.errors.map((staff, i) =>
                      <tr key={'errorClient_' + i} >
                        <td><i className="u-danger fas fa-times-octagon"/></td>
                        <td>{staff.email}</td>
                        <td>{`${staff.firstname} ${staff.lastname}`}</td>
                        <td>
                          <CheckboxInput
                            name="owner"
                            value={staff.owner}
                            change={this._handleFormChange}
                            checked={staff.owner}
                          />
                        </td>
                        <td>{staff.error || ''}</td>
                      </tr>
                      )
                      :
                      null
                    }
                    { bulkStaffObj.newStaffs.map((staff, i) =>
                      <tr key={'newClient_' + i} >
                        <td><i className="u-success fas fa-check"/></td>
                        <td>{staff.email}</td>
                        <td>{`${staff.firstname} ${staff.lastname}`}</td>
                        <td>
                          <CheckboxInput
                            name="owner"
                            value={staff.owner}
                            change={this._handleFormChange}
                            checked={staff.owner}
                          />                        
                        </td>
                        <td>{staff.error || ''}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            : responseData ? // import results 
            <div className="table-wrapper -invitation-results">
              <h3>Import Results</h3>
              <br/>
              <p><strong>Staffs submitted: </strong> {responseData.results.length}</p>
              <p><strong>Invitations sent: </strong> {responseData.stats.successfulInvites}</p>
              <p><strong>Existing Staff Members: </strong> {responseData.stats.existingStaff}</p>
              <p><strong>Existing Users: </strong> {responseData.stats.existingUsers}</p>
              <p><strong>Errors: </strong> {responseData.stats.errors}</p>
              <button className="yt-btn x-small u-pullRight" onClick={this._exportResultsReport} style={{marginBottom:"1em"}}>Download Report</button>
              <table className="yt-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Contact Email</th>
                    <th>Staff Name</th>
                    {/* <th>Owner Privileges</th> */}
                    <th>Result</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  { responseData.results.map((staff, i) =>
                    <tr key={'newClient_' + i} >
                      <td><i className="u-success fas fa-check"/></td>
                      <td>{staff.email}</td>
                      <td>{`${staff.firstname} ${staff.lastname}`}</td>
                      {/* <td>
                        <CheckboxInput
                          name="owner"
                          value={staff.owner}
                          change={this._handleFormChange}
                          checked={staff.owner}
                        />
                      </td> */}
                      <td>{staff.result || ''}</td>
                      <td>{staff.error || ''}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            :            
            <div className="yt-container">
              <div className="yt-row">
                <h3>Upload your CSV file</h3>
                  {
                    exceedWarning ?
                    <div className="alert-message warning -left">
                      <strong>WARNING: </strong> 
                      You have exceed your number of available user licenses. {subscription.licenses > 1 ? `Please upload ${subscription.licenses} or fewer users` : "Please upload 1 user only"}.
                      If you would like to purchase more user licenses, Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a> to add more licenses.
                    </div> : null
                  }
                <div className="yt-col full ">
                  <br/>
                  <div className="yt-row">
                    <p>Import data into {brandingName.title} from CSV files. <a href="/staff_bulk_import_template_csv.csv" target="_blank" download>Click here to download a CSV template.</a></p>
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
          }
          {/* { submitting ?
            progressPercent === 0 && !startUpload ?
              <div className="-loading-hero hero">
                <div className="u-centerText">
                  <div className="loading"></div>
                </div>
              </div>
              :
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
            !bulkStaffObj && !responseData ?
            <div className="yt-container">
              <div className="yt-row">
                <h3>Upload your CSV file</h3>
                <div className="alert-message warning -left"><strong>WARNING: </strong> This will automatically send invitations to all emails listed in the CSV.</div>
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
            bulkStaffObj && !responseData ?
            <div className="table-wrapper -invitation-results">
              <h3>Review Import</h3>
              { this.state.unhandledErrors ?
                <a onClick={this._exportErrorReport} className="yt-btn warn u-pullRight small">
                  Download error report
                </a>
                :
                null
              }
              <p><strong>Clients to import: </strong> {bulkStaffObj.newClients.length}</p>
              { this.state.unhandledErrors ?
                <p><strong>Errors found: </strong> {errorCount || '0'}</p>
                :
                null
              }
              { this.state.unhandledErrors ?
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
                    {`Don't worry, you can still import the other ${bulkStaffObj.newClients.length} clients, but first click above to download an error report in the same format as your upload.`}
                  </p>
                  <p>
                    You can fix the errors and import those clients later.
                  </p>
                </div>
                :
                <p className="u-success"><strong>Ready to import!</strong></p>
              }
              <table className="yt-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Client ID</th>
                    <th>Client Name</th>
                    <th>Account Type</th>
                    <th>Contact Name</th>
                    <th>Contact Email</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  { this.state.unhandledErrors ?
                    bulkStaffObj.errors.map((client, i) =>
                    <tr key={'errorClient_' + i} >
                      <td><i className="u-danger fas fa-times-octagon"/></td>
                      <td>{client.clientIdentifier}</td>
                      <td>{client.clientName}</td>
                      <td>{client.accountType}</td>
                      <td>{`${client.primaryContact.firstname} ${client.primaryContact.lastname}`}</td>
                      <td>{client.primaryContact.email}</td>
                      <td>{client.error || ''}</td>
                    </tr>
                    )
                    :
                    null
                  }
                  { bulkStaffObj.newClients.map((client,i) =>
                    <tr key={'newClient_' + i} >
                      <td><i className="u-success fas fa-check"/></td>
                      <td>{client.clientIdentifier}</td>
                      <td>{client.clientName}</td>
                      <td>{client.accountType}</td>
                      <td>{`${client.primaryContact.firstname} ${client.primaryContact.lastname}`}</td>
                      <td>{client.primaryContact.email}</td>
                      <td>{client.error || ''}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            :
            responseData ?
            <div className="table-wrapper -invitation-results">
              <h3>Import Results</h3>
              <br/>
              <p><strong>Clients submitted: </strong> {responseData.results.length}</p>
              <p><strong>Invitations sent: </strong> {responseData.stats.successfulInvites}</p>
              <p><strong>Existing Clients: </strong> {responseData.stats.existingClients}</p>
              <p><strong>Existing Users: </strong> {responseData.stats.existingUsers}</p>
              <p><strong>Errors: </strong> {responseData.stats.errors}</p>
              <button className="yt-btn x-small u-pullRight" onClick={this._exportResultsReport}>Download Report</button>
              <table className="yt-table">
                <caption>Total: {responseData.results.length}</caption>
                <thead>
                  <tr>
                    <th></th>
                    <th>Client ID</th>
                    <th>Client Name</th>
                    <th>Contact Name</th>
                    <th>Contact Email</th>
                    <th>Result</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  { responseData.results.map((result,i) =>
                    <PracticeClientImportResult result={result} index={i} key={i} />
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
          } */}
        </Modal>
        <AlertModal
          alertMessage={<div> <h4>Are you sure?</h4> This will send an invitation email to all contacts uploaded.</div> }
          alertTitle="Invite staffs"
          closeAction={() => this.setState({warningModal: false})}
          confirmAction={this._handleInviteStaffs}
          confirmText="Yes, upload and send invites"
          declineAction={this._closeDeleteModal}
          declineText="Never mind"
          isOpen={warningModal}
          type="danger"
          addConfirmText="Upload only"
          addConfirmAction={this._handleInviteStaffs.bind(this, true)}
          addFooterClass="-bulk-upload"
        />
      </PracticeLayout>
    )
  }
}

PracticeStaffBulkImport.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeStaffBulkImport.defaultProps = {
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    socket: store.user.socket
    , loggedInUser: store.user.loggedIn.user
    , firmStore: store.firm
    , subscriptionStore: store.subscription
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeStaffBulkImport)
);
