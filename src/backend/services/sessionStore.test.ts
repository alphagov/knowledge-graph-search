import { SessionStore } from './sessionStore'

beforeAll(() => {
  ;(
    jest.spyOn(
      SessionStore.prototype,
      'createRedisInstance'
    ) as jest.Mock<SessionStore>
  ).mockImplementation(() => 'A redis instance')
  ;(
    jest.spyOn(
      SessionStore.prototype,
      'createSessionStore'
    ) as jest.Mock<SessionStore>
  ).mockImplementation(() => 'A session store')
})

afterAll(() => {
  jest.restoreAllMocks()
})

test('Modify class', () => {
  const newSessionStore = new SessionStore()

  expect(newSessionStore.getStore()).equal('A session store')
})
