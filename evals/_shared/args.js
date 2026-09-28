const { parseArgs } = require('node:util');

// Parse only this layer's options and preserve the remaining arguments for the next layer.
function takeOptions(args, options) {
  const { values, tokens } = parseArgs({ args, options, strict: false, allowPositionals: true, tokens: true });
  const consumed = new Set();
  for (const token of tokens) {
    if (token.kind === 'option' && Object.hasOwn(options, token.name)) {
      consumed.add(token.index);
      if (options[token.name].type === 'string' && !token.inlineValue) consumed.add(token.index + 1);
    }
  }
  return {
    values: Object.fromEntries(
      Object.keys(options)
        .filter((name) => values[name] !== undefined)
        .map((name) => [name, values[name]])
    ),
    rest: args.filter((_, index) => !consumed.has(index)),
  };
}

module.exports = { takeOptions };
