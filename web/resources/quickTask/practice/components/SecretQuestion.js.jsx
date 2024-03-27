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

class SecretQuestion extends Binder {
  constructor(props) {
    super(props);
    this.state = {}
  }

  render() {
    const {
        secretQuestions
        , handleFormChange
        , selectedQuestion
        , currentIndex
        , signer
        , signers
    } = this.props;
    
    console.log("this", this.props)

    return (
        <div>
            <SelectFromObject
                change={handleFormChange}
                items={secretQuestions}
                display="display"
                displayStartCase={false}
                name={`signers[${currentIndex}][auth][selectedQuestions]`}
                selected={signer.auth && signer.auth.selectedQuestions}
                value="val"
                // label={`Signer #${currentIndex + 1}`}
            />
            {
              signer.auth && signer.auth.selectedQuestions != 'none' ?
              <TextInput
                change={handleFormChange}
                helpText={currentIndex+1 === signers.length ? 'Make sure the answer is something you both know' : '' }
                name={`signers[${currentIndex}][auth][password]`}
                placeholder="Shared answer"
                required
                value={signer.auth && signer.auth.password}
              />
              : null
            }
        </div>
    )
  }
}

SecretQuestion.propTypes = {
  allowSharedEmail: PropTypes.bool
  , change: PropTypes.func.isRequired
  , currentIndex: PropTypes.number.isRequired
  , handleSignerChange: PropTypes.func.isRequired
  , signer: PropTypes.object.isRequired
  // , signerListItems: PropTypes.arrayOf(PropTypes.object).isRequired
}

SecretQuestion.defaultProps = {
  allowSharedEmail: false
}

export default SecretQuestion;
