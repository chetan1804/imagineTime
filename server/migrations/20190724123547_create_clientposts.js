// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addClientPostIndex = `
ALTER TABLE clientposts ADD "document_vectors" tsvector;
CREATE FUNCTION clientposts_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.subject || ' ' || NEW.content || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_clientposts_trigger
BEFORE INSERT OR UPDATE ON clientposts
FOR EACH ROW
EXECUTE PROCEDURE clientposts_index_trigger();
CREATE INDEX idx_fts_clientposts ON clientposts USING gin(document_vectors);
`;

const removeClientPostIndex = `
  DROP FUNCTION IF EXISTS clientposts_index_trigger() CASCADE;
  ALTER TABLE clientposts DROP COLUMN document_vectors;
`;


exports.up = knex => Promise.all([
  knex.schema.createTable('clientposts', table => {
    table.increments('_id').primary();
    table.timestamps(false, true);

    table.string('content', 4095)
    table.string('subject')

    table.integer('_client')
    table.foreign('_client').references('_id').inTable('clients')
    table.integer('_firm')
    table.foreign('_firm').references('_id').inTable('firms')
    table.integer('_createdBy')
    table.foreign('_createdBy').references('_id').inTable('users')
  }).then(() => {
    return knex.schema.raw(addClientPostIndex)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTableIfExists('clientposts')
  .then(() => {
    return knex.schema.raw(removeClientPostIndex)
  })
]);
