// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addUserIndex = `
ALTER TABLE users ADD "document_vectors" tsvector;
CREATE FUNCTION users_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.username || ' ' || NEW.firstname || ' ' || NEW.lastname || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_users_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE users_index_trigger();
CREATE INDEX idx_fts_users ON users USING gin(document_vectors);
`;

const removeUserIndex = `
  DROP FUNCTION IF EXISTS users_index_trigger() CASCADE;
  ALTER TABLE users DROP COLUMN document_vectors;
`;

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('users', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.string('username')
      table.unique('username')
      table.string('firstname').default('')
      table.string('lastname').default('')
      table.string('password_salt', 511) // longer to accomodate 256 bit salt
      table.string('password_hash')
      table.boolean('admin').defaultTo(false) // change this from the 'roles' array
      table.boolean('onBoarded').defaultTo(false)

      table.date('resetPasswordTime')
      table.string('resetPasswordHex')

      table.integer('_primaryAddress')
      table.foreign('_primaryAddress').references('_id').inTable('addresses')
      table.integer('_primaryPhone')
      table.foreign('_primaryPhone').references('_id').inTable('phonenumbers')
    })
  ]).then(() => {
    return knex.schema.raw(addUserIndex)
  })
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('users')
    .then(() => {
      return knex.schema.raw(removeUserIndex)
    })
  ])
};