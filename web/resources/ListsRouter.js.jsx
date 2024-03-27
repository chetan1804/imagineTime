/**
 * Set up routing for all file activity views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Switch } from 'react-router-dom';

// import global components
import Binder from '../global/components/Binder.js.jsx';
import YTRoute from '../global/components/routing/YTRoute.js.jsx';

import Lists from './Lists.js.jsx';
import FileActivityList from './fileActivity/views/FileActivityList.js.jsx';
import NoteList2 from './note/views/NoteList2.js.jsx';
import ClientPostList2 from './clientPost/views/ClientPostList2.js.jsx';
import ShareLinkList from './shareLink/views/ShareLinkList.js.jsx';
import RequestTaskList2 from './requestTask/views/RequestTaskList2.js.jsx';

class ListsRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const firmId = this.props.location.pathname.split('/')[2];
    return (
      <Switch>
        <YTRoute
            breadcrumbs={[{display: 'Lists', path: null }]}
            component={Lists}
            path="/firm/:firmId/lists"
            exact
            staff={true}
        />
        <YTRoute
            breadcrumbs={[{display: 'Lists', path: `/firm/${firmId}/lists`}, {display: 'Shared Links', path: null}]}
            component={ShareLinkList}
            path="/firm/:firmId/lists/links/"
            exact
            staff={true}
        />
        <YTRoute
            breadcrumbs={[{display: 'Lists', path: `/firm/${firmId}/lists`}, {display: 'Client Messages', path: null}]}
            component={ClientPostList2}
            path="/firm/:firmId/lists/client-message/"
            exact
            staff={true}
        />
        <YTRoute
            breadcrumbs={[{display: 'Lists', path: `/firm/${firmId}/lists`}, {display: 'Files Activity', path: null}]}
            component={FileActivityList}
            path="/firm/:firmId/lists/file-activity"
            exact
            staff={true}
        />
        <YTRoute
            breadcrumbs={[{display: 'Lists', path: `/firm/${firmId}/lists`}, {display: 'Files Notes', path: null}]}
            component={NoteList2}
            path="/firm/:firmId/lists/file-note/"
            exact
            staff={true}
        />
        <YTRoute
            breadcrumbs={[{display: 'Lists', path: `/firm/${firmId}/lists`}, {display: 'Request List Tasks', path: null}]}
            component={RequestTaskList2}
            path="/firm/:firmId/lists/request-task/"
            exact
            staff={true}
        />
      </Switch>
    )
  }
}

export default ListsRouter;
