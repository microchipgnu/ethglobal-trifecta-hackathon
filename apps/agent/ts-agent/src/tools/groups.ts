import { BaseAnthropicTool } from './base';
import { BashTool20241022, BashTool20250124 } from './bash';
import { ComputerTool20241022, ComputerTool20250124 } from './computer';
import { EditTool20241022, EditTool20250124 } from './edit';
import { AgentKitTool20241022, AgentKitTool20250124 } from './agentkit';

export type ToolVersion = 
  | 'computer_use_20241022' 
  | 'computer_use_20250124' 
  | 'computer_use_agentkit_20241022'
  | 'computer_use_agentkit_20250124';

export type BetaFlag = 
  | 'computer-use-2024-10-22' 
  | 'computer-use-2025-01-24' 
  | 'computer-use-agentkit-2024-10-22'
  | 'computer-use-agentkit-2025-01-24';

/**
 * Tool group configuration
 */
export interface ToolGroup {
  version: ToolVersion;
  tools: Array<typeof BaseAnthropicTool>;
  beta_flag: BetaFlag | null;
}

/**
 * Define different tool groups available to the agent
 */
export const TOOL_GROUPS: ToolGroup[] = [
  {
    version: 'computer_use_20241022',
    tools: [ComputerTool20241022, EditTool20241022, BashTool20241022],
    beta_flag: 'computer-use-2024-10-22',
  },
  {
    version: 'computer_use_20250124',
    tools: [ComputerTool20250124, EditTool20250124, BashTool20250124],
    beta_flag: 'computer-use-2025-01-24',
  },
  {
    version: 'computer_use_agentkit_20241022',
    tools: [ComputerTool20241022, EditTool20241022, BashTool20241022, AgentKitTool20241022],
    beta_flag: 'computer-use-agentkit-2024-10-22',
  },
  {
    version: 'computer_use_agentkit_20250124',
    tools: [ComputerTool20250124, EditTool20250124, BashTool20250124, AgentKitTool20250124],
    beta_flag: 'computer-use-agentkit-2025-01-24',
  },
];

/**
 * Tool groups indexed by version
 */
export const TOOL_GROUPS_BY_VERSION: Record<ToolVersion, ToolGroup> = 
  Object.fromEntries(TOOL_GROUPS.map(group => [group.version, group])) as Record<ToolVersion, ToolGroup>; 