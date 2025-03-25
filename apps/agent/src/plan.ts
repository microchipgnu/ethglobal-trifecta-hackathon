import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Define the structure for a single step in the plan
export type PlanStep = {
  id: number;
  name: string;
  description: string;
  // If this step requires specific tools, list them here
  suggestedTools?: string[];
  // Dependencies - ids of steps that must be completed before this one
  dependsOn?: number[];
  // Estimated complexity (1-5, with 5 being most complex)
  complexity: number;
};

// Define the full plan structure
export type Plan = {
  // Overall summary of what the plan accomplishes
  summary: string;
  // The individual steps to execute
  steps: PlanStep[];
  // Reasoning behind the plan structure
  reasoning: string;
};

// Define the tool structure
export type Tool = {
  name: string;
  description: string;
};

/**
 * Generates a structured plan for executing a user prompt
 * @param prompt The user's original prompt/request
 * @param availableTools Optional list of tool objects with name and description
 * @returns A structured plan with steps
 */
export const generatePlan = async (
  prompt: string,
  availableTools?: Tool[]
): Promise<Plan> => {
  let toolsContext = "";
  
  if (availableTools?.length) {
    // Include both tool names and descriptions
    toolsContext = "\nAvailable tools:\n" + availableTools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join("\n");
  }

  const { object: plan } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      summary: z.string(),
      reasoning: z.string().min(50).max(500),
      steps: z.array(z.object({
        id: z.number().int().positive(),
        name: z.string().min(3).max(50),
        description: z.string().min(20).max(300),
        suggestedTools: z.array(z.string()).optional(),
        dependsOn: z.array(z.number().int().positive()).optional(),
        complexity: z.number().int().min(1).max(5)
      })).min(1).max(10)
    }),
    prompt: `
      Create a step-by-step plan to accomplish the following task:
      "${prompt}"
      
      Break this down into logical steps with clear dependencies.${toolsContext}
      
      For each step:
      1. Give it a short, descriptive name
      2. Provide a detailed description of what should be done
      3. If applicable, suggest specific tools that would be helpful (use the tool name only)
      4. Note any steps that must be completed before this one (dependencies)
      5. Rate the complexity from 1 (simple) to 5 (complex)
      
      Make the plan comprehensive but efficient, avoiding unnecessary steps.
      Number the steps sequentially starting from 1.
      For complex tasks, try to break them down into 3-7 manageable steps.
    `,
  });

  return plan;
};

/**
 * Checks if a plan step is ready to execute based on its dependencies
 * @param step The step to check
 * @param completedStepIds Array of completed step IDs
 * @returns boolean indicating if step is ready to execute
 */
export const isStepReady = (step: PlanStep, completedStepIds: number[]): boolean => {
  // If no dependencies, step is ready
  if (!step.dependsOn || step.dependsOn.length === 0) {
    return true;
  }
  
  // Step is ready if all dependencies are in the completed steps
  return step.dependsOn.every(depId => completedStepIds.includes(depId));
};

/**
 * Gets the next executable steps from a plan based on what's already completed
 * @param plan The full plan
 * @param completedStepIds IDs of steps already completed
 * @returns Array of steps that are ready to execute
 */
export const getNextExecutableSteps = (plan: Plan, completedStepIds: number[] = []): PlanStep[] => {
  return plan.steps.filter(step => 
    !completedStepIds.includes(step.id) && isStepReady(step, completedStepIds)
  );
};
