import shelljs from 'shelljs'

// TODO, figure out how to properly write unit tests when shelljs is involved

beforeEach(() => {
  // // to mock shelljs there are multiple ways
  // jest.mock('shelljs', () => {
  //   return { exec: jest.fn() }
  // });
  // //or
  // jest.mock('shelljs', () => {
  //   return {
  //     exec: jest.fn((_, __, callback) => callback())
  //   };
  // });
  // //or
  // jest.mock('shelljs');
  // shelljs.exec = jest.fn().mockImplementation(() => ({ code: 0 }));
})

describe('starting and stopping ephemeral adapters', () => {
  it('should successfully start an adapter', async () => {
    // expect(parseConfig(exampleFeed)).toMatchSnapshot()
  })
})
