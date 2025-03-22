// Main agent entry point

import { VNCComputer } from "./computers/vnc";
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options: { host?: string; port?: number; password?: string } = {};
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--host' && i + 1 < args.length) {
            options.host = args[i + 1];
            i++;
        } else if (args[i] === '--port' && i + 1 < args.length) {
            const portStr = args[i + 1] || '5900'; // Default port if undefined
            const portNum = parseInt(portStr, 10);
            if (!isNaN(portNum)) {
                options.port = portNum;
            }
            i++;
        } else if (args[i] === '--password' && i + 1 < args.length) {
            options.password = args[i + 1];
            i++;
        }
    }
    
    return options;
}

const main = async () => {
    console.log("Starting agent...");
    
    // Get command line arguments
    const options = parseArgs();
    console.log(`Using options: ${JSON.stringify({
        host: options.host || 'computer',
        port: options.port || 5900,
        password: options.password ? '****' : undefined
    })}`);
    
    // Create VNC computer with provided options
    const computer = new VNCComputer(
        options.host,
        options.port,
        options.password
    );

    try {
        console.log("Initializing VNC connection...");
        await computer.initialize();
        console.log("VNC connection initialized successfully");

        console.log("Taking screenshot...");
        const screenshot = await computer.screenshot();
        
        // Print just the first part of the screenshot base64 data to avoid flooding console
        if (screenshot) {
            console.log(`Screenshot taken successfully (${screenshot.length} bytes)`);
            console.log(`Data preview: ${screenshot}`);
            
            // Save to file (optional)
            if (screenshot.length > 0) {
                const filename = path.join(process.cwd(), 'vnc-screenshot.png');
                
                // Check the format of the data
                if (screenshot.startsWith('data:image/raw;base64,')) {
                    // Handle raw pixel data - we'll save it as a binary file instead of PNG
                    const rawFilename = path.join(process.cwd(), 'vnc-screenshot.raw');
                    const base64Data = screenshot.replace(/^data:image\/raw;base64,/, "");
                    fs.writeFileSync(rawFilename, Buffer.from(base64Data, 'base64'));
                    console.log(`Raw screenshot saved to: ${rawFilename}`);
                } else {
                    // Regular PNG or other image format
                    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
                    fs.writeFileSync(filename, Buffer.from(base64Data, 'base64'));
                    console.log(`Screenshot saved to: ${filename}`);
                }
            }
        } else {
            console.log("Screenshot is empty");
        }

        // Example of other interactions you could do
        // await computer.click(100, 100);
        // await computer.type("Hello World");
        
        console.log("Agent finished successfully");
    } catch (error) {
        console.error("Error in agent:", error);
    } finally {
        // Always make sure to close the connection
        console.log("Closing VNC connection...");
        await computer.close();
        console.log("VNC connection closed");
    }
}

try {
    await main();
} catch (error) {
    console.error("Uncaught error:", error);
    process.exit(1);
}

// Exit normally
process.exit(0);