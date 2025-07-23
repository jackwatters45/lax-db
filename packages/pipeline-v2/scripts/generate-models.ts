#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@typescript-eslint/parser';
import type { TSESTree } from '@typescript-eslint/types';

interface DrizzleField {
  name: string;
  type: string;
  nullable: boolean;
  unique: boolean;
  length?: number;
  isArray?: boolean;
  references?: string;
}

interface DrizzleTable {
  name: string;
  tableName: string;
  fields: DrizzleField[];
  conflictFields: string[];
}

class DrizzleModelGenerator {
  private corePackagePath = join(process.cwd(), '../core/src');
  private outputPath = join(process.cwd(), 'generated/models');

  async generateModels() {
    console.log('🔄 Generating Pydantic models from Drizzle schemas...');

    const tables = [
      { entity: 'school', conflictFields: ['ncaa_id'] },
      { entity: 'conference', conflictFields: ['ncaa_id'] },
      {
        entity: 'location',
        conflictFields: ['street', 'city', 'state', 'country', 'zip_code'],
      },
      { entity: 'sport', conflictFields: ['ncaa_id'] },
      { entity: 'team', conflictFields: ['school_id', 'sport_id'] },
    ];

    for (const { entity, conflictFields } of tables) {
      try {
        const table = await this.parseSchema(entity);
        if (table) {
          table.conflictFields = conflictFields;
          const pythonModel = this.generatePydanticModel(table);
          this.writeModel(entity, pythonModel);
          console.log(`✅ Generated ${entity}.py`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate ${entity}:`, error);
      }
    }

    this.generateInit();
    console.log('🎉 Model generation complete!');
  }

  private async parseSchema(entity: string): Promise<DrizzleTable | null> {
    const schemaPath = join(this.corePackagePath, entity, `${entity}.sql.ts`);

    if (!existsSync(schemaPath)) {
      console.warn(`⚠️  Schema file not found: ${schemaPath}`);
      return null;
    }

    const content = readFileSync(schemaPath, 'utf-8');
    const ast = parse(content, {
      ecmaVersion: 2022,
      sourceType: 'module',
      loc: true,
      range: true,
    });

    return this.extractTableInfo(ast, entity);
  }

  private extractTableInfo(
    ast: TSESTree.Program,
    entity: string,
  ): DrizzleTable | null {
    const tableExport = ast.body.find(
      (node): node is TSESTree.ExportNamedDeclaration =>
        node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'VariableDeclaration' &&
        node.declaration.declarations[0]?.id.type === 'Identifier' &&
        node.declaration.declarations[0].id.name === `${entity}Table`,
    );

    if (!tableExport) return null;

    const declaration = tableExport.declaration as TSESTree.VariableDeclaration;
    const init = declaration.declarations[0]?.init;

    if (
      init?.type !== 'CallExpression' ||
      init.callee.type !== 'Identifier' ||
      init.callee.name !== 'pgTable'
    ) {
      return null;
    }

    const tableName = (init.arguments[0] as TSESTree.Literal)?.value as string;
    const fieldsObject = init.arguments[1] as TSESTree.ObjectExpression;

    const fields = this.parseFields(fieldsObject);

    return {
      name: entity,
      tableName,
      fields,
      conflictFields: [],
    };
  }

  private parseFields(fieldsObject: TSESTree.ObjectExpression): DrizzleField[] {
    const fields: DrizzleField[] = [];

    for (const property of fieldsObject.properties) {
      if (property.type === 'Property' && property.key.type === 'Identifier') {
        const fieldName = property.key.name;

        // Skip spread operators like ...id, ...timestamps
        if (property.type === 'SpreadElement') continue;

        const field = this.parseFieldDefinition(fieldName, property.value);
        if (field) {
          fields.push(field);
        }
      } else if (property.type === 'SpreadElement') {
        // Handle spread operators like ...id, ...timestamps
        const spreadFields = this.handleSpreadElement(property);
        fields.push(...spreadFields);
      }
    }

    return fields;
  }

  private handleSpreadElement(spread: TSESTree.SpreadElement): DrizzleField[] {
    if (spread.argument.type === 'Identifier') {
      const name = spread.argument.name;

      // Handle common spread patterns
      if (name === 'id') {
        return [
          {
            name: 'id',
            type: 'UUID',
            nullable: false,
            unique: true,
          },
        ];
      }
      if (name === 'timestamps') {
        return [
          {
            name: 'time_created',
            type: 'datetime',
            nullable: false,
            unique: false,
          },
          {
            name: 'time_updated',
            type: 'datetime',
            nullable: false,
            unique: false,
          },
          {
            name: 'time_deleted',
            type: 'datetime',
            nullable: true,
            unique: false,
          },
        ];
      }
      if (name === 'ncaaId') {
        return [
          {
            name: 'ncaa_id',
            type: 'int',
            nullable: true,
            unique: true,
          },
        ];
      }
    }
    return [];
  }

  private parseFieldDefinition(
    fieldName: string,
    _value: TSESTree.Node,
  ): DrizzleField | null {
    // This is a simplified parser - in a real implementation you'd need more sophisticated AST parsing
    // For now, we'll use some heuristics based on common Drizzle patterns

    let type = 'str';
    let nullable = true;
    const unique = false;
    let length: number | undefined;
    const isArray = false;

    // Convert camelCase to snake_case for database field names
    const dbFieldName = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();

    // Basic type inference from field names and common patterns
    if (fieldName.includes('Id') || fieldName === 'id') {
      type = 'UUID';
      nullable = false;
    } else if (fieldName.includes('time') || fieldName.includes('Time')) {
      type = 'datetime';
      nullable = fieldName.includes('deleted');
    } else if (fieldName.includes('private') || fieldName.includes('active')) {
      type = 'bool';
    } else if (
      fieldName.includes('latitude') ||
      fieldName.includes('longitude')
    ) {
      type = 'float';
    } else if (fieldName.includes('division')) {
      type = 'str'; // Enum will be handled as string
    }

    return {
      name: dbFieldName,
      type,
      nullable,
      unique,
      length,
      isArray,
    };
  }

  private generatePydanticModel(table: DrizzleTable): string {
    const className = this.toPascalCase(table.name);
    const imports = new Set(['BaseModel', 'Field']);
    const fields: string[] = [];

    // Add imports based on field types
    for (const field of table.fields) {
      if (field.type === 'UUID') {
        imports.add('UUID4');
      } else if (field.type === 'datetime') {
        imports.add('datetime');
      } else if (field.nullable) {
        imports.add('Optional');
      } else if (field.isArray) {
        imports.add('List');
      }
    }

    // Generate field definitions
    for (const field of table.fields) {
      const pythonType = this.mapToPythonType(field);
      const defaultValue = this.getDefaultValue(field);
      const fieldDef = `    ${this.toCamelCase(field.name)}: ${pythonType}${defaultValue}`;
      fields.push(fieldDef);
    }

    const importList = Array.from(imports).join(', ');

    return `from pydantic import ${importList}
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ${className}(BaseModel):
${fields.join('\n')}
    
    class Config:
        table_name = "${table.tableName}"
        conflict_fields = [${table.conflictFields.map((f) => `"${f}"`).join(', ')}]
        
        # Field mapping for database operations
        field_mapping = {
${table.fields.map((f) => `            "${this.toCamelCase(f.name)}": "${f.name}"`).join(',\n')}
        }
`;
  }

  private mapToPythonType(field: DrizzleField): string {
    let baseType: string;

    switch (field.type) {
      case 'UUID':
        baseType = 'UUID4';
        break;
      case 'datetime':
        baseType = 'datetime';
        break;
      case 'bool':
        baseType = 'bool';
        break;
      case 'int':
        baseType = 'int';
        break;
      case 'float':
        baseType = 'float';
        break;
      default:
        baseType = 'str';
    }

    if (field.isArray) {
      baseType = `List[${baseType}]`;
    }

    if (field.nullable) {
      baseType = `Optional[${baseType}]`;
    }

    return baseType;
  }

  private getDefaultValue(field: DrizzleField): string {
    if (field.nullable) {
      return ' = None';
    }
    if (field.isArray) {
      return ' = []';
    }
    return '';
  }

  private toPascalCase(str: string): string {
    return (
      str.charAt(0).toUpperCase() +
      str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    );
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private writeModel(entity: string, content: string) {
    const filePath = join(this.outputPath, `${entity}.py`);
    writeFileSync(filePath, content);
  }

  private generateInit() {
    const initContent = `# Auto-generated Pydantic models from Drizzle schemas
# This file is generated by scripts/generate-models.ts
# Do not edit manually

from .school import School
from .conference import Conference
from .location import Location
from .sport import Sport
from .team import Team

__all__ = [
    "School",
    "Conference", 
    "Location",
    "Sport",
    "Team",
]

__version__ = "0.1.0"
`;
    writeFileSync(join(this.outputPath, '__init__.py'), initContent);
  }
}

// Run the generator
if (import.meta.main) {
  const generator = new DrizzleModelGenerator();
  await generator.generateModels();
}
