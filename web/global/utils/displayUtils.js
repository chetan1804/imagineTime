import _ from 'lodash';
import { DateTime } from 'luxon';
import { COUNTRIES, STATES, COUNTRY_STATES } from '../../config/constants';
import { formatPhoneNumber } from 'react-phone-number-input'

const displayUtils = {

  getInitials(user) {
    if(user.firstname) {
      return user.firstname.charAt(0).toUpperCase() + user.lastname.charAt(0).toUpperCase();
    } else if(user.username) {
      return user.username.charAt(0).toUpperCase();
    } else {
      return "?"
    }
  }

  , getUserColorBG(user) {
    const colorMap = {
        0: "#f39a88" 
      , 1: "#F1910E" 
      , 2: "#D26D87" 
      , 3: "#C096CA" 
      , 4: "#F5684D" 
      , 5: "#0DA79D" 
      , 6: "#4EBAC5" 
      , 7: "#4b4b4b" 
      , 8: "#8CC63F" 
    }
    let h = (DateTime.fromISO(user.created).hour + 1) % 8;
    return colorMap[h];
  }
  
  , getFileIcon(category, contentType, file = {}) {
    let icon = 'file-80';
    if(category === 'image') {
      icon = 'picture-80';
    } else if(category === 'video') {
      icon = 'video-file-80';
    } else if (category === "folder") {
      if (contentType && contentType.includes("template")){
        icon = "folder-template"
      } else {
        icon = "folder-empty"
      }
    } else if(contentType) {
      if(
        contentType.indexOf('xls') > -1
        || contentType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        || contentType.indexOf('ms-excel') > -1
      ) {
        icon = 'xls-80';
      } else if(contentType.indexOf('zip') > -1) {
        icon = 'zip-80';
      } else if(
          contentType.indexOf('ppt') > -1
          || contentType.indexOf('powerpoint') > -1
          || contentType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ) {
        icon = 'ppt-80';
      } else if(contentType.indexOf('pdf') > -1) {
        icon = 'pdf-80';
      } else if(contentType.indexOf('csv') > -1) {
        icon = 'csv-80';
      } else if(contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
        icon = 'word-80';
      } else if(file && file.fileExtension && file.fileExtension.indexOf('.mp4') > -1) {
        icon = 'video-file-80';
      } else {

        console.log('file file file', file);

        if(file && file.fileExtension) {
          if(['.pdf'].includes(file.fileExtension.toLowerCase())) {
            icon = 'pdf-80';
          } else if (['.jpg', '.png', '.jpeg'].includes(file.fileExtension.toLowerCase())) {
            icon = 'picture-80';
          }
        }
      }
    } else {
      // do nothing


    }

    return icon;
  }

  , getTaskIcon(taskType) {
    let icon;
    switch(taskType) {
      case "document-request": {
        icon = "fas fa-file-upload fa-lg";
        break;
      }
      case "document-delivery": {
        icon = "fas fa-paperclip fa-lg";
        break;
      }
      case "signature-request": {
        icon = "fas fa-file-signature fa-lg";
        break;
      }
      case "text": {
        icon = "far fa-text fa-lg";
        break;
      }
      default: {
        icon = "fas fa-file-upload fa-lg";
      }
    }
    return icon;
  }

  , getTaskPlaceholder(taskType) {
    let placeholder;
    switch(taskType) {
      case "document-request": {
        placeholder = "Describe the requested files here...";
        break;
      }
      case "document-delivery": {
        placeholder = "Describe the attached files here...";
        break;
      }
      case "signature-request": {
        placeholder = "Describe the attached file here...";
        break;
      }
      case "text": {
        placeholder = "Type your question here...";
        break;
      }
      default: {
        placeholder = "Describe the requested files here...";
      }
    }
    return placeholder;
  }

  , getShareLinkAuthLabel(authType) {
    let label; 
    switch(authType) {
      case "shared-client-secret":
      case "secret-question": {
        label = "Answer";
        break;
      }
      case "tax-id": {
        label = "Tax ID (SSN or EIN)";
        break;
      } 
      default: {
        label = "Password"
      }
    }
    return label;
  }
  , getShareLinkAuthPrompt(authType) {
    let label; 
    switch(authType) {
      case "secret-question": {
        label = "Please answer your secret question";
        break;
      }
      case "shared-client-secret": {
        label = "Please answer your security question";
        break;
      }
      default: {
        label = "Enter the password for this link";
      }
    }
    return label;
  }
  , getShareLinkViewParams(authType) {
    let label; 
    switch(authType) {
      case "secret-question": {
        label = "Anyone with this link and knows the answer to the client's secret question can view the files.";
        break;
      }
      case "tax-id": {
        label = "Anyone with this link and who knows this client's tax id can view the files";
        break;
      } 
      case "none": {
        label = "Anyone with this link can view the files";
        break;
      }
      default: {
        label = "Anyone with this link and password can view the files.";
      }
    }
    return label;
  }
  , formatPhoneNumber(phoneNumber) {
    let cleaned = ('' + phoneNumber).replace(/\D/g, '')
    let match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      let intlCode = (match[1] ? '+1 ' : '')
      return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('')
    }
    return null
  }

  , getColor(index) {
    let newIndex = index ? index : 0;
    
    while (newIndex > 20) {
      newIndex -= 20;
    }

    const color = [
      "#669933"
      , "#6dd5ed"
      , "#753a88"
      , "#65d487"
      , "#2c3e50"
      , "#ffb88c"
      , "#48b1bf"
      , "#f45c43"
      , "#f7bb97"
      , "#a8e063"
      , "#516395"
      , "#ef629f"
      , "#d6ae7b"
      , "#00cdac"
      , "#e29587"
      , "#faaca8"
      , "#185a9d"
      , "#dd2476"
      , "#19547b"
      , "#ffedbc"
    ];

    return color[newIndex];
  }

  , getLocationByString(fileMap, fileId) {
    let locationByString = "";
    if (fileMap[fileId]) {
      do {
        if (fileMap[fileId]) {
          locationByString = `${fileMap[fileId].filename} ${locationByString ? "> " : ""}${locationByString}`;
          fileId = fileMap[fileId]._folder;
        }
      } while (fileId);
    }
    return locationByString;
  }

  , getLocationByStringSubfolder(subfolder, folderId) {
    let locationByString = "";
    if (subfolder && subfolder.length) {
      let folder = subfolder.filter(a => a._id === folderId)
      do {
        if (folder && folder.length && folderId) {
          folder = folder[0];
          locationByString = `${folder.name} ${locationByString ? "> " : ""}${locationByString}`;
          folderId = folder._folder;
          folder = subfolder.filter(a => a._id === folderId)
        }
      } while (folder && folderId);
    }
    return locationByString;
  }

  , getMergeFieldValue(name, store) {

    let value = '';
    const {
      firm
      , user
      , addressMap
      , phoneNumberMap
      , client
      , clientPrimaryContact
      , template
    } = store;

    let address = {};
    if (firm && name.indexOf('Firm.Address') > -1 && addressMap && addressMap[firm._primaryAddress]) {
      address = addressMap[firm._primaryAddress];
    } else if (client && name.indexOf('Client.Address') > -1 && addressMap && addressMap[client._primaryAddress]) {
      address = addressMap[client._primaryAddress];
    } else if (clientPrimaryContact && name.indexOf('Client.Primary.Address') > -1 && addressMap && addressMap[clientPrimaryContact._primaryAddress]) {
      address = addressMap[clientPrimaryContact._primaryAddress];
    } else if (user && name.indexOf('User.Address') > -1 && addressMap && addressMap[user._primaryAddress]) {
      address = addressMap[user._primaryAddress];
    }
    let country = address.country;
    let state = address.state;
    let phoneNumber = "";

    if (name.indexOf('Address') > -1) {

      // country 
      country = _.find(COUNTRIES, { code: country });
      country = country ? country.name : address.country;

      // state
      const NEW_STATES = COUNTRY_STATES[address.state] || STATES;
      state = _.find(NEW_STATES, { code: state });
      state = state ? state.name : address.state;
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

      // FIRM
      case 'Firm.Name': 
        value = firm.name;
        break;
      // case 'Firm.Address':
      //   addressValue();
      //   break;
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

      // USER
      case 'User.FirstName':
        value = user.firstname;
        break;
      case 'User.LastName':
        value = user.lastname;
        break;
      case 'User.UserName':
        value = user.username;
        break;
      case 'User.PhoneNumber':
        phoneNumber = user && user._primaryPhone && phoneNumberMap[user._primaryPhone] ? phoneNumberMap[user._primaryPhone].number : "";
        phoneNumber += user && phoneNumber && phoneNumber.trim() && phoneNumberMap[user._primaryPhone] && phoneNumberMap[user._primaryPhone].extNumber ? ` ${phoneNumberMap[user._primaryPhone].extNumber}` : ""
        if (phoneNumber) {
          value = formatPhoneNumber(phoneNumber, 'National') ? formatPhoneNumber(phoneNumber, 'National') : phoneNumber;
        }
        break;
      // case 'User.Address':
      //   addressValue();
      //   break;
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
        value = client && client.name;
        break;
      case 'Client.Identifier': 
        value = client && client.identifier;
        break;
      case 'Client.PhoneNumber': 
        phoneNumber = client && client._primaryPhone && phoneNumberMap[client._primaryPhone] ? phoneNumberMap[client._primaryPhone].number : "";
        phoneNumber += client && phoneNumber && phoneNumber.trim() && phoneNumberMap[client._primaryPhone] && phoneNumberMap[client._primaryPhone].extNumber ? ` ${phoneNumberMap[client._primaryPhone].extNumber}` : ""
        if (phoneNumber) {
          value = formatPhoneNumber(phoneNumber, 'National') ? formatPhoneNumber(phoneNumber, 'National') : phoneNumber;
        }
        break;
      // case 'Client.Address':
      //   addressValue();
      //   break;
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
      case 'Client.Primary.FirstName':
        value = clientPrimaryContact && clientPrimaryContact.firstname;
        break;
      case 'Client.Primary.LastName':
        value = clientPrimaryContact && clientPrimaryContact.lastname;
        break;
      case 'Client.Primary.UserName':
        value = clientPrimaryContact && clientPrimaryContact.username;
        break;
      case 'Client.Primary.PhoneNumber':
        phoneNumber = clientPrimaryContact && clientPrimaryContact._primaryPhone && phoneNumberMap[clientPrimaryContact._primaryPhone] ? phoneNumberMap[clientPrimaryContact._primaryPhone].number : "";
        phoneNumber += clientPrimaryContact && phoneNumber && phoneNumber.trim() && phoneNumberMap[clientPrimaryContact._primaryPhone] && phoneNumberMap[clientPrimaryContact._primaryPhone].extNumber ? ` ${phoneNumberMap[clientPrimaryContact._primaryPhone].extNumber}` : ""
        if (phoneNumber) {
          value = phoneNumber;
        }
        break;
      // case 'Client.Primary.Address':
      //   addressValue();
      //   break;
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

      case 'Date.Now':
        value = DateTime.fromJSDate(new Date()).toFormat("MMMM dd yyyy");
        break;
      case 'DateTime.Now':
        value = DateTime.fromJSDate(new Date()).toFormat("MMMM dd yyyy hh:mm:ss.s");
        break;
      case 'Date.Document.Creation':
        value = template && template.created_at ? DateTime.fromISO(template.created_at).toFormat("MMMM dd yyyy") : "";
        break;
      case 'DateTime.Document.Creation':
        value = template && template.created_at ? DateTime.fromISO(template.created_at).toFormat("MMMM dd yyyy hh:mm:ss.s") : "";
        break;
      default:
        // do nothing
        break;
    }

    return value ? value.trim() : "";
  }

  , convertBytesToReadable(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    
    while(bytes >= 1000 && units.length - 1) {
      bytes = bytes/1000;
      i++;
    }

    return `${bytes.toFixed(2)} ${units[i]}`;
  }
}

export default displayUtils;