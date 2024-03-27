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
import ViewShareLinkFiles from './views/ViewShareLinkFiles.js.jsx';

// import resource component
import CustomTemplate from '../file/components/CustomTemplate.js.jsx';

class ShareLinkRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/share" component={NotFound} />
        <YTRoute exact path="/share/:hex" component={ViewShareLinkFiles}/>
        <YTRoute exact path="/share/:hex/folder/:folderId" component={ViewShareLinkFiles}/>
        <YTRoute exact path="/share/custom-template/preview" component={CustomTemplate}/>

      </Switch>
    )
  }
}

export default ShareLinkRouter;
