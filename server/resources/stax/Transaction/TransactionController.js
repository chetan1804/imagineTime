const stax = require("../../../global/constants").staxConstants;
const Firm = require("../../../resources/firm/FirmModel");
const CardDetails = require("./CardDetailsModel");
const PaymentHeader = require("./PaymentHeaderModel");
const InvoiceModel = require("../../clientInvoice/InvoiceModel");
const Client = require("../../client/ClientModel");
const emailUtil = require('../../../global/utils/email');
const Address = require('./../../address/AddressModel');
const brandingName = require("../../../global/brandingName").brandingName;
const firmsController = require("../../../resources/firm/firmsController");

const domain = require("../../../global/constants").domain;


// Get Transaction Details
exports.getTransactionDetails = async (req, res) => {
  const request = require("request");
  const firmData = await getFirmData(req.query.id);
  delete req.query.id;
  const headers = {
    Authorization: `Bearer ${firmData.stax_merchant_apikey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  let urlParameters = Object.keys(req.query).map((key) => {
    return encodeURIComponent(key) + '=' + encodeURIComponent(req.query[key])
  }).join('&');
  request(
    {
      method: "GET",
      url: `${stax.STAX_API}/transaction?${urlParameters}`,
      headers: headers,
    },
    function (error, response, body) {
      if (error) {
        res.send({ success: false, message: error });
      } else {
        const jsonData = body;
        let data = JSON.parse(jsonData).data;
        res.send({ success: true, data });
      }
    }
  );
};


exports.voidOrRefund = async (req, res) => {
  const request = require("request");
  const firmData = await getFirmData(req.params.firmId);
  const headers = {
    Authorization: `Bearer ${firmData.stax_merchant_apikey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  request(
    {
      method: "POST",
      url: `${stax.STAX_API}/transaction/${req.body.transactionId}/${req.params.type}`,
      headers: headers,
      body: JSON.stringify({ total: req.body.amount }),
    },
    async function (error, response, body) {
      if (error) {
        res.send({ success: false, message: error });
      } else {
        await updateInvoiceRecord({ isPaid: false, invoice_balance: req.body.amount }, req.body.invoiceid);
        await deletePaymentHeader(req.body.invoiceid);
        let msg = req.params.type == 'refund' ? 'refunded' : 'voided';
        res.send({ success: true, message: `Successfully ${msg}` });
      }
    }
  );
};

// Stax Pay Using Token
exports.payUsingToken = async (req, res) => {
  const request = require("request");
  const firmData = await getFirmData(req.params.firmId);
  const headers = {
    Authorization: `Bearer ${firmData.stax_merchant_apikey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  request(
    {
      method: "POST",
      url: `${stax.STAX_API}/charge`,
      headers: headers,
      body: JSON.stringify(req.body),
    },
    async function (error, response, body) {
      if (error) {
        res.send({ success: false, message: error });
      } else {
        const jsonData = body;
        let data = JSON.parse(jsonData);
        await updateInvoiceRecord({ isPaid: true, invoice_balance: 0 }, req.params.invoiceId);
        await createPaymentHeaderByStax(req.params.firmId, req.params.clientId, req.params.invoiceId, req.params.invoiceNo, req.params.cardType, data);
        await updateCardDetails(data, req.params.customerCardID);
        res.send({ success: true, message: "Paid Successfully" });
      }
    }
  );
};

async function createPaymentHeaderByStax(firmId, clientId, invoiceId, invoiceNo, type, responseObj) {
  let paymentHeader = {};
  paymentHeader["StaxID"] = responseObj.id;
  paymentHeader["firm_id"] = firmId;
  paymentHeader["client_id"] = clientId;
  paymentHeader["invoice_id"] = invoiceId;
  paymentHeader["invoice_number"] = invoiceNo;
  paymentHeader["payment_note"] = responseObj.payment_method.nickname;
  paymentHeader["payment_date"] = responseObj.created_at;
  paymentHeader["payment_type"] = type == 'CC' ? "Credit Card" : "ACH";
  paymentHeader["amount"] = responseObj.total;

  return new Promise((resolve, reject) => {
    PaymentHeader.query()
      .insert(paymentHeader)
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

async function updateCardDetails(data, cardId) {
  return new Promise((resolve, reject) => {
    CardDetails.query()
      .findById(cardId)
      .update({ merchant_id: data.payment_method.merchant_id, StaxPaymentMethodID: data.payment_method.id })
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
async function updateInvoiceRecord(obj, invoiceId) {
  return new Promise((resolve, reject) => {
    InvoiceModel.query()
      .where("invoice_id", invoiceId)
      .update(obj)
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

async function deletePaymentHeader(invoiceId) {
  return new Promise((resolve, reject) => {
    PaymentHeader.query()
      .where("invoice_id", invoiceId)
      .delete()
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



// CARD DETAILS 
exports.createCardDetails = (req, res) => {
  CardDetails.query()
    .insert(req.body)
    .returning("*")
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, message: 'Created successfully' });
      }
    });
};

exports.updateCardDetails = (req, res) => {
  const customerCardID = parseInt(req.params.id);
  CardDetails.query()
    .findById(customerCardID)
    .update(req.body)
    .returning("*")
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, message: 'Updated successfully' });
      }
    })
}

exports.getCardDetailsByClientId = (req, res) => {
  const clientId = parseInt(req.params.id);
  CardDetails.query()
    .where("client_id", clientId)
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, data });
      }
    })
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

// PAYMENT HEADER
exports.createPaymentHeader = (req, res) => {
  PaymentHeader.query()
    .insert(req.body)
    .returning("*")
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, message: 'Created successfully' });
      }
    });
};

exports.updatePaymentHeader = (req, res) => {
  const paymentHeaderId = parseInt(req.params.id);
  PaymentHeader.query()
    .findById(paymentHeaderId)
    .update(req.body)
    .returning("*")
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, message: 'Updated successfully' });
      }
    })
}

exports.getPaymentHeader = (req, res) => {
  const clientId = parseInt(req.params.id);
  PaymentHeader.query()
    .select(`clients.name`)
    .select(`payment_header.*`)
    .leftJoin('clients', 'clients._id', 'payment_header.client_id')
    .where("client_id", clientId)
    .returning("*")
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, data, message: 'Fetched successfully' });
      }
    })
}

exports.getPaynowData = async (req, res) => {
  var responseObj = { cardDetails: null, clientData: null, invoiceData: null, firmData: null, addressData: null, isInvalidUrl: false }
  const tokenData = await getInvoiceData(req.params.token);
  if (tokenData.length > 0) {
    responseObj.invoiceData = await getInvoiceClientData(tokenData[0].client_id, tokenData[0].invoice_id);
    responseObj.clientData = await getClientData(tokenData[0].client_id);
    responseObj.firmData = await getFirmData(tokenData[0].firm_id);
    responseObj.cardDetails = await getCardDetails(tokenData[0].client_id, tokenData[0].firm_id);
    responseObj.addressData = await getaddressData(responseObj.clientData._primaryAddress);
    res.send(responseObj);
  } else {
    responseObj.isInvalidUrl = true;
    res.send(responseObj);
  }

}

async function getClientData(clientId) {
  return new Promise((resolve, reject) => {
    Client.query()
      .where("_id", clientId)
      .returning("*")
      .asCallback((err, data) => {
        if (err || !data) {
          reject(err);
        } else {
          resolve(data[0]);
        }
      });
  })
}

async function getaddressData(addressId) {
  console.log(addressId)
  return new Promise((resolve, reject) => {
    Address.query()
      .where("_id", addressId)
      .returning("*")
      .asCallback((err, data) => {
        if (err || !data) {
          reject(err);
        } else {
          resolve(data[0]);
        }
      });
  })
}

async function getCardDetails(clientId, firm_id) {
  return new Promise((resolve, reject) => {
    CardDetails.query()
      .where("client_id", clientId)
      .where("firm_id", firm_id)
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

async function getInvoiceClientData(clientId, invoice_id) {
  return new Promise((resolve, reject) => {
    InvoiceModel.query().select(`clients.name`).select(`invoice.*`).leftJoin('clients', 'clients._id', 'invoice.client_id').where("client_id", clientId).where("invoice_id", invoice_id).where("is_archived", false).then((data) => {
      if (data) {
        resolve(data[0]);
      } else {
        reject({});
      }
    });
  })
}

async function getInvoiceData(token) {
  return new Promise((resolve, reject) => {
    InvoiceModel.query()
      .where("paynow_token", token)
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

async function getCardDetails(clientId, firm_id) {
  return new Promise((resolve, reject) => {
    CardDetails.query()
      .where("client_id", clientId)
      .where("firm_id", firm_id)
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

async function getInvoiceClientData(clientId, invoice_id) {
  return new Promise((resolve, reject) => {
    InvoiceModel.query().select(`clients.name`).select(`invoice.*`).leftJoin('clients', 'clients._id', 'invoice.client_id').where("client_id", clientId).where("invoice_id", invoice_id).where("is_archived", false).then((data) => {
      if (data) {
        resolve(data[0]);
      } else {
        reject({});
      }
    });
  })
}

async function getInvoiceData(token) {
  return new Promise((resolve, reject) => {
    InvoiceModel.query()
      .where("paynow_token", token)
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



// Send Email
exports.sendEmailLink = async (req, res) => {
  // start

  const fromInfo = {
    email: brandingName.email.noreply
    , name: brandingName.title
  }
  // instead of the above, use the following line for IS-488 ticket if this code
  // is released to the customers.
  //const fromInfo = await firmsController.getEmailFromInfo(req.body.firmId, req.user._id);
  const template = 'notification-email';
  const targets = [req.body.email];
  const firmName = req.body.firmName;
  const invoiceDate = req.body.invoiceDate;
  const invoiceDueDate = req.body.invoiceDueDate;
  const invoiceNum = req.body.invoiceNum;
  const invoiceAmt = req.body.invoiceAmt;
  const invoiceBal = req.body.invoiceBal;
  // const firmNum = req.body.firmNum;
  const clientName = req.body.clientName;
  const url = `${domain.DEMO_URL}/payments/activate/${req.body.payNowToken}`;
  const subject = `Invoice Attached #${invoiceNum}`;

  // We need to change the design of the email content
  const emailContent = `<span>
                          <span><h4 style="line-height: 150%; text-align: center">Invoice Attached</h4></span>
                          <br/>
                          <p style="font-size:14px">Hello,</p>
                          <p style="font-size:14px">You have received an invoice from <b>${firmName}</b>, which is attached to this email for preview.
                            Clicking the button below will redirect you to the Customer Portal where you can view invoices, as well as make a payment
                            by credit card. Below is a summary of the attached invoice.
                          </p>
                          <br/>
                          <span style="font-size:18px;text-decoration:underline;font-weight: bold;">Invoice Summary:</span>
                          <span style="display: flex;flex-wrap: wrap">
                            <p style="font-size:14px;margin-right: 5px;">Client Name:</p>
                            <p style="font-size:14px;font-weight: bold;">${clientName}</p>
                          </span>
                          <span style="display: flex;flex-wrap: wrap">
                            <p style="font-size:14px;margin-right: 5px;">Invoice Date:</p>
                            <p style="font-size:14px;font-weight: bold;">${invoiceDate}</p>
                          </span>
                          <span style="display: flex;flex-wrap: wrap">
                            <p style="font-size:14px;margin-right: 5px;">Invoice Due Date:</p>
                            <p style="font-size:14px;font-weight: bold;">${invoiceDueDate}</p>
                          </span>
                          <span style="display: flex;flex-wrap: wrap">
                            <p style="font-size:14px;margin-right: 5px;">Invoice Number:</p>
                            <p style="font-size:14px;font-weight: bold;">${invoiceNum}</p>
                          </span>
                          <span style="display: flex;flex-wrap: wrap">
                            <p style="font-size:14px;margin-right: 5px;">Invoice Amount:</p>
                            <p style="font-size:14px;font-weight: bold;">$${invoiceAmt.toFixed(2)}</p>
                          </span>
                          <span style="display: flex;flex-wrap: wrap">
                            <p style="font-size:14px;margin-right: 5px;">Invoice Balance:</p>
                            <p style="font-size:14px;font-weight: bold;">$${invoiceBal.toFixed(2)}</p>
                          </span>
                          <br/>
                          <p style="font-size:14px">If you should have any questions, please feel free to give us a call for assistance.</p>
                          <br/>
                          <p style="font-size:14px">Best Regards,</p>
                          <p style="font-size:14px;font-weight: bold;">${firmName}</p>
                      </span>`;

  const payLink = `<span>
                    <button style="background-color:#f5684d;border-radius:8px;padding:12px 28px;color: white;border-color: #f5684d;border-style: none;margin-left: 225px;margin-bottom: 20px;"><a href="${url}" style="
                    color: white;
                    text-decoration: none;
                    ">Click To Pay</a></button>
                  </span>`
  const content = [
    { name: 'notifLink', content: payLink }
    , { name: 'notifContent', content: emailContent }
  ]

  emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
    res.send({ success: data.success, message: data.message });
  });
}