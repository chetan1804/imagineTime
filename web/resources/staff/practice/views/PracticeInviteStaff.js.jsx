/**
 * View component for /firm/:firmId/serttings/staff/invite
 * 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as staffActions from '../../staffActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import form components
import { TextAreaInput } from '../../../../global/components/forms';

// import staffClient components
import PracticeFirmLayout from '../../../firm/practice/components/PracticeFirmLayout.js.jsx';


class PracticeInviteStaff extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      emailAddresses: ''
      , submitting: false
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    // dispatch(staffActions.fetchDefaultStaff());
  }

  componentWillReceiveProps(nextProps) {
    // this.setState({
    //   staff: _.cloneDeep(nextProps.defaultStaff.obj)
    // })
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


  _handleFormSubmit(e) {
    const { dispatch, history, match } = this.props;
    const { emailAddresses } = this.state;
    this.setState({submitting: true});
    e.preventDefault();
    if(emailAddresses) {
      const emailsList = emailAddresses.split(',')
      emailsList.forEach(email => {
        console.log('email', email)
        // TODO dispatch invites here.
      })
      this.setState({submitting: false}, () => history.push(`${match.url.substring(0, match.url.indexOf('/invite'))}`))
    }
  }

  render() {
    const { match } = this.props;
    const { emailAddresses, submitting } = this.state;

    const isEmpty = false;
    const isFetching = false;

    const cancelLink = `${match.url.substring(0, match.url.indexOf('/invite'))}`

    return (
      <PracticeFirmLayout>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <div>Empty.</div>
          )
          :
          <Modal
            closeAction={() => this.props.history.push(cancelLink)}
            isOpen={true}
            showButtons={false}
          >
            <div className="yt-container">
              <div className="yt-row center-horiz">
                <div className="form-container -slim">
                  <form name="inviteClientUserForm" className="inviteClientUser-form" onSubmit={this._handleFormSubmit}>
                    <div className="formHeader u-textLeft">
                      <h3> Invite your staff members to {brandingName.title} </h3>
                    </div>
                    <TextAreaInput
                      change={this._handleFormChange}
                      label="Email Addresses"
                      helpText="Your staff members will receive an email that gives them access to this account."
                      name="emailAddresses"
                      placeholder="Separate email addresses with comma."
                      required={true}
                      value={emailAddresses || ''}
                    />
                    <div className="input-group">
                      <div className="yt-row space-between">
                        <Link className="yt-btn link" to={cancelLink}>Cancel</Link>
                        <button className="yt-btn " type="submit" disabled={submitting} > Invite </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Modal>
        }
      </PracticeFirmLayout>
    )
  }
}

PracticeInviteStaff.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    defaultStaff: store.staff.defaultItem
    , staffStore: store.staff
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeInviteStaff)
);
