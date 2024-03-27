import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import global
import Binder from '../../components/Binder.js.jsx';
import { EmailInput, PasswordInput } from '../../components/forms';
import Auth from '../../utils/auth';

// import actions
import * as userActions from '../../../resources/user/userActions';
import * as clientActions from '../../../resources/client/clientActions';

// import components 
import UploadboxLoading from '../components/UploadboxLoading.js.jsx';

// import global components
import ProfilePic from '../../components/navigation/ProfilePic.js.jsx';
import ProfileDropdown from '../../components/navigation/ProfileDropdown.js.jsx';
import CloseWrapper from '../../components/helpers/CloseWrapper.js.jsx';

class UploadboxAccount extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            profileOpen: false
        };

        this._bind(
            '_closeDropdowns'
        );
    }

    componentDidMount() {
        const { dispatch, loggedInUser } = this.props;
        // dispatch(notificationActions.fetchListIfNeeded('_user', loggedInUser._id))
    }  

    _closeDropdowns() {
        console.log("close all dropdowns")
        this.setState({
            profileOpen: false
        });
    }


    render() {
        const {
            loggedInUser
            , logout
        } = this.props;
        
        return (
            loggedInUser.username ?
            <div className="dropdown -uploadbox-only">
                <CloseWrapper
                    isOpen={this.state.profileOpen}
                    closeAction={this._closeDropdowns}
                />            
                <div className="action-link" onClick={() => this.setState({ profileOpen: true })}>
                    <ProfilePic user={loggedInUser}/>
                    <div className="-profile-info">
                        <small>{loggedInUser.firstname}</small>
                        <br/>
                    </div>
                    <i className="far fa-angle-down"/>
                </div>
                <TransitionGroup >
                    {this.state.profileOpen ?
                        <CSSTransition
                            classNames="dropdown-anim"
                            timeout={250}
                        >
                            <ul className="dropMenu">
                                <div>
                                    <li><Link to="/account" onClick={() => this.setState({ profileOpen: false })}>Switch accounts</Link></li>
                                    <li><a onClick={() => logout()}>Logout</a></li>
                                </div>
                            </ul>
                        </CSSTransition>
                        :
                        null
                    }
                </TransitionGroup>            
            </div>
            :
            null
        );
    }
}

UploadboxAccount.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

const mapStoreToProps = store => ({
  loggedInUser: store.user.loggedIn.user
  , clientStore: store.client
  , firmStore: store.firm
});

export default connect(mapStoreToProps)(UploadboxAccount);
