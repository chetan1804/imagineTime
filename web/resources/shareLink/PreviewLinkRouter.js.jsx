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
import ViewPreviewFile from './views/ViewPreviewFile.js.jsx';

class PreviewLinkRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/preview" component={NotFound} />
        <YTRoute exact path="/preview/:fileId" component={ViewPreviewFile}/>
      </Switch>
    )
  }
}

export default PreviewLinkRouter;
