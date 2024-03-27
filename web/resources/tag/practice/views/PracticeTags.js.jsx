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
import * as tagActions from '../../tagActions';
import * as userActions from '../../../user/userActions';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';
import { SearchInput } from  '../../../../global/components/forms';

// import resource components
import PracticeFirmLayout from '../../../firm/practice/components/PracticeFirmLayout.js.jsx';
import PracticeTagList from '../components/PracticeTagList.js.jsx';
import CreateTagModal from '../components/CreateTagModal.js.jsx';

class PracticeTags extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isCreateTagModalOpen: false 
      , page: 1
      , per: 50
      , query: ''
      , tagListArgsObj: {
        '~firm': props.match.params.firmId
      }
    }
    this._bind(
      '_handleSetPagination'
      , '_handleNewTag'
      , '_handleQuery'
      , '_setPerPage'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    const tagListArgs = routeUtils.listArgsFromObject(this.state.tagListArgsObj);
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId))
    dispatch(tagActions.fetchListIfNeeded(...tagListArgs))
    dispatch(tagActions.setQuery('', ...tagListArgs));
    this._handleSetPagination({page: 1, per: 50});

    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

  }

  componentDidUpdate(prevProps, prevState) {
    // catch for state change and re-fetch file list if it happens
    // compare computed listArgs object
    if(routeUtils.listArgsFromObject(prevState.tagListArgsObj) !== routeUtils.listArgsFromObject(this.state.tagListArgsObj)) {
      this.props.dispatch(tagActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.tagListArgsObj)))
    }
  }

  _handleNewTag(tag) {
    const { dispatch, match } = this.props;
    dispatch(tagActions.addTagToList(tag, '~firm', match.params.firmId));
    this.setState({ isCreateTagModalOpen: false });
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    dispatch(tagActions.setPagination(newPagination, ...routeUtils.listArgsFromObject(this.state.tagListArgsObj)));
  }

  _handleQuery(e) {
    const { dispatch } = this.props;
    // always defaulting the page to page 1 so we can see our results
    let pagination = {};
    pagination.page = 1;
    pagination.per = this.state.per;
    this._handleSetPagination(pagination);
    // continue query logic
    dispatch(tagActions.setQuery(e.target.value.toLowerCase(), ...routeUtils.listArgsFromObject(this.state.tagListArgsObj)));
    this.setState({query: e.target.value.toLowerCase()});
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  render() {
    const {
      match
      , tagStore 
    } = this.props;

    const tagList = tagStore.util.getListInfo(...routeUtils.listArgsFromObject(this.state.tagListArgsObj));
    const tagListItems = tagStore.util.getList(...routeUtils.listArgsFromObject(this.state.tagListArgsObj));

    const isEmpty = (
      !tagList
      || !tagListItems
    );

    const isFetching = (
      !tagList
      || tagList.isFetching
    );

    const {
      isCreateTagModalOpen
    } = this.state;

    return (
      <PracticeFirmLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1, position: "inherit" }}>
            <div className="yt-row -side-content">
              <div className="-member-staff" style={{ display: "none" }}>
                <SearchInput
                  name="query"
                  value={this.state.query}
                  change={this._handleQuery}
                  placeholder="Search..."
                  required={false}
                />
              </div>
              <div className="yt-col _20 -mobile-yt-hide" style={{ float: "right", order: 1 }}>
                <div className="practice-aside">
                  <button className="yt-btn block success x-small" onClick={() => this.setState({isCreateTagModalOpen: true})}>New Tag</button>
                  <br/>
                  <span><i className="fas fa-lock" style={{paddingRight: '.5em'}}/><small>This denotes a global tag that cannot be edited.</small></span>
                </div>
              </div>
              <div className="yt-col _80">
                <PracticeTagList
                  handleQuery={this._handleQuery}
                  handleSetPagination={this._handleSetPagination}
                  handleSort={() => console.log('handle sort')}
                  query={this.state.query}
                  setPerPage={this._setPerPage}
                  tagList={tagList}
                  tagListItems={tagListItems}
                  handleShowNewTagModal={() => this.setState({ isCreateTagModalOpen: !isCreateTagModalOpen })}
                />
              </div>
            </div>
            <CreateTagModal
              close={() => this.setState({isCreateTagModalOpen: false})}
              firmId={parseInt(match.params.firmId)}
              handleNewTag={this._handleNewTag}
              tag={this.state.tag}
              isOpen={this.state.isCreateTagModalOpen}
            />
          </div>
        }
      </PracticeFirmLayout>
    )
  }
}

PracticeTags.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    tagStore: store.tag
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeTags)
);
