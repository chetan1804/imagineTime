/**
 * View component for /firms/:firmId/settings/tags/:tagId/update
 *
 * Allows staff owner to update custom firm tags.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as tagActions from '../../tagActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import TagForm from '../../components/TagForm.js.jsx';

class PracticeUpdateTag extends Binder {
  constructor(props) {
    super(props);
    const { match, tagStore } = this.props;
    this.state = {
      tag: tagStore.byId[match.params.tagId] ? _.cloneDeep(tagStore.byId[match.params.tagId]) : {}
      , submitting: false
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(tagActions.fetchSingleIfNeeded(match.params.tagId)).then(tagRes => {
      if(tagRes.success) {
        this.setState({
          tag: _.cloneDeep(tagRes.item)
        })
      }
    });
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState)
  }

  _handleFormSubmit(e) {
    const { dispatch, history, match } = this.props;
    e.preventDefault();
    this.setState({ submitting: true });
    dispatch(tagActions.sendUpdateTag(this.state.tag)).then(staffRes => {
      this.setState({ submitting: false })
      if(staffRes.success) {
        history.push(`/firm/${match.params.firmId}/settings/tags`)
      } else {
        alert("ERROR - Check logs");
        history.push(`/firm/${match.params.firmId}/settings/tags`)
      }
    });
  }
  
  render() {
    const {
      location
      , match
      , tagStore
    } = this.props;

    const selectedTag = tagStore.selected.getItem();

    const isEmpty = (
      tagStore.selected.didInvalidate
      || !selectedTag
    );

    const isFetching = (
      !selectedTag
      || tagStore.selected.isFetching
    )

    return (
      <PracticeLayout>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
              <div className="-btns dropdown">
              </div>
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
        <h1>Update Custom Tag</h1>
        <hr/>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <h2>Empty.</h2>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <TagForm
              cancelLink={`/firm/${match.params.firmId}/settings/tags`}
              submitting={this.state.submitting}
              formType="update"
              handleFormChange={this._handleFormChange}
              handleFormSubmit={this._handleFormSubmit}
              tag={this.state.tag}
            />
          </div>
        }
        </div>
      </PracticeLayout>
    )
  }
}

PracticeUpdateTag.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    loggedInUser: store.user.loggedIn.user
    , tagStore: store.tag
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeUpdateTag)
);
