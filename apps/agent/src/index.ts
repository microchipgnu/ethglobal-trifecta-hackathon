import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import redisClient from './db/redis';
import { generatePlan } from './plan';
import { setAgentState } from './state/agent';
import { setLastUsedTool } from './state/tools';
import { selectTools, selectToolsFromMultipleGroups } from './tools';

// Define types for our classifications to help TypeScript
type GroupType = 'crypto' | 'general' | 'computer';
type ClassificationResult = {
  reasoning: string;
  primaryType: GroupType;
  additionalGroups?: GroupType[];
  useMultipleGroups?: boolean;
};

export const executePrompt = async (
  prompt: string,
  { host, port }: { host: string; port: number }
) => {
  redisClient.append('messages', {
    role: 'user',
    content: prompt,
  });

  await setAgentState({
    state: 'received_prompt',
    model: 'gpt-4o',
    provider: 'openai',
    message: `Received prompt: ${prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt}`,
    timestamp: new Date().toISOString(),
  });

  // Classify the prompt with enhanced schema that supports multiple groups
  const { object: classification } = (await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      reasoning: z.string(),
      primaryType: z.enum(['crypto', 'general', 'computer']),
      // Optional additional groups that might be relevant
      additionalGroups: z
        .array(z.enum(['crypto', 'general', 'computer']))
        .optional(),
      // Whether to use multiple groups or just the primary
      useMultipleGroups: z.boolean().optional(),
    }),
    prompt: `
          Classify the following user prompt:
          "${prompt}"
          
          Determine the primary category it belongs to: 'crypto', 'general', or 'computer'.
          Then, analyze if this query could benefit from tools in multiple categories.
          If so, list the additional relevant categories and set useMultipleGroups to true.
          
          Provide your reasoning for this classification.
        `,
  })) as { object: ClassificationResult };

  console.log(classification);

  // Use multi-group selection if we have multiple groups, otherwise use single group
  const useMultipleGroups = !!classification.useMultipleGroups;
  const primaryType = classification.primaryType;
  const additionalGroups = classification.additionalGroups || [];

  // Determine which groups to use
  const groupsToUse =
    useMultipleGroups && additionalGroups.length > 0
      ? [primaryType, ...additionalGroups]
      : [primaryType];

  // Remove duplicates from groups
  const uniqueGroups = [...new Set(groupsToUse)];

  await setAgentState({
    state: 'prompt_classified',
    model: 'gpt-4o',
    provider: 'openai',
    message: `Classified prompt as ${uniqueGroups.join(', ')}`,
    timestamp: new Date().toISOString(),
  });

  // Use multi-group selection if we have multiple groups, otherwise use single group
  const toolsToUse =
    uniqueGroups.length > 1
      ? await selectToolsFromMultipleGroups(prompt, uniqueGroups, 5)
      : await selectTools(prompt, uniqueGroups[0], 5);

  const toolCount = Object.keys(toolsToUse).length;
  const tools = Object.keys(toolsToUse).map((tool) => ({
    name: tool,
    description: toolsToUse[tool]?.description || '',
  }));
  const groupsUsed = uniqueGroups.join(', ');

  console.log(`Selected ${toolCount} tools from ${groupsUsed}`);

  await setAgentState({
    state: 'tools_selected',
    model: 'gpt-4o',
    provider: 'openai',
    message: `Selected ${toolCount} tools from ${groupsUsed}`,
    timestamp: new Date().toISOString(),
  });

  // Generate a plan for executing the prompt
  const plan = await generatePlan(prompt, tools);
  console.log('Generated execution plan:', JSON.stringify(plan, null, 2));

  await setAgentState({
    state: 'plan_created',
    model: 'gpt-4o',
    provider: 'openai',
    message: `Created plan with ${plan.steps.length} steps: ${plan.summary}`,
    timestamp: new Date().toISOString(),
  });

  // Store the plan in Redis for potential future reference
  redisClient.set('current_plan', JSON.stringify(plan));

  // Include the plan in the prompt to the model
  const formatStep = (step: {
    id: number;
    name: string;
    description: string;
    complexity: number;
    suggestedTools?: string[];
    dependsOn?: number[];
  }) => {
    const suggestedTools = step.suggestedTools || [];
    const dependsOn = step.dependsOn || [];

    let text = `${step.id}. ${step.name} (Complexity: ${step.complexity}/5)\n`;
    text += `    ${step.description}\n`;

    if (suggestedTools.length > 0) {
      text += `    Suggested tools: ${suggestedTools.join(', ')}\n`;
    }

    if (dependsOn.length > 0) {
      text += `    Depends on steps: ${dependsOn.join(', ')}\n`;
    }

    return text;
  };

  const enhancedPrompt = `
Task: ${prompt}

I've created a plan to complete this task:
${plan.summary}

Steps:
${plan.steps.map(formatStep).join('\n')}

Please follow this plan to complete the task efficiently.
`;

  const result = await generateText({
    model: openai('o3-mini'),
    system:
      "You are an AI assistant that follows plans methodically. Work through the steps in the plan to complete the user's task.",
    prompt: enhancedPrompt,
    tools: toolsToUse,
    maxSteps: 10,
    maxRetries: 3,
  });

  // Track completed steps
  const completedSteps: number[] = [];

  for (const toolCall of result.toolCalls) {
    await setLastUsedTool(toolCall.toolName);

    // Try to identify which step this tool call is for
    const matchingSteps = plan.steps.filter((step) =>
      step.suggestedTools?.includes(toolCall.toolName)
    );

    let stepInfo = '';
    if (matchingSteps.length === 1) {
      const matchingStep = matchingSteps[0];
      if (matchingStep && typeof matchingStep.id === 'number') {
        const stepId = matchingStep.id;
        if (!completedSteps.includes(stepId)) {
          completedSteps.push(stepId);
          stepInfo = ` (Step ${stepId}: ${matchingStep.name || 'Unknown'})`;
        }
      }
    }

    setAgentState({
      state: 'tool_used',
      model: 'o3-mini',
      provider: 'openai',
      message: `Used tool: ${toolCall.toolName}${stepInfo}`,
      timestamp: new Date().toISOString(),
    });

    // Sleep for 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Update with completion information
  const percentComplete = Math.round(
    (completedSteps.length / plan.steps.length) * 100
  );
  redisClient.set(
    'plan_progress',
    JSON.stringify({
      total: plan.steps.length,
      completed: completedSteps.length,
      percentComplete,
    })
  );

  redisClient.set('agent_message', result.text);

  await setAgentState({
    state: 'idle',
    model: 'o3-mini',
    provider: 'openai',
    message: `Task completed (${percentComplete}% of planned steps)`,
    timestamp: new Date().toISOString(),
  });

  redisClient.append('messages', {
    role: 'assistant',
    content: result.text,
  });

  return result;
};
