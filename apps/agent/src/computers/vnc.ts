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
        // If this is a full-screen update or large enough, use it for the frame buffer
        if (x === 0 && y === 0 && width === this.dimensions[0] && height === this.dimensions[1]) {
            console.log("Received full-screen update, storing as frame buffer");
            this.frameBuffer = Buffer.from(data); // Make a copy to ensure we have a proper buffer
            this.frameReceived = true;
        }
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
            
            // Wait for frame update with timeout
            const maxWaitTime = 5000; // 5 seconds max
            const startTime = Date.now();
            
            while (!this.frameReceived && Date.now() - startTime < maxWaitTime) {
                await this.wait(100);
            }
            
            if (!this.frameBuffer || !this.frameReceived) {
                console.error("Failed to receive frame buffer data");
                return this.createDummyImage();
            }
            
            console.log(`Got frame buffer of size: ${this.frameBuffer.length} bytes`);
            
            // Convert the raw RGB buffer to a PNG using Bun-compatible approaches
            return await this.convertFrameBufferToImage(this.frameBuffer);
        } catch (error) {
            console.error('Screenshot error:', error);
            return this.createDummyImage();
        }
    }

    private createDummyImage(): string {
        console.log("Creating dummy screen response");
        return Buffer.from('VNC Connection Active - No Frame Data').toString('base64');
    }

    private async convertFrameBufferToImage(buffer: Buffer): Promise<string> {
        try {
            // Create a simple PNG encoder without external dependencies
            // PNG format: https://www.w3.org/TR/PNG/
            
            const width = this.dimensions[0];
            const height = this.dimensions[1];
            
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
            for (let y = 0; y < height; y++) {
                // Add filter byte (0) at the beginning of each scanline
                pixelData[pixelPos++] = 0;
                
                for (let x = 0; x < width; x++) {
                    const srcPos = (y * width + x) * 4;
                    
                    // VNC uses BGR format, we need to convert to RGBA
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
            
            // Compress the pixel data using zlib
            const compressedData = require('zlib').deflateSync(pixelData);
            
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
        } catch (error) {
            console.error('Error converting frame buffer to image:', error);
            return Buffer.from('Error converting image').toString('base64');
        }
    }
    
    private createPNGChunk(type: string, data: Buffer): Buffer {
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
    }
    
    private calculateCRC32(data: Buffer): number {
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
