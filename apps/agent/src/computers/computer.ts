/**
 * Type for computer environment
 */
export type Environment = 'windows' | 'mac' | 'linux' | 'browser';

/**
 * Interface for computer environments that can be controlled by an agent
 */
export interface Computer {
  /**
   * The type of environment
   */
  readonly environment: Environment;
  
  /**
   * The dimensions of the screen [width, height]
   */
  readonly dimensions: [number, number];
  
  /**
   * Take a screenshot of the current state
   * @returns Base64-encoded string of the screenshot
   */
  screenshot(): string | Promise<string>;
  
  /**
   * Click at a specific position
   * @param x X coordinate
   * @param y Y coordinate
   * @param button Button to use for clicking (left, right, middle)
   */
  click(x: number, y: number, button?: string): void | Promise<void>;
  
  /**
   * Double-click at a specific position
   * @param x X coordinate
   * @param y Y coordinate
   */
  doubleClick(x: number, y: number): void | Promise<void>;
  
  /**
   * Scroll from a specific position
   * @param x X coordinate of starting position
   * @param y Y coordinate of starting position
   * @param scrollX Horizontal scroll amount
   * @param scrollY Vertical scroll amount
   */
  scroll(x: number, y: number, scrollX: number, scrollY: number): void | Promise<void>;
  
  /**
   * Type text into the computer
   * @param text Text to type
   */
  type(text: string): void | Promise<void>;
  
  /**
   * Wait for a specified amount of time
   * @param ms Milliseconds to wait
   */
  wait(ms?: number): void | Promise<void>;
  
  /**
   * Move the cursor to a specific position
   * @param x X coordinate
   * @param y Y coordinate
   */
  move(x: number, y: number): void | Promise<void>;
  
  /**
   * Press keyboard keys
   * @param keys Array of key names to press
   */
  keypress(keys: string[]): void | Promise<void>;
  
  /**
   * Drag the cursor along a path
   * @param path Array of points defining the drag path
   */
  drag(path: Array<{x: number, y: number}>): void | Promise<void>;
  
  /**
   * Get the current URL (for browser environments)
   * @returns The current URL
   */
  getCurrentUrl?(): string | Promise<string>;
} 