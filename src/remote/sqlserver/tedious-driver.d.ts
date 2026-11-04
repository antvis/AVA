/**
 * The `tedious` driver is an optional peer dependency and is intentionally not
 * installed for the library build. This shorthand declaration lets the lazy
 * dynamic import type-check without shipping the driver or its typings.
 */
declare module 'tedious';
