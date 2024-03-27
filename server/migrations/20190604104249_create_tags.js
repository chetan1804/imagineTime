// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addTagIndex = `
ALTER TABLE tags ADD "document_vectors" tsvector;
CREATE FUNCTION tags_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.name || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_tags_trigger
BEFORE INSERT OR UPDATE ON tags
FOR EACH ROW
EXECUTE PROCEDURE tags_index_trigger();
CREATE INDEX idx_fts_tags ON tags USING gin(document_vectors);
`;

const removeTagIndex = `
  DROP FUNCTION IF EXISTS tags_index_trigger() CASCADE;
  ALTER TABLE tags DROP COLUMN document_vectors;
`;

exports.up = knex => Promise.all([
  knex.schema.createTable('tags', table => {
    table.increments('_id').primary()
    table.timestamps(false, true)
    table.string('name')
    table.string('type').defaultTo('other')
    table.boolean('public').defaultTo(true)
  }).then(() => {
    return knex.schema.raw(addTagIndex)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTable('tags')
  .then(() => {
    return knex.schema.raw(removeTagIndex)
  })
]);