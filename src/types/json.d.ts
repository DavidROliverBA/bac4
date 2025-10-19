/**
 * TypeScript declaration for JSON imports
 * Allows importing .json files as modules
 */

declare module '*.json' {
  const value: any;
  export default value;
}
