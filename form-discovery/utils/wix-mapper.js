export function generateWixMapping(schema) {
  const requiredFields = schema.fields.filter(f => f.required);
  const optionalFields = schema.fields.filter(f => !f.required);

  let markdown = `# Wix to gabineteonline Field Mapping\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- Total fields: ${schema.metadata.totalFields}\n`;
  markdown += `- Required fields: ${schema.metadata.requiredFields}\n`;
  markdown += `- Optional fields: ${schema.metadata.optionalFields}\n\n`;

  markdown += `## Required Fields (Must be in Wix Form)\n\n`;
  markdown += `| Wix Field Name | gabineteonline Field | Type | Validation |\n`;
  markdown += `|----------------|---------------------|------|------------|\n`;

  requiredFields.forEach(field => {
    markdown += `| ${field.label} | ${field.name} | ${field.type} | `;
    if (field.pattern) markdown += `Pattern: ${field.pattern} `;
    if (field.maxLength) markdown += `MaxLength: ${field.maxLength} `;
    markdown += `|\n`;
  });

  markdown += `\n## Optional Fields\n\n`;
  optionalFields.forEach(field => {
    markdown += `- **${field.label}** → \`${field.name}\` (${field.type})\n`;
  });

  return markdown;
}
