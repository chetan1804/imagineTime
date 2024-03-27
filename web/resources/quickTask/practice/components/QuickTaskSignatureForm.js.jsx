/**
 * Reusable stateless form component for signature type QuickTasks
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import global
import sortUtils from '../../../../global/utils/sortUtils.js'; 
import ProgressBar from '../../../../global/components/helpers/ProgressBar.js.jsx';
import ISReactDraftEditor from '../../../../global/components/forms/ISReactDraftEditor.js.jsx';

// import resource components
import SignerInput from './SignerInput.js.jsx';

// import form components
import { TextAreaInput, SelectFromObject, TextInput, ToggleSwitchInput } from '../../../../global/components/forms';

import FileDeliveryListItem from '../../../file/components/FileDeliveryListItem.js.jsx';
import RecipientInput from './RecipientInput.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

const  QuickTaskSignatureForm = ({
  allowSharedEmail
  , cancelLink
  , clientListItems
  , disabled
  , fetching
  , handleFormChange
  , handleFormSubmit
  , handleSignerChange
  , handleTemplateChange
  , prompt
  , selectedClient
  , selectedFile
  , signerListItems
  , signers
  , submitting
  , templates
  , templateId
  , authTypes
  , authType
  , secretQuestions
  , selectedQuestion
  , password
  , handleJotblocksModal
  , elements
  , loggedInUser
  , match
  , _personal
  , userMap
  , kbaEnabled
  , handleCheckInputChange
  , progress
  , sN_viewSignatureRequest
  , sN_signingCompleted
  , isConfigScreenView = false
  , staffListItems = []
  , selectedStaff = ''
  , handleRTEChange
  , handleShowFolderTree
  , selectedFolder
  , modelName
  , firm
  , showTermsConditions
  , sN_creatorAutoSignatureReminder
  , sN_clientAutoSignatureReminder
  , staffClientsListItems
  , staffClientInfo
  , signerSigningOrderType
  , staffStore
  , userStore
  , receivers
  , addRecipient
  , removeRecipient
}) => {
  const selectedStaffClient = staffClientsListItems ? staffClientsListItems.filter(item => item._user === loggedInUser._id) : [];

  // sort 
  clientListItems = sortUtils._object(clientListItems, "name");
  signerListItems = sortUtils._object(signerListItems, "displayName");
  templates = sortUtils._object(templates, "name");
  let newTemplates = templates ? _.cloneDeep(templates) : [];

  if (!newTemplates.some(template => template.templateID === "custom")) {
    newTemplates.unshift({ templateID: "custom", name: "Custom Template" });
  }

  let signersId = [];
  if (signers) {
    signersId = signers.filter(a => a._id).map(a => a._id);
    signersId = signersId.length ? signersId : null;
  }

  
  if (clientListItems && loggedInUser) {
    clientListItems.unshift({
      _id: `personal${loggedInUser._id}`
      , name: "Your Staff Files"
      , _firm: match.params.firmId 
      , _staff: loggedInUser._id
    });
  }

  const userId = match.params.userId;
  if (clientListItems && loggedInUser && loggedInUser._id && userMap && userId && userId != loggedInUser._id && userMap[userId]) {
    clientListItems.unshift({
      _id: `personal${userId}`
      , name: `Personal Files for ${userMap[userId].firstname} ${userMap[userId].lastname}`
      , _firm: match.params.firmId 
      , _staff: userId
    });
  }
   
  console.log('going A', selectedClient && selectedClient._id ? selectedClient._id : _personal ? _personal : null)
  // set the button text
  const buttonText = submitting ? "Preparing Request..." : "Prepare Request";

  const individualQA = { individualQA: { display: 'Individual Question/Answer', val: 'individualQA', prompt: 'Individual Question/Answer' } };
  const directLink = { none: { display: 'Direct Link', val: 'none' } }
  const staffList = staffStore.util.getList('_firm', match.params.firmId);
  const availableStaff = !staffList ? [] : staffList.filter(staff => {
    if (staff.status === 'active') {
      let item = staff;
      let fullName = userStore.byId[staff._user] ? `${userStore.byId[staff._user].firstname} ${userStore.byId[staff._user].lastname}` : '';
      let userName = userStore.byId[staff._user] ? userStore.byId[staff._user].username : '';
      item.displayName = `${fullName} | ${userName}`;
      item.email = userName;
      return item;
    }
  });

  return (
    <div className="-share-link-configuration">
      <div className="-body -max-width">
        { submitting ?
          <ProgressBar
            progress={progress}
          />  
          :
          null
        }
      </div>
      <div className="-header">
        <i className="fal fa-file-export" /> File to sign
      </div>
      <div className="-body">
      { selectedFile && selectedFile._id ?
        <FileDeliveryListItem
          key={`${selectedFile._id}_file`}
          file={selectedFile}
          filePath={`/`}
          allowRemove={false}
        />
        :
        null
      }
      </div>
      <div className="-header">
        <i className="fas fa-eye"/> Link settings 
      </div>
      <div className="-body">
        <div className="-setting yt-row space-between">
          <div className="-instructions yt-col">
            <p><strong>Workspace</strong></p>
            <p>Select workspace to request from</p>
          </div>
          { clientListItems && clientListItems.length ? 
            <div className="-inputs yt-col">
              <SelectFromObject
                  change={handleFormChange}
                  items={clientListItems}
                  disabled={!!match.params.clientId}
                  display="name"
                  displayStartCase={false}
                  filterable={true}
                  isClearable={true}
                  name="selectedClientId"
                  placeholder="Select from the following"
                  selected={selectedClient && selectedClient._id ? selectedClient._id : _personal ? _personal : null}
                  //selected={this.state.clientId}
                  value="_id"
                />
            </div>
            :
            selectedClient && selectedClient._id
            ?
            <div className="-inputs yt-col">
              <p>{selectedClient.name}</p>
            </div>
            :
            <p><small><strong>Note: </strong> You do not have any client workspaces available. Files will upload to General Files.</small></p>
          }
        </div>
        {
          modelName === "documenttemplate" ?
          <div>
            <hr/>
            <div className="-setting yt-row space-between">
              <div className="-instructions yt-col">
                <p><strong>Signed file location</strong></p>
              </div>
              <div className="-inputs yt-col">
                <div className="-inputs yt-row">
                  <div className="input-group"><p>{ selectedFolder && selectedFolder._id ? `Folder - ${selectedFolder.filename}` : 'Workspace files' }</p></div>
                </div>
                <div className="-inputs yt-row">
                  <div className="input-group">
                    <button className="yt-btn small link info"
                      onClick={handleShowFolderTree}
                      style={{ width: "100%" }}>Select a folder</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          : null
        }
        <hr/>
        <div className="-setting yt-row space-between">
          <div className="-instructions yt-col">
            <p><strong>Who has access</strong></p>
            <p>Control who can view the file with this link</p>
          </div>
          <div className="-inputs yt-col">
            <SelectFromObject 
              change={handleFormChange}
              items={authTypes}
              display="display"
              displayStartCase={false}
              name="authType"
              selected={authType}
              value="val"
            />
            { authType === 'secret-question' ?
              <div>
                <SelectFromObject
                  change={handleFormChange}
                  items={{ ...individualQA, ...secretQuestions }}
                  display="display"
                  displayStartCase={false}
                  name="selectedQuestion"
                  selected={selectedQuestion}
                  value="val"
                />
                { selectedQuestion === 'other' ?
                  <TextInput
                    change={handleFormChange}
                    name={`secretQuestions.${selectedQuestion}.prompt`}
                    placeholder="Custom secret question"
                    required
                    value={secretQuestions[selectedQuestion].prompt}
                  />
                  :
                  null
                }
                <TextInput
                  change={handleFormChange}
                  helpText="Make sure the answer is something you both know"
                  name="password"
                  placeholder="Shared answer"
                  required
                  value={password}
                />
              </div>
              :
              null
            }
            <div className="alert-message warning -left -small">
            { authType === 'none' ? 
              <p><small><strong>Note: </strong>Anyone with the link can access these files.</small></p> 
              :
              <p><small><strong>Note: </strong>Only those who know the answer to the question can access these files.</small></p> 
            }
            </div>
          </div>
        </div>
        <hr/>
        <div className="-setting yt-row space-between">
          <div className="-instructions yt-col">
            <p><strong>Template</strong></p>
            <p>Select template</p>
          </div>
          <div className="-inputs yt-col">
            <SelectFromObject
              change={handleTemplateChange}
              display="name"
              filterable={true}
              label="Choose a template"
              name="templateId"
              value="templateID"
              items={newTemplates}
              required={true}
              selected={templateId}
              displayStartCase={false}
            />
            {
              templateId === "custom" ?
              <div className="input-group">
                <button className="yt-btn small link info" style={{ width: "100%" }} onClick={handleJotblocksModal}>
                  {
                    elements.length ? "Setup new custom template" : "Setup custom template"
                  }
                </button>                  
              </div> : null
            }
          </div>
        </div>
        { signers && signers.length ? <hr/> : null }
        {
          signers && signers.length ?
          <div className="-setting yt-row space-between">
            <div className="-instructions yt-col">
              <p><strong>Signer{signers.length > 1 ? 's' : ''}</strong></p>
            </div>
            <div className="-inputs yt-col">
              {
                templateId === "custom" && brandingName.title != 'LexShare'?
                <div className="input-group" style={{ marginBottom: "5px" }}>
                  <input
                    checked={kbaEnabled}
                    disabled={false}
                    name="kbaEnabled"
                    onChange={handleCheckInputChange}
                    type="checkbox"
                    value={kbaEnabled}
                  />
                  <small className="help-text" style={{ fontWeight: 600, position: "relative", bottom: "1px" }}><em>Enable KBA</em></small>
                </div>
                : null
              }
              {
                templateId === "custom" && signers && signers.length > 1 ?
                <SelectFromObject
                  change={handleFormChange}
                  display="name"
                  filterable={true}
                  label="Signers can sign..."
                  name="signerSigningOrderType"
                  value="value"
                  items={[{ name: "In any order", value: "parallel" }, { name: "In the displayed order", value: "sequential" }]}
                  required={true}
                  selected={signerSigningOrderType}
                  displayStartCase={false}
                />
                : null
              }
              { fetching ?
                  <div className="loading -small"/>
                  :  
                  signers ?
                  signers.map((signer, i) => 
                    <SignerInput
                      allowSharedEmail={allowSharedEmail}
                      change={handleFormChange}
                      handleSignerChange={handleSignerChange}
                      currentIndex={i}
                      key={'signer' + '_' + i}
                      signerListItems={signerListItems}
                      signer={signer}
                      signersId={signersId}
                      selectedClient={selectedClient}
                      templateId={templateId}

                      selectedQuestion={selectedQuestion}
                      secretQuestions={{ ...directLink, ...secretQuestions }}
                      signers={signers}
                      authType={authType}
                    />
                  )
                  :
                  null
                }
            </div>
          </div>
          : null
        }
        {
          !isConfigScreenView ?
          <div>
            <hr/>
            <div className="-setting yt-row space-between">
              <div className="-instructions yt-col">
                <p><strong>Receive emails</strong></p>
                <p>Auto receive emails when signers completed a file</p>
              </div>
              <div className="-inputs yt-col">
                <button className="yt-btn xx-small u-pullRight input-group" onClick={() => addRecipient("receiver")} ><i className="fal fa-plus"/> Add recipient</button>
                <div className="input-group">
                  {receivers.map((receiver, i) => {
                    return (
                      receiver ?
                      <RecipientInput
                        change={(e) => handleFormChange(e, "receiver")}
                        currentIndex={i}
                        key={'receiver_' + i}
                        recipientListItems={availableStaff}
                        recipient={receiver}
                        removeRecipient={() => removeRecipient(i, "receiver")}
                        filterable={true}
                      />
                      :
                      null
                    )
                    })
                  }
                </div>
              </div>
            </div>
            <hr/>
            <div className="-setting yt-row space-between">
              <div className="-instructions yt-col">
                <p>Notify when viewed</p>
              </div>
              <div className="-inputs yt-col">
                <ToggleSwitchInput
                  change={handleFormChange}
                  disabled={false}
                  inputClasses="-right"
                  name="sN_viewSignatureRequest"
                  required={false}
                  rounded={true}
                  value={sN_viewSignatureRequest}
                />
              </div>
            </div>
            <hr/>
            <div className="-setting yt-row space-between">
              <div className="-instructions yt-col">
                <p>Notify when completed</p>
              </div>
              <div className="-inputs yt-col">
                <ToggleSwitchInput
                  change={handleFormChange}
                  disabled={false}
                  inputClasses="-right"
                  name="sN_signingCompleted"
                  required={false}
                  rounded={true}
                  value={sN_signingCompleted}
                />
              </div>
            </div>
            { (staffClientInfo && staffClientInfo.isFetching) || (selectedStaffClient && selectedStaffClient.length) ? null : <hr/> }
            { (staffClientInfo && staffClientInfo.isFetching) || (selectedStaffClient && selectedStaffClient.length) ? null : 
              <div className="-setting yt-row space-between">
                <div className="-instructions yt-col">
                  <p>Your weekly reminder for incomplete signature requests</p>
                </div>
                <div className="-inputs yt-col">
                  <ToggleSwitchInput
                    change={handleFormChange}
                    disabled={false}
                    inputClasses="-right"
                    name="sN_creatorAutoSignatureReminder"
                    required={false}
                    rounded={true}
                    value={sN_creatorAutoSignatureReminder}
                  />
                </div>
              </div>
            }
            { selectedClient && selectedClient._id ? null : <hr/> }
            { selectedClient && selectedClient._id ? null :
            <div className="-setting yt-row space-between">
              <div className="-instructions yt-col">
                <p>Signer's weekly reminder for incomplete signature requests</p>
              </div>
              <div className="-inputs yt-col">
                <ToggleSwitchInput
                  change={handleFormChange}
                  disabled={false}
                  inputClasses="-right"
                  name="sN_clientAutoSignatureReminder"
                  required={false}
                  rounded={true}
                  value={sN_clientAutoSignatureReminder}
                />
              </div>
            </div>
            }
            <hr/>
            {
              firm.tcFileAccess ?
              <div className="-setting yt-row space-between">
                <div className="-instructions yt-col">
                  <p><strong>Show Terms and Conditions</strong></p>
                  <p>Terms and conditions will appear before accessing the files</p>
                </div>
                <div className="-inputs yt-col">
                  <ToggleSwitchInput
                    change={handleFormChange}
                    disabled={false}
                    inputClasses="-right"
                    name={'showTermsConditions'}
                    required={false}
                    rounded={true}
                    value={showTermsConditions}
                  />
                </div>
              </div> : null
            }
          </div>
          :
          staffListItems.length > 0 ?
          <div>
            {/* <hr/>
            <div className="-setting yt-row space-between">
              <div className="-instructions yt-col">
                <p><strong>Requested By</strong></p>
              </div>
              <div className="-inputs yt-col">
                <SelectFromObject
                  change={handleFormChange}
                  display={'userName'}
                  filterable={true}
                  label="Choose a Staff"
                  name="selectedStaff"
                  value={'_user'}
                  items={staffListItems}
                  required={true}
                  selected={selectedStaff}
                  displayStartCase={false}
                />
              </div>
            </div> */}
            <hr/>
            <div className="-setting yt-row space-between">
              <div className="-instructions yt-col">
                <p><strong>Receive emails</strong></p>
                <p>Auto receive emails when signers completed a file</p>
              </div>
              <div className="-inputs yt-col">
              </div>
            </div>
            <div className="yt-row space-between -share-and-request-recepient">
              <div className="yt-col" style={{paddingLeft: '5px'}}>
                <button className="yt-btn xx-small u-pullRight" onClick={() => addRecipient("receiver")} ><i className="fal fa-plus"/> Add recipient</button>
                { receivers.map((receiver, i) => {
                  return (
                    receiver ?
                    <RecipientInput
                      change={(e) => handleFormChange(e, "receiver")}
                      currentIndex={i}
                      key={'receiver_' + i}
                      recipientListItems={staffListItems}
                      recipient={receiver}
                      removeRecipient={() => removeRecipient(i, "receiver")}
                      filterable={true}
                      hiddenBtn={true}
                      hideRemoveBtn={!(i > 0)}
                    />
                    :
                    null
                  )
                })}
              </div>
            </div>
          </div>
          :
          null
        }
        <hr/>
        <div className="setting yt-row space-between">
          <div className="-instructions yt-col">
            <p><strong>Instruction</strong></p>
          </div>
          {/* <TextAreaInput
            change={handleFormChange}
            name="prompt"
            placeholder="Please sign the attached document."
            value={prompt}
            rows="2"
          /> */}
          <div className="input-group">
            <ISReactDraftEditor
              onChange={handleRTEChange}
              defaultValue={prompt}
              title={null}
              placeholder="Please sign the attached document."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

QuickTaskSignatureForm.propTypes = {
  allowSharedEmail: PropTypes.bool
  , cancelLink: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired
  // , disabled: PropTypes.bool
  , formHelpers: PropTypes.object.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , prompt: PropTypes.string.isRequired
  , selectedFile: PropTypes.object.isRequired
  , signerInputs: PropTypes.arrayOf(PropTypes.object).isRequired
  , signerListItems: PropTypes.arrayOf(PropTypes.object).isRequired
  , signers: PropTypes.arrayOf(PropTypes.object).isRequired
  , submitting: PropTypes.bool
  , templateId: PropTypes.string.isRequired
  , isConfigScreenView: PropTypes.bool
}

QuickTaskSignatureForm.defaultProps = {
  allowSharedEmail: false
  , disabled: false
  , formHelpers: {}
  , prompt: ''
  , selectedFile: {}
  , signers: []
  , signerInputs: []
  , submitting: false
  , templateId: ''
  , isConfigScreenView: false
}


export default QuickTaskSignatureForm;
