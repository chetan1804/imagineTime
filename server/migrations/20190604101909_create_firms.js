// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addFirmIndex = `
ALTER TABLE firms ADD "document_vectors" tsvector;
CREATE FUNCTION firms_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.name || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_firms_trigger
BEFORE INSERT OR UPDATE ON firms
FOR EACH ROW
EXECUTE PROCEDURE firms_index_trigger();
CREATE INDEX idx_fts_firms ON firms USING gin(document_vectors);
`;

const removeFirmIndex = `
  DROP FUNCTION IF EXISTS firms_index_trigger() CASCADE;
  ALTER TABLE firms DROP COLUMN document_vectors;
`;

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('firms', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.string('name')
      table.string('subdomain') // replaced with 'domain' in separate migration
      table.string('logoUrl').defaultTo('')
      table.integer('_primaryAddress')
      table.foreign('_primaryAddress').references('_id').inTable('addresses')
      table.integer('_primaryPhone')
      table.foreign('_primaryPhone').references('_id').inTable('phonenumbers')
    })
  ]).then(() => {
    return knex.schema.raw(addFirmIndex)
  })
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('firms')
    .then(() => {
      return knex.schema.raw(removeFirmIndex)
    })
  ])
};
