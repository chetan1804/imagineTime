
const async = require('async');

// import primary libraries
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import ContentEditable from 'react-simple-contenteditable'
import { DateTime } from 'luxon';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

// import utilities
import { foldersUtil } from '../../../../global/utils';
import * as constants from '../../../../config/constants.js';

// import resource components
import PracticeFolderTemplateTableListItem from './PracticeFolderTemplateTableListItem.js.jsx';
import _, { filter } from 'lodash';
import forms, { TextInput } from  '../../../../global/components/forms';
import folder from '../../../folder/folderReducers.js';
import FolderPermissionModdal from '../../../folderPermission/components/folderPemissionModal.js.jsx';

class SubFolderEmplateForm extends Binder {
    constructor(props) {
        super(props);

        console.log('foldertemplate props', props);
        this.state = {
            subFolderListItems: []
            , isUpdateViewing: props.match.params.folderTemplateId && props.match.params.folderTemplateId != "new"
            , selectedFolder: {} // props.folderTemplate
            , isOpen: false
        }
        this._bind(
            '_handleAddSubFolder'
            , '_handleDeleteSubFolder'
            , '_handleRestoreSubFolder'
            , '_handleSubfolderChange'
            , '_handleSelectFolder'
            , '_handleFormChange'
            , '_handleShowPermission'
            , '_handleCloseModal'
        )
    }

    componentWillReceiveProps(prevProps) {
        const { folderTemplate } = prevProps;
        const subFolderListItems = _.cloneDeep(this.state.subFolderListItems);
        if (folderTemplate && folderTemplate.subfolder && subFolderListItems && !subFolderListItems.length) {
            this.setState({ subFolderListItems: folderTemplate.subfolder });
        }
    }

    _handleAddSubFolder() {
        const { selectedFirm } = this.props;

        const selectedFolder = _.cloneDeep(this.state.selectedFolder);
        const subFolderListItems = _.cloneDeep(this.state.subFolderListItems);
        const newId = `${new Date().getTime()}_rand${Math.floor(Math.random()*(999-100+1)+100)}`;
        const totalSameGroupFiles = subFolderListItems.filter(folder => selectedFolder._createdBy || selectedFolder._id === "root" ? !folder._folder : selectedFolder._id === folder._folder).length;
        const count = selectedFolder._createdBy || selectedFolder._id === "root" ? totalSameGroupFiles : `${selectedFolder.count}.${totalSameGroupFiles}`;
        let folderItem = { 
            _id: newId
            , name: `New Folder`
            , count: _.toString(count) 
            , _folder: selectedFolder._createdBy || selectedFolder._id === "root" ? null : selectedFolder._id
            , status: "visible"
            , updated_at: DateTime.local()
        }
        const FOLDER_PERMISSION_FIELDS = constants.FOLDER_PERMISSION_FIELDS;

        FOLDER_PERMISSION_FIELDS.map(key => {
            folderItem[key] = !!(selectedFirm && selectedFirm.permission && selectedFirm.permission[key]);
        });

        subFolderListItems.push(folderItem);
        console.log('selectedFirm add sub folder', selectedFirm);
        this.setState({ subFolderListItems });   
    }

    _handleDeleteSubFolder() {

        const selectedFolder = _.cloneDeep(this.state.selectedFolder);
        const { handleSubfolderChange } = this.props;
        const { isUpdateViewing } = this.state;

        const subFolderListItems = _.cloneDeep(this.state.subFolderListItems);
        const index = _.findIndex(subFolderListItems, { _id: selectedFolder._id });
        const deletedFolder = subFolderListItems[index];
        async.map(subFolderListItems, (folder, cb) => {
            console.log("folder", folder)

            if (handleSubfolderChange && folder) {
                const currentFolderCount = _.toString(folder.count);
                const rootFolderCount = _.toString(deletedFolder.count);
                const statustext = isUpdateViewing ? "deleted" : "initial_deleted";
                let isDeleted = false;
                if (folder._id == selectedFolder._id) {
                    folder.status = statustext;
                    isDeleted = true;
                } else if (currentFolderCount && rootFolderCount && currentFolderCount.substr(0, rootFolderCount.length + 1) == `${rootFolderCount}.`) {
                    folder.status = statustext;
                    isDeleted = true;
                }
                folder.updated_at = DateTime.local();
                handleSubfolderChange(folder)
            }
            cb(null, folder)
        }, (err, response) => {
            if (!err) {
                this.setState({ subFolderListItems: response, selectedFolder: {} });
            }
        });
    }

