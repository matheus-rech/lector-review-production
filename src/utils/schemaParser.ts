/**
 * Schema Parser Utility
 * Parses JSON schema and generates form definitions
 */

export interface SourcedValue<T = any> {
  value: T;
  source_text?: string;
  source_location?: string;
  highlightId?: string;
}

export interface SchemaField {
  id: string;
  label: string;
  description?: string;
  type:
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "enum"
    | "object"
    | "array";
  required: boolean;
  enum?: string[];
  properties?: SchemaField[];
  items?: SchemaField;
  path: string;
  isSourced: boolean; // Whether this field uses SourcedString/Number/etc.
}

export interface SchemaSection {
  id: string;
  title: string;
  description?: string;
  fields: SchemaField[];
}

/**
 * Parse JSON schema and extract field definitions
 */
export function parseSchema(schema: any): SchemaSection[] {
  const sections: SchemaSection[] = [];

  if (!schema.properties) return sections;

  for (const [key, value] of Object.entries(schema.properties)) {
    const prop = value as any;
    const section: SchemaSection = {
      id: key,
      title: prop.description || key,
      description: prop.description,
      fields: parseProperties(
        prop.properties || {},
        key,
        schema.definitions || {}
      ),
    };
    sections.push(section);
  }

  return sections;
}

/**
 * Parse properties recursively
 */
function parseProperties(
  properties: any,
  parentPath: string,
  definitions: any
): SchemaField[] {
  const fields: SchemaField[] = [];

  for (const [key, value] of Object.entries(properties)) {
    const prop = value as any;
    const path = `${parentPath}.${key}`;

    // Check if this is a reference to a definition
    if (prop.$ref) {
      const refPath = prop.$ref.replace("#/definitions/", "");
      const definition = definitions[refPath];

      if (definition) {
        // Handle sourced types
        if (refPath.startsWith("Sourced")) {
          const baseType = getBaseType(definition);
          fields.push({
            id: key,
            label: extractLabel(prop.description || key),
            description: prop.description,
            type: baseType,
            required: false,
            path,
            isSourced: true,
          });
        } else {
          // Handle other definitions
          const nestedFields = parseProperties(
            definition.properties || {},
            path,
            definitions
          );
          if (nestedFields.length > 0) {
            fields.push({
              id: key,
              label: extractLabel(prop.description || key),
              description: prop.description,
              type: "object",
              required: false,
              path,
              properties: nestedFields,
              isSourced: false,
            });
          }
        }
      }
    }
    // Handle direct types
    else if (prop.type) {
      if (prop.type === "object" && prop.properties) {
        const nestedFields = parseProperties(
          prop.properties,
          path,
          definitions
        );
        fields.push({
          id: key,
          label: extractLabel(prop.description || key),
          description: prop.description,
          type: "object",
          required: false,
          path,
          properties: nestedFields,
          isSourced: false,
        });
      } else if (prop.type === "array" && prop.items) {
        const itemField = parseArrayItems(prop.items, path, definitions);
        fields.push({
          id: key,
          label: extractLabel(prop.description || key),
          description: prop.description,
          type: "array",
          required: false,
          path,
          items: itemField,
          isSourced: false,
        });
      } else {
        fields.push({
          id: key,
          label: extractLabel(prop.description || key),
          description: prop.description,
          type: mapType(prop.type),
          required: false,
          enum: prop.enum,
          path,
          isSourced: false,
        });
      }
    }
    // Handle allOf (for enums with sourced base)
    else if (prop.allOf) {
      const merged = mergeAllOf(prop.allOf, definitions);
      if (merged.enum) {
        fields.push({
          id: key,
          label: extractLabel(prop.description || key),
          description: prop.description,
          type: "enum",
          required: false,
          enum: merged.enum,
          path,
          isSourced: true,
        });
      }
    }
  }

  return fields;
}

/**
 * Parse array items
 */
function parseArrayItems(
  items: any,
  parentPath: string,
  definitions: any
): SchemaField {
  if (items.$ref) {
    const refPath = items.$ref.replace("#/definitions/", "");
    const definition = definitions[refPath];

    if (definition && refPath.startsWith("Sourced")) {
      const baseType = getBaseType(definition);
      return {
        id: "item",
        label: "Item",
        type: baseType,
        required: false,
        path: `${parentPath}[]`,
        isSourced: true,
      };
    }
  }

  return {
    id: "item",
    label: "Item",
    type: "string",
    required: false,
    path: `${parentPath}[]`,
    isSourced: false,
  };
}

/**
 * Get base type from sourced definition
 */
function getBaseType(
  definition: any
): "string" | "number" | "integer" | "boolean" {
  if (!definition.properties?.value) return "string";

  const valueType = definition.properties.value.type;
  if (valueType === "string") return "string";
  if (valueType === "number") return "number";
  if (valueType === "integer") return "integer";
  if (valueType === "boolean") return "boolean";

  return "string";
}

/**
 * Merge allOf schemas
 */
function mergeAllOf(allOf: any[], definitions: any): any {
  const merged: any = {};

  for (const item of allOf) {
    if (item.$ref) {
      const refPath = item.$ref.replace("#/definitions/", "");
      const definition = definitions[refPath];
      Object.assign(merged, definition);
    }
    if (item.properties) {
      Object.assign(merged, item.properties);
      if (item.properties.value?.enum) {
        merged.enum = item.properties.value.enum;
      }
    }
  }

  return merged;
}

/**
 * Map JSON schema types to internal types
 */
function mapType(
  type: string
): "string" | "number" | "integer" | "boolean" | "object" | "array" {
  if (type === "string") return "string";
  if (type === "number") return "number";
  if (type === "integer") return "integer";
  if (type === "boolean") return "boolean";
  if (type === "object") return "object";
  if (type === "array") return "array";
  return "string";
}

/**
 * Extract label from description
 * "Study ID: What is the unique identifier?" -> "Study ID"
 */
function extractLabel(description: string): string {
  const match = description.match(/^([^:?]+)/);
  return match ? match[1].trim() : description;
}

/**
 * Create a sourced value
 */
export function createSourcedValue<T>(
  value: T,
  source_text?: string,
  source_location?: string,
  highlightId?: string
): SourcedValue<T> {
  return {
    value,
    source_text,
    source_location,
    highlightId,
  };
}

/**
 * Extract value from sourced value
 */
export function extractValue<T>(sourced: SourcedValue<T> | T): T {
  if (sourced && typeof sourced === "object" && "value" in sourced) {
    return sourced.value;
  }
  return sourced as T;
}

/**
 * Check if value is sourced
 */
export function isSourcedValue(value: any): value is SourcedValue {
  return value && typeof value === "object" && "value" in value;
}
