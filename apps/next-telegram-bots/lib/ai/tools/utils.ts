import { type ToolSet, tool } from 'ai';
import { z } from 'zod';

type ParameterOverrides = Record<string, unknown>;
// Helper function to create tools with parameter overrides
export const createToolsWithOverrides = (
  tools: ToolSet,
  overrides: ParameterOverrides
): ToolSet => {
  const result: ToolSet = {};

  for (const [name, originalTool] of Object.entries(tools)) {
    if (!originalTool) continue;

    // Create a modified tool with updated schema and execution
    result[name] = tool({
      type: 'function',
      description: originalTool.description,
      // Update the schema to reflect that some parameters are pre-filled
      parameters:
        updateParameterSchema(originalTool.parameters, overrides) ||
        z.object({}),
      execute: async (args, options) => {
        // Merge the original args with the overrides
        const mergedArgs: Record<string, unknown> = { ...(args || {}) };

        // Apply overrides for matching parameter keys
        for (const key in overrides) {
          if (key in mergedArgs) {
            mergedArgs[key] = overrides[key];
          }
        }

        // Execute the original tool with the merged args
        if (originalTool.execute) {
          return originalTool.execute(mergedArgs, options);
        }
        return null;
      },
    });
  }

  return result;
};

// Helper function to update parameter schema to indicate pre-filled values
function updateParameterSchema(
  schema: z.ZodType<unknown> | undefined,
  overrides: ParameterOverrides
) {
  if (!schema || !(schema instanceof z.ZodObject)) {
    return schema;
  }

  // Create a new schema with updated descriptions
  const shape = schema.shape;
  const newShape: Record<string, z.ZodTypeAny> = {};

  for (const [key, zodType] of Object.entries(shape)) {
    if (key in overrides) {
      // Update the description to indicate this parameter is pre-filled
      if (zodType instanceof z.ZodString) {
        newShape[key] = zodType.describe(
          `${
            zodType.description || ''
          } (Pre-filled with value from context: ${String(overrides[key])})`
        );
      } else {
        // For other types, we still update the description
        const originalDescription =
          (zodType as z.ZodTypeAny)._def?.description || '';
        const newZodType = zodType as z.ZodTypeAny;
        if (newZodType.describe) {
          newShape[key] = newZodType.describe(
            `${originalDescription} (Pre-filled with value from context: ${String(
              overrides[key]
            )})`
          );
        } else {
          newShape[key] = zodType as z.ZodTypeAny;
        }
      }
    } else {
      newShape[key] = zodType as z.ZodTypeAny;
    }
  }

  return z.object(newShape);
}

export const omitTools = <T extends ToolSet, K extends keyof T>({
  tools,
  toolNames,
}: {
  tools: T;
  toolNames: K[];
}) => {
  return Object.fromEntries(
    Object.entries(tools).filter(([name]) => !toolNames.includes(name as K))
  ) as Omit<T, K>;
};
