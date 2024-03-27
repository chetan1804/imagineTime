/**
 * Set up routing for all file activity views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import file activity views
import FileActivityList from './views/FileActivityList.js.jsx';

class FileActivityRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const firmId = this.props.location.pathname.split('/')[2];
    return (
      <Switch>
        <YTRoute
            breadcrumbs={[{display: 'Lists', path: `/firm/${firmId}/lists`}, {display: 'Files Activity', path: null}]}
            component={FileActivityList}
            path="/firm/:firmId/file-activity"
            exact
            staff={true}
        />
      </Switch>
    )
  }
}

export default FileActivityRouter;
