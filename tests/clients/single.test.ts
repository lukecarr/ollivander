import OllivanderClient from "../../src/clients/single";

describe("The Ollivander single school client", () => {
  const school = "abc123";
  const token = "def456";
  const timeout = 5000;
  const retries = 5;
  const cache = new Map();
  const http2 = false;
  let client: OllivanderClient;

  beforeAll(() => {
    client = new OllivanderClient(
      {
        school,
        token,
      },
      {
        timeout,
        retries,
        cache,
        http2,
      }
    );
  });

  it("should be initialized with a school ID and token", () => {
    expect(client.school).toBe(school);
    expect(client.token).toBe(token);
  });

  it("should allow initialization through environment variables", () => {
    process.env.OLLIVANDER_WONDE_SCHOOL_ID = "abc123";
    process.env.OLLIVANDER_WONDE_TOKEN = "def456";

    expect(() => new OllivanderClient()).not.toThrowError();

    delete process.env.OLLIVANDER_WONDE_SCHOOL_ID;
    delete process.env.OLLIVANDER_WONDE_TOKEN;
  });

  it("should prioritize provided options over environment variables", () => {
    process.env.OLLIVANDER_WONDE_SCHOOL_ID = "abc123";
    process.env.OLLIVANDER_WONDE_TOKEN = "def456";

    const newToken = "ghi789";
    const newClient = new OllivanderClient({
      token: newToken,
    });

    expect(newClient.school).toBe("abc123");
    expect(newClient.token).toBe("ghi789");

    delete process.env.OLLIVANDER_WONDE_SCHOOL_ID;
    delete process.env.OLLIVANDER_WONDE_TOKEN;
  });

  it("should allow HTTP options to be provided as a second constructor parameter", () => {
    expect(client.got.defaults.options.timeout.request).toBe(timeout);
    expect(client.got.defaults.options.retry.limit).toBe(retries);
    expect(client.got.defaults.options.cache).toBeInstanceOf(Map);
    expect(client.got.defaults.options.http2).toBe(http2);
  });

  it("should thrown an error if the school ID is not provided", () => {
    expect(() => new OllivanderClient({ token })).toThrowError();
  });

  it("should thrown an error if the token is not provided", () => {
    expect(() => new OllivanderClient({ school })).toThrowError();
  });

  describe("the invoke method", () => {
    it("should be exposed to allow for making raw requests to Wonde's API", () => {
      expect(client.invoke).toBeInstanceOf(Function);
    });
  });
});
