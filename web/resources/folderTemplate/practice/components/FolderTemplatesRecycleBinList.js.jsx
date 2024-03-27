/**
 * rendered at /firm/:firmId/settings/tags
 * Modal for staffOwner to create custom firm tags.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { DateTime } from 'luxon';

// import third-party libraries
import _ from 'lodash';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { displayUtils }  from '../../../../global/utils';

class FolderTemplatesRecycleBinList extends Binder {
    constructor(props) {
        super(props);
        this.state = {
          folderTemplate: {}
          , fixedFolderTemplate: {}
          , submitting: false
          , isOpen: false
        }
        this._bind(
          '_handleClose'
          , '_handleSubfolderChanges'
        );

        this.subfolder = {};
    }

    componentWillMount() {
        const { match, dispatch } = this.props;
        this.setState({ isOpen: true });
    }

    componentWillReceiveProps(prevProps) {
        const { match, dispatch, folderTemplateMap, folderTemplateStore } = prevProps;
        const { folderTemplate } = this.state;
        const id = match.params.folderTemplateId;
        if (!(folderTemplate && folderTemplate._id) && id && folderTemplateMap && folderTemplateStore &&  !folderTemplateStore.selected.didInvalidate && !folderTemplateStore.selected.isFetching && folderTemplateMap[id]) {
            this.setState({ folderTemplate: folderTemplateMap[id], fixedFolderTemplate: folderTemplate });
        }
    }

    _handleClose() {
        const { match, history, close } = this.props;

        this.setState({
            folderTemplate: {}
            , submitting: false
        }, () => {
            this.subfolder = {};
            if (close) {
                close();
            } else if (history && history.replace && match && match.url) {
                let index = match.url.lastIndexOf("folder-templates");
                history.replace(`${match.url.substr(0, (index+16))}`);
                // history.replace(`${match.url.substr(0, match.url.lastIndexOf("/"))}`)
                this.setState({ isOpen: false });
            }
        });
    }

    _handleSubfolderChanges(Id) {

    }

    render() {
        const {
          match
            , folderTemplateStore
        } = this.props;
        const { 
            folderTemplate
            , isOpen
            , fixedFolderTemplate
        } = this.state;

        const isEmpty = (
            !folderTemplate 
            || folderTemplateStore.selected.didInvalidate
        );

        const isFetching = (
            !folderTemplate 
            || folderTemplateStore.selected.isFetching
        )

        console.log("folderTemplate", folderTemplate)

        const subfolder = folderTemplate && folderTemplate.subfolder ? folderTemplate.subfolder.filter(a => a.status === "deleted" || a.status === "restore") : [];

        return (
            <Modal
                isOpen={isOpen}
                closeAction={this._handleClose}
                closeText="Cancel"
                confirmAction={this._handleClose}
                confirmText="Save Changes"
                disableConfirm={_.isEqual(folderTemplate, fixedFolderTemplate)}
                modalHeader={`Recycle bin with ${folderTemplate.name}`}
                showButtons={true}
                cardSize="large"
            >
                <div>
                    <div className="-share-link-configuration -folder-tempate-form">
                        {
                            isEmpty ?
                                isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>
                            :
                            <div className="-body">
                                <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
                                    <div className="table-head" >
                                        <div className="table-cell">Action</div>
                                        <div className="table-cell -folder-title">Name</div>
                                        <div className="table-cell _20">Original Location</div>
                                        <div className="table-cell -date">Date Deleted</div>
                                    </div>
                                    {
                                        subfolder && subfolder.length ?
                                        subfolder.map((folder, i) => 
                                            <div className="table-row -file-item" key={i}>
                                                <div className="table-cell">
                                                    <a>Restore</a>
                                                </div>
                                                <div className="table-cell">{folder.name}</div>
                                                <div className="table-cell">{displayUtils.getLocationByStringSubfolder(subfolder, folder._id)}</div>
                                                <div className="table-cell -date">{DateTime.fromISO(folder.updated_at).toLocaleString(DateTime.DATE_SHORT)}</div>
                                            </div>
                                        )
                                        :
                                        <div className="table-head empty-state">
                                            <div className="table-cell" colSpan="4">
                                                <em>Empty</em>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </Modal>
        )
    }
}

FolderTemplatesRecycleBinList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  
    return {
      folderTemplateStore: store.folderTemplate
      , folderTemplateMap: store.folderTemplate.byId
    }
}

export default withRouter(
    connect(
        mapStoreToProps
    )(FolderTemplatesRecycleBinList)
);
