import type { Computer, Environment } from "./computer";
import * as rfb from 'rfb2';

export class VNCComputer implements Computer {
    readonly environment: Environment = "linux";
    dimensions: [number, number] = [1280, 720];

    private host: string;
    private port: number;
    private password: string;
    private client: any = null;
    private connected: boolean = false;
    private frameBuffer: Buffer | null = null;
    private frameReceived: boolean = false;

    constructor(host?: string, port?: number, password?: string) {
        this.host = host || "computer";
        this.port = port || 5900;
        this.password = password || "";
    }

    async initialize() {
        console.log(`Initializing VNC connection to ${this.host}:${this.port}...`);
        try {
            return new Promise<void>((resolve, reject) => {
                console.log('Creating RFB connection...');
                
                // Create RFB client connection
                const options: any = {
                    host: this.host,
                    port: this.port,
                };
                if (this.password) {
                    options.password = this.password;
                }
                
                this.client = rfb.createConnection(options);
                
                console.log('RFB connection created, setting up event handlers...');
                
                // Add timeout to prevent hanging indefinitely
                const timeout = setTimeout(() => {
                    console.warn('Warning: Connection timeout reached');
                    if (!this.connected) {
                        reject(new Error('Connection timed out'));
                    } else {
                        resolve();
                    }
                }, 10000); // 10 second timeout
                
                // Setup event handlers
                this.client.on('connect', () => {
                    console.log(`Connected to VNC server at ${this.host}:${this.port}`);
                    console.log(`Remote screen name: ${this.client.title}, width: ${this.client.width}, height: ${this.client.height}`);
                    
                    // Update dimensions based on remote screen
                    this.dimensions = [this.client.width, this.client.height];
                    this.connected = true;
                    
                    // Request initial screen update
                    this.requestScreenUpdate();
                    
                    clearTimeout(timeout);
                    resolve();
                });
                
                this.client.on('error', (error: any) => {
                    console.error('VNC connection error:', error);
                    clearTimeout(timeout);
                    reject(error);
                });
                
                this.client.on('rect', (rect: any) => {
                    // Process rectangle updates based on encoding
                    if (rect.encoding === rfb.encodings.raw) {
                        this.handleRawRect(rect);
                    } else if (rect.encoding === rfb.encodings.copyRect) {
                        console.log('Received copyRect encoding (not fully handled)');
                    } else {
                        console.log(`Received rect with encoding: ${rect.encoding}`);
                    }
                });
                
                this.client.on('resize', (rect: any) => {
                    console.log(`Screen resized to ${rect.width}x${rect.height}`);
                    this.dimensions = [rect.width, rect.height];
                    // Request full screen update after resize
                    this.requestScreenUpdate();
                });
                
                this.client.on('clipboard', (text: string) => {
                    console.log('Remote clipboard updated:', text);
                });
                
                this.client.on('bell', () => {
                    console.log('Bell signal received');
                });
                
                this.client.on('end', () => {
                    console.log('Connection ended');
                    this.connected = false;
                });
            });
        } catch (error) {
            console.error('Failed to initialize VNC connection:', error);
            throw error;
        }
    }

    private handleRawRect(rect: any) {
        const { x, y, width, height, data } = rect;
        console.log(`Received raw rect: ${x},${y} ${width}x${height} with ${data.length} bytes of data`);
        
        // Store the raw data for screenshot functionality
        this.frameBuffer = data;
        this.frameReceived = true;
    }

    private requestScreenUpdate(incremental: boolean = true) {
        if (this.client && this.connected) {
            console.log(`Requesting ${incremental ? 'incremental' : 'full'} screen update`);
            this.client.requestUpdate(incremental, 0, 0, this.dimensions[0], this.dimensions[1]);
        }
    }

    async close() {
        if (this.client && this.connected) {
            console.log('Closing RFB connection');
            this.client.end();
            this.connected = false;
        }
    }

    async screenshot(): Promise<string> {
        if (!this.client || !this.connected) {
            console.error("Cannot take screenshot - not connected");
            return "";
        }
        
        try {
            console.log("Requesting full screen update for screenshot...");
            this.frameReceived = false;
            
            // Request full (non-incremental) screen update
            this.client.requestUpdate(false, 0, 0, this.dimensions[0], this.dimensions[1]);
            
            // Create a simple text-based dummy image in case we need it
            const createDummyResponse = () => {
                console.log("Creating dummy screen response");
                return `data:text/plain;base64,${Buffer.from('VNC Connection Active - No Frame Data').toString('base64')}`;
            };
            
            // Wait for frame update with timeout
            const maxWaitTime = 5000; // 5 seconds max
            const startTime = Date.now();
            
            while (!this.frameReceived && Date.now() - startTime < maxWaitTime) {
                await this.wait(100);
            }
            
            if (!this.frameBuffer || !this.frameReceived) {
                console.error("Failed to receive frame buffer data");
                return createDummyResponse();
            }
            
            console.log(`Got frame buffer of size: ${this.frameBuffer.length} bytes`);
            
            // Just return the raw buffer as base64
            const base64Data = this.frameBuffer.toString('base64');
            return `data:image/raw;base64,${base64Data}`;
        } catch (error) {
            console.error('Screenshot error:', error);
            return "";
        }
    }

