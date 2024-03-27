// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addClientIndex = `
ALTER TABLE clients ADD "document_vectors" tsvector;
CREATE FUNCTION clients_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.name || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_clients_trigger
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE PROCEDURE clients_index_trigger();
CREATE INDEX idx_fts_clients ON clients USING gin(document_vectors);
`;

const removeClientIndex = `
  DROP FUNCTION IF EXISTS clients_index_trigger() CASCADE;
  ALTER TABLE clients DROP COLUMN document_vectors;
`;

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('clients', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.string('name')
      table.string('website').defaultTo('')
      table.string('accountType').defaultTo('other') // enum in controller?
      table.specificType('engagementTypes', 'TEXT[]').defaultTo('{}')
      table.boolean('onBoarded').defaultTo(false)
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')

      table.integer('_primaryContact')
      table.foreign('_primaryContact').references('_id').inTable('users')
      table.integer('_primaryAddress')
      table.foreign('_primaryAddress').references('_id').inTable('addresses')
      table.integer('_primaryPhone')
      table.foreign('_primaryPhone').references('_id').inTable('phonenumbers')

      table.string('logoPath') // local path to file 
    }).then(() => {
      return knex.schema.raw(addClientIndex)
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('clients')
    .then(() => {
      return knex.schema.raw(removeClientIndex)
    })
  ])
};

