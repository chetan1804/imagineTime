
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('products').del()
    .then(function () {
      return knex('products').insert([
        {_id: 1, title: 'first product', description: 'abc'},
        {_id: 2, title: 'next product', description: 'abc'},
        {_id: 3,title: 'product xyz',  description: '123'}
      ]);
    })
    .then(() => {
      // the primary keys do NOT increment automatically from the seed, we need to do this manually
      // https://github.com/tgriesser/knex/issues/2130
      knex.raw('SELECT setval(\'products__id_seq\', max(_id)) from products')
    })
};