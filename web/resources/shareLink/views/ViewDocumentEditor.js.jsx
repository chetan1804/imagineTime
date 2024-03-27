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

// import actions
import * as clientActions from '../../client/clientActions';
import * as fileActions from '../../file/fileActions';
import * as firmActions from '../../firm/firmActions';
import * as quickTaskActions from '../../quickTask/quickTaskActions';
import * as shareLinkActions from '../shareLinkActions';

// import global components
import ISRichTextEditor from '../../../global/components/forms/ISRichTextEditor.js.jsx';
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
import DefaultTopNav from '../../../global/components/navigation/DefaultTopNav.js.jsx';
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';
import ProfileDropdown from '../../../global/components/navigation/ProfileDropdown.js.jsx';
import { FileInput, TextInput } from '../../../global/components/forms';
import apiUtils from '../../../global/utils/api';

// import resource components
import ClientNoteItem from '../../clientNote/components/ClientNoteItem.js.jsx';
import PreviewFile from '../../file/components/PreviewFile.js.jsx';
import ShareLinkAuthForm from '../components/ShareLinkAuthForm.js.jsx';
import ShareLinkLayout from '../components/ShareLinkLayout.js.jsx';
import ShareLinkNav from '../components/ShareLinkNav.js.jsx';


import classNames from 'classnames';
import { DateTime } from 'luxon';
import { auth } from '../../../global/utils';
import { Helmet } from 'react-helmet';
import RichTextEditor from 'react-rte';
import { jsPDF } from "jspdf";

class ViewDocumentEditor extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      docContents: RichTextEditor.createEmptyValue()
    }
    this._bind(
      '_handleRTEChange'
      , 'testButton'
    )
  }

  componentDidMount() {
    const { defaultValue } = this.props;

    const docContents = localStorage.getItem('docContents');

    if(docContents) {
      this.setState({ docContents: RichTextEditor.createValueFromString(docContents, 'html')})
    }
  }
  
  _handleRTEChange(docContents) {
    console.log('tcContents', docContents.toString('html') );
    this.setState({ docContents }, () => {
      localStorage.setItem('docContents', docContents.toString('html'))
    });
  }

  testButton() {
    var doc = new jsPDF();

    const elm = document.querySelector('.DraftEditor-root');
    console.log('DraftEditor-root', elm, doc);
    doc.html(elm, {
      callback: function(doc) {
        doc.save('test pdf.pdf');
      },
      x: 10,
      y: 10
    });
  }

  render() {

    const {
      docContents
    } = this.state;

    return (
      <div>
        <Helmet><title>Document Editor</title></Helmet>
        <button onClick={this.testButton}>save</button>
        <div className="document-editor">
          <RichTextEditor
            onChange={this._handleRTEChange}
            value={docContents}
            toolbar="full"
          />
        </div>
      </div>
    )
  }
}

ViewDocumentEditor.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ViewDocumentEditor)
);