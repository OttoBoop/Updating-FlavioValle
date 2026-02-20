// __mocks__/wix-web-module.js — jest mock for Wix Web Module
// webMethod is just a decorator in Wix runtime. In tests, unwrap it transparently.
export const Permissions = { Anyone: 'anyone' };
export const webMethod = (_permissions, fn) => fn;
