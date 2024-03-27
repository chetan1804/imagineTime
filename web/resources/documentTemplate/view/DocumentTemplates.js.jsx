/**
 * View component for /firms/:firmId/settings/tags
 *
 * Displays a list of a firm's custom tags.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, Route, NavLink, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import actions
import * as firmActions from '../../firm/firmActions';
import * as mergeFieldActions from '../../mergeField/mergeFieldActions';
import * as documentTemplateActions from '../documentTemplateActions';
import * as staffActions from '../../staff/staffActions';
import * as userActions from '../../user/userActions';
import * as clientActions from '../../client/clientActions';
// import * as folderTemplateActions from '../../folderTemplateActions';

// import global components
// import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';
import routeUtils from '../../../global/utils/routeUtils';
import { SearchInput } from  '../../../global/components/forms';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
// import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
// import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';
import RoleModalComponent from '../../../global/enum/RoleModalComponent.js.jsx';

// import resource components
import PracticeFirmLayout from '../../firm/practice/components/PracticeFirmLayout.js.jsx';
// import PracticefolderTemplateList from '../components/PracticefolderTemplateList.js.jsx';
// import CreateFolderTemplateForm from '../components/CreateFolderTemplateForm.js.jsx';
// import SingleFolderTemplateOptions from '../components/SingleFolderTemplateOptions.js.jsx';
// import FolderTemplatesRecycleBinList from '../components/FolderTemplatesRecycleBinList.js.jsx';
// import CreateTagModal from '../components/CreateTagModal.js.jsx';

import DocumentTemplatesList from '../components/DocumentTemplatesList.js.jsx';
class DocumentTemplates extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      query: ''
      , roleModal: null
      , listArgs: {
        '_firm': props.match.params.firmId
      }
      , selectedTemplateIds: []
      , selectedTemplate: null
    }
    this._bind(
      '_handleQuery'
      , '_handleUploaded'
      , '_handleToggleSelectAll'
      , '_handleSelectTemplate'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(documentTemplateActions.fetchListIfNeeded(...listArgs)).then(json => {
      dispatch(documentTemplateActions.setQuery('', ...listArgs));
      this._handleSetPagination({page: 1, per: 100 });
    });
    dispatch(mergeFieldActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId, 'status', 'visible'));
  }

  _handleQuery(e) {
    console.log("e", e)

    const { dispatch } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);

    // always defaulting the page to page 1 so we can see our results
    let pagination = {};
    pagination.page = 1;
    pagination.per = this.state.per;
    this._handleSetPagination(pagination);

    // continue query logic
    dispatch(documentTemplateActions.setQuery(e.target.value.toLowerCase(), ...listArgs));
    this.setState({ query: e.target.value.toLowerCase() });
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs);
    dispatch(documentTemplateActions.setPagination(newPagination, ...listArgs));
  }

  _handleUploaded(template) {
    const { dispatch } = this.props;
    const listArgs = routeUtils.listArgsFromObject(this.state.listArgs) // computed from the object
    dispatch(documentTemplateActions.addDocumentTemplateToList(template._id, ...listArgs));
  }

  _handleToggleSelectAll(paginatedList, allTemplatesSelected) {
    const { selectedTemplateIds } = this.state; 
    if(selectedTemplateIds.length > 0 && allTemplatesSelected) {
      this.setState({ selectedTemplateIds: [] });
    } else if(paginatedList) {
      let newSelectedFiles = _.cloneDeep(selectedTemplateIds); 
      paginatedList.map(item => newSelectedFiles.indexOf(item._id) < 0 ? newSelectedFiles.push(item._id) : null);
      this.setState({selectedTemplateIds: newSelectedFiles});
    } else null; 
  }

  _handleSelectTemplate(templateId) {
    let newTemplateIds = _.cloneDeep(this.state.selectedTemplateIds);
    if(newTemplateIds.indexOf(templateId) === -1) {
      newTemplateIds.push(templateId)
    } else {
      newTemplateIds.splice(newTemplateIds.indexOf(templateId), 1);
    }
    this.setState({
      selectedTemplateIds: newTemplateIds
    })
  }

  render() {
    const {
      match
      , documentTemplateStore
      , firmStore
    } = this.props;

    const {
      query
      , roleModal
      , selectedTemplateIds
      , selectedTemplate
    } = this.state;

    const documentTemplateList = documentTemplateStore.util.getSelectedStore('_firm', match.params.firmId);
    const documentTemplateListItems = documentTemplateStore.util.getList('_firm', match.params.firmId);
    const selectedFirm = firmStore.selected.getItem();

    const isEmpty = (
      !documentTemplateListItems
      || documentTemplateStore.selected.didInvalidate
      || !documentTemplateList
      || documentTemplateList.isFetching
    );

    const isFetching = (
      !documentTemplateListItems
      || documentTemplateStore.selected.isFetching
      || !documentTemplateList
      || documentTemplateList.isFetching
    );

    const ModalComponent = RoleModalComponent[roleModal];

    return (
      <PracticeFirmLayout>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <div className="hero -empty-hero">
              <div className="u-centerText">
                <p>Looks like you don't have any merge field yet. </p>
                <p>Let's add some.</p>
              </div>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="file-list-wrapper">
              <DocumentTemplatesList
                documentTemplateStore={documentTemplateStore}
                documentTemplateList={documentTemplateList}
                documentTemplateListItems={documentTemplateListItems}
                setPagination={this._handleSetPagination}
                setPerPage={this._setPerPage}
                handleQuery={this._handleQuery}
                fileQuery={query}
                handleOpenModal={(name, template) => this.setState({ roleModal: name, selectedTemplate: template })}
                handleToggleSelectAll={this._handleToggleSelectAll}
                selectedTemplateIds={selectedTemplateIds}
                handleSelectTemplate={this._handleSelectTemplate}
              />
            </div>
          </div>
        }
        {
          !isEmpty && !isFetching && roleModal ?
          <ModalComponent 
            close={() => this.setState({ roleModal: null })}
            isOpen={!!roleModal}
            match={match}
            handleUploaded={this._handleUploaded}
            type={roleModal === "file_signature" ? "signature" : roleModal}
            file={selectedTemplate}
            firm={selectedFirm}
            modelName="documenttemplate"
            firmId={match.params.firmId}
          />
          : null
        }
      </PracticeFirmLayout>
    )
  }
}

DocumentTemplates.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    documentTemplateStore: store.documentTemplate
    , firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(DocumentTemplates)
);
