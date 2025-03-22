import { VNCComputer } from "./tools/computers/vnc";

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

        // Keep the connection open in a loop
        let running = true;
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('Received SIGINT, shutting down...');
            running = false;
        });
        
        process.on('SIGTERM', () => {
            console.log('Received SIGTERM, shutting down...');
            running = false;
        });

        while (running) {
            try {
                console.log("Running agent tasks...");
                
                // console.log("Taking screenshot...");
                const screenshot = await computer.screenshot();
                console.log(screenshot);
                
                // Wait before next iteration
                console.log("Waiting for next iteration...");
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error("Error during agent task execution:", error);
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
        
        console.log("Agent loop terminated");
        
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