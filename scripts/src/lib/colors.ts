/**
 * ANSI color codes for terminal output
 */

export const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  magenta: '\x1b[0;35m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m',
} as const;

export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export function success(text: string): string {
  return colorize(text, 'green');
}

export function error(text: string): string {
  return colorize(text, 'red');
}

export function warning(text: string): string {
  return colorize(text, 'yellow');
}

export function info(text: string): string {
  return colorize(text, 'cyan');
}
