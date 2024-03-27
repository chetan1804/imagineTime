// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import SingleFolderTemplateOptions from './SingleFolderTemplateOptions.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms';
import Binder from '../../../../global/components/Binder.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';
import * as folderTemplateActions from '../../folderTemplateActions';

class PracticeFolderTemplateTableListItem extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            folderTemplateOptionsOpen: false
            , deleteShowWarning: false
        }
        this._bind(
            '_handleCloseTemplateListOptions'
            , 'deleteFolderTemplate'
        )
    }

    _handleCloseTemplateListOptions(e) {
        e.stopPropagation();
        this.setState({ folderTemplateOptionsOpen: false });        
    }

    deleteFolderTemplate(folderId) {
        const { dispatch, folderTemplate } = this.props;
        dispatch(folderTemplateActions.sendDeleteRootFolderTemplate(folderTemplate._id)).then(json => {
          this.setState({ folderTemplateOptionsOpen: false, deleteShowWarning: false })
        });
    }

    render() {
        const {
            folderTemplate
            , userMap
            , match
            , viewingAs
            , checked
            , handleSelectTemplate 
            , dispatch
        } = this.props;

        const {
            folderTemplateOptionsOpen
            , deleteShowWarning
        } = this.state;

        const isEmpty = (
            !folderTemplate
            || !folderTemplate._id
        )

        const createdBy = userMap && folderTemplate && folderTemplate._createdBy && userMap[folderTemplate._createdBy] ?
        userMap[folderTemplate._createdBy].firstname + " " + userMap[folderTemplate._createdBy].lastname : "n/a";
    
        const subfolderCount = folderTemplate && folderTemplate.subfolder && folderTemplate.subfolder.length ?
            folderTemplate.subfolder.filter(folder => folder.status === "visible") : [];
    
        const recycleBinSubFolderCount = folderTemplate && folderTemplate.subfolder && folderTemplate.subfolder.length ?
            folderTemplate.subfolder.filter(folder => folder.status === "deleted") : [];

            
        return isEmpty ?
            (<div>
                <div className="table-cell"><i className="far fa-spinner fa-spin"/>  Loading...</div>
            </div>)
            :
            (<div className="table-row -file-item">
                <div className="table-cell">
                    {
                        viewingAs === "templateListModal" ?
                        <input
                            type="radio"
                            value={folderTemplate._id}
                            name="template"
                            onChange={() => handleSelectTemplate(folderTemplate._id)}
                            checked={checked}
                        />
                        :
                        viewingAs === "templateList" ?
                        <CheckboxInput
                            // disabled={checked}
                            name="template"
                            value={checked}
                            change={() => handleSelectTemplate(folderTemplate._id)}
                            checked={checked}
                        />
                        :
                        <div className="-options" onClick={() => this.setState({folderTemplateOptionsOpen: true})} style={{ cursor:"pointer" }}>
                            <div style={{position: "relative", height: "100%", width: "100%"}}>
                                <CloseWrapper
                                    isOpen={folderTemplateOptionsOpen}
                                    closeAction={this._handleCloseTemplateListOptions}
                                />
                                <i className="far fa-ellipsis-v"></i>
                                <SingleFolderTemplateOptions
                                    isOpen={folderTemplateOptionsOpen}
                                    folderTemplate={folderTemplate}
                                    closeAction={() => this.setState({folderTemplateOptionsOpen: false})}
                                    dispatch={dispatch}
                                    deleteFolderTemplate={this.deleteFolderTemplate}
                                    handleDeleteWarningModal={() => this.setState({ deleteShowWarning: !deleteShowWarning })}
                                    deleteShowWarning={deleteShowWarning}
                                />
                            </div> 
                        </div>
                    }
                </div>
                <div className="table-cell -folder-title -without-description -folder-template">
                    <div className="yt-row center-vert">
                        <span className="-icon">
                            <img src={brandingName.image['folder-template']} />
                        </span>
                        <div className="-file-info">
                            {
                                viewingAs === "templateListModal" ?
                                <a className="-filename" onClick={() => handleSelectTemplate(folderTemplate._id)}>
                                    {folderTemplate.name}
                                </a>
                                :
                                <Link className="-filename" to={`${match.url}/${folderTemplate._id}/update`}>
                                    {folderTemplate.name}
                                </Link>
                            }
                            {/* <button className="yt-btn x-small link info" onClick={() => console.log("testme")}>
                                {folderTemplate.name}
                            </button> */}
                        </div>
                    </div>
                </div>
                <div className="table-cell">
                    {folderTemplate.description || "n/a"}
                </div>
                <div className="table-cell" style={{ minWidth: "150px" }}>{subfolderCount.length}</div>
                <div className="table-cell" style={{ minWidth: "150px" }}>{recycleBinSubFolderCount.length}</div>
                <div className="table-cell">
                    {createdBy}
                </div>
                <div className="table-cell -date">
                    {DateTime.fromISO(folderTemplate.updated_at).toLocaleString(DateTime.DATE_SHORT)}
                </div>
            </div>)
    }

}

PracticeFolderTemplateTableListItem.propTypes = {
    folderTemplate: PropTypes.object.isRequired
    , user: PropTypes.object.isRequired
}

PracticeFolderTemplateTableListItem.defaultProps = {
    folderTemplate: {}
    , user: {}
}

export default PracticeFolderTemplateTableListItem