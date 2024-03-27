const FolderTemplate = require('./FolderTemplateModel');
const Firm = require('../firm/FirmModel');

const { raw } = require('objection');

exports.getAllFolderTemplates = () => {
  return Firm.query()
    .from('firms as f')
    .leftJoin('foldertemplates as ft', 'ft._firm', 'f._id')
    .leftJoin('folderpermission as fp', 'fp._firm', 'f._id')
    .leftJoin('subscriptions as s', 's._firm', 'f._id')
    .whereNot({ 's.status': 'canceled' })
    .where({
      'fp._client': null,
      'fp._folder': null
    })
    .whereNot({'ft._firm': null})
    .select(['f._id', 'f.name', raw('row_to_json(ft) as foldertemplate'), raw('row_to_json(fp) as permission')])
    .groupBy('f._id', 'f.name', 'ft._id', 'fp._id', 's._id')
}

exports.updateFolderTemplates = (id, payload) => {
  return FolderTemplate.query()
    .findById(id)
    .update(payload)
    .returning('*');
}

