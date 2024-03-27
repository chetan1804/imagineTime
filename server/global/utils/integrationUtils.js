const axios = require('axios');

const mangobilling = require('../constants').mangobilling;

exports.mangobillingCreateClient = (client, firm) => {
  const MANGO_CREATE_CLIENT = mangobilling.MANGO_CREATE_CLIENT;

  const requestBody = {

  }
  
  axios({
    method: 'POST',
    url: MANGO_CREATE_CLIENT,
    data: requestBody,
    headers: {
      'vendorAPIToken': vendorAPIToken,
      'Content-Type': 'application/json'
    }
  })
}

exports.mangobillingUpdateClient = (client, firm) => {

  const MANGO_UPDATE_CLIENT = mangobilling.MANGO_UPDATE_CLIENT.replace(':mangoClientID', client._id);

  const requestBody = {

  }

  return axios({
    method: 'PUT',
    url: MANGO_UPDATE_CLIENT,
    data: requestBody,
    headers: {
      'vendorAPIToken': vendorAPIToken,
      'Content-Type': 'application/json'
    }
  }).then(({ data }) => {
    const responseData = data;
    return responseData.data;
  })
}

exports.mangobillingDeleteClient = (client) => {

}

exports.mangobillingCreateFile = (file) => {

}

exports.mangobillingUpdateFile = (file) => {

}

exports.mangobillingDeleteFile = (file) => {

}

exports.getTestFiles = () => {
    return [];
}