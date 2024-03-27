
exports.up = knex => Promise.all([
  knex.schema.table('staff', table => {
    table.integer('_eSigGrantedBy') // 
    table.foreign('_eSigGrantedBy').references('_id').inTable('users')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('staff', table => {
    table.dropColumn('_eSigGrantedBy')
  })
]);