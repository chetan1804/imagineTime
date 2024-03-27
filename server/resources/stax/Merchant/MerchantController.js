const stax = require("../../../global/constants").staxConstants;
const Firm = require("../../../resources/firm/FirmModel");
const Client = require("../../client/ClientModel");
const Invoice = require("../../clientInvoice/InvoiceModel");

// Enroll Merchant
exports.enrollMerchant = (req, res) => {
  const request = require("request");

  const staxObj = {
    company_name: req.body.company_name,
    contact_email: req.body.email,
    name: req.body.name,
    password: req.body.password,
    password_confirmation: req.body.password_confirmation,
    app_url: stax.STAX_REDIRECT_URL,
    business_email: req.body.email,
    email: req.body.email,
    plan: "api",
    pricing_plan: stax.STAX_plan,
    brand: stax.STAX_brand,
    notes: "Merchant Stax Enrollment",
    skip_account_page: true,
    business_legal_name: req.body.company_name,
  };

  const firmId = req.body.firm_id;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  request(
    {
      method: "POST",
      url: `${stax.STAX_API}/register`,
      headers: headers,
      body: JSON.stringify(staxObj),
    },
    async function (error, response, body) {
      if (error) {
        res.send({ success: false, message: error });
      } else {
        const jsonData = body;
        const data = JSON.parse(jsonData);

        if (!data.merchant_id) {
          let merchantData = await getMerchantAPIKey(
            data && data[0].merchant.id,
            req.body.company_name
          );

          const firmCol = {
            // name: req.body.company_name,
            stax_token: data[0].token,
            stax_merchant_id: data[0].merchant.id,
            stax_public_key: data[0].merchant.hosted_payments_token,
            stax_status: data[0].merchant.status,
          };

          firmCol["stax_merchant_apikey"] = merchantData["api_key"];
          firmCol["is_stax_enrollment_started"] = true;

          let firmData = await updateFirmData(firmId, firmCol);

          res.send({ success: true, firmData });
        } else {
          res.send({ success: true, data });
        }
      }
    }
  );
};

// Enroll Status Merchant
exports.enrollStatus = async (req, res) => {
  const firmData = await getFirmData(req.params.id);
  const request = require("request");

  const headers = {
    Authorization: `Bearer ${stax.STAX_API_ENROLLMENT_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  request(
    {
      method: "GET",
      url: `${stax.STAX_API}/merchant/${firmData.stax_merchant_id}/registration`,
      headers: headers,
    },
    async function (error, response, body) {
      if (error) {
        res.send({ success: false, message: error });
      } else {
        const data = JSON.parse(body);
        let queryParams = `?user_id=${data.user_id}&user_email=${data.email}`;
        let ssoTokenObj = await getSSOToken(firmData.stax_merchant_apikey, queryParams);
        data['ssoToken'] = ssoTokenObj['token'];
        res.send({ success: true, data });
      }
    }
  );
};

async function getSSOToken(merchantApiKey, queryParams) {
  return new Promise((resolve, reject) => {
    const request = require("request");
    const headers = {
      Authorization: `Bearer ${merchantApiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    request(
      {
        method: "GET",
        url: `${stax.STAX_API}/ephemeral${queryParams}`,
        headers: headers,
      },
      function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          const jsonData = body;
          const data = JSON.parse(jsonData);
          resolve(data);
        }
      }
    );
  });
}

// Enroll Assume Merchant
exports.enrollAssume = async (req, res) => {
  const firmData = await getFirmData(req.params.id);
  const request = require("request");

  const headers = {
    Authorization: `Bearer ${stax.STAX_API_ENROLLMENT_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  request(
    {
      method: "POST",
      url: `${stax.STAX_API}/merchant/${firmData.stax_merchant_id}/assume`,
      headers: headers,
    },
    async function (error, response, body) {
      if (error) {
        res.send({ success: false, message: error });
      } else {
        const data = JSON.parse(body);
        if (data['merchant'] && data['merchant'].status) {
          let status = data['merchant'].underwriting_status ? data['merchant'].underwriting_status : data['merchant'].status;
          console.log("firmData.stax_public_key > ", firmData.stax_public_key)
          if (!firmData.stax_public_key) {
            firmData.stax_public_key = data['merchant']['hosted_payments_token'];
          }
          await updateFirmData(firmData._id, { name: firmData.name, stax_status: status, stax_public_key: firmData.stax_public_key })
        }
        res.send({ success: true, data });
      }
    }
  );
};

async function updateFirmData(firmID, firmData) {
  return new Promise((resolve, reject) => {
    Firm.query()
      .findById(firmID)
      .update(firmData)
      .returning("*")
      .asCallback((err, data) => {
        if (err || !data) {
          reject(err);
        } else {
          resolve(data);
        }
      });
  });
}

async function getMerchantAPIKey(merchantId, firmName) {
  return new Promise((resolve, reject) => {
    const request = require("request");
    const headers = {
      Authorization: `Bearer ${stax.STAX_API_ENROLLMENT_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    request(
      {
        method: "POST",
        url: `${stax.STAX_API}/merchant/${merchantId}/apikey`,
        headers: headers,
        body: JSON.stringify({ team_role: "admin", name: firmName }),
      },
      function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          const jsonData = body;
          const data = JSON.parse(jsonData);
          resolve(data);
        }
      }
    );
  });
}

