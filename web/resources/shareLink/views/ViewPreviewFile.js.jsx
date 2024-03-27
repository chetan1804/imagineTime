/**
 * View component for /share-links/:shareLinkId
 *
 * Displays a single shareLink from the 'byId' map in the shareLink reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, history, withRouter } from 'react-router-dom';
import queryString from 'query-string';

// import actions
import * as fileActions from '../../file/fileActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import PreviewFile from '../../file/components/PreviewFile.js.jsx';
import brandingName from '../../../global/enum/brandingName.js.jsx';

import classNames from 'classnames';
import { fileUtils } from '../../../global/utils';
import { Helmet } from 'react-helmet';

class ViewPreviewFile extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      alertModalOpen: false 
      , password: ''
      , expired: false 
      , selectedFile: null 
      , showSideBar: true  
      , viewing: 'comments'
      , selectedFileIds: []
      , uploadName: ''
      , uploadNameSet: false
      , showTermsAndServices: false
      , tcContents: ''
      , tcCheckboxStatus: false
    }
    this._bind()
  }

  componentDidMount() {
    console.log('did mount');
    const { dispatch, loggedInUser, match } = this.props;

    const { vendorapitoken } = queryString.parse(window.location.search);

    console.log('vendorapitoken', vendorapitoken);

    if(vendorapitoken) {
      dispatch(fileActions.fetchSingleFileById(match.params.fileId, vendorapitoken)).then(fileRes => {});
    }
  }

  render() {
    const { 
      clientStore 
      , fileStore 
      , firmStore 
      , location 
      , loggedInUser
      , shareLinkStore 
      , disabled
      , checked
      , handleSelectFile
    } = this.props;

    const selectedFile = fileStore.selected.getItem();

    const isEmpty = (
      !selectedFile
    );

    const isFetching = (
      fileStore.selected.isFetching
    ) 

    const previewClass = classNames(
      'file-preview-container'
      , { '-with-sidebar': false }
    )

    let firmLogo = brandingName.image.icon;
    // if(selectedFirm && selectedFirm._id && selectedFirm.logoUrl) {
    //   firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`
    // }
    
    return (
      <div>
        <Helmet><title>Preview File</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <div className="flex column">
              <section className="section white-bg the-404">
                <div className="hero flex three-quarter ">
                  <div className="yt-container slim">
                    <h1> Whoops! <span className="light-weight">Something wrong here</span></h1>
                    <hr/>
                    <h4>Either this link no longer exists, or your credentials are invalid.</h4>
                  </div>
                </div>
              </section>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className={previewClass}>
              <header className="-header fixed">
                <div className="-header-content">
                  <div className="-exit-preview" >
                    <img style={{
                      "maxHeight": "80%",
                      "width": "auto",
                      "opacity": .97
                    }}
                    src={firmLogo}/>
                  </div>
                  <div className="-preview-title">
                    { selectedFile.filename }
                  </div>
                  <div className="-file-actions">

                  </div>
                </div>
              </header>
              <div className="-preview-content">
                <PreviewFile
                  contentType={selectedFile.contentType}
                  filePath={fileUtils.getDownloadLink(selectedFile)}
                  isIE={false}
                  file={selectedFile}
                />
              </div>
            </div>
          </div>
        }
      </div>
    )
  }
}

ViewPreviewFile.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientStore: store.client 
    , fileStore: store.file
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , shareLinkStore: store.shareLink
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ViewPreviewFile)
);
