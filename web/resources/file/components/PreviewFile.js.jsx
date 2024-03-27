/**
 * TODO: @ffugly
 * open file preview instead of download link
 */

// import primary libraries
import React from 'react'
import PropTypes from 'prop-types'

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import PDFViewer from '../../../global/components/helpers/PDFViewer.js.jsx';
import PDFEditor from '../../../global/components/helpers/PDFEditor.js.jsx';

import { fileUtils } from '../../../global/utils';
// import utils
import displayUtills from '../../../global/utils/displayUtils.js';import { findLastIndex } from 'lodash';
;

// // import event tracking
// import UserClickEvent from '../../userEvent/components/UserClickEvent.js.jsx';
// import UserViewEvent from '../../userEvent/components/UserViewEvent.js.jsx';

class PreviewFile extends Binder {
  constructor(props) {
    super(props);

    this.state = {
    }

    this._bind(
      '_handleIframeLoad'
    )
  }

 
  // shouldComponentUpdate(nextProps, nextState) {
  //   if(this.props.file && this.props.file._id && nextProps.file && nextProps.file._id) {
  //     return true;
  //   }
  //   return false;
  // }

  componentDidMount() {

  }

  _handleIframeLoad() {
    console.log('iframe is loaded');
  }

  render() {
    const { contentType, filePath, isIE
      , isEditor, signers, selectedSignerIndex, handleSelectedJotblock, handleElements, handleSignatureStyle
      , handleAttachment, file, viewingAs } = this.props;

    // let icon = displayUtills.getFileIcon(file.fileType, contentType);

    const InternetExplorerMessage = (
      <div><span><small>If you're using Internet Explorer, right-click the DOWNLOAD button and select "Save target as..."</small></span></div>
    )

    const fileExtension = file && file.fileExtension ? file.fileExtension : "";

    if(!isEditor && contentType && contentType.includes("image") || ['.jpg', '.png', '.jpeg'].includes(fileExtension.toLowerCase())) {
      return(
        // <UserViewEvent
        //   description="File View Event"
        //   eventAction="view"
        //   eventType="file"
        //   listArgs={['_file', file._id]}
        //   refKey="_file"
        //   refId={file._id}
        // >
          <div className="-preview-file -image">
            <img src={filePath}/>
            { isIE ?
              InternetExplorerMessage
              :
              null
            }
          </div>
        // </UserViewEvent>
      )
    } else if(!isEditor && contentType && contentType.includes("video") || (fileExtension && fileExtension.indexOf('.mp4') > -1)) {
      return (
        // <UserViewEvent
        //   description="File View Event"
        //   eventAction="view"
        //   eventType="file"
        //   listArgs={['_file', file._id]}
        //   refKey="_file"
        //   refId={file._id}
        // >
          <div className="-preview-file -video">
            <video width="100%" controls>
              <source src={filePath} type="video/mp4" />
            </video>
            { isIE ?
              InternetExplorerMessage
              :
              null
            }
          </div>
        // </UserViewEvent>
      )
    } else if(viewingAs === "PDFFormat" || contentType && contentType.includes("pdf") || [".pdf"].includes(fileExtension.toLowerCase())) {
      return (
        // <UserViewEvent
        //   description="File View Event"
        //   eventAction="view"
        //   eventType="file"
        //   listArgs={['_file', file._id]}
        //   refKey="_file"
        //   refId={file._id}
        // >
          <div className="-preview-file -pdf">
            {
              isEditor ?
              <PDFEditor
                ref="pdfEditor"
                filePath={filePath}
                autoScroll={false}
                onDone={() => null}
                hidden={false}
                signers={signers}
                selectedSignerIndex={selectedSignerIndex}
                handleSelectedJotblock={handleSelectedJotblock}
                handleElements={handleElements}
                handleSignatureStyle={handleSignatureStyle}
                handleAttachment={handleAttachment}
              /> :
              <PDFViewer
                filePath={filePath}
                autoScroll={false}
                onDone={() => null}
                hidden={false}
              />          
            }
            { isIE ?
              InternetExplorerMessage
              :
              null
            }
          </div>
        // </UserViewEvent>
      )
    } else if(['.doc', '.docx', '.dotx', '.xlsx', '.csv', '.xls'].includes(fileExtension)) {
      const fileUrl = viewingAs === "template" && filePath ? window.appUrl + filePath : `${window.appUrl}` + fileUtils.getDownloadLink(file);
      //testing purposes
      //const fileUrl = `https://app.imaginetime.com` + fileUtils.getDownloadLink(file);

      return(
        <div style={{'width': '85%', 'height': '100%', 'margin': '0 20px'}}>
          <iframe
            key={this.props.iframeKey}
            id="googleDocsIframe"
            style={{'border': 'none'}}
            src={"https://docs.google.com/gview?key=AIzaSyBoXLcvu10Z9zPbZBcXW-cZiNVrMla07DI&embedded=true&url=" + fileUrl}
            title="file"
            width="100%"
            height="100%"
            onLoad={this._handleIframeLoad}
            onError={this._handleIframeError}
          >
          </iframe>
        </div>
      )

    } else {
      return <div>{`Can't display a preview for "${file && fileExtension ? fileExtension : contentType}" file`}</div>
    }
  }

}

PreviewFile.propTypes = {
  contentType: PropTypes.string.isRequired  
  , filePath: PropTypes.string.isRequired
  , isIE: PropTypes.bool 
  , iframeKey: PropTypes.number
}

PreviewFile.defaultProps = {
  isIE: false 
  , iframeKey: 0
}

export default PreviewFile;
