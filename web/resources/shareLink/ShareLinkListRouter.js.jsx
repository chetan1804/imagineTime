/**
 * Set up routing for all ShareLink views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import shareLink views
import ShareLinkList from './views/ShareLinkList.js.jsx';

class ShareLinkListRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const firmId = this.props.location.pathname.split('/')[2];
    return (
      <Switch>
        <YTRoute
            breadcrumbs={[{display: 'Lists', path: `/firm/${firmId}/lists`}, {display: 'Shared Links', path: null}]}
            component={ShareLinkList}
            path="/firm/:firmId/links"
            exact
            staff={true}
        />
      </Switch>
    )
  }
}

export default ShareLinkListRouter;
