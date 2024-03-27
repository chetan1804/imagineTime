/**
 * Set up routing for all File views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter  } from 'react-router-dom';
import { connect } from 'react-redux';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import file views
import ClientFiles from './views/ClientFiles.js.jsx';
import ClientSingleFile from './views/ClientSingleFile.js.jsx';

class FilePortalRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const { breadcrumbs } = this.props;

    return (
      <Switch>
        <YTRoute breadcrumbs={breadcrumbs} exact clientUser={true} path="/portal/:clientId/files/folder/:folderId" component={ClientFiles} />
        <YTRoute breadcrumbs={breadcrumbs} exact clientUser={true} path="/portal/:clientId/files/:fileId" component={ClientSingleFile}/>
        <YTRoute breadcrumbs={breadcrumbs} exact clientUser={true} path="/portal/:clientId/files/folder/:folderId/:fileId" component={ClientSingleFile}/>
        <YTRoute breadcrumbs={breadcrumbs} exact clientUser={true} path="/portal/:clientId/files" component={ClientFiles} />
      </Switch>
    )
  }
}

const mapStoreToProps = (store, props) => {

  const { match } = props;
  const files = store.file && store.file.byId ? store.file.byId : null;
  const clientId  = props.match.params.clientId;

  // , fileId cannot get from FilePracticeRouter without set in breadcrumbs first 
  let fileId = match.params.fileId;

  // another way to find out where your page is
  const path = props.location.pathname.split('/');
  fileId = path[4] === "folder" ? path[5] : fileId;

  // default value
  let breadcrumbs = [{display: 'My Files', path: `/portal/${clientId}/files`}];

  if (fileId && files) {

    do {
      fileId = breadcrumbs.length === 1 ? fileId : files[fileId]._folder;
      if (fileId && files[fileId]) { // check again
        if (files[fileId].status === "visible" || files[fileId].status === "none") {
          
          breadcrumbs.splice(1, 0, {
            display: files[fileId].filename
            , path:`/portal/${clientId}/files/folder/${fileId}`
          });
        }
      }
    } while (files[fileId] ? files[fileId]._folder : false)
  }

  return {
    breadcrumbs
  }  
}

export default withRouter(
  connect(
  mapStoreToProps
)(FilePortalRouter)
);
