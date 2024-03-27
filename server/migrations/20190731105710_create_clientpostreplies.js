// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addClientPostRepliesIndex = `
ALTER TABLE clientpostreplies ADD "document_vectors" tsvector;
CREATE FUNCTION clientpostreplies_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.content || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_clientpostreplies_trigger
BEFORE INSERT OR UPDATE ON clientpostreplies
FOR EACH ROW
EXECUTE PROCEDURE clientpostreplies_index_trigger();
CREATE INDEX idx_fts_clientpostreplies ON clientpostreplies USING gin(document_vectors);
`;

const removeClientPostRepliesIndex = `
  DROP FUNCTION IF EXISTS clientpostreplies_index_trigger() CASCADE;
  ALTER TABLE clientpostreplies DROP COLUMN document_vectors;
`;


exports.up = knex => Promise.all([
  knex.schema.createTable('clientpostreplies', table => {
    table.increments('_id').primary();
    table.timestamps(false, true);

    table.string('content', 4095)

    table.integer('_client')
    table.foreign('_client').references('_id').inTable('clients')
    table.integer('_firm')
    table.foreign('_firm').references('_id').inTable('firms')
    table.integer('_createdBy')
    table.foreign('_createdBy').references('_id').inTable('users')
    table.integer('_clientPost')
    table.foreign('_clientPost').references('_id').inTable('clientposts')
    
  }).then(() => {
    return knex.schema.raw(addClientPostRepliesIndex)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTableIfExists('clientpostreplies')
  .then(() => {
    return knex.schema.raw(removeClientPostRepliesIndex)
  })
]);