    _handleRestoreSubFolder() {
        const selectedFolder = _.cloneDeep(this.state.selectedFolder);
        const { handleSubfolderChange } = this.props;
        const subFolderListItems = _.cloneDeep(this.state.subFolderListItems);
        const index = _.findIndex(subFolderListItems, { _id: selectedFolder._id });
        const restoredFolder = subFolderListItems[index];
        async.map(subFolderListItems, (folder, cb) => {
            if (handleSubfolderChange && folder) {
                const currentFolderCount = _.toString(folder.count);
                const rootFolderCount = _.toString(restoredFolder.count);
                const statustext = "visible";
                if (folder._id == selectedFolder._id) {
                    folder.status = statustext;
                } else if (currentFolderCount && rootFolderCount && currentFolderCount.substr(0, rootFolderCount.length + 1) == `${rootFolderCount}.`) {
                    folder.status = statustext;
                }
                folder.updated_at = DateTime.local();
                handleSubfolderChange(folder)
            }
            cb(null, folder)
        }, (err, response) => {
            if (!err) {
                this.setState({ subFolderListItems: response });
            }
        });
    }

    _handleSubfolderChange(folder) {
        const { handleSubfolderChange } = this.props;
        const subFolderListItems = _.cloneDeep(this.state.subFolderListItems);
        const index = _.findIndex(subFolderListItems, { _id: folder._id });
        subFolderListItems.splice(index, 1, folder);
        this.setState({ subFolderListItems }, () => {
            handleSubfolderChange(folder);
        });
    }

    _handleSelectFolder(selectedFolder) {
        this.setState({ selectedFolder });
    }

    _handleFormChange(e) {
        const selectedFolder = _.cloneDeep(this.state.selectedFolder);
        if (selectedFolder._createdBy || selectedFolder._id === "root") {
            selectedFolder.name = e.target.value;
            this.props.handleFormChange(e);
            this.setState({ selectedFolder });
        } else {
            const subFolderListItems = _.cloneDeep(this.state.subFolderListItems);
            const index = _.findIndex(subFolderListItems, { _id: selectedFolder._id });

            if (subFolderListItems[index] && subFolderListItems[index]._id) {
                const selectedFolder = subFolderListItems[index];
                subFolderListItems[index].name = e.target.value;
                this.props.handleSubfolderChange(selectedFolder);
                this.setState({ subFolderListItems, selectedFolder });
            }
        }
    }

    _handleShowPermission() {
        this.setState({isOpen: true})
    }

    _handleCloseModal() {
        this.setState({isOpen: false})
    }

    render() {
        const {
            folderTemplate
            , selectedFirm
            , handleUpdateTemplatePermission
        } = this.props;

        const {
            subFolderListItems
            , isUpdateViewing // coming soon
            , isOpen
            , close
        } = this.state;

        const folderFilteredForCount = subFolderListItems.filter(folder => !folder._folder);
        const folderFiltered = folderFilteredForCount; // folderFilteredForCount.filter(folder => folder.status != "initial_deleted");
        const selectedFolder = _.cloneDeep(this.state.selectedFolder);
        const findParentIndex = selectedFolder && selectedFolder._id && subFolderListItems.length ? _.findIndex(subFolderListItems, { _id: selectedFolder._folder }) : -1;
        const parentFolder = subFolderListItems[findParentIndex];
        const deletedParentFolder = isUpdateViewing && parentFolder && parentFolder.status === "deleted";
        const deletedFolder = isUpdateViewing && selectedFolder.status === "deleted";

        return (
            <div className="-setting yt-row space-between">
                <div className="yt-col">
                    <p><strong>Folder Structure 1</strong></p>
                </div>
                <div className="yt-row">
                    <div className="-options -left data-form-actions">
                        <button className="yt-btn x-small info" 
                            disabled={!selectedFolder._id} 
                            onClick={this._handleAddSubFolder}>Add</button>
                        <button className="yt-btn x-small info" 
                            disabled={(selectedFolder._id === "root" || selectedFolder._createdBy) || !selectedFolder._id || deletedFolder}
                            onClick={this._handleDeleteSubFolder}>Delete</button>
                        <button className="yt-btn x-small info"
                            disabled={!deletedFolder || deletedParentFolder} // && parentFolder && parentFolder.status != "deleted"}
                            onClick={this._handleRestoreSubFolder}>Restore</button>
                        {/* <button className="yt-btn x-small info" 
                            disabled={!selectedFolder._id || deletedFolder}
                            onClick={this._handleShowPermission}>Permission</button> */}
                    </div>
                    <div className="-options -right"></div>
                </div>
                <hr/>
                <div className="yt-row">
                    <TextInput
                        change={this._handleFormChange}
                        name="folderTemplate.name"
                        placeholder="Folder name"
                        value={selectedFolder.name}
                        disabled={!selectedFolder._id || deletedFolder}
                    />
                </div>
                <div className="yt-row -unselected-div">
                    <div className="yt-row -subfolder-template-tree">
                        <div style={{ display: "flex", width: "100%" }}>
                            <span 
                                onClick={this._handleSelectFolder.bind(this, folderTemplate)} 
                                style={{ cursor: "pointer" }}><div className="folder"></div></span>
                            <div 
                                className={"-folder-row-list " + (folderTemplate && selectedFolder._id === folderTemplate._id ? "-selected-row" : "")}
                                onClick={this._handleSelectFolder.bind(this, folderTemplate)} 
                                style={{ marginLeft: "5px" }}
                            >
                                <small style={{ margin: "0 5px" }}>{folderTemplate ? folderTemplate.name : null}</small>
                            </div>
                        </div>
                        {
                            folderFiltered.map((childFolder, i) =>
                                <SubFolder
                                    key={i}
                                    folder={childFolder}
                                    subFolderListItems={subFolderListItems}
                                    handleSubfolderChange={this._handleSubfolderChange}
                                    handleAddSubFolder={this._handleAddSubFolder}
                                    handleDeleteSubFolder={this._handleDeleteSubFolder}
                                    isUpdateViewing={isUpdateViewing}
                                    parentFolder={{}}
                                    handleRestoreSubFolder={this._handleRestoreSubFolder}
                                    selectedFolder={selectedFolder}
                                    handleSelectFolder={this._handleSelectFolder}
                                />
                            )
                        }
                    </div>
                </div>
                <FolderPermissionModdal
                    firm={selectedFirm}
                    file={selectedFolder}
                    isFolderTemplate={true}
                    isOpen={isOpen}
                    close={this._handleCloseModal}
                    folderTemplate={folderTemplate}
                    subFolderListItems={subFolderListItems}
                    handleUpdateTemplatePermission={handleUpdateTemplatePermission}
                />
            </div>
        )
    }
}

