jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve(undefined)),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve(undefined)),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve(undefined)),
    multiRemove: jest.fn(() => Promise.resolve(undefined)),
    clear: jest.fn(() => Promise.resolve(undefined)),
  },
}))

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve(undefined)),
  deleteItemAsync: jest.fn(() => Promise.resolve(undefined)),
}))
