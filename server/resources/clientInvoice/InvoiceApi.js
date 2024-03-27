var invoice = require("./InvoiceController");

module.exports = function (router, requireLogin, requireRole) {
  // Firm > Services 
  router.post("/api/service/create", requireLogin(), invoice.createService);
  router.put("/api/service/updateService/:id", requireLogin(), invoice.updateService);
  router.get("/api/service/getById/:id", requireLogin(), invoice.getByIdService);
  router.get("/api/service/getAll", requireLogin(), invoice.getAllService);
  router.delete("/api/service/delete/:id", requireLogin(), invoice.deleteService);

  // Client Invoice
  router.post("/api/invoice/create", requireLogin(), invoice.createInvoice);
  router.put("/api/invoice/update/:id", requireLogin(), invoice.updateInvoice);
  router.delete("/api/delete-invoice/:id", requireLogin(), invoice.deleteInvoice);
  router.get("/api/invoice/getById/:id", requireLogin(), invoice.getByIdInvoice);
  router.get("/api/invoice/getAll/:id", requireLogin(), invoice.getAllInvoice);

  // Client Detail
  router.post("/api/invoice-details", requireLogin(), invoice.createInvoiceDetails);
  router.put("/api/invoice-details/:id", requireLogin(), invoice.updateInvoiceDetails);
  router.delete("/api/invoice-details/:id", requireLogin(), invoice.deleteInvoiceDetails);

};