
// SEE NOTES AND EXAMPLE IN THE postgres-notes.md file

const addClientTaskIndex = `
ALTER TABLE clienttasks ADD "document_vectors" tsvector;
CREATE FUNCTION clienttasks_index_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.document_vectors := to_tsvector(NEW.title || ' ');
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';
CREATE TRIGGER my_clienttasks_trigger
BEFORE INSERT OR UPDATE ON clienttasks
FOR EACH ROW
EXECUTE PROCEDURE clienttasks_index_trigger();
CREATE INDEX idx_fts_clienttasks ON clienttasks USING gin(document_vectors);
`;

// todo: this works on an "add" migration, but what about a "create" migration?
const removeClientTaskIndex = `
  DROP FUNCTION IF EXISTS clienttasks_index_trigger() CASCADE;
  ALTER TABLE clienttasks DROP COLUMN document_vectors;
`;

exports.up = knex => Promise.all([
  knex.schema.createTable('clienttasks', table => {
    table.increments('_id').primary()
    table.timestamps(false, true)

    // table.enu('clientStatus', ['open', 'locked', 'awaitingApproval', 'completed', 'none']).defaultTo('open')
    // table.enu('firmStatus', ['open', 'locked', 'completed', 'awaitingClient']).defaultTo('awaitingClient')

    // DISCUSSION:
    table.enu('status', ['draft', 'open', 'awaitingApproval', 'completed', 'locked'])
    // seems way less redundant but still complete, given the new separation between firm and client tasks

    table.date('dueDate')
    table.boolean('needsApproval').defaultTo(false)

    table.string('title')
    table.string('description', 1023)
    // table.enu('type', ['document-delivery', 'document-request', 'signature-request', 'text']).defaultTo('text')
    table.string('type')

    table.integer('_clientWorkflow')
    table.foreign('_clientWorkflow').references('_id').inTable('clientworkflows')

    table.integer('_approvedBy')
    table.foreign('_approvedBy').references('_id').inTable('users')
    table.integer('_completedBy')
    table.foreign('_completedBy').references('_id').inTable('users')
    table.integer('_createdBy')
    table.foreign('_createdBy').references('_id').inTable('users')
    table.integer('_firm')
    table.foreign('_firm').references('_id').inTable('firms')
    table.integer('_client')
    table.foreign('_client').references('_id').inTable('clients')
    

  }).then(() => {
    return knex.schema.raw(addClientTaskIndex)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTable('clienttasks')
  .then(() => {
    return knex.schema.raw(removeClientTaskIndex)
  })
]);
