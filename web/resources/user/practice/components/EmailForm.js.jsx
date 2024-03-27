// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import {
  TextInput 
  , EmailInput
} from '../../../../global/components/forms'

// import actions
import * as userActions from '../../userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

class EmailForm extends Binder {
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
     emailId
      , dispatch
    } = this.props;

    if (emailId) {
      dispatch(userActions.fetchSingleIfNeeded(emailId)).then(json => {
        if (json.success) {
          this.setState({
            user: _.clone(json.item)
          });
        }
      });
    }
  }

  _handleFormChange(e) {
    let newState = _.update( this.state, e.target.name, function() {
      return e.target.value.trim();
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

    let newUser = _.cloneDeep(user);
    newUser.username = newUser.username.trim();

    dispatch(userActions.sendUpdateUser(newUser)).then((json) => {
      this.setState({ isLoading: false });
      if (json.success) {
        this.props.handleEditEmail();
      }
    });
  }

  render() {
    const { 
      user
      , isLoading 
    } = this.state;

    const {  
      emailId
      , handleEditEmail 
    } = this.props;

    const isEmpty = (
      !emailId
      || !user
    );

    /**  README: since from bulk invite primary contact proceed to the process even primary email address is empty, 
    so I put in temporary email address 'hideme.ricblyz+@gmail.com', this temporary email should not display in user interface */
    const username = user ? user.username.match(/hideme.ricblyz/g) ? '' : user.username : '';

    return (
      isEmpty || isLoading ?
      <div className="u-centerText">
        <div className="loading -small"></div>
      </div>
      :
      <form name="emailForm" onSubmit={this._handleFormSubmit}>
        <div className="yt-col input-group" style={{ marginBottom: 0 }}>
          <EmailInput
            name="user.username"
            label=""
            value={username}
            change={this._handleFormChange}
            required={true}
          />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <div className="yt-row space-between">
            <button className="yt-btn link x-small danger" type="button" onClick={handleEditEmail}> Cancel </button>
            <button className="yt-btn link x-small info" type="submit" > Update Email </button>
          </div>
        </div>        
      </form>          
    )
  }
}

EmailForm.propTypes = {
  dispatch: PropTypes.func.isRequired
  , handleEditEmail: PropTypes.func.isRequired  
  , emailId: PropTypes.number
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
  )(EmailForm)
);