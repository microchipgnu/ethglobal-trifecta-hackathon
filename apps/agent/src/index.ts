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
    message: `Received prompt: ${
      prompt.length > 100 ? `${prompt.substring(0, 100)}...` : prompt
    }`,
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
    message: `Classified prompt as ${uniqueGroups.join(', ')}`,
  });

  // Use multi-group selection if we have multiple groups, otherwise use single group
  const toolsToUse =
    uniqueGroups.length > 1
      ? await selectToolsFromMultipleGroups({
          prompt,
          groups: uniqueGroups,
          maxTools: 5,
          options: { host, port },
        })
      : await selectTools({
          prompt,
          group: uniqueGroups[0],
          maxTools: 5,
          options: { host, port },
        });

  const toolCount = Object.keys(toolsToUse).length;
  const tools = Object.keys(toolsToUse).map((tool) => ({
    name: tool,
    description: toolsToUse[tool]?.description || '',
  }));
  const groupsUsed = uniqueGroups.join(', ');

  console.log(`Selected ${toolCount} tools from ${groupsUsed}`);

  await setAgentState({
    state: 'tools_selected',
    message: `Selected ${toolCount} tools from ${groupsUsed}`,
  });

  // Generate a plan for executing the prompt
  const plan = await generatePlan(prompt, tools);
  console.log('Generated execution plan:', JSON.stringify(plan, null, 2));

  await setAgentState({
    state: 'plan_created',
    message: `Created plan with ${plan.steps.length} steps: ${plan.summary}`,
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
    model: openai('gpt-4o'),
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
      message: `Used tool: ${toolCall.toolName}${stepInfo}`,
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


  redisClient.append('messages', {
    role: 'assistant',
    content: result.text,
  });


  await setAgentState({
    state: 'task_completed',
    message: result.text,
  });

  // Wait for 5 seconds before setting the final idle state
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await setAgentState({
    state: 'idle',
    message: `Waiting for next task...`,
  });

  return result;
};
