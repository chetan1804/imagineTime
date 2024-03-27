/**
 * View component for /firm/:firmId/workspaces/:clientId/files 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter, Switch, Route } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import actions
import * as requestTaskActions from '../requestTaskActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { EmailInput } from '../../../global/components/forms';
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import ShareLinkNav from '../../shareLink/components/ShareLinkNav.js.jsx';
import SingleRequestTask from '../components/SingleRequestTask.js.jsx';
import TaskActivityOverview from '../components/TaskActivityOverview.js.jsx';

class ViewRequestTask extends Binder {
  constructor(props) {
    super(props);
    this.state = {
        userEmail: ""
        , authenticated: false
        , alertModalOpen: false
        , wrongUser: false
    }
    this._bind(
        '_handleFormChange'
        , '_handleCheckUserEmail'
        , '_handleReload'
    )
  }

  componentDidMount() {
    const { dispatch, match, loggedInUser } = this.props;
    dispatch(requestTaskActions.fetchSingleByHex(match.params.hex)).then(json => {
        if (json.success && loggedInUser && loggedInUser.username) {
            this._handleCheckUserEmail(loggedInUser.username, "fromdidmount");
        }
    });
  }

  _handleCheckUserEmail(username, fromdidmount) {
    const { requestTaskStore } = this.props;
    const selectedRequestTask = requestTaskStore.selectedHex.getItem();
    if (selectedRequestTask && selectedRequestTask.assignee && selectedRequestTask.assignee.length) {
        const authenticated = selectedRequestTask.assignee.some(assignee => assignee.username.toLowerCase() === username.toLowerCase());
        if (authenticated) {
            this.setState({ authenticated, userEmail: username });
        } else {
            if (fromdidmount === "fromdidmount") {
                this.setState({ wrongUser: true });
            } else {
                this.setState({ alertModalOpen: true });
            }
        }
    }
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleReload() {
    const { dispatch, match } = this.props;
    dispatch(requestTaskActions.fetchSingleByHex(match.params.hex))
    this.setState({ alertModalOpen: false, userEmail: ''});
  }

  render() {
    const {
        userEmail
        , authenticated
        , alertModalOpen
        , wrongUser
    } = this.state;

    const {
        requestTaskStore
        , loggedInUser
    } = this.props;

    const selectedRequestTask = requestTaskStore.selectedHex.getItem();

    const isEmpty = (
        !selectedRequestTask
        || !selectedRequestTask._id
        || requestTaskStore.selectedHex.didInvalidate
    );

    const isFetching = (
        requestTaskStore.selectedHex.isFetching
    );

    const display = [];
    
    return (
        <div>
            <Helmet><title>Request Task</title></Helmet>
            { isEmpty ?
                (isFetching ? 
                    <div className="-loading-hero hero">
                        <div className="u-centerText">
                            <div className="loading"></div>
                        </div>
                    </div>  
                    : 
                    <div className="flex column">
                        <section className="section white-bg the-404">
                            <div className="hero flex three-quarter ">
                                <div className="yt-container slim">
                                    <h1> Whoops! <span className="light-weight">Something wrong here</span></h1>
                                    <hr/>
                                    <h4>Either this link no longer exists, or your credentials are invalid.</h4>
                                </div>
                            </div>
                        </section>
                    </div>
                )
                : 
                <div className="share-link-layout">
                    <ShareLinkNav/>
                    {
                        wrongUser ? 
                        <div className="yt-row center-horiz" style={{marginTop: '128px'}}>
                            <div className="yt-container slim">
                                <h1> Whoops! <span className="light-weight">You're not assigned user on this link</span></h1>
                                <hr/>
                                <h4>
                                Do you have multiple accounts? You may be logged in to the wrong one. You can <Link to="/user/forward">switch accounts.</Link>
                                </h4>
                            </div>
                        </div>
                        :
                        <div className="body with-header">
                            <div className="yt-container slim">
                                <h3>
                                    { selectedRequestTask.firm ?
                                        <span> {selectedRequestTask.firm.name} </span>
                                        :
                                        <span> Your accountant </span>
                                    }
                                    is requesting your file
                                </h3>
                                { selectedRequestTask.client ?
                                    <p className="u-muted">for {selectedRequestTask.client.name}</p>
                                    :
                                    null
                                }
                                <hr/>
                                {
                                    authenticated ? 
                                    <div className=" yt-col full m_50 l_40 xl_33">
                                        <SingleRequestTask fromShareLink={true} userEmail={userEmail} requestTask={selectedRequestTask} selectedFirm={selectedRequestTask && selectedRequestTask.firm ? selectedRequestTask.firm : {}} />
                                    </div>
                                    :
                                    <div className=" yt-col full m_50 l_40 xl_33">
                                        <EmailInput
                                            autoFocus
                                            name='userEmail'
                                            placeholder='Enter your email address'
                                            change={this._handleFormChange}
                                            value={userEmail}
                                        />
                                        <div className="input-group">
                                            <button className="yt-btn x-small info u-pullRight" onClick={this._handleCheckUserEmail.bind(this, userEmail)}>done</button>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                    <AlertModal
                        alertMessage={<div><p>You did not enter the correct information to access this link.</p></div> }
                        alertTitle="Invalid credentials"
                        closeAction={this._handleReload}
                        confirmAction={this._handleReload}
                        confirmText="Try again"
                        isOpen={alertModalOpen}
                        type="danger"
                    />
                    {/* <TransitionGroup>
                        <CSSTransition
                            key={location.key}
                            classNames="slide-from-right"
                            timeout={300}
                        >
                            <Switch location={location}>
                                <YTRoute
                                    breadcrumbs={[]}
                                    exact
                                    // path="/firm/:firmId/workspaces/:clientId/files/:fileId/folder/file-activity/:fileActivityId"
                                    path="/request/request-task/:hex/:requestTaskId/:viewingAs"
                                    staff={true}
                                    component={TaskActivityOverview}
                                />
                                <Route render={() => <div/>} />
                            </Switch>
                        </CSSTransition>
                    </TransitionGroup> */}
                </div>
            }
        </div>
    )
  }
}

ViewRequestTask.propTypes = {
}

ViewRequestTask.defaultProps = {

}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    loggedInUser: store.user.loggedIn.user
    , requestTaskStore: store.requestTask
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ViewRequestTask)
);
