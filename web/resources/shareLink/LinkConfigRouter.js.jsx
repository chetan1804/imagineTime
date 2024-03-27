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
import ViewLinkConfigRequestFile from './views/ViewLinkConfigRequestFile.js.jsx';
import ViewLinkConfigShareFiles from './views/ViewLinkConfigShareFiles.js.jsx';
import ViewLinkConfigRequestSignature from './views/ViewLinkConfigRequestSignature.js.jsx';
import ViewLinkTestActions from './views/ViewLinkTestActions.js.jsx';
import ShareLinkList from './views/ShareLinkList.js.jsx';

class LinkConfigRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/link" component={NotFound} />
        <YTRoute exact path="/link/request-file" component={ViewLinkConfigRequestFile}/>
        <YTRoute exact path="/link/share-file" component={ViewLinkConfigShareFiles}/>
        <YTRoute exact path="/link/request-signature" component={ViewLinkConfigRequestSignature}/>
        <YTRoute exact path="/link/test" component={ViewLinkTestActions} />
      </Switch>
    )
  }
}

export default LinkConfigRouter;
