/**
 * Reusable component for setting signers on a signature request. Either select from existing users or enter freeform user information.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

// import constants
import { STATES } from '../../../../config/constants';

// import form components
import { 
  EmailInput, 
  SelectFromObject, 
  TextInput, 
  SingleDatePickerInput,
  NumberInput } from '../../../../global/components/forms'

import { DateTime } from 'luxon';
import SecretQuestion from './SecretQuestion.js.jsx';

class SignerInput extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      signerType: props.selectedClient ? 'existing' : 'new' // 'new'
      , selectedClient: props.selectedClient
    }
    this._bind(
      '_handleChangeSignerType'
    )
  }

  componentDidUpdate(prevProps) {
    let prevProp = _.cloneDeep(prevProps);
    let prevState = _.cloneDeep(this.state);

    if (!prevProp.selectedClient && !prevState.selectedClient) {
      // do nothing
    } else if (!prevProp.selectedClient && prevState.selectedClient || prevProp.selectedClient && !prevState.selectedClient) {
      this.setState({ signerType: "existing", selectedClient: prevProp.selectedClient });
    } else if (prevProp.selectedClient._id !== prevState.selectedClient._id) {
      this.setState({ signerType: "existing", selectedClient: prevProp.selectedClient });
    }
  }

  _handleChangeSignerType(type) {
    const { currentIndex, signer, authType } = this.props;
    this.setState({
      signerType: type
    })
    // Clear the signer info when the type changes.
    const event = {
      target: {
        name: `signers[${currentIndex}]`
        , value: {
          firstname: ''
          , lastname: ''
          , username: ''
        }
      }
    }
    if(signer.kba) {
      event.target.value.kba = {
        city: ''
        , zip: ''
        , state: ''
        , address: ''
        , ssn: ''
        , dob: ''
      }
    }

    if (authType === 'individual-auth') {
      event.target.value.auth = signer.auth;
    }

    this.props.change(event)
  }

  render() {
    const {
      allowSharedEmail
      , change
      , currentIndex
      , handleSignerChange
      , signer
      , signerListItems
      , signersId
      , selectedClient
      , secretQuestions
      , selectedQuestion
      , signers
      , authType
    } = this.props;
    
    // const signerType = selectedClient ? this.state.signerType : "new";
    const signerType = selectedClient ? this.state.signerType : "new";

    return (
      signerType === 'existing' ?
      <div>
        <SelectFromObject 
          change={handleSignerChange}
          display={'displayName'}
          filterable={false}
          label={`Signer #${currentIndex + 1}`}
          name={`signers[${currentIndex}]`}
          value={'_id'}
          items={signerListItems}
          required={true}
          selected={signer._id}
          placeholder='Select a user'
          signersId={signersId || null}
        />
        { signer.kba ?
          <div className="-rmb-custom-template">
            <TextInput
              change={change}
              placeholder='Street Address'
              name={`signers[${currentIndex}][kba]['address']`}
              required={true}
              value={signer.kba.address}
            />
            <TextInput
              change={change}
              placeholder='City'
              name={`signers[${currentIndex}][kba]['city']`}
              required={true}
              value={signer.kba.city}
            />
            <SelectFromObject 
              change={change}
              display={'name'}
              filterable={true}
              name={`signers[${currentIndex}]['kba']['state']`}
              value={'code'}
              items={STATES}
              required={true}
              selected={signer.kba.state}
              placeholder='Select a state'
            />
            <TextInput
              change={change}
              placeholder='Zipcode'
              name={`signers[${currentIndex}]['kba']['zip']`}
              required={true}
              value={signer.kba.zip}
            />
            <TextInput
              change={change}
              placeholder='Social Security Number (optional)'
              name={`signers[${currentIndex}][kba]['ssn']`}
              required={false}
              value={signer.kba.ssn}
              helpText={'format xxx-xx-xxxx'}
            />
            <SingleDatePickerInput
              change={change}
              name={`signers[${currentIndex}][kba]['dob']`}
              anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
              enableOutsideDays={false}
              initialDate={null} // epoch/unix time in milliseconds
              inputClasses='dobinput'
              numberOfMonths={1}
              placeholder={"Date of Birth (optional)"}
            />
          </div>
          :
          null
        }
        {
          authType === "individual-auth" ?
          <SecretQuestion
            secretQuestions={secretQuestions}
            handleFormChange={change}
            selectedQuestion={selectedQuestion}
            signer={signer}
            signers={signers}
            currentIndex={currentIndex}
          />
          : null
        }
        <button className="yt-btn xx-small link info" onClick={() => this._handleChangeSignerType('new')}>
          <i className="fal fa-plus"/> Add new
        </button>
      </div>
      :
      signerType === 'new' ?
      <div className="input-group">
        <label>{`Signer #${currentIndex + 1}`}</label>
        <TextInput
          autoFocus={true}
          change={change}
          placeholder='First name'
          name={`signers[${currentIndex}]['firstname']`}
          required={true}
          value={signer['firstname']}
        />
        <TextInput
          change={change}
          name={`signers[${currentIndex}]['lastname']`}
          placeholder='Last name'
          required={true}
          value={signer['lastname']}
        />
        <EmailInput
          allowComment={allowSharedEmail}
          change={change}
          helpText={signer.sharedEmail ? 'For shared email addresses, please enter a comment. e.g. name(spouse)@domain.com' : ''}
          name={`signers[${currentIndex}]['username']`}
          placeholder='Email'
          required={true}
          value={signer['username']}
        />
         { signer.kba ?
          <div>
            <TextInput
              change={change}
              placeholder='Street Address'
              name={`signers[${currentIndex}][kba]['address']`}
              required={true}
              value={signer.kba.address}
            />
            <TextInput
              change={change}
              placeholder='City'
              name={`signers[${currentIndex}][kba]['city']`}
              required={true}
              value={signer.kba.city}
            />
            <SelectFromObject 
              change={change}
              display={'name'}
              filterable={true}
              name={`signers[${currentIndex}]['kba']['state']`}
              value={'code'}
              items={STATES}
              required={true}
              selected={signer.kba.state}
              placeholder='Select a state'
            />
            <TextInput
              change={change}
              placeholder='Zipcode'
              name={`signers[${currentIndex}]['kba']['zip']`}
              required={true}
              value={signer.kba.zip}
            />
            <TextInput
              change={change}
              placeholder='Social Security Number (optional)'
              name={`signers[${currentIndex}][kba]['ssn']`}
              required={false}
              value={signer.kba.ssn}
              helpText={'format xxx-xx-xxxx'}
            />
            <SingleDatePickerInput
              change={change}
              name={`signers[${currentIndex}]['kba']['dob']`}
              anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
              enableOutsideDays={false}
              initialDate={null} // epoch/unix time in milliseconds
              inputClasses='dobinput'
              numberOfMonths={1}
              placeholder={"Date of Birth (optional)"}
            />
          </div>
          :
          null
        }
        {
          authType === "individual-auth" ?
          <SecretQuestion
            secretQuestions={secretQuestions}
            handleFormChange={change}
            selectedQuestion={selectedQuestion}
            signer={signer}
            signers={signers}
            currentIndex={currentIndex}
          />
          : null
        }
        {
          selectedClient ?
          <button className="yt-btn xx-small link danger" onClick={() => this._handleChangeSignerType('existing')}>Cancel</button>
          : null
        }
      </div>
      :
      null
    )
  }
}

SignerInput.propTypes = {
  allowSharedEmail: PropTypes.bool
  , change: PropTypes.func.isRequired
  , currentIndex: PropTypes.number.isRequired
  , handleSignerChange: PropTypes.func.isRequired
  , signer: PropTypes.object.isRequired
  // , signerListItems: PropTypes.arrayOf(PropTypes.object).isRequired
}

SignerInput.defaultProps = {
  allowSharedEmail: false
}

export default SignerInput;
