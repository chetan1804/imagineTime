let DateTime = require('luxon').DateTime;
// import { COUNTRIES, STATES, COUNTRY_STATES } from '../../config/constants';
// import { formatPhoneNumber } from 'react-phone-number-input'
const COUNTRIES = require('../constants').COUNTRIES;
const STATES = require('../constants').STATES;
const COUNTRY_STATES = require('../constants').COUNTRY_STATES;

exports.getMergeFieldValue = (name, store) => {
    let value = '';
    const {
      firm
      , addressMap
      , loggedInUser
      , phoneNumberMap
      , client
      , clientPrimaryContact
    } = store;

    let address = {};
    if (firm && name.indexOf('Firm.Address') > -1 && addressMap && addressMap[firm._primaryAddress]) {
      address = addressMap[firm._primaryAddress];
    } else if (loggedInUser && name.indexOf('User.Address') > -1 && addressMap && addressMap[loggedInUser._primaryAddress]) {
      address = addressMap[loggedInUser._primaryAddress];
    } else if (client && name.indexOf('Client.Address') > -1 && addressMap && addressMap[client._primaryAddress]) {
      address = addressMap[client._primaryAddress];
    } else if (clientPrimaryContact && name.indexOf('Client.Primary.Address') > -1 && addressMap && addressMap[clientPrimaryContact._primaryAddress]) {
      address = addressMap[clientPrimaryContact._primaryAddress];
    }
    let country = address.country;
    let state = address.state;
    let phoneNumber = "";

    if (name.indexOf('Address') > -1) {

      // country 
      country = country && COUNTRIES[country] && COUNTRIES[country].name || address.country ;

      // state
      const NEW_STATES = COUNTRY_STATES[state] || STATES;
      state = state && NEW_STATES[state] && NEW_STATES[state].name || address.state;
    }

    const addressValue = () => {
      value = address.street1 ? `${address.street1}, ` : "";
      value += address.street2 ? `${address.street2}, ` : "";
      value += address.city ? `${address.city}, ` : "";
      value += state ? `${state}, ` : "";
      value += address.postal ? `${address.postal}, ` : "";
      value += country ? `${country}, ` : "";
    }

    switch (name) {

      // FIRM DETAILS
      case 'Firm.Name': 
        value = firm.name;
        break;
      case 'Firm.Address':
        addressValue();
        break;
      case 'Firm.Address.Street':
        value = address.street1 ? `${address.street1}, ` : "";
        value += address.street2 ? `${address.street2}, ` : "";
        break;
      case 'Firm.Address.City':
        value = address.city;
        break;
      case 'Firm.Address.State':
        value = state;
        break;
      case 'Firm.Address.ZipCode':
        value = address.postal
        break;
      case 'Firm.Address.Country':
        value = country;
        break;


      // USER, loggedInUser
      case 'User.FullName':
        value = `${loggedInUser.firstname} ${loggedInUser.lastname}`;
        break;
      case 'User.FirstName':
        value = loggedInUser.firstname;
        break;
      case 'User.LastName':
        value = loggedInUser.lastname;
        break;
      case 'User.UserName':
        value = loggedInUser.username;
        break;
      case 'User.PhoneNumber':
        phoneNumber = loggedInUser && loggedInUser._primaryPhone && phoneNumberMap[loggedInUser._primaryPhone] ? phoneNumberMap[loggedInUser._primaryPhone].number : null;
        if (phoneNumber) {
          value = phoneNumber;
        }
        break;
      case 'User.Address':
        addressValue();
        break;
      case 'User.Address.Street':
        value = address.street1 ? `${address.street1}, ` : "";
        value += address.street2 ? `${address.street2}, ` : "";
        break;
      case 'User.Address.City':
        value = address.city;
        break;
      case 'User.Address.State':
        value = state;
        break;
      case 'User.Address.ZipCode':
        value = address.postal
        break;
      case 'User.Address.Country':
        value = country;
        break;

      // CLIENT
      case 'Client.Name': 
        value = client.name;
        break;
      case 'Client.Identifier': 
        value = client.identifier;
        break;
      case 'Client.PhoneNumber': 
        phoneNumber = client && client._primaryPhone && phoneNumberMap[client._primaryPhone] ? phoneNumberMap[client._primaryPhone].number : null;
        if (phoneNumber) {
          value = phoneNumber;
        }
        break;
      case 'Client.Address':
        addressValue();
        break;
      case 'Client.Address.Street':
        value = address.street1 ? `${address.street1}, ` : "";
        value += address.street2 ? `${address.street2}, ` : "";
        break;
      case 'Client.Address.City':
        value = address.city;
        break;
      case 'Client.Address.State':
        value = state;
        break;
      case 'Client.Address.ZipCode':
        value = address.postal
        break;
      case 'Client.Address.Country':
        value = country;
        break;

      // CLIENT PRIMARY CONTACT
      case 'Client.Primary.FullName':
        value = `${clientPrimaryContact.firstname} ${clientPrimaryContact.lastname}`;
        break;
      case 'Client.Primary.FirstName':
        value = clientPrimaryContact.firstname;
        break;
      case 'Client.Primary.LastName':
        value = clientPrimaryContact.lastname;
        break;
      case 'Client.Primary.UserName':
        value = clientPrimaryContact.username;
        break;
      case 'Client.Primary.PhoneNumber':
        phoneNumber = clientPrimaryContact && clientPrimaryContact._primaryPhone && phoneNumberMap[clientPrimaryContact._primaryPhone] ? phoneNumberMap[clientPrimaryContact._primaryPhone].number : null;
        if (phoneNumber) {
          value = phoneNumber;
        }
        break;
      case 'Client.Primary.Address':
        addressValue();
        break;
      case 'Client.Primary.Address.Street':
        value = address.street1 ? `${address.street1}, ` : "";
        value += address.street2 ? `${address.street2}, ` : "";
        break;
      case 'Client.Primary.Address.City':
        value = address.city;
        break;
      case 'Client.Primary.Address.State':
        value = state;
        break;
      case 'Client.Primary.Address.ZipCode':
        value = address.postal
        break;
      case 'Client.Primary.Address.Country':
        value = country;
        break;
    }

    return value ? value.trim() : "";
  }