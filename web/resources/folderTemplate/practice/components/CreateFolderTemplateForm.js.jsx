/**
 * rendered at /firm/:firmId/settings/tags
 * Modal for staffOwner to create custom firm tags.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as folderTemplateActions from '../../folderTemplateActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { TextInput } from  '../../../../global/components/forms';

// import components 
import SubFolderEmplateForm from './SubFolderEmplateForm.js.jsx';

// import resource components
// import TagForm from '../../components/TagForm.js.jsx';

class CreateFolderTemplateForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            folderTemplate: {
                _id: "root"
                , name: "New Folder"
            }
            , submitting: false
            , isUpdateViewing: props.match.params.folderTemplateId && props.match.params.folderTemplateId != "new"
            , isOpen: false
        }
        this._bind(
            '_handleFormChange'
            , '_handleFormSubmit'
            , '_handleSubfolderChange'
            , '_handleClose'
            , '_handleUpdateFormSubmit'
            , '_handlePermissionChange'
            , '_handleUpdateTemplatePermission'
        );

        this.subfolder = {};
    }

    componentDidMount() {
        const { firmStore, match } = this.props;
        const selectedFirm = !!firmStore.byId[match.params.firmId] ? firmStore.byId[match.params.firmId] : {};

        console.log('selectedFirm on mount - ', selectedFirm);
    }

    componentWillMount() {
        const { match, dispatch } = this.props;
        dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
        this.setState({ isOpen: true });
    }

    componentWillReceiveProps(prevProps) {
        const { match, dispatch, folderTemplateMap, folderTemplateStore } = prevProps;
        const { folderTemplate } = this.state;
        const id = match.params.folderTemplateId;
        if (!(folderTemplate && folderTemplate._id && folderTemplate._id != "root") && id && folderTemplateMap && folderTemplateStore &&  !folderTemplateStore.selected.didInvalidate && !folderTemplateStore.selected.isFetching && folderTemplateMap[id]) {
            this.setState({ folderTemplate: folderTemplateMap[id]  });
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

    _handleFormChange(e) {
        let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
        return e.target.value;
        });
        this.setState(newState);
    }

    _handleFormSubmit(e) {

        // obj to array
        const subfolder = _.toArray(this.subfolder);
        
        const { match, dispatch, history } = this.props;
        this.setState({ submitting: true });

        
        const newFolderTemplate = _.cloneDeep(this.state.folderTemplate);
        delete newFolderTemplate._id;
        newFolderTemplate._firm = match.params.firmId;
        newFolderTemplate.subfolder = subfolder.filter(item => item.status !== "initial_deleted");

        dispatch(folderTemplateActions.sendCreateFolderTemplate(newFolderTemplate)).then(response => {
            if (response.success) {
                dispatch(folderTemplateActions.addFolderTemplateToList(response.item, ...['_firm', match.params.firmId]));
                this._handleClose();
            } else {
                alert("ERROR - Check logs");
                this.setState({ submitting: false });
            }
        });
    }

    _handleUpdateTemplatePermission(newFolderTemplate) {
        console.log('log update new folder template', newFolderTemplate);
        this.setState({
            folderTemplate: newFolderTemplate
        }, () => {
            console.log('successfully add folder template');
            console.log(this.state.folderTemplate);
        })
    }

    _handleUpdateFormSubmit() {

        // obj to array
        const subfolder = _.toArray(this.subfolder);

        const { match, dispatch, history } = this.props;
        this.setState({ submitting: true });

        const newFolderTemplate = _.cloneDeep(this.state.folderTemplate);
        newFolderTemplate._firm = match.params.firmId;
        newFolderTemplate.subfolder = subfolder.filter(item => item.status !== "initial_deleted");

        dispatch(folderTemplateActions.sendUpdateFolderTemplate(newFolderTemplate)).then(response => {
            if (response.success) {
                dispatch(folderTemplateActions.addFolderTemplateToList(response.item, ...['_firm', match.params.firmId]));
                this._handleClose();
            } else {
                alert("ERROR - Check logs");
                this.setState({ submitting: false });
            }
        });
    }

    _handleSubfolderChange(folder, action) {
        if (action === "initial_deleted") {
            delete this.subfolder[folder]
        } else {
            this.subfolder[folder._id] = folder;
        }
    }

    _handlePermissionChange() {

    }

    render() {
        const {
            folderTemplateStore
            , staffStore
            , userStore
            , loggedInUser
            , firmStore
            , match
        } = this.props;
        const { 
            folderTemplate
            , submitting
            , isUpdateViewing 
            , isOpen
        } = this.state;

        const isEmpty = (
            !folderTemplate 
            || folderTemplateStore.selected.didInvalidate
            || userStore.selected.didInvalidate
            || staffStore.selected.didInvalidate
        );

        const isFetching = (
            !folderTemplate 
            || folderTemplateStore.selected.isFetching
            || userStore.selected.isFetching
            || staffStore.selected.isFetching
        )

        const selectedFirm = !!firmStore.byId[match.params.firmId] ? firmStore.byId[match.params.firmId] : {};

        return (
            <Modal
                isOpen={isOpen}
                closeAction={this._handleClose}
                closeText="Cancel"
                confirmAction={isUpdateViewing ? this._handleUpdateFormSubmit : this._handleFormSubmit}
                confirmText={isUpdateViewing ? "Update Template" : "Create Template"}
                disableConfirm={submitting || !(folderTemplate && folderTemplate.name && folderTemplate.name.trim())}
                modalHeader={isUpdateViewing ? "Update Template" : "Create Template"}
                showButtons={true}
                cardSize="jumbo"
            >
                <div>
                    <div className="-share-link-configuration -folder-tempate-form">
                        {
                            isEmpty ?
                                isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>
                            :
                            <div className="-body">
                                <div className="-setting yt-row space-between">
                                    <div className="-instructions yt-col">
                                        <p><strong>Description</strong></p>
                                    </div>
                                    <div className="-inputs yt-col">
                                        <TextInput
                                            change={this._handleFormChange}
                                            name="folderTemplate.description"
                                            placeholder="Enter description"
                                            required={false}
                                            value={folderTemplate.description || ""}
                                        />
                                    </div>
                                </div>
                                <hr/>
                                <SubFolderEmplateForm
                                    handleSubfolderChange={this._handleSubfolderChange}
                                    folderTemplate={folderTemplate}
                                    isUpdateViewing={isUpdateViewing}
                                    handleFormChange={this._handleFormChange}
                                    selectedFirm={selectedFirm}
                                    handleUpdateTemplatePermission={this._handleUpdateTemplatePermission}
                                />
                            </div>
                        }
                    </div>
                </div>
            </Modal>
        )
    }
}

CreateFolderTemplateForm.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */

    return {
        defaultTag: store.tag.defaultItem
        , folderTemplateStore: store.folderTemplate
        , folderTemplateMap: store.folderTemplate.byId
        , staffStore: store.staff
        , userStore: store.user
        , loggedInUser: store.user.loggedIn.user
        , firmStore: store.firm
    }
}

export default withRouter(
    connect(
        mapStoreToProps
    )(CreateFolderTemplateForm)
);
