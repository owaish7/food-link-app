// Tiny className joiner — filters falsy values and flattens arrays.
export function cn(...args) {
  return args
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}
