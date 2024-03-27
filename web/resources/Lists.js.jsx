/**
 * view component for /firm/:firmId/sharelinks
 */

// import primary libraries
import React from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';

// import global components
import Binder from '../global/components/Binder.js.jsx';
import Breadcrumbs from '../global/components/navigation/Breadcrumbs.js.jsx';

// import firm components
import PracticeLayout from '../global/practice/components/PracticeLayout.js.jsx';

class Lists extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const { 
      location
      , match
    } = this.props;


    return  (
      <PracticeLayout >
        <Helmet>
          <title>Lists</title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>Lists</h1>
        </div>
        <div className="-practice-content">
          <div className="yt-container fluid">
            <div className="yt-container fluid">
              <div className="-option-list">
                <Link className="-link" to={`/firm/${match.params.firmId}/lists/links`}>Shared Links</Link>
              </div>
              <div className="-option-list">
                <Link className="-link" to={`/firm/${match.params.firmId}/lists/file-activity`}>Files Activity</Link>
              </div>
              <div className="-option-list">
                <Link className="-link" to={`/firm/${match.params.firmId}/lists/file-note`}>Files Notes</Link>
              </div>
              <div className="-option-list">
                <Link className="-link" to={`/firm/${match.params.firmId}/lists/client-message`}>Clients Messages</Link>
              </div>
              <div className="-option-list">
                <Link className="-link" to={`/firm/${match.params.firmId}/lists/request-task`}>Request List Tasks</Link>
              </div>
            </div>
          </div>
        </div>
      </PracticeLayout>
    )
  }
}

const mapStoreToProps = (store, props) => {
  return {};
}

export default withRouter(
  connect(
    mapStoreToProps
  )(Lists)
);
