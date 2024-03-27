// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { DateTime } from 'luxon';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
// import SingleFolderTemplateOptions from './SingleFolderTemplateOptions.js.jsx';
import { CheckboxInput, TextInput } from '../../../global/components/forms';
import Binder from '../../../global/components/Binder.js.jsx';
import brandingName from '../../../global/enum/brandingName.js.jsx';
import SingleTemplateOptions from './SingleTemplateOptions.js.jsx';
import displayUtils from '../../../global/utils/displayUtils';
import validationUtils from "../../../global/utils/validationUtils";
import * as documentTemplateActions from '../documentTemplateActions'

class DocumentTemplatesListItems extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            templateOptionOpen: false
            , changeTemplateName: false
            , newTemplateName: ''
            , baseTemplateName: ''
            , isTemplateNameValid: true
        }
        this._bind(
            '_handleCloseTemplateOption'
            , '_toggleUpdateTemplateName'
            , '_handleUpdateTemplateName'
            , '_handleFormChange'
        )
    }

    _handleCloseTemplateOption(e) {
        e.stopPropagation();
        this.setState({ templateOptionOpen: false });        
    }

    _toggleUpdateTemplateName(e) {
        e.stopPropagation();
        const { template } = this.props;
        // preserve the fileExtension by removing it from the filename here. We'll add it back when they save.
        const baseTemplateName = template.filename.slice(0, template.filename.indexOf(template.fileExtension));
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
        const { dispatch, template } = this.props;

        newTemplateName = newTemplateName ? newTemplateName.trim() : newTemplateName;

        // disable button
        this.setState({ baseFilename: newTemplateName });

        let newTemplate = _.cloneDeep(template);
        // Add the fileExtension back to the filename.
        newTemplate.filename = newTemplateName + (template.fileExtension || "");
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

    render() {
        const {
            userMap
            , loggedInUser
            , template
            , match
            , handleSelectTemplate
            , checked
            , handleOpenModal
        } = this.props;

        const {
            templateOptionOpen
            , changeTemplateName
            , newTemplateName
            , isTemplateNameValid
            , baseTemplateName
        } = this.state;


        let uploaderName = "";
        const filenameErrorMessage = `A template name can't contain any of the following characters: \ / : * ? " < > |`;
        const icon = displayUtils.getFileIcon(template.category, template.contentType, template);   
        if (userMap && userMap[template._createdBy]) {
            uploaderName = `${userMap[template._createdBy].firstname} ${userMap[template._createdBy].lastname}`
        }

        return(
            <div className="table-row -file-item">
                <div className="table-cell">
                    <CheckboxInput
                        name="file"
                        value={checked}
                        change={() => handleSelectTemplate(template._id)}
                        checked={checked}
                    />
                </div>
                <div className="table-cell">
                    <div className="-options" onClick={() => this.setState({ templateOptionOpen: true })} style={{ cursor:"pointer" }}>
                        <div style={{position: "relative", height: "100%", width: "100%"}}>
                            <CloseWrapper
                                isOpen={templateOptionOpen}
                                closeAction={this._handleCloseTemplateOption}
                            />
                            <i className="far fa-ellipsis-v"></i>
                            <SingleTemplateOptions
                                isOpen={templateOptionOpen}
                                template={template}
                                closeAction={() => this.setState({ templateOptionOpen: false })}
                                toggleUpdateTemplateName={this._toggleUpdateTemplateName}
                                handleOpenModal={handleOpenModal}
                            />
                        </div> 
                    </div>
                </div>
                <div className="table-cell -title -break-word">
                    <div className="yt-row center-vert">
                        <span className="-icon">
                            <img src={brandingName.image[icon] || `/img/icons/${icon}.png`} />
                        </span>
                        {
                            changeTemplateName ? 
                            <div className="-file-info">
                                <div className="yt-row center-vert">
                                    <div className="-pB_10"> 
                                        <TextInput
                                            change={this._handleFormChange}
                                            name="newTemplateName"
                                            suffix={template.fileExtension}
                                            value={newTemplateName}
                                            onSubmit={this._handleUpdateTemplateName}
                                            showLabel={false}
                                        />
                                    </div>
                                    <div className="center-vert">
                                        <button className="yt-btn x-small link" onClick={this._toggleUpdateTemplateName}>cancel</button>
                                        <button className="yt-btn x-small success" onClick={this._handleUpdateTemplateName} disabled={!isTemplateNameValid || newTemplateName === baseTemplateName || !newTemplateName}>save</button>
                                    </div>
                                </div>
                                { !isTemplateNameValid && <small className="-error-color">{filenameErrorMessage}</small> }
                            </div>
                            :
                            <div className="-file-info">
                                <Link className="-filename" to={match.url + `/${template._id}`}>{template.filename}</Link>
                            </div>
                        }
                    </div>
                </div>
                <div className="table-cell">{uploaderName}</div>
                <div className="table-cell -date">{DateTime.fromISO(template.updated_at).toLocaleString(DateTime.DATE_SHORT)}</div>
            </div>
        )
    }
}

DocumentTemplatesListItems.propTypes = {
    mergeField: PropTypes.object.isRequired
}

DocumentTemplatesListItems.defaultProps = {
    mergeField: {}
}

const mapStoreToProps = (store) => {
    /**
    * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
    * differentiated from the React component's internal state
    */
    return {
        loggedInUser: store.user.loggedIn.user
        , userMap: store.user.byId
    }
  }
  
  export default withRouter(
    connect(
      mapStoreToProps
    )(DocumentTemplatesListItems)
  );
  