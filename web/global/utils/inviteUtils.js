import { map } from "lodash";

const inviteUtils = {

  getCSVSubmitObj(readerResult, submitObj) {  
    // set our success variable
    submitObj.success = true;
    // setup variables
    let clientsArray = [];
    let errorsArray = [];
    let hasContactEmail = false;
    // replace all new line characters with %. Then split on % where % is not in quotes (meaning don't split on new line characters that are inside one of the fields.)
    let lineArrays = readerResult.replace(/\r?\n|\r/g,"%").split(/%(?=(?:(?:[^"]*"){2})*[^"]*$)/g)
    // make sure our headers match what we need them to be
    // NOTE: In the future we might want to make this dynamic. Allow the fields to be in any order, as long as the field names are correct.
    //       Rather than hard coding the indices, we could just check the header line and save the index of each field. 
    console.log('lineArrays', lineArrays[0]);
    let header = lineArrays && lineArrays[0];
    header = header.split(',').map(item => item && item.toLowerCase().trim()).join(',');
    let headerItems = ['clientid,clientname,accounttype,street,city,state,postal,country,phonenumber,contactfullname,contactemail'
                      , 'clientid,clientname,engagementtype,street,city,state,postal,country,phonenumber,contactfullname,contactemail'];

    if(lineArrays && header && !(header.indexOf(headerItems[0]) > -1 || header.indexOf(headerItems[1]) > -1)) {

      submitObj.success = false;
      if(lineArrays[0].includes('error')) {
        // The user is re-uploading a corrected error report but has not deleted the error column.
        submitObj.message = `The CSV headers don't match the template. Please delete the "error" column and try again!`;
      } else {
        submitObj.message = "The CSV headers don't match the template. Please download the sample template, edit your file, and try again!";
      }
      // return our object
      return submitObj;
    }
    // if we only have one line, header, give error
    if(lineArrays.length === 1) {
      submitObj.success = false;
      submitObj.message = "Please make sure you have data populated in the CSV and try again!";
      // return our object
      return submitObj;
    }

    
    // console.log("clientStore", clientStore)
    // let clientStores = clientStore ? clientStore.byId ? Object.keys(clientStore.byId) : [] : [];
    // clientStores = clientStores.map(clientId => clientStore.byId[clientId]);

    // loop through each line - skipping the first line (headers)

    lineArrays.slice(1).map((line, i) => {

      /**
       * We are dealing with csv strings here. If there was a comma in a field that was exported as csv
       * it will have double quotes around it. We need to split the string at each comma that IS NOT inside
       * double quotes. This regex does that. More info: https://regexr.com/44u6o
       */
      console.log("itemArray", line);


      let itemArray = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/g);

      itemArray = itemArray.filter((a, b) => b < 10 || itemArray[b]);
      // console.log('itemArray.length', itemArray.length);



      if (itemArray.length >= 10) {

        let error = false;
        // setup the object that will store this line's information.
        let clientObj = {
          clientIdentifier: ''
          , clientName: ''
          , engagementTypes: []
          , primaryContact: []
          , error: null
        };

        // loop through each field, verify and capture the data.
        // console.log(itemArray);
        itemArray.map((item, index) => {

          let currentValue = item && item.trim() || "";
          currentValue = currentValue.replace(/"/g,'');

          // console.log('item, index, itemArray.length', item, index, itemArray.length);
          // remove any quotes from the string.
          if(index === 0) {
            clientObj.clientIdentifier = currentValue;
          }
          if(index === 1) {
            if(currentValue && currentValue.length > 2) {
              clientObj.clientName = currentValue;
            } else  {
              clientObj.error = 'Invalid client name';
            }
          }

          // No longer requiring accountType, contact name, contact email.
          if (index === 2) {
            clientObj.engagementTypes = [currentValue];
          }

          if (index === 3) {
            clientObj.street1 = currentValue;
          }

          if (index === 4) {
            clientObj.city = currentValue;
          }

          if (index === 5) {
            clientObj.state = currentValue;
          }

          if (index === 6) {
            clientObj.postal = currentValue;
          }

          if (index === 7) {
            clientObj.country = currentValue;
          }

          if(index === 8) {
            clientObj.number = currentValue;
          }

          if(index === 9) {
            if (currentValue) {
              let arrData = currentValue.split(" ");
              clientObj.primaryContact.push({
                firstname: arrData.slice(0, ((arrData.length/2) + (arrData.length%2))).join(" ") || ""
                , lastname: arrData.slice((arrData.length/2) + (arrData.length%2)).join(" ") || ""
              });
            }
          }

          // check if email is valid
          if(index === 10 && currentValue && itemArray[index-1] && itemArray[index-1].trim()) {
            clientObj.primaryContact[clientObj.primaryContact.length-1].email = currentValue;
            if (this.validateEmail(currentValue)) {
              hasContactEmail = true;
            } else if (currentValue) {
              clientObj.primaryContact[clientObj.primaryContact.length-1].error = "Invalid contact email";
              error = true;
            }
          }

          // add another contacts
          if (index >= 11 && itemArray[index]) {
            const nextEmail = itemArray[index] ? itemArray[index] : "";
            const existingEmail = clientObj.primaryContact.some(contact => contact.email ? contact.email === nextEmail.trim() : false);
            if (!existingEmail) {
              if ((index % 2) === 1) {
                if (currentValue) {
                  let arrData = currentValue.split(" ");
                  clientObj.primaryContact.push({
                    firstname: arrData.slice(0, ((arrData.length/2) + (arrData.length%2))).join(" ") || ""
                    , lastname: arrData.slice((arrData.length/2) + (arrData.length%2)).join(" ") || ""
                  });
                } else {
                  clientObj.primaryContact.push({ firstname: "", lastname: "" });
                }
              } else {
                // email
                clientObj.primaryContact[clientObj.primaryContact.length-1].email = currentValue;
                if (this.validateEmail(currentValue)) {
                  hasContactEmail = true;
                } else if (currentValue) {
                  clientObj.primaryContact[clientObj.primaryContact.length-1].error = "Invalid contact email";
                  error = true;
                }
              }
            }
          }

          if (index > 11 && index % 2 === 0) { // greater than 10 and even number
            if (currentValue && itemArray[index-1]) {
              clientObj.primaryContact[clientObj.primaryContact.length-1].email = currentValue;
              if (!this.validateEmail(currentValue)) {
                clientObj.primaryContact[clientObj.primaryContact.length-1].error = "Invalid contact email";
                error = true;
              }
            } else if (itemArray[index-1]) {
              clientObj.primaryContact[clientObj.primaryContact.length-1].error = "Invalid contact email";
              error = true;
            }
          }

          // We're at the end of the array, push the new client object to the correct array.
          if(itemArray.length > 0 && index + 1 === itemArray.length) {
            if(clientObj.error) {
              errorsArray.push(clientObj);
            } else if (error) {
              // remove invalid contact email from primaryContact
              if (clientObj.primaryContact.length === 1) {
                errorsArray.push(clientObj);
              } else {
                const clientObjError = _.cloneDeep(clientObj);

                // get contact with invalid email
                clientObjError.primaryContact = clientObjError.primaryContact.filter(contact => contact.error);
                errorsArray.push(clientObjError);

                // get contact with valid email
                clientObj.primaryContact = clientObj.primaryContact.filter(contact => !contact.error);
                clientsArray.push(clientObj);
              }
            } else {
              clientsArray.push(clientObj);
            }
            error = false;
          }
        });
      }
    });
    // save both arrays of client objects to the submit object.
    submitObj.newClients = clientsArray;
    submitObj.errors = errorsArray
    submitObj.success = true;
    submitObj.hasContactEmail = hasContactEmail;
    // return our object

    console.log('submitObj', submitObj);
    return submitObj;
  }

  , validateEmail(email) {
    // console.log(email);
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // console.log(re.test(email))
    return re.test(email);
  }

  , generateErrorReport(errorsArray) {
    let csv = "";
    // set header rows
    csv += "clientID,clientName,accountType,contactFullName,contactEmail,error (delete this column before importing)\n"
    errorsArray.map((clientObj, i) => {
      // Add the next line to the CSV
      let nextLine = '';
      nextLine += clientObj.clientIdentifier + ','
      nextLine += '"' + clientObj.clientName + '"' + ','
      nextLine += clientObj.engagementTypes.toString() + ','
      clientObj.primaryContact.map(contact => {
        nextLine += '"' + contact.firstname + " " + contact.lastname + '"' + ','
        nextLine += '"' + contact.email + '"' + ','
      });
      nextLine += clientObj.error || "Invalid contact email";
      // end line
      nextLine += '\n'
      csv += nextLine
    })
    return csv;
  }
  , generateResultsReport(responseData) {
    let csv = "";
    // set header rows
    csv += "clientID,clientName,contactFullName,contactEmail,result,error\n"
    responseData.results.map((item, i) => {
      // Add the next line to the CSV
      let nextLine = '';
      nextLine += item.clientIdentifier + ','
      nextLine += '"' + item.clientName + '"' + ','
      item.primaryContact.map(contact => {
        let firstname = contact.firstname || "";
        let lastname = contact.lastname || "";
        nextLine += '"' + firstname + " " + lastname + '"' + ','
        nextLine += '"' + contact.email + '"' + ','
      });
      nextLine += item.result_message + ','
      nextLine += item.error_message || ''
      // end line
      nextLine += '\n'
      csv += nextLine
    })
    return csv;
  }
  , checkInvitesComplete(invitations) {
    let complete = true
    invitations.forEach(invite => {
      // Not complete unless we have an email address for each invite.
      if(!invite.email) {
        complete = false
      }
    })
    return complete;
  }

  , getCSVSubmitStaffObj(readerResult, submitObj, subscription) {

    // set our success variable
    submitObj.success = true;

    // setup varialbes
    let staffsArray = [];
    let errorsArray = [];
    let hasContactEmail = false;

    // replace all new line characters with %. Then split on % where % is not in quotes (meaning don't split on new line characters that are inside one of the fields.)
    let lineArrays = readerResult.replace(/\r?\n|\r/g,"%").split(/%(?=(?:(?:[^"]*"){2})*[^"]*$)/g);

    // make sure our headers match what we need them to be
    // NOTE: In the future we might want to make this dynamic. Allow the fields to be in any order, as long as the field names are correct.
    // Rather than hard coding the indices, we could just check the header line and save the index of each field.
    if (lineArrays && lineArrays[0] && lineArrays[0] !== "email,fullName,ownerPrivileges") {
      submitObj.success = false;
      if(lineArrays[0].includes('error')) {
        // The user is re-uploading a corrected error report but has not deleted the error column.
        submitObj.message = `The CSV headers don't match the template. Please delete the "error" column and try again!`;
      } else {
        submitObj.message = "The CSV headers don't match the template. Please download the sample template, edit your file, and try again!";
      }
      // return our object
      return submitObj;
    }

    lineArrays = lineArrays.filter(item => item && item.trim());

    // count of list is more than in available licenses
    if (lineArrays && (lineArrays.length - 1) > parseInt(subscription.licenses)) {
      submitObj.success = false;
      submitObj.exceedList = true;
      return submitObj;
    }

    // if we only one line, header, giver error
    if (lineArrays.length === 1) {
      submitObj.success = false;
      submitObj.message = "Please make sure you have data populated in the CSV and try again!";
      // return our object
      return submitObj;
    }

    // loop through each line - skipping the first line (headers)
    lineArrays.slice(1).map((line, i) => {

      /**
       * We are dealing with csv strings here. If there was a comma in a field that was exported as csv
       * it will have double quotes around it. We need to split the string at each comma that IS NOT inside
       * double quotes. This regex does that. More info: https://regexr.com/44u6o
       */
      let itemArray = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/g);

      if (itemArray.length === 3) {

        // setup the object that will store this line's information.
        let staffObj = {
          email: ""
          , firstname: ""
          , lastname: ""
          , owner: false
          , error: null
        }

        itemArray.map((item, index) => {

          // remove any quotes from the string.
          item = item.replace(/"/g,'');
  
          // check if email is valid
          if (index === 0) {
            if (this.validateEmail(item.trim())) {
              staffObj.email = item.trim();
              hasContactEmail = true;
            } else {
              staffObj.error = 'Invalid email address';
            }
          }
  
          // first name
          if (index === 1) {
            // staffObj.firstname = item.trim();
            let arrFulname = item.split(" ");
            staffObj.firstname = arrFulname.slice(0, ((arrFulname.length/2) + (arrFulname.length%2))).join(" ") || ""; 
            staffObj.lastname = arrFulname.slice((arrFulname.length/2) + (arrFulname.length%2)).join(" ") || "";             
          }
  
          // // last name
          // if (index === 2) {
          //   staffObj.lastname = item.trim();
          // }
  
          // owner privilege
          if (index === 2 && item.trim()) {
            item = item && item.toLowerCase();
            staffObj.owner = item.indexOf('f') > -1 ? false : item.indexOf('t') > -1;
          }
  
          // We're at the end of the array, push the new staff object to the correct array.
          if (itemArray.length > 0 && index + 1 === itemArray.length) {
            if (staffObj.error) {
              errorsArray.push(staffObj);
            } else {
              staffsArray.push(staffObj);
            }
          }
        });        
      }
    });

    // // remove other rows
    // const newStaffArray = staffsArray.slice(0, parseInt(firm._subscription));

    // save both arrays of client objects to the submit object.
    submitObj.newStaffs = staffsArray;
    submitObj.errors = errorsArray;
    submitObj.success = true;
    submitObj.hasContactEmail = hasContactEmail;

    // return our object
    return submitObj;
  }

  , generateStaffErrorReport(errorsArray) {
    let csv = "";
    // set header rows
    csv += "email,fullName,ownerPrivileges,error (delete this column before importing)\n"
    errorsArray.map((staffObj, i) => {
      // Add the next line to the CSV
      let nextLine = '';
      nextLine += '"' + staffObj.email + '"' + ','
      nextLine += '"' + staffObj.firstname + " " + staffObj.lastname + '"' + ','
      nextLine += staffObj.owner + ','
      nextLine += staffObj.error
      // end line
      nextLine += '\n'
      csv += nextLine
    })
    return csv;
  }

  , generateStaffResultsReport(responseData) {
    let csv = "";
    // set header rows
    csv += "email,fullName,ownerPrivileges,result,error\n"
    responseData.results.map((staffObj, i) => {
      // Add the next line to the CSV''
      let nextLine = '';
      nextLine += '"' + staffObj.email + '"' + ','
      nextLine += '"' + staffObj.firstname + " " + staffObj.lastname + '"' + ','
      nextLine += staffObj.owner + ','
      nextLine += staffObj.result + ','
      nextLine += staffObj.error      
      // end line
      nextLine += '\n'
      csv += nextLine
    })
    return csv;
  }

  , separateFullName(action, users) {
    // separate fullname to firstname and lastname
    // delete fullname from object

    if (action === "arr") {
      const newArrayList = users.map(arr => {
        if (arr.fullname) {
          arr.fullname = arr.fullname.trim();
          let arrFulname = arr.fullname.split(" ");
          arr.firstname = arrFulname.slice(0, ((arrFulname.length/2) + (arrFulname.length%2))).join(" "); 
          arr.lastname = arrFulname.slice((arrFulname.length/2) + (arrFulname.length%2)).join(" "); 
        } else {
          arr.firstname = "";
          arr.lastname = "";
        }
        delete arr.fullname;
        return arr;
      });

      return newArrayList;
    } else if (action === "obj") {

      if (users.fullname) {
        users.fullname = users.fullname.trim();
        let arrFulname = users.fullname.split(" ");
        users.firstname = arrFulname.slice(0, ((arrFulname.length/2) + (arrFulname.length%2))).join(" "); 
        users.lastname = arrFulname.slice((arrFulname.length/2) + (arrFulname.length%2)).join(" "); 
      } else {
        users.firstname = "";
        users.lastname = "";
      }
      delete users.fullname;
      return users;
    } else {
      return users;
    }
  }
}

export default inviteUtils;
