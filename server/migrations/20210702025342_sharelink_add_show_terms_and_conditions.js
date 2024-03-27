
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('sharelinks', table => {
      table.boolean('showTermsConditions').default(false)
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('sharelinks', table => {
      table.dropColumn('showTermsConditions')
    })
  ])
};