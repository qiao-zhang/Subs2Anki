/**
 * Browser-compatible shim for Node.js 'path' module.
 * Used to satisfy dependencies like kuroshiro-analyzer-kuromoji that rely on path.join.
 */

export function join(...args: string[]): string {
  if (args.length === 0) return '.';

  // Join all arguments with forward slashes
  let joined = args.join('/');

  // Normalize slashes (remove duplicates)
  // But strictly preserve '://' for URLs (e.g. https://)
  if (joined.includes('://')) {
    const [protocol, rest] = joined.split('://');
    return protocol + '://' + rest.replace(/\/+/g, '/');
  }

  return joined.replace(/\/+/g, '/');
}

export function resolve(...args: string[]): string {
  return join(...args);
}

export const sep = '/';

export default {
  join,
  resolve,
  sep
};
