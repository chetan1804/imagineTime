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
import * as clientUserActions from '../../../clientUser/clientUserActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

class ClientUserPositionForm extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            selectedClientUser: null
            , isLoading: false
        }
        this._bind(
            '_handleFormChange'
            , '_handleFormSubmit'
        )
    }

    componentDidMount() {
        const { 
            selectedClientUser
            , dispatch
        } = this.props;

        if (selectedClientUser) {
            this.setState({ selectedClientUser });
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

    const { dispatch, close } = this.props;
    const { selectedClientUser } = this.state;

    if (e) {
      e.preventDefault();
    }

    // separate fullname to first name and last name
    dispatch(clientUserActions.sendUpdateClientUser(selectedClientUser)).then((json) => {
      this.setState({ isLoading: false });
      if (json.success && json.item && close) {
        close(json.item);
      }
    });
  }

  render() {
    const { selectedClientUser, isLoading } = this.state;
    const { close } = this.props;

    const isEmpty = (
      !selectedClientUser
    );

    return (
      isEmpty || isLoading ?
      <div className="u-centerText">
        <div className="loading -small"></div>
      </div>
      :
      <form name="ClientUserPositionForm" onSubmit={this._handleFormSubmit}>
        <div className="yt-col input-group" style={{ marginBottom: 0 }}>
          <TextInput
            change={this._handleFormChange}
            name="selectedClientUser.position"
            value={selectedClientUser.position || ""}
            placeholder="Position"
          />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <div className="yt-row space-between">
            <button className="yt-btn link x-small danger" type="button" onClick={() => close(this.props.selectedClientUser)}> Cancel </button>
            <button className="yt-btn link x-small info" type="submit" > Update Position </button>
          </div>
        </div>        
      </form>          
    )
  }
}

ClientUserPositionForm.propTypes = {
  dispatch: PropTypes.func.isRequired
  , selectedClientUser: PropTypes.object.isRequired  
  , close: PropTypes.func.isRequired  
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
  )(ClientUserPositionForm)
);