/**
 * View component for /files/new
 *
 * Creates a new file from a copy of the defaultItem in the file reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
const async = require('async');
import { DateTime } from 'luxon';
import classNames from 'classnames';
import { Helmet } from 'react-helmet';

// import actions
import * as documentTemplateActions from '../documentTemplateActions';
import * as userActions from '../../user/userActions';

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { TextInput } from '../../../global/components/forms';
import templateUtils from '../../../global/utils/templateUtils.js';
import validationUtils from '../../../global/utils/validationUtils.js';

// import component
import PreviewFile from '../../file/components/PreviewFile.js.jsx';

class SingleTemplate extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            showSideBar: true
            , viewing: 'details'
            , changeTemplateName: false
            , newTemplateName: ''
            , baseTemplateName: ''
            , isTemplateNameValid: true
            , iframeKey: 0
        }
        this._bind(
            '_handleFormChange'
            , '_toggleUpdateTemplateName'
            , '_handleUpdateTemplateName'
            , '_handleFormChange'
            , '_handleRefreshIframe'
        );
    }

    componentDidMount() {
        const { dispatch, match } = this.props;
        dispatch(documentTemplateActions.fetchSingleIfNeeded(match.params.templateId));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    }

    _toggleUpdateTemplateName(e) {
        e.stopPropagation();
        const { documentTemplateStore } = this.props;
        const selectedTemplate = documentTemplateStore.selected.getItem();
        // preserve the fileExtension by removing it from the filename here. We'll add it back when they save.
        const baseTemplateName = selectedTemplate.filename.slice(0, selectedTemplate.filename.indexOf(selectedTemplate.fileExtension));
        this.setState({
            changeTemplateName: !this.state.changeTemplateName
            , newTemplateName: baseTemplateName
            , templateOptionOpen: false
            , isTemplateNameValid: true
            , baseTemplateName
        });
    }

    _handleUpdateTemplateName() {
        if(!this.state.isTemplateNameValid) return;

        let { newTemplateName } = this.state;
        const { dispatch, documentTemplateStore } = this.props;
        const selectedTemplate = documentTemplateStore.selected.getItem();

        newTemplateName = newTemplateName ? newTemplateName.trim() : newTemplateName;

        // disable button
        this.setState({ baseFilename: newTemplateName });

        let newTemplate = _.cloneDeep(selectedTemplate);
        // Add the fileExtension back to the filename.
        newTemplate.filename = newTemplateName + (selectedTemplate.fileExtension || "");
        if(newTemplateName && newTemplateName.length) {
            dispatch(documentTemplateActions.sendUpdatedocumentTemplate(newTemplate)).then((action) => {
                if(action.success) {
                    this.setState({
                        changeTemplateName: false
                        , newTemplateName: ''
                    });
                } else {
                    alert(`ERROR: ${action.error}`);
                }
            });
        }
    }

    _handleFormChange(e) {
        let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
            return e.target.value;
        });
        this.setState(newState)
      
        if(e.target.name === "newTemplateName") {
            if(!validationUtils.checkFilenameIsValid(e.target.value)) {
                this.setState({ isTemplateNameValid: false });
            } else {
                this.setState({ isTemplateNameValid: true });
            }
        }
    }

    _handleRefreshIframe() {
        this.setState({iframeKey: this.state.iframeKey + 1});
    }

    render() {

        const {
            showSideBar
            , viewing
            , changeTemplateName
            , newTemplateName
            , isTemplateNameValid
            , baseTemplateName
            , iframeKey
        } =  this.state;

        const {
            userMap
            , documentTemplateStore
            , userStore
            , match
        } = this.props;

        const selectedTemplate = documentTemplateStore.selected.getItem();
        const filenameErrorMessage = `A template name can't contain any of the following characters: \ / : * ? " < > |`;

        const sideBarClass = classNames(
            'file-preview-sidebar'
            , { '-hidden': !showSideBar }
        )

        const previewClass = classNames(
            'file-preview-container'
            , { '-with-sidebar': showSideBar }
        )

        const sideMenuClass = classNames(
            "-sidebar-menu"
            , { '-open': showSideBar }
        )

        console.log('selectedTemplate', selectedTemplate)


        const isEmpty = (
            !selectedTemplate
            || !selectedTemplate._id
            || documentTemplateStore.selected.didInvalidate
            || userStore.selected.didInvalidate
        );
    
        const isFetching = (
            documentTemplateStore.selected.isFetching
            || userStore.selected.isFetching
        )

        const filePath = templateUtils.getDownloadLink(selectedTemplate);
        
        return (
                <div className="file-preview-layout">
                    <Helmet><title>Template Preview</title></Helmet>
                    {isEmpty ?
                        isFetching ? 
                        <div className="-loading-hero hero">
                            <div className="u-centerText">
                                <div className="loading"></div>
                            </div>
                        </div>  
                        : 
                        <div className="hero -empty-hero">
                            <div className="u-centerText">
                                <p>Looks like you don't have any files yet. </p>
                                <p>Let's add some.</p>
                            </div>
                        </div>
                        :
                        <div style={{ opacity: isFetching ? 0.5 : 1 }}>
                            <div className={previewClass}>
                                <header className="-header fixed">
                                    <div className="-header-content">
                                        <Link to={match.url.substr(0, match.url.lastIndexOf('/'))} className="-exit-preview" >
                                            <i className="fas fa-arrow-left"></i>
                                        </Link>
                                        <div className="-preview-title">
                                            { selectedTemplate.filename }
                                        </div>
                                        <div className="-file-actions">
                                            <a className="yt-btn x-small link bordered" 
                                                href={`${templateUtils.getDownloadLink(selectedTemplate)}?viewingas=DOCXFormat`} 
                                                download target="_blank">
                                                <span> Download as .Docx</span>
                                            </a>
                                            <a className="yt-btn x-small link bordered" 
                                                href={`${templateUtils.getDownloadLink(selectedTemplate)}?viewingas=PDFFormat`} 
                                                download target="_blank">
                                                <span> Download as .PDF</span>
                                            </a>
                                        </div>
                                    </div>
                                </header>
                                <div className="-preview-content">
                                    <div className={sideMenuClass}>
                                        <div className="-icon" onClick={() => this.setState({showSideBar: !this.state.showSideBar, viewing: "details" })}>
                                            { showSideBar ?
                                                <i className="far fa-arrow-to-right fa-lg"/>
                                                :
                                                <i className="far fa-arrow-from-right fa-lg"/>
                                            }
                                        </div>
                                        <div className="-icon" onClick={this._handleRefreshIframe}>
                                            <i className="far fa-redo-alt fa-lg"/>
                                        </div> 
                                    </div>
                                    <PreviewFile
                                        contentType={selectedTemplate.contentType}
                                        filePath={filePath}
                                        isIE={false}
                                        file={selectedTemplate}
                                        iframeKey={iframeKey}
                                        viewingAs="template"
                                        // viewingAs="PDFFormat"
                                    />
                                </div>
                            </div>
                            <div className={sideBarClass}>
                                <div className="tab-bar-nav">
                                    <ul className="navigation">
                                        <li>
                                            <span className={`action-link ${viewing === 'details' ? 'active' : null}`} onClick={() => this.setState({viewing: 'details' })}>Details</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="-content">
                                    <h4>File details</h4>
                                    { changeTemplateName ? 
                                        <div className="-text-field-with-error">
                                            <TextInput
                                                change={this._handleFormChange}
                                                name="newTemplateName"
                                                suffix={selectedTemplate.fileExtension}
                                                value={newTemplateName}
                                                onSubmit={this._handleUpdateTemplateName}
                                                showLabel={false}
                                                helpText={!isTemplateNameValid && filenameErrorMessage}
                                            />
                                            <button className="yt-btn x-small link" onClick={this._toggleUpdateTemplateName}>cancel</button>
                                            <button className="yt-btn x-small success" onClick={this._handleUpdateTemplateName} disabled={!isTemplateNameValid || newTemplateName === baseTemplateName || !newTemplateName}>save</button>
                                        </div>
                                        :
                                        <div>
                                            <div style={{display: 'inline-block'}}>{selectedTemplate && selectedTemplate.filename}</div>
                                            <button className="yt-btn x-small link danger" onClick={this._toggleUpdateTemplateName}>change</button>
                                        </div>
                                    }
                                    <br/>
                                    <p>
                                        <small className="u-muted">Date Created: </small><br/>
                                        {DateTime.fromISO(selectedTemplate.created_at).toLocaleString(DateTime.DATE_SHORT)}
                                    </p>
                                    <br/>
                                    <p>
                                        <small className="u-muted">Uploaded By: </small><br/>
                                        { userMap[selectedTemplate._user] ?
                                            `${userMap[selectedTemplate._user].firstname} ${userMap[selectedTemplate._user].lastname}`
                                            : 'Unknown'
                                        }
                                    </p>
                                    <br/>
                                    <p>
                                        <small className="u-muted">Type: </small><br/>
                                        { selectedTemplate.category }
                                    </p>
                                    <br/>
                                    <p>
                                        <small className="u-muted">Content Type: </small><br/>
                                        { selectedTemplate.contentType }
                                    </p>
                                    <br/>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            )
    }
}

SingleTemplate.propTypes = {
}

SingleTemplate.defaultProps = {

}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
    , documentTemplateStore: store.documentTemplate
    , userStore: store.user
    , userMap: store.user.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SingleTemplate)
);
