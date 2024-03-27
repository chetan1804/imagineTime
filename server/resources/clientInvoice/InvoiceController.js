const Invoice = require("./InvoiceModel");
const InvoiceService = require("./InvoiceServiceModel");
const Service = require("./ServiceModel");
const InvoiceDetails = require("./InvoiceDetailsModel");


exports.createInvoice = async (req, res) => {
  let rootObj = req.body;
  let invoiceDetailInsertObj = rootObj.invoice_details;
  delete rootObj.invoice_details;
  try {
    let invoiceInsertObj = rootObj;
    // create new invoice
    let invoiceRes = await createNewInvoice(invoiceInsertObj);
    // if invoice Details Presents
    if (invoiceDetailInsertObj.length > 0) {
      for (let index = 0; index < invoiceDetailInsertObj.length; index++) {
        const element = invoiceDetailInsertObj[index];
        element['invoice_id'] = invoiceRes['invoice_id'];
        delete element['invoiceDetail_id'];
        delete element['isNewDetail']
        delete element['isEditFlow']
        let obj = await createInvoiceDetail(element);
      }
      res.send({ success: true, message: 'Created successfully' });
    } else {
      res.send({ success: true, message: 'Created successfully' });
    }
  } catch (error) {
    res.send({ success: false, message: error });
  }
};

async function createNewInvoice(insertData) {
  delete insertData['ClientName']
  return new Promise((resolve, reject) => {
    Invoice.query()
      .insert(insertData)
      .returning("*")
      .asCallback((err, data) => {
        //console.log(err, data)
        if (err || !data) {
          reject(err);
        } else {
          resolve(data);
        }
      });
  });
}

async function createInvoiceDetail(insertData) {
  return new Promise((resolve, reject) => {
    InvoiceDetails.query()
      .insert(insertData)
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

// Get Invoice By Client Id
exports.getByIdInvoice = (req, res) => {
  const invoiceId = parseInt(req.params.id);
  Invoice.query()
    .where("invoice_id", invoiceId)
    .where("is_archived", false)
    .then(data => {
      if (data.length > 0) {
        data = data[0];
        data['invoice_details'] = [];
        InvoiceDetails.query()
          .select(`service.service`)
          .select(`invoice_details.*`)
          .leftJoin('service', 'service._id', 'invoice_details.service_id')
          .where("invoice_id", invoiceId)
          .then(details => {
            data['invoice_details'] = details ? details : [];
            res.send({ success: true, data });
          })
      } else {
        res.send({ success: true, data });
      }

    })
};

exports.getAllInvoice = (req, res) => {
  const clientId = parseInt(req.params.id);
  Invoice.query().select(`clients.name`).select(`invoice.*`).leftJoin('clients', 'clients._id', 'invoice.client_id').where("client_id", clientId).where("isPaid", false).where("is_archived", false).then((data) => {
    res.send({ success: true, data });
  });
};

async function updateCurrentInvoice(updateData) {
  delete updateData['ClientName']
  return new Promise((resolve, reject) => {
    Invoice.query()
      .where("invoice_id", updateData.invoice_id)
      .update(updateData)
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

async function updateCurrentInvoiceDetail(updateData) {
  return new Promise((resolve, reject) => {
    InvoiceDetails.query()
      .findById(updateData.invoiceDetail_id)
      .update(updateData)
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

async function createCurrentInvoiceDetail(updateData) {
  return new Promise((resolve, reject) => {
    InvoiceDetails.query()
      .insert(updateData)
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



exports.updateInvoice = async (req, res) => {
  let rootObj = req.body;
  let invoiceDetailInsertObj = rootObj.invoice_details;
  delete rootObj.invoice_details;
  try {
    let invoiceInsertObj = rootObj;

    // update new invoice
    await updateCurrentInvoice(invoiceInsertObj);
    // if invoice Details Presents
    if (invoiceDetailInsertObj.length > 0) {
      for (let index = 0; index < invoiceDetailInsertObj.length; index++) {
        const element = invoiceDetailInsertObj[index];
        delete element['service']
        if (element.isNewDetail && element.isNewDetail == true) {
          element['invoice_id'] = invoiceInsertObj.invoice_id;
          delete element['isNewDetail']
          delete element['isEditFlow'];
          delete element['invoiceDetail_id'];
          await createCurrentInvoiceDetail(element);
        } else {
          delete element['isNewDetail'];
          delete element['isEditFlow'];
          await updateCurrentInvoiceDetail(element);
        }
      }
      res.send({ success: true, message: 'Updated successfully' });
    } else {
      res.send({ success: true, message: 'Updated successfully' });
    }
  } catch (error) {
    res.send({ success: false, message: error });
  }
};

exports.deleteInvoice = async (req, res) => {
  const invoiceId = parseInt(req.params.id);
  let details = getInvoiceDetail(invoiceId);
  
  if (details.length == 0) {
    Invoice.query()
      .where("invoice_id", invoiceId)
      .delete()
      .asCallback((err, data) => {
        if (err) {
          res.send({ success: false, message: err });
        } else {
          res.send({ success: true, message: 'Deleted successfully' });
        }
      });
  } else {
    Invoice.query()
      .where("invoice_id", invoiceId)
      .update({ is_archived: true })
      .asCallback((err, data) => {
        if (err) {
          res.send({ success: false, message: err });
        } else {
          res.send({ success: true, message: 'Deleted successfully' });
        }
      });
  }

};


async function getInvoiceDetail(invoiceId) {
  return new Promise((resolve, reject) => {
    InvoiceDetails.query()
      .findById(invoiceId)
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

// Service
exports.createService = (req, res) => {
  Service.query()
    .insert(req.body)
    .returning("*")
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, data });
      }
    });
};

exports.getByIdService = (req, res) => {
  const invoiceId = parseInt(req.params.id);
  InvoiceService.query()
    .findById(invoiceId)
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, data });
      }
    });
};

exports.getAllService = (req, res) => {
  Service.query().then((service) => {
    service.sort(function (a, b) {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
    res.send({ success: true, service });
  });
};

exports.updateService = (req, res) => {
  const serviceId = parseInt(req.params.id);
  Service.query()
    .findById(serviceId)
    .update(req.body)
    .returning("*")
    .asCallback((err, data) => {
      if (err) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, data });
      }
    });
};

exports.deleteService = (req, res) => {
  const serviceId = parseInt(req.params.id);
  Service.query()
    .findById(serviceId)
    .del()
    .returning("*")
    .asCallback((err, data) => {
      if (err) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, data });
      }
    });
};

// Invoice Details
// Create bulk details
exports.createBulkDetails = (req, res) => {
  // var tableName = ""
  InvoiceDetails.knex()
    .batchInsert("")
    .returning("*")
    .asCallback((err, data) => {
      if (err || !data) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, data });
      }
    });
};


exports.createInvoiceDetails = (req, res) => {
  InvoiceDetails.query()
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

exports.updateInvoiceDetails = (req, res) => {
  const invoiceDetailID = parseInt(req.params.id);
  InvoiceDetails.query()
    .findById(invoiceDetailID)
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

exports.deleteInvoiceDetails = (req, res) => {
  const invoiceDetailID = parseInt(req.params.id);
  InvoiceDetails.query()
    .findById(invoiceDetailID)
    .delete()
    .asCallback((err, data) => {
      if (err) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, message: 'Deleted successfully' });
      }
    });
};