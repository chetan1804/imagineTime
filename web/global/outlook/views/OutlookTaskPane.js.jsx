import React from 'react';
import PropTypes from 'prop-types';
import { HashRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import OutlookActions from '../components/OutlookActions.js.jsx';
import OutlookAttach from '../components/OutlookAttach.js.jsx';
import OutlookLayout from '../components/OutlookLayout.js.jsx';
import OutlookLoading from '../components/OutlookLoading.js.jsx';
import OutlookRequestFiles from '../components/OutlookRequestFiles.js.jsx';
import OutlookRequestSignatures from '../components/OutlookRequestSignatures.js.jsx';
import OutlookRoute from '../components/OutlookRoute.js.jsx';
import OutlookSettings from '../components/OutlookSettings.js.jsx';
import OutlookShareFiles from '../components/OutlookShareFiles.js.jsx';
import OutlookUploadFiles from '../components/OutlookUploadFiles.js.jsx';
import OutlookUserAccount from '../components/OutlookUserAccount.js.jsx';
import OutlookWelcome from '../components/OutlookWelcome.js.jsx';
import OutlookUserLogin from './OutlookUserLogin.js.jsx';
import OutlookForgotPassword from '../components/OutlookForgotPassword.js.jsx'
import FileJotBlocks from '../../../resources/file/components/FileJotBlocks.js.jsx';
import SelectFolderList from "../../../resources/folder/components/SelectFolderList.js.jsx";

import Auth from '../../utils/auth';

function handleCustomTemplate(signers, customeTemplate) {
  let messageObject = {
    messageText: "dialogClosed"
    , signers
    , customeTemplate
  };
  console.log("child: send message");

  let jsonMessage = JSON.stringify(messageObject);
  Office.context.ui.messageParent(jsonMessage);
}

function handleSelectFolder(selectedFolder) {

  let messageObject = {
    messageText: "dialogClosed",
    selectedFolder
  }

  console.log('messageObject', messageObject);
  
  let jsonMessage = JSON.stringify(messageObject);
  Office.context.ui.messageParent(jsonMessage);
}

const OutlookTaskPane = (props) => {

  let { isIframeInitialized, isOfficeInitialized, startRoute } = props;

  // selected file
  let selectedFile = localStorage.getItem("selectedFile");
  selectedFile = selectedFile ? JSON.parse(selectedFile) : null;

  if (isOfficeInitialized) {
    isIframeInitialized = false;
  }

  if (!isOfficeInitialized && !isIframeInitialized) {
    return (<OutlookLoading />);
  }
  const viewingAs = window && window.location && window.location.href && window.location.href.includes("custom-template") ? "custom-template-plugin" : window.location.href.includes("select-folder") ? "select-folder-plugin" : "";

  // Must use the HashRouter for Outlook add in. The official version of office.js nullifies
  // the history functionality in React. See the link for more info.
  // https://stackoverflow.com/questions/42642863/office-js-nullifies-browser-history-functions-breaking-history-usage
  return (
    <OutlookLayout viewingAs={viewingAs}>
      <Router>
        <Switch>
          <Route exact path="/login" component={OutlookUserLogin} />
          <Route exact path="/forgot-password" component={OutlookForgotPassword} />
          <Route exact path="/custom-template" 
            render={(props) => <FileJotBlocks {...props} selectedFile={selectedFile} handleCustomTemplate={handleCustomTemplate} />}
          />
          <Route exact path="/select-folder/:firmId/:clientId" 
            render={(props) => <SelectFolderList {...props} handleSelectFolder={handleSelectFolder} />}
          />
          '<Route exact path="/select-folder/:firmId/public/:userId" 
            render={(props) => <SelectFolderList {...props} handleSelectFolder={handleSelectFolder} />}
          />
          <Route exact path="/">
            { startRoute && !Auth.notLoggedIn() ? <Redirect to={`/${startRoute}`} /> : <OutlookWelcome />}
          </Route>
          <OutlookRoute isIframeInitialized={isIframeInitialized} path="/account" component={OutlookUserAccount} />
          <OutlookRoute isIframeInitialized={isIframeInitialized} path="/actions" component={OutlookActions} />
          <OutlookRoute isIframeInitialized={isIframeInitialized} path="/attach" component={OutlookAttach} />
          <OutlookRoute isIframeInitialized={isIframeInitialized} path="/request" component={OutlookRequestFiles} />
          <OutlookRoute isIframeInitialized={isIframeInitialized} path="/settings" component={OutlookSettings} />
          <OutlookRoute isIframeInitialized={isIframeInitialized} path="/share" component={OutlookShareFiles} />
          <OutlookRoute isIframeInitialized={isIframeInitialized} path="/signature" component={OutlookRequestSignatures} />
          {/* Add 'forward' param so we can use this component for sharing files and requesting signatures. */}
          <OutlookRoute isIframeInitialized={isIframeInitialized} path="/upload/:forward" component={OutlookUploadFiles} />
        </Switch>
      </Router>
    </OutlookLayout>
  );
};

OutlookTaskPane.propTypes = {
  isOfficeInitialized: PropTypes.bool,
  startRoute: PropTypes.string,
  isIframeInitialized: PropTypes.bool
};

OutlookTaskPane.defaultProps = {
  isOfficeInitialized: false,
  isIframeInitialized: true
};

export default OutlookTaskPane;
