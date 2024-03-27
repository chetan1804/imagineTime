/**
 * View component for /user/finish/welcome/:clientId
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries


// import actions
import * as clientActions from '../../../client/clientActions';

// import utils
import { onBoardUtils } from '../../../../global/utils/index';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import ProgressDots from '../../../../global/components/helpers/ProgressDots.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import resource components
import UserLayout from '../../components/UserLayout.js.jsx';
import UserFinishWelcomeForm from '../components/UserFinishWelcomeForm.js.jsx';

class UserFinishWelcome extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      onBoardedProgress: {}
      , totalSteps: null
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;    
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        const client = clientRes.item
        const onBoardedProgress = onBoardUtils.getOnBoardedProgress(loggedInUser, client)
        this.setState({
          onBoardedProgress: onBoardedProgress
          , totalSteps: Object.keys(onBoardedProgress).length
        })
      }
    })
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    e.preventDefault();
    const { history, match } = this.props;    
    history.push(`/user/finish/review-personal/${match.params.clientId}`)
  }

  render() {
    const { clientStore, loggedInUser, userStore } = this.props;
    
    const isEmpty = (
      !loggedInUser
      || !loggedInUser._id
    )
    const isFetching = (
      !userStore
      || !userStore.loggedIn
      || userStore.loggedIn.isFetching
      || !clientStore
      || !clientStore.selected
      || clientStore.selected.isFetching
    )

    let firmLogo = brandingName.image.logoWhite;
    return (
      <UserLayout>
      { isEmpty ?
        (isFetching ?
        <div className="-loading-hero">
          <div className="u-centerText">
            <div className="loading"></div>
          </div>
        </div>
        : <div>Empty.</div>
        )
        :
        <div style={{height: '100vh'}} className="yt-row center-vert">
          <div style={{height: '80%'}} className="yt-col _50">
            <div className="yt-container user-finish -left-side">
              <ProgressDots
                currentStep={1}
                totalSteps={3}
              />
              <UserFinishWelcomeForm
                handleFormChange={this._handleFormChange}
                handleFormSubmit={this._handleFormSubmit} 
                user={loggedInUser}
              />
            </div>
          </div>
          <div style={{backgroundColor: "black", height: '100%'}} className="yt-col _50">
            <div style={{justifyContent: 'center', height: '100%'}} className="yt-row center-vert">
              <img src={firmLogo}/>
            </div>
          </div>
        </div>
      }
      </UserLayout>
    )
  }
}

UserFinishWelcome.propTypes = {
  dispatch: PropTypes.func.isRequired
}

UserFinishWelcome.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientStore: store.client
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(UserFinishWelcome)
);
