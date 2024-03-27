// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import {
  TextInput 
} from '../../../../global/components/forms'

// import utils
import inviteUtils from '../../../../global/utils/inviteUtils.js';

// import actions
import * as userActions from '../../userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

class FullNameForm extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      user: null
      , isLoading: false
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    const { 
      fullNameId
      , dispatch
    } = this.props;

    if (fullNameId) {
      dispatch(userActions.fetchSingleIfNeeded(fullNameId)).then(json => {
        if (json.success) {
          if (json.item) {
            json.item.fullname = `${json.item.firstname} ${json.item.lastname}`;
          }
          this.setState({
            user: _.clone(json.item)
          });
        }
      });
    }
  }

  _handleFormChange(e) {
    let newState = _.update( this.state, e.target.name, function() {
      return e.target.value;
    });
    this.setState({newState})
  }

  _handleFormSubmit(e) {
    this.setState({ isLoading: true });

    const { dispatch } = this.props;
    const { user } = this.state;

    if (e) {
      e.preventDefault();
    }

    // separate fullname to first name and last name
    const newUser = inviteUtils.separateFullName("obj", user);
    dispatch(userActions.sendUpdateUser(newUser)).then((json) => {
      this.setState({ isLoading: false });
      if (json.success) {
        this.props.handleEditFullName();
      }
    });
  }

  render() {
    const { user, isLoading } = this.state;
    const {  
      fullNameId
      , handleEditFullName } = this.props;

    const isEmpty = (
      !fullNameId
      || !user
    );

    return (
      isEmpty || isLoading ?
      <div className="u-centerText">
        <div className="loading -small"></div>
      </div>
      :
      <form name="fullNameForm" onSubmit={this._handleFormSubmit}>
        <div className="yt-col input-group" style={{ marginBottom: 0 }}>
          <TextInput
            change={this._handleFormChange}
            name="user.fullname"
            value={user.fullname || ""}
            placeholder="Full Name"
          />
        </div>
        {/*<label>First Name</label>
        <div className="yt-col input-group">
          <TextInput
            change={this._handleFormChange}
            name="user.firstname"
            value={user.firstname}
            placeholder="First Name (required)"
          />
        </div>
        <label>Last Name</label>
        <div className="yt-col input-group">
          <TextInput
            change={this._handleFormChange}
            name="user.lastname"
            value={user.lastname}
            placeholder="Last Name (required)"
          />
        </div> */}
        <div className="input-group" style={{ marginBottom: 0 }}>
          <div className="yt-row space-between">
            <button className="yt-btn link x-small danger" type="button" onClick={handleEditFullName}> Cancel </button>
            <button className="yt-btn link x-small info" type="submit" > Update Name </button>
          </div>
        </div>        
      </form>          
    )
  }
}

FullNameForm.propTypes = {
  dispatch: PropTypes.func.isRequired
  , handleEditFullName: PropTypes.func.isRequired  
  , fullNameId: PropTypes.number
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {

  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(FullNameForm)
);