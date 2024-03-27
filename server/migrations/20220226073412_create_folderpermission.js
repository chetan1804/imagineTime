exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('folderpermission', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_client')
      table.foreign('_client').references('_id').inTable('clients')
      table.integer('_folder')
      table.foreign('_folder').references('_id').inTable('files')
      table.string('profile').defaultTo('')
      table.boolean('allowRead').defaultTo(false)
      table.boolean('allowCreate').defaultTo(false)
      table.boolean('allowDelete').defaultTo(false)
      table.boolean('allowUpload').defaultTo(false)
      table.boolean('allowDownload').defaultTo(false)
      table.boolean('showFolderClientPortal').defaultTo(false)
      table.boolean('allowUploadClientPortal').defaultTo(false)
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('folderpermission')
  ])
};

