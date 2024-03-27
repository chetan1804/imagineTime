/**
 * View component for /firms/:firmId/settings/tags
 *
 * Displays a list of a firm's custom tags.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, Route, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import actions
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';
import * as folderTemplateActions from '../../folderTemplateActions';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';
import { SearchInput } from  '../../../../global/components/forms';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';

// import resource components
import PracticeFirmLayout from '../../../firm/practice/components/PracticeFirmLayout.js.jsx';
import PracticefolderTemplateList from '../components/PracticefolderTemplateList.js.jsx';
import CreateFolderTemplateForm from '../components/CreateFolderTemplateForm.js.jsx';
import SingleFolderTemplateOptions from '../components/SingleFolderTemplateOptions.js.jsx';
import FolderTemplatesRecycleBinList from '../components/FolderTemplatesRecycleBinList.js.jsx';
// import CreateTagModal from '../components/CreateTagModal.js.jsx';

class PracticeFolderTemplates extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isCreateFolderTemplatesModalOpen: false 
      , page: 1
      , per: 50
      , query: ''
      , folderTemplatesListArgsObj: {
        '_firm': props.match.params.firmId
      }
      , folderTemplateOptionsOpen: false
      , showMobileActionOption: false
    }
    this._bind(
      '_handleSetPagination'
      , '_handleNewTag'
      , '_handleQuery'
      , '_setPerPage'
      , '_handleCloseTemplateListOptions'
      , '_handleCloseMobileOption'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    const folderTemplatesListArgsObj = routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj);
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(folderTemplateActions.fetchListIfNeeded(...folderTemplatesListArgsObj));
    dispatch(folderTemplateActions.setQuery('', ...folderTemplatesListArgsObj));
    this._handleSetPagination({page: 1, per: 50});
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
  }

  _handleNewTag(tag) {
    const { dispatch, match } = this.props;
    dispatch(folderTemplateActions.addTagToList(tag, '_firm', match.params.firmId));
    this.setState({ isCreateFolderTemplatesModalOpen: false });
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    dispatch(folderTemplateActions.setPagination(newPagination, ...routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj)));
  }

  _handleQuery(e) {
    const { dispatch } = this.props;
    // always defaulting the page to page 1 so we can see our results
    let pagination = {};
    pagination.page = 1;
    pagination.per = this.state.per;
    this._handleSetPagination(pagination);
    // continue query logic
    dispatch(folderTemplateActions.setQuery(e.target.value.toLowerCase(), ...routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj)));
    this.setState({query: e.target.value.toLowerCase()});
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  _handleCloseTemplateListOptions(e) {
    e.stopPropagation();
    this.setState({ folderTemplateOptionsOpen: false });
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {
    const {
      match
      , folderTemplateStore
      , staffStore
      , userStore
      , userMap
      , location
    } = this.props;

    const {
      folderTemplateOptionsOpen
      , showMobileActionOption
    } = this.state;

    const folderTemplateList = folderTemplateStore.util.getListInfo(...routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj));
    const folderTemplateListItems = folderTemplateStore.util.getList(...routeUtils.listArgsFromObject(this.state.folderTemplatesListArgsObj));
    const filteredFolderTemplateListItems = folderTemplateListItems ? folderTemplateListItems.filter(data => data !== undefined) : [];

    const isEmpty = (
      !folderTemplateList
      || !folderTemplateList.items
      || folderTemplateStore.selected.didInvalidate
      || userStore.selected.didInvalidate
      || staffStore.selected.didInvalidate
    );

    const isFetching = (
      !folderTemplateStore
      || folderTemplateStore.selected.isFetching
      || userStore.selected.isFetching
      || staffStore.selected.isFetching
    );

    console.log("PracticeFolderTemplates")
    // console.log("activeStaff", activeStaff);

    return (
      <PracticeFirmLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="file-list-wrapper">
              <div className={`-options -mobile-layout yt-toolbar`} onClick={() => this.setState({ showMobileActionOption: !showMobileActionOption })}>
                <div>
                  <CloseWrapper
                      isOpen={showMobileActionOption}
                      closeAction={this._handleCloseMobileOption}
                  />
                  <i className="far fa-ellipsis-h"></i>
                  <MobileActionsOption
                      isOpen={showMobileActionOption}
                      closeAction={() => this.setState({showMobileActionOption: false})}
                      viewingAs="folder-template-list"
                  />
                </div>
              </div>
              <div className="-member-staff" style={{ display: "none" }}>
                <SearchInput
                  name="query"
                  value={this.state.query}
                  change={this._handleQuery}
                  placeholder="Search..."
                  required={false}
                />
              </div>
              <div className="yt-toolbar">
                <div className="yt-tools space-between">
                  <div className="-left"></div>
                  <div className="yt-tools -right">
                    <div className="search">
                      <SearchInput
                        name="query"
                        value={this.state.query}
                        change={this._handleQuery}
                        placeholder="Search..."
                        required={false}
                      />
                    </div>
                    <Link className="yt-btn x-small info -filename" to={`${match.url}/new`}>New template</Link>
                  </div>
                </div>
              </div>
              <hr className="-mobile-yt-hide" />
              <PracticefolderTemplateList
                handleSort={() => console.log('handle sort')}
                setPerPage={this._setPerPage}
                folderTemplateList={folderTemplateList}
                folderTemplateListItems={filteredFolderTemplateListItems}
                setPagination={this._handleSetPagination}
              />
            </div>
            <PageTabber
              totalItems={folderTemplateList.items.length}
              totalPages={Math.ceil(folderTemplateList.items.length / folderTemplateList.pagination.per)}
              pagination={folderTemplateList.pagination}
              setPagination={this._handleSetPagination}
              setPerPage={this._setPerPage}
              viewingAs="bottom"
              itemName="templates"
              searchText="Search..."
            />
            <TransitionGroup>
              <CSSTransition
                key={location.key}
                classNames="slide-from-right"
                timeout={300}
              >
                <Switch location={location}>
                  <YTRoute
                    breadcrumbs={[]}
                    exact
                    path="/firm/:firmId/settings/folder-templates/new"
                    staff={true}
                    component={CreateFolderTemplateForm}
                  />
                  <YTRoute
                    breadcrumbs={[]}
                    exact
                    path="/firm/:firmId/settings/folder-templates/:folderTemplateId/update"
                    staff={true}
                    component={CreateFolderTemplateForm}
                  />
                  <YTRoute
                    breadcrumbs={[]}
                    exact
                    path="/firm/:firmId/settings/folder-templates/:folderTemplateId/recycle-bin"
                    staff={true}
                    component={FolderTemplatesRecycleBinList}
                  />
                  <Route render={() => <div/>} />
                </Switch>
              </CSSTransition>
            </TransitionGroup>
          </div>
        }
      </PracticeFirmLayout>
    )
  }
}

PracticeFolderTemplates.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    folderTemplateStore: store.folderTemplate
    , staffStore: store.staff
    , userStore: store.user
    , userMap: store.user.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeFolderTemplates)
);
