function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getCollectionItems(collections, collectionName) {
  return collections[collectionName] || [];
}

export function createWixDataMock(initialData = {}) {
  const collections = deepClone(initialData);
  let autoIdCounter = 1;

  return {
    query(collectionName) {
      const conditions = [];
      let limitCount = null;
      let skipCount = 0;

      const builder = {
        eq(field, value) {
          conditions.push({ field, value });
          return builder;
        },
        limit(n) {
          limitCount = n;
          return builder;
        },
        skip(n) {
          skipCount = n;
          return builder;
        },
        find() {
          const items = getCollectionItems(collections, collectionName);

          let filtered = items.filter(item => {
            return conditions.every(({ field, value }) => item[field] === value);
          });

          const totalCount = filtered.length;

          filtered = filtered.slice(skipCount);

          if (limitCount !== null) {
            filtered = filtered.slice(0, limitCount);
          }

          return {
            items: filtered,
            totalCount,
            length: filtered.length
          };
        }
      };

      return builder;
    },

    insert(collectionName, item) {
      if (!collections[collectionName]) {
        collections[collectionName] = [];
      }

      const newItem = {
        _id: 'auto_' + autoIdCounter++,
        ...item
      };

      collections[collectionName].push(newItem);
      return newItem;
    },

    update(collectionName, item) {
      const items = getCollectionItems(collections, collectionName);
      const index = items.findIndex(i => i._id === item._id);

      if (index !== -1) {
        items[index] = { ...items[index], ...item };
        return items[index];
      }

      return item;
    },

    get(collectionName, itemId) {
      const items = getCollectionItems(collections, collectionName);
      const item = items.find(i => i._id === itemId);
      return item || null;
    }
  };
}

export function createWixFetchMock(responses = []) {
  const calls = [];

  return {
    async fetch(url, options = {}) {
      calls.push({ url, options });

      const response = responses.find(r => url.includes(r.urlPattern));

      if (!response) {
        return {
          ok: false,
          status: 404,
          async json() {
            return {};
          },
          async text() {
            return '';
          },
          headers: {}
        };
      }

      return {
        ok: response.status < 400,
        status: response.status,
        async json() {
          return response.body;
        },
        async text() {
          return typeof response.body === 'string'
            ? response.body
            : JSON.stringify(response.body);
        },
        headers: response.headers || {}
      };
    },

    getCalls() {
      return calls;
    }
  };
}

export function createWixLocationMock(initialPath = '/', initialQuery = {}) {
  const navigations = [];

  return {
    get path() {
      return initialPath;
    },
    get query() {
      return initialQuery;
    },
    to(url) {
      navigations.push(url);
    },
    getNavigations() {
      return navigations;
    }
  };
}

export function createWixSecretsMock(secrets = {}) {
  return {
    getSecret(name) {
      if (!(name in secrets)) {
        throw new Error(`Secret not found: ${name}`);
      }
      return secrets[name];
    }
  };
}
