// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
    knex.schema.createTable('documenttemplates', table => {
        table.increments('_id').primary();
        table.timestamps(false, true);
        table.integer('_firm')
        table.foreign('_firm').references('_id').inTable('firms')
        table.integer('_createdBy')
        table.foreign('_createdBy').references('_id').inTable('users')
        table.string('name')
        table.json('content').defaultTo(JSON.stringify([]))
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('documenttemplates')
]);