// Listen to the queue for new messages
// Get the last message from the queue
// Execute the message
// Update the state
// Send the response

import { executePrompt } from ".";

export const loop = async () => {

    const prompts = [
        "Use computer to go to Dexscreener and find interesting tokens",
        "Use computer to go to pump.fun and find interesting tokens",
    ]

    for (const prompt of prompts) {
        const response = await executePrompt(prompt, {host: "computer", port: 5900});
        console.log(response);
    }
}

loop();