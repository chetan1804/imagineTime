exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('folderpermission', table => {
        table.boolean("adminUpdate").defaultTo(false)
        table.boolean("ownerUpdate").defaultTo(false)
        table.boolean("staffUpdate").defaultTo(false)
        table.boolean("contactUpdate").defaultTo(false)
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('folderpermission', table => {
      table.dropColumn("adminUpdate").defaultTo(false)
      table.dropColumn("ownerUpdate").defaultTo(false)
      table.dropColumn("staffUpdate").defaultTo(false)
      table.dropColumn("contactUpdate").defaultTo(false)
    })
])
}; 