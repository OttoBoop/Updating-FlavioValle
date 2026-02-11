import { describe, it, expect } from '@jest/globals';
import { generateWixMapping } from '../utils/wix-mapper.js';

describe('Wix Mapper', () => {
  it('should export generateWixMapping function', () => {
    expect(generateWixMapping).toBeDefined();
    expect(typeof generateWixMapping).toBe('function');
  });

  it('should generate markdown mapping document', () => {
    const mockSchema = {
      metadata: { totalFields: 5, requiredFields: 3, optionalFields: 2 },
      fields: [
        { name: 'nome', type: 'text', label: 'Nome', required: true },
        { name: 'email', type: 'email', label: 'Email', required: false }
      ]
    };

    const mapping = generateWixMapping(mockSchema);

    expect(mapping).toContain('# Wix to gabineteonline Field Mapping');
    expect(mapping).toContain('Total fields: 5');
    expect(mapping).toContain('Required fields: 3');
  });

  it('should include both required and optional fields sections', () => {
    const mockSchema = {
      metadata: { totalFields: 3, requiredFields: 2, optionalFields: 1 },
      fields: [
        { name: 'nome', type: 'text', label: 'Nome Completo', required: true, maxLength: 100 },
        { name: 'email', type: 'email', label: 'Email', required: true },
        { name: 'telefone', type: 'tel', label: 'Telefone', required: false }
      ]
    };

    const mapping = generateWixMapping(mockSchema);

    expect(mapping).toContain('## Required Fields');
    expect(mapping).toContain('## Optional Fields');
    expect(mapping).toContain('Nome Completo');
    expect(mapping).toContain('Telefone');
  });
});