async function getFirmData(firmId) {
  return new Promise((resolve, reject) => {
    Firm.query()
      .findById(firmId)
      .returning("*")
      .asCallback((err, data) => {
        if (err || !data) {
          reject(err);
        } else {
          resolve(data);
        }
      });
  })
}

async function enrollStatusStax(mId) {
  return new Promise((resolve, reject) => {
    const request = require("request");
    const headers = {
      Authorization: `Bearer ${stax.STAX_API_ENROLLMENT_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    request(
      {
        method: "GET",
        url: `${stax.STAX_API}/merchant/${mId}/registration`,
        headers: headers,
      },
      function (error, response, body) {
        if (error) {
          reject(err);
        } else {
          resolve(JSON.parse(body));
        }
      }
    );
  })
}



// Get Merchant Details
exports.getDetails = async (req, res) => {
  const request = require("request");
  const firmData = await getFirmData(req.params.id);
  const StaxUnderwriting = await enrollStatusStax(firmData.stax_merchant_id);
  firmData['isStaxEnrolled'] = false;
  firmData['staxUrl'] = `/firm/${req.params.id}/settings/enrollment`;
  if (firmData && !firmData.stax_merchant_id) {
    res.send({ success: true, firmData });
    console.log(1)
  } else if (firmData.stax_merchant_id && StaxUnderwriting.electronic_signature && StaxUnderwriting.underwriting_status != 'REJECTED') {
    firmData['isStaxEnrolled'] = true;
    firmData['staxUrl'] = `/firm/${req.params.id}/settings/electronic-payments`;
    res.send({ success: true, firmData });
  } else {
    console.log(3)
    let dbObj = { stax_status: firmData.stax_status, name: firmData.name };
    const headers = {
      Authorization: `Bearer ${stax.STAX_API_ENROLLMENT_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    request(
      {
        method: "GET",
        url: `${stax.STAX_API}/merchant/${firmData.stax_merchant_id}`,
        headers: headers,
      },
      async function (error, response, body) {
        if (error) {
          res.send({ success: true, firmData });
        } else {
          let staxRes = JSON.parse(body);
          dbObj.stax_status = staxRes['status'];
          await updateFirmData(req.params.id, dbObj);
          firmData['isStaxEnrolled'] = (staxRes['status'] == 'ACTIVE') ? true : false;
          if (firmData['isStaxEnrolled'] == true || staxRes.underwriting_status == 'REJECTED') {
            firmData['staxUrl'] = `/firm/${req.params.id}/settings/electronic-payments`;
          }
          res.send({ success: true, firmData });
        }
      }
    );
  }
};

exports.getLastInvoiceNumber = async (req, res) => {
  const clientData = await getClientData(req.params.id);
  Invoice.query()
    .where("firm_id", clientData._firm)
    .orderBy("invoice_number", "desc")
    .returning("invoice_number")
    .first()
    .asCallback((err, data) => {
      if (err) {
        res.send({ success: false, err });
      } else {
        let invoice = { invoice_number: 1000 };
        if (data) {
          invoice = { invoice_number: parseInt(data.invoice_number) };
        }
        res.send({ success: true, invoice });
      }
    });
};

async function getClientData(clientId) {
  return new Promise((resolve, reject) => {
    Client.query()
      .findById(clientId)
      .returning("*")
      .asCallback((err, data) => {
        if (err || !data) {
          reject(err);
        } else {
          resolve(data);
        }
      });
  })
}