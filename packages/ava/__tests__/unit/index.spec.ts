import { Advisor, bindRenderer } from "../../src/";

describe('index', () => {
  it('Advisor', async () => { 
    expect(Advisor).toBeDefined();
  });

  it('bindRenderer', async () => { 
    expect(bindRenderer).toBeInstanceOf(Function);
  });
});
