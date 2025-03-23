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
    private connectionTimeout: ReturnType<typeof setTimeout> | null = null;

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
                
                try {
                    this.client = rfb.createConnection(options);
                    console.log('RFB connection created, setting up event handlers...');
                } catch (err) {
                    console.error('Failed to create RFB connection:', err);
                    reject(new Error(`Failed to create RFB connection: ${err}`));
                    return;
                }
                
                // Add timeout to prevent hanging indefinitely
                this.connectionTimeout = setTimeout(() => {
                    console.warn('Warning: Connection timeout reached');
                    if (!this.connected) {
                        this.cleanupConnection();
                        reject(new Error('Connection timed out'));
                    }
                }, 10000); // 10 second timeout
                
                // Setup event handlers
                this.client.on('connect', () => {
                    console.log(`Connected to VNC server at ${this.host}:${this.port}`);
                    console.log(`Remote screen name: ${this.client.title}, width: ${this.client.width}, height: ${this.client.height}`);
                    
                    // Update dimensions based on remote screen
                    this.dimensions = [this.client.width || this.dimensions[0], this.client.height || this.dimensions[1]];
                    this.connected = true;
                    
                    // Request initial screen update
                    this.requestScreenUpdate();
                    
                    this.clearConnectionTimeout();
                    resolve();
                });
                
                this.client.on('error', (error: any) => {
                    console.error('VNC connection error:', error);
                    this.clearConnectionTimeout();
                    this.connected = false;
                    reject(error);
                });
                
                this.client.on('rect', (rect: any) => {
                    // Process rectangle updates based on encoding
                    try {
                        if (rect.encoding === rfb.encodings.raw) {
                            this.handleRawRect(rect);
                        } else if (rect.encoding === rfb.encodings.copyRect) {
                            console.log('Received copyRect encoding (not fully handled)');
                        } else {
                            console.log(`Received rect with encoding: ${rect.encoding}`);
                        }
                    } catch (err) {
                        console.error('Error handling rect update:', err);
                    }
                });
                
                this.client.on('resize', (rect: any) => {
                    console.log(`Screen resized to ${rect.width}x${rect.height}`);
                    this.dimensions = [rect.width || this.dimensions[0], rect.height || this.dimensions[1]];
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
                    this.clearConnectionTimeout();
                });
            });
        } catch (error) {
            console.error('Failed to initialize VNC connection:', error);
            this.connected = false;
            this.client = null;
            throw error;
        }
    }

    private clearConnectionTimeout() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
    }

    private cleanupConnection() {
        this.clearConnectionTimeout();
        if (this.client) {
            try {
                this.client.end();
            } catch (e) {
                console.error('Error ending RFB connection:', e);
            }
            this.client = null;
        }
        this.connected = false;
    }

    private handleRawRect(rect: any) {
        try {
            const { x, y, width, height, data } = rect;
            if (!data || !width || !height) {
                console.error('Invalid rect data received');
                return;
            }
            
            console.log(`Received raw rect: ${x},${y} ${width}x${height} with ${data.length} bytes of data`);
            
            // Store the raw data for screenshot functionality
            // If this is a full-screen update or large enough, use it for the frame buffer
            if (x === 0 && y === 0 && width === this.dimensions[0] && height === this.dimensions[1]) {
                console.log("Received full-screen update, storing as frame buffer");
                this.frameBuffer = Buffer.from(data); // Make a copy to ensure we have a proper buffer
                this.frameReceived = true;
            }
        } catch (err) {
            console.error('Error handling raw rect:', err);
        }
    }

    private requestScreenUpdate(incremental: boolean = true) {
        if (!this.client || !this.connected) {
            console.warn('Cannot request screen update - not connected');
            return;
        }
        
        try {
            console.log(`Requesting ${incremental ? 'incremental' : 'full'} screen update`);
            this.client.requestUpdate(incremental, 0, 0, this.dimensions[0], this.dimensions[1]);
        } catch (err) {
            console.error('Error requesting screen update:', err);
        }
    }

    async close() {
        console.log('Closing RFB connection');
        this.cleanupConnection();
    }

    async screenshot(): Promise<string> {
        if (!this.client || !this.connected) {
            console.error("Cannot take screenshot - not connected");
            return this.createDummyImage("Not connected to VNC server");
        }
        
        try {
            console.log("Requesting full screen update for screenshot...");
            this.frameReceived = false;
            
            // Request full (non-incremental) screen update
            this.client.requestUpdate(false, 0, 0, this.dimensions[0], this.dimensions[1]);
            
            // Wait for frame update with timeout
            const maxWaitTime = 5000; // 5 seconds max
            const startTime = Date.now();
            
            while (!this.frameReceived && Date.now() - startTime < maxWaitTime) {
                await this.wait(100);
            }
            
            if (!this.frameBuffer || !this.frameReceived) {
                console.error("Failed to receive frame buffer data");
                return this.createDummyImage("No frame data received");
            }
            
            console.log(`Got frame buffer of size: ${this.frameBuffer.length} bytes`);
            
            // Convert the raw RGB buffer to a PNG using Bun-compatible approaches
            return await this.convertFrameBufferToImage(this.frameBuffer);
        } catch (error: any) {
            console.error('Screenshot error:', error);
            return this.createDummyImage(`Error: ${error.message || 'Unknown error'}`);
        }
    }

    private createDummyImage(message: string = "VNC Connection Active - No Frame Data"): string {
        console.log(`Creating dummy screen with message: ${message}`);
        // Return a base64 encoded string that represents a dummy image
        return `data:image/png;base64,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`;
    }

    private async convertFrameBufferToImage(buffer: Buffer): Promise<string> {
        try {
            // Safety check for buffer and dimensions
            if (!buffer || buffer.length === 0) {
                return this.createDummyImage("Invalid frame buffer");
            }
            
            const width = this.dimensions[0];
            const height = this.dimensions[1];
            
            if (width <= 0 || height <= 0) {
                return this.createDummyImage("Invalid screen dimensions");
            }
            
            // Expected buffer size check (4 bytes per pixel)
            const expectedSize = width * height * 4;
            if (buffer.length < expectedSize) {
                console.warn(`Frame buffer size (${buffer.length}) is smaller than expected (${expectedSize})`);
                // Continue anyway but log the warning
            }
            
            // PNG signature
            const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
            
            // IHDR chunk (image header)
            const IHDR = Buffer.alloc(13);
            // Width (4 bytes)
            IHDR.writeUInt32BE(width, 0);
            // Height (4 bytes)
            IHDR.writeUInt32BE(height, 4);
            // Bit depth (1 byte) - 8 bits per channel
            IHDR[8] = 8;
            // Color type (1 byte) - 6 means RGBA
            IHDR[9] = 6;
            // Compression method (1 byte) - 0 means zlib
            IHDR[10] = 0;
            // Filter method (1 byte) - 0 means adaptive filtering
            IHDR[11] = 0;
            // Interlace method (1 byte) - 0 means no interlace
            IHDR[12] = 0;
            
            const IHDRChunk = this.createPNGChunk('IHDR', IHDR);
            
            // Convert VNC's BGR format to RGBA format for PNG
            const pixelData = Buffer.alloc(width * height * 4 + height); // +height for filter byte per scanline
            
            let pixelPos = 0;
            try {
                for (let y = 0; y < height; y++) {
                    // Add filter byte (0) at the beginning of each scanline
                    pixelData[pixelPos++] = 0;
                    
                    for (let x = 0; x < width; x++) {
                        const srcPos = (y * width + x) * 4;
                        
                        // Safely check if we're within buffer bounds
                        if (srcPos + 2 < buffer.length) {
                            pixelData[pixelPos++] = buffer[srcPos + 2] || 0;  // R (from B)
                            pixelData[pixelPos++] = buffer[srcPos + 1] || 0;  // G (from G)
                            pixelData[pixelPos++] = buffer[srcPos] || 0;      // B (from R)
                            pixelData[pixelPos++] = 255;                      // Alpha (full opacity)
                        } else {
                            // Fill with black if we're out of bounds
                            pixelData[pixelPos++] = 0;  // R
                            pixelData[pixelPos++] = 0;  // G
                            pixelData[pixelPos++] = 0;  // B
                            pixelData[pixelPos++] = 255; // Alpha
                        }
                    }
                }
            } catch (err) {
                console.error('Error converting pixel data:', err);
                return this.createDummyImage("Error converting pixel data");
            }
            
            // Compress the pixel data using zlib
            let compressedData;
            try {
                compressedData = require('zlib').deflateSync(pixelData);
            } catch (err) {
                console.error('Error compressing data:', err);
                return this.createDummyImage("Error compressing image data");
            }
            
            // IDAT chunk (image data)
            const IDATChunk = this.createPNGChunk('IDAT', compressedData);
            
            // IEND chunk (image end)
            const IENDChunk = this.createPNGChunk('IEND', Buffer.alloc(0));
            
            // Combine all chunks to create the PNG file
            const pngBuffer = Buffer.concat([
                signature,
                IHDRChunk,
                IDATChunk,
                IENDChunk
            ]);
            
            return `data:image/png;base64,${pngBuffer.toString('base64')}`;
        } catch (error: any) {
            console.error('Error converting frame buffer to image:', error);
            return this.createDummyImage(`Image conversion error: ${error.message || 'Unknown error'}`);
        }
    }
    
    private createPNGChunk(type: string, data: Buffer): Buffer {
        try {
            // Chunk structure: Length (4 bytes) + Type (4 bytes) + Data (Length bytes) + CRC (4 bytes)
            const typeBuffer = Buffer.from(type);
            const length = data.length;
            
            const chunk = Buffer.alloc(length + 12);
            
            // Write length (4 bytes)
            chunk.writeUInt32BE(length, 0);
            
            // Write type (4 bytes)
            typeBuffer.copy(chunk, 4);
            
            // Write data
            data.copy(chunk, 8);
            
            // Calculate CRC
            const crcData = Buffer.alloc(4 + length);
            typeBuffer.copy(crcData, 0);
            data.copy(crcData, 4);
            
            const crc = this.calculateCRC32(crcData);
            chunk.writeInt32BE(crc, length + 8);
            
            return chunk;
        } catch (err) {
            console.error('Error creating PNG chunk:', err);
            // Return an empty chunk on error
            return Buffer.alloc(0);
        }
    }
    
    private calculateCRC32(data: Buffer): number {
        try {
            let crc = 0xffffffff;
            const crcTable = this.getCRC32Table();
            
            for (let i = 0; i < data.length; i++) {
                const index = (crc ^ data[i]!) & 0xff;
                const tableValue = crcTable[index];
                if (tableValue !== undefined) {
                    crc = tableValue ^ (crc >>> 8);
                }
            }
            
            return crc ^ 0xffffffff;
        } catch (err) {
            console.error('Error calculating CRC32:', err);
            return 0;
        }
    }
    
    private getCRC32Table(): Uint32Array {
        const table = new Uint32Array(256);
        
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = ((c & 1) ? 0xedb88320 : 0) ^ (c >>> 1);
            }
            table[i] = c;
        }
        
        return table;
    }

    async click(x: number, y: number, button: string = 'left'): Promise<void> {
        if (!this.client || !this.connected) {
            console.warn('Cannot click - not connected');
            return;
        }
        
        try {
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
        } catch (err) {
            console.error('Error during click operation:', err);
        }
    }

    async doubleClick(x: number, y: number, button: string = 'left'): Promise<void> {
        try {
            await this.click(x, y, button);
            await this.wait(100);
            await this.click(x, y, button);
        } catch (err) {
            console.error('Error during double click operation:', err);
        }
    }

    async scroll(x: number, y: number, deltaX: number, deltaY: number): Promise<void> {
        if (!this.client || !this.connected) {
            console.warn('Cannot scroll - not connected');
            return;
        }
        
        try {
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
        } catch (err) {
            console.error('Error during scroll operation:', err);
        }
    }

    async type(text: string): Promise<void> {
        if (!this.client || !this.connected) {
            console.warn('Cannot type - not connected');
            return;
        }
        
        try {
            for (const char of text) {
                const keycode = this.charToKeySym(char);
                
                // Key down
                this.client.keyEvent(keycode, 1);
                await this.wait(10);
                
                // Key up
                this.client.keyEvent(keycode, 0);
                await this.wait(30);
            }
        } catch (err) {
            console.error('Error during type operation:', err);
        }
    }

    async move(x: number, y: number): Promise<void> {
        if (!this.client || !this.connected) {
            console.warn('Cannot move - not connected');
            return;
        }
        
        try {
            this.client.pointerEvent(x, y, 0);
        } catch (err) {
            console.error('Error during move operation:', err);
        }
    }

    async drag(path: Array<{ x: number; y: number; }>): Promise<void> {
        if (!this.client || !this.connected || !path || path.length < 2) {
            console.warn('Cannot drag - not connected or invalid path');
            return;
        }
        
        try {
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
        } catch (err) {
            console.error('Error during drag operation:', err);
        }
    }

    async getCurrentUrl(): Promise<string> {
        // Not directly available through VNC
        return "";
    }

    async keypress(keys: string[]): Promise<void> {
        if (!this.client || !this.connected) {
            console.warn('Cannot keypress - not connected');
            return;
        }
        
        try {
            // Map special keys to keycodes
            const keyCodes = keys.map(key => this.keyToKeySym(key.toLowerCase()));
            
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
        } catch (err) {
            console.error('Error during keypress operation:', err);
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
            'enter': 0xff0d,
            'space': 0x0020,
            'tab': 0xff09,
            'escape': 0xff1b,
            'backspace': 0xff08,
            'ctrl': 0xffe3,
            'alt': 0xffe9,
            'shift': 0xffe1,
            'arrowup': 0xff52,
            'arrowdown': 0xff54,
            'arrowleft': 0xff51,
            'arrowright': 0xff53,
            'home': 0xff50,
            'end': 0xff57,
            'pageup': 0xff55,
            'pagedown': 0xff56,
            'f1': 0xffbe,
            'f2': 0xffbf,
            'f3': 0xffc0,
            'f4': 0xffc1,
            'f5': 0xffc2,
            'f6': 0xffc3,
            'F7': 0xffc4,
            'F8': 0xffc5,
            'f9': 0xffc6,
            'f10': 0xffc7,
            'f11': 0xffc8,
            'f12': 0xffc9,
        };
        
        return keyMap[key] || key.charCodeAt(0);
    }
}
