const axios = require('axios');

const COMPANY_ID = 1272;

const VENDORAPITOKEN = '1b6f2235-f3ad-4e24-be42-f1a55dde18e0';

exports.getClientData = () => {

    return axios({
        url: `https://secure.mangobilling.com/api/IS/getAllClientListByCompanyId/${COMPANY_ID}`
        , METHOD: 'GET'
        , headers: {
            'vendorAPIToken': VENDORAPITOKEN,
            'Content-Type': 'application/json'
        }
    })
    .then(({ data }) => {
        const responseData = data;
        return responseData.data;
    })
}

exports.getVendorAPIToken = () => {
    return VENDORAPITOKEN;
}
