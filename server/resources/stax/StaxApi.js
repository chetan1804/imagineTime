const merchant = require("./Merchant/MerchantController");
const transaction = require("./Transaction/TransactionController");

module.exports = function (router, requireLogin) {
  // Merchant
  router.post("/api/merchant/register", requireLogin(), merchant.enrollMerchant);
  router.get("/api/merchant/:id/registration", requireLogin(), merchant.enrollStatus);
  router.post("/api/merchant/:id/assume", requireLogin(), merchant.enrollAssume);
  router.get("/api/merchant/:id", requireLogin(), merchant.getDetails);

  // Transaction
  router.get("/api/transaction/:id:queryParams", requireLogin(), transaction.getTransactionDetails);
  router.post("/api/transaction/charge/:firmId/:clientId/:invoiceId/:customerCardID/:invoiceNo/:cardType", requireLogin(), transaction.payUsingToken);
  router.post("/api/transaction/voidOrRefund/:type/:firmId", requireLogin(), transaction.voidOrRefund);

  //Card/ACH Details API
  router.post("/api/createCardDetails", requireLogin(), transaction.createCardDetails);
  router.put("/api/updateCardDetails/:id", requireLogin(), transaction.updateCardDetails);
  router.get("/api/getCardDetails/:id", requireLogin(), transaction.getCardDetailsByClientId);

  router.get("/api/getLastInvoiceNumber/:id", requireLogin(), merchant.getLastInvoiceNumber);

  // Payment Header
  router.post("/api/createPaymentHeader", transaction.createPaymentHeader);
  router.put("/api/updatePaymentHeader/:id", requireLogin(), transaction.updatePaymentHeader);
  router.get("/api/getPaymentHeader/:id", requireLogin(), transaction.getPaymentHeader)

  // Send Email
  router.post("/api/sendEmailLink",  transaction.sendEmailLink);
  router.get("/api/getPaynowData/:token",  transaction.getPaynowData);
};
