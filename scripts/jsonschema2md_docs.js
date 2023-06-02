const {jsonschema2md} = require('@adobe/jsonschema2md');

const markdown = jsonschema2md(schema, {
  includeReadme: true,
});