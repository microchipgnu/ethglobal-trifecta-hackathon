import { getTools as getAgentkitTools } from "./tools/agentkit"
import { getTools as getComputerTools } from "./tools/computers"

export const executePrompt = async (prompt: string) => {
    const agentkitTools = await getAgentkitTools();
    const computerTools = await getComputerTools();
    
    const tools = [
        ...agentkitTools,
        ...computerTools,
    ]

}
