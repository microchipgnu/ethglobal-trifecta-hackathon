#!/usr/bin/env node

import { executePrompt } from "./src/index";
import readline from "readline";

// If arguments are provided, use them as the prompt
if (process.argv.length > 2) {
    const prompt = process.argv.slice(2).join(" ");
    handlePrompt(prompt, { host: "localhost", port: 5900 });
} else {
    // Start interactive mode if no arguments
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    console.log("Welcome to the Agent CLI. Type 'exit' to quit.");
    promptUser(rl);
}

function promptUser(rl: readline.Interface) {
    rl.question("> ", (prompt) => {
        if (prompt.toLowerCase() === "exit") {
            rl.close();
            return;
        }

        handlePrompt(prompt, { host: "localhost", port: 5900 })
            .finally(() => promptUser(rl));
    });
}

async function handlePrompt(prompt: string, { host, port }: { host: string, port: number }) {
    try {
        console.log("Processing your request...");
        const result = await executePrompt(prompt, { host, port });
        console.log("\nResponse:");
        console.log(result.text);
    } catch (error) {
        console.error("Error:", error);
    }
}
