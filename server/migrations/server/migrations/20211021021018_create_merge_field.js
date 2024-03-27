// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
    knex.schema.createTable('mergefields', table => {
        table.increments('_id').primary();
        table.timestamps(false, true);
        table.integer('_firm')
        table.foreign('_firm').references('_id').inTable('firms')
        table.integer('_createdBy')
        table.foreign('_createdBy').references('_id').inTable('users')
        table.string('name')
        table.string('value', 1024)
        table.string('status').defaultTo('visible')
    })
]);

exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('mergefields')
]); 
