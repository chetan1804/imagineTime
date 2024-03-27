/**
 * Set up routing for all ShareLink views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';
import NotFound from '../../global/components/navigation/NotFound.js.jsx';

// import shareLink views
import ViewFileRequest from './views/ViewFileRequest.js.jsx';
import ViewSignatureRequest from './views/ViewSignatureRequest.js.jsx';
import ViewSignedFile from "./views/ViewSignedFile.js.jsx";
import ViewRequestTask from '../requestTask/views/ViewRequestTask.js.jsx';

class ShareLinkRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/request" component={NotFound} />
        <YTRoute exact path="/request/file/:hex" component={ViewFileRequest}/>
        <YTRoute exact path="/request/signature/:hex" component={ViewSignatureRequest}/>
        <YTRoute exact path="/request/request-task/:hex" component={ViewRequestTask} />
        {/* <YTRoute exact path="/request/request-task/:hex/:requestTaskId/:viewingAs" component={ViewRequestTask} /> */}
        <YTRoute exact path="/request/signedFile/:hex/files/:fileId" component={ViewSignedFile}/>
      </Switch>
    )
  }
}

export default ShareLinkRouter;