    async click(x: number, y: number, button: string = 'left'): Promise<void> {
        if (!this.client || !this.connected) return;
        
        // Convert button string to button mask
        // In RFB protocol:
        // bit 0: left button
        // bit 1: middle button
        // bit 2: right button
        let buttonMask = 0;
        if (button === 'left') buttonMask = 1;
        else if (button === 'middle') buttonMask = 2;
        else if (button === 'right') buttonMask = 4;
        
        // Press button
        this.client.pointerEvent(x, y, buttonMask);
        await this.wait(50);
        
        // Release button
        this.client.pointerEvent(x, y, 0);
    }

    async doubleClick(x: number, y: number, button: string = 'left'): Promise<void> {
        await this.click(x, y, button);
        await this.wait(100);
        await this.click(x, y, button);
    }

    async scroll(x: number, y: number, deltaX: number, deltaY: number): Promise<void> {
        if (!this.client || !this.connected) return;
        
        // In RFB, scroll events are typically handled as button 4 (up) and 5 (down)
        // button 3 is right, so we start at bit 3 (value 8) for scroll up
        const steps = Math.abs(Math.round(deltaY / 40));
        
        for (let i = 0; i < steps; i++) {
            const buttonMask = deltaY < 0 ? 8 : 16; // 8 is scroll up (button 4), 16 is scroll down (button 5)
            
            // Press scroll button
            this.client.pointerEvent(x, y, buttonMask);
            await this.wait(10);
            
            // Release button
            this.client.pointerEvent(x, y, 0);
            await this.wait(20);
        }
    }

    async type(text: string): Promise<void> {
        if (!this.client || !this.connected) return;
        
        for (const char of text) {
            const keycode = this.charToKeySym(char);
            
            // Key down
            this.client.keyEvent(keycode, 1);
            await this.wait(10);
            
            // Key up
            this.client.keyEvent(keycode, 0);
            await this.wait(30);
        }
    }

    async move(x: number, y: number): Promise<void> {
        if (!this.client || !this.connected) return;
        this.client.pointerEvent(x, y, 0);
    }

    async drag(path: Array<{ x: number; y: number; }>): Promise<void> {
        if (!this.client || !this.connected || !path || path.length < 2) return;
        
        console.log(`Dragging from (${path[0]?.x}, ${path[0]?.y}) to (${path[path.length-1]?.x}, ${path[path.length-1]?.y})`);
        
        const firstPoint = path[0];
        const lastPoint = path[path.length-1];
        
        // Check if first point exists and has valid x,y coordinates
        if (firstPoint && typeof firstPoint.x === 'number' && typeof firstPoint.y === 'number') {
            // Press at first point (button1 = left mouse button)
            this.client.pointerEvent(firstPoint.x, firstPoint.y, 1); // 1 is left button
            await this.wait(50);
            
            // Move through path (maintaining button press)
            for (let i = 1; i < path.length - 1; i++) {
                const point = path[i];
                if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                    this.client.pointerEvent(point.x, point.y, 1);
                    await this.wait(20);
                }
            }
            
            // Check if last point exists and has valid x,y coordinates
            if (lastPoint && typeof lastPoint.x === 'number' && typeof lastPoint.y === 'number') {
                // Release at last point
                this.client.pointerEvent(lastPoint.x, lastPoint.y, 0);
            }
        }
    }

    async getCurrentUrl(): Promise<string> {
        // Not directly available through VNC
        return "";
    }

    async keypress(keys: string[]): Promise<void> {
        if (!this.client || !this.connected) return;
        
        // Map special keys to keycodes
        const keyCodes = keys.map(key => this.keyToKeySym(key));
        
        // Press all keys
        for (const keyCode of keyCodes) {
            this.client.keyEvent(keyCode, 1);
            await this.wait(20);
        }
        
        // Release all keys in reverse order
        for (const keyCode of [...keyCodes].reverse()) {
            this.client.keyEvent(keyCode, 0);
            await this.wait(20);
        }
    }

    async wait(ms: number = 500): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Helper method to convert character to VNC keysym
    private charToKeySym(char: string): number {
        // For most printable ASCII characters, the keysym is the same as the ASCII code
        return char.charCodeAt(0);
    }
    
    private keyToKeySym(key: string): number {
        // Map of special keys to their VNC keycodes
        const keyMap: {[key: string]: number} = {
            'Enter': 0xff0d,
            'Tab': 0xff09,
            'Escape': 0xff1b,
            'Backspace': 0xff08,
            'Control': 0xffe3,
            'Alt': 0xffe9,
            'Shift': 0xffe1,
            'ArrowUp': 0xff52,
            'ArrowDown': 0xff54,
            'ArrowLeft': 0xff51,
            'ArrowRight': 0xff53,
            'Home': 0xff50,
            'End': 0xff57,
            'PageUp': 0xff55,
            'PageDown': 0xff56,
            'F1': 0xffbe,
            'F2': 0xffbf,
            'F3': 0xffc0,
            'F4': 0xffc1,
            'F5': 0xffc2,
            'F6': 0xffc3,
            'F7': 0xffc4,
            'F8': 0xffc5,
            'F9': 0xffc6,
            'F10': 0xffc7,
            'F11': 0xffc8,
            'F12': 0xffc9,
        };
        
        return keyMap[key] || key.charCodeAt(0);
    }
}
