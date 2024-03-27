/**
 * Reusable component for setting recipients on a file request. Either select from existing users or enter freeform user information.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';

// import form components
import { SelectFromObject, EmailInput } from '../../../../global/components/forms'


class RecipientInput extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      recipientType: props.recipientListItems && props.recipientListItems.length > 0 ? 'existing' : 'new'
    }
    this._bind(
      '_handleChangeRecipientType'
    )
  }

  _handleChangeRecipientType(type) {
    const { currentIndex } = this.props;
    this.setState({
      recipientType: type
    })
    // Clear the recipient info when the type changes.
    const event = {
      target: {
        name: `recipients[${currentIndex}]`
        , value: {
          email: ''
        }
      }
    }
    this.props.change(event)
  }

  render() {
    const {
      change
      , currentIndex
      , recipient
      , recipientListItems
      , removeRecipient
      , filterable
      , hiddenBtn
      , hideRemoveBtn = false
    } = this.props;
    
    const { recipientType } = this.state;
    const isFilterable = filterable ? true : false;
    
    return (
      <div className="yt-row">
      { recipientType === 'existing' && recipientListItems.length > 0 ?
        <div className="yt-col input-group">
          <SelectFromObject 
            change={change}
            display={'displayName'}
            filterable={isFilterable}
            name={`recipients[${currentIndex}][email]`}
            value={'email'}
            items={recipientListItems}
            required={true}
            selected={recipient.email}
            placeholder="Choose a recipient"
            displayStartCase={false}
          />
          { !hiddenBtn && <button className="yt-btn xx-small link info" onClick={() => this._handleChangeRecipientType('new')}> Or enter an email address </button> }
        </div>
        :
        <div className="yt-col input-group">
          <EmailInput
            autoFocus={true}
            change={change}
            name={`recipients[${currentIndex}]['email']`}
            placeholder='Enter an email address'
            required={true}
            value={recipient['email']}
          />
          { recipientListItems && recipientListItems.length > 0 ?
            <button className="yt-btn xx-small link info" onClick={() => this._handleChangeRecipientType('existing')}>
              Or choose from existing users
            </button>
            :
            null
          }
        </div>
      }
        <button className="yt-btn xx-small link u-pullRight" style={{maxHeight: '2.5em', visibility: hideRemoveBtn ? 'hidden': 'visible'}} onClick={hideRemoveBtn ? null: removeRecipient}>
          <i className="far fa-times" />
        </button>
      </div>
    )
  }
}

RecipientInput.propTypes = {
  change: PropTypes.func.isRequired
  , currentIndex: PropTypes.number.isRequired
  , recipient: PropTypes.object.isRequired
  , recipientListItems: PropTypes.arrayOf(PropTypes.object)
}

RecipientInput.defaultProps = {

}

export default RecipientInput;
