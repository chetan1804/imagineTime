/**
 * View component for /firms/:firmId
 *
 * Displays a single firm from the 'byId' map in the firm reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect, ReactReduxContext } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import _, { rest } from 'lodash'; 
import _uniqueId from 'lodash/uniqueId';
import { Helmet } from 'react-helmet';

// import actions
import * as firmActions from '../../firmActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';
import { FeedbackMessage } from "../../../../global/components/helpers/FeedbackMessage.js.jsx";
import FolderPermissionTable from '../../../folderPermission/components/folderPermissionTable.js.jsx';

// import resource components
import PracticeFirmLayout from '../components/PracticeFirmLayout.js.jsx';

class PracticeGroupPermissionSettings extends Binder {

  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      error: '',
      payload: {},
      submitting: false
    }
    this._bind(
      '_handleChange'
      , '_handleSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;

    dispatch(firmActions.fetchSingleFirmById(match.params.firmId));
  }

  _handleChange(payload) {
    this.setState({
      payload
    })
  }

  _handleSubmit() {
    const {
      payload
    } = this.state;

    const {
      dispatch
      , firmStore
    } = this.props;

    const selectedFirm = firmStore.selected.getItem();

    let newPayload = payload;

    newPayload['_firm'] = selectedFirm._id;
    this.setState({
      submitting: true
    })
    dispatch(firmActions.sendUpdateGroupPermission(newPayload)).then(json => {
      this.setState({
        submitting: false
      })
      if(json && json.success && json.item) {
        this.feedbackMessage.current.showSuccess('Successfully updated')
      } else {
        this.feedbackMessage.current.showSuccess('Failed to update folder permission')
      }
    })
  }

  render() {
    const { 
      firmStore 
    } = this.props;

    const { submitting } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual firm object from the map
     */
    const selectedFirm = firmStore.selected.getItem();

    const isEmpty = (
      !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const isFetching = (
      firmStore.selected.isFetching
    )

    return (
      <PracticeFirmLayout>
        <FeedbackMessage ref = {this.feedbackMessage} />
        <Helmet><title>Firm Settings</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero three-quarter ">
              <div className="yt-container slim">
                <h2>Hmm.  Something's wrong here. </h2>
                <p>Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>.</p>
              </div>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-row ">
              <div className="yt-col">
                <div className="-practice-content">
                  <div style={{marginBottom: '16px'}}>
                    <FolderPermissionTable
                      selectedFirm={selectedFirm}
                      handleChange={this._handleChange}
                    />
                  </div>
                  <div>
                    <button className='yt-btn x-small info' onClick={() => {this._handleSubmit()}}
                    disabled={!!submitting}
                    >
                      {
                        submitting ? 'Saving...' : 'Save'
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </PracticeFirmLayout>
    )
  }
}

PracticeGroupPermissionSettings.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */

  return {
    firmStore: store.firm
    , staffStore: store.staff 
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeGroupPermissionSettings)
);