class SubFolder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            folder: props.folder ? props.folder : {}
        }
    }

    componentDidMount() {
        const { handleSubfolderChange, folder } = this.props;
        handleSubfolderChange(folder);
    }

    componentWillReceiveProps(props) {
        const folder = _.cloneDeep(this.state.folder);
        const newFolder = props.folder;
        if (newFolder && !_.isEqual(folder, newFolder)) {
            this.setState({ folder: newFolder });
        }
    }

    render() {

        const { 
            subFolderListItems
            , handleSubfolderChange
            , isUpdateViewing
            , selectedFolder
            , handleSelectFolder
        } = this.props;

        const {
            folder 
        } = this.state;
        
        const folderFilteredForCount = subFolderListItems.filter(subfolder => subfolder._folder == folder._id);
        const folderFiltered = folderFilteredForCount; // folderFilteredForCount.filter(subfolder => subfolder.status != "initial_deleted");
        const folderDeleted = isUpdateViewing && folder.status === "deleted";


        console.log('selectedFolder', selectedFolder)
        
        return (
            <div className="yt-row" style={folder.status === "initial_deleted" ? { display: "none" } : {}}>
                {
                    <div style={{ width: "100%" }}>
                        <div className="-folder-line-connector">
                            <div></div>
                        </div>
                        <div className="-folder-name">
                            <span onClick={() => handleSelectFolder(folder)} style={{ cursor: "pointer" }}><div className="folder"></div></span>
                            <div className={"-folder-row-list " + (folder && selectedFolder._id === folder._id ? "-selected-row" : "")}
                                onClick={() => handleSelectFolder(folder)}>
                                <small className="-folder-count">{folder.count}:</small>
                                <div style={folderDeleted ? { color: "red", display: "inline-block" } : { display: "inline-block" }}>
                                    <small>{folder.name}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                {
                    folderFiltered.map((childFolder, i) =>
                        <SubFolder
                            key={i}
                            parentFolder={folder}
                            folder={childFolder}
                            subFolderListItems={subFolderListItems}
                            handleSubfolderChange={handleSubfolderChange}
                            isUpdateViewing={isUpdateViewing}
                            selectedFolder={selectedFolder}
                            handleSelectFolder={handleSelectFolder}
                        />
                    )
                }
            </div>
        )   
    }
}


SubFolderEmplateForm.propTypes = {
  dispatch: PropTypes.func.isRequired
}

SubFolderEmplateForm.defaultProps = {
}

const mapStoreToProps = (store, props) => {
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
  )(SubFolderEmplateForm)
);