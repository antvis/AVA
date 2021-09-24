import { WebRandom } from '../../src/random';

const R = new WebRandom();

test('color', () => {
  expect(R.database.tld.includes(R.tld())).toBe(true);
  expect(R.domain()).toMatch(/\w+\.\w{2,3}/);
  expect(R.email()).toMatch(/\w+@\w+\.\w{2,3}/);
  expect(R.ipv4()).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
  expect(R.ipv6()).toMatch(
    /[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}/
  );
  expect(R.url()).toMatch(/\w+:\/\/\w+\.\w{2,3}/);
  expect(R.url({ domainPrefix: R.word() })).toMatch(/\w+:\/\/\w+.\w+\.\w{2,3}/);
  expect(R.url({ extensions: [R.word()] })).toMatch(/\w+:\/\/\w+\.\w{2,3}/);
});
