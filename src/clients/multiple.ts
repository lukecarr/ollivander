import OllivanderClient, { InvokeOptions } from "./single";
import { HttpOptions } from "./client";

interface ClientOptions {
  /**
   * The schools that the client will make requests against.
   */
  schools: {
    /**
     * The Wonde ID of the school.
     */
    id: string;

    /**
     * The school's corresponding API token.
     */
    token: string;
  }[];
}

interface ClientOptionsMultiToken {
  /**
   * The array of school Wonde IDs.
   */
  schools: string[];

  /**
   * The multi-school token for authenticating with Wonde's API.
   */
  token: string;
}

/**
 * A multi-school client for Wonde's API. With this client, the same request can be made against multiple schools.
 *
 * @since 1.0.0
 */
export default class OllivanderMultiSchoolClient {
  /**
   * The schools that this multi-school client is configured to make requests against.
   */
  public readonly schools: {
    [school: string]: OllivanderClient;
  };

  /**
   * Initializes the client as well as the client's `got` instance so HTTP requests can be made to Wonde's API.
   *
   * @param {ClientOptions} options The client options used to configure Ollivander.
   * @param {HttpOptions} httpOptions HTTP configuration options to pass along to `got`.
   *
   * @since 1.0.0
   */
  public constructor(
    options: ClientOptions | ClientOptionsMultiToken,
    httpOptions?: HttpOptions
  ) {
    if ("token" in options) {
      this.schools = Object.fromEntries(
        options.schools.map((school) => [
          school,
          new OllivanderClient({ school, token: options.token }, httpOptions),
        ])
      );
    } else {
      this.schools = Object.fromEntries(
        options.schools.map((school) => [
          school.id,
          new OllivanderClient(
            { school: school.id, token: school.token },
            httpOptions
          ),
        ])
      );
    }
  }

  /**
   * Makes a request to Wonde's API, with the requests grouped by school. The responses will be separated, and the
   * function will return an object that maps each Wonde ID to the corresponding school's response for the Wonde
   * function invoked.
   *
   * @param {"get" | "post" | "put" | "delete"} method The HTTP method to use for the request.
   * @param {string} path The path of the Wonde API request to invoke. Any occurrences of `{{school}}` will be replaced
   * with the Wonde ID of this client's school.
   * @param mode The request mode.
   * @param options Configuration options for the request.
   *
   * @since 1.0.0
   * @async
   */
  public async invoke(
    method: "get" | "post" | "put" | "delete",
    path: string,
    mode: "group",
    options?: InvokeOptions<any>
  ): Promise<Record<string, any>>;

  /**
   * Makes a request to Wonde's API, with the requests aggregated. The responses for each school will be combined/merged
   * into a single array.
   *
   * @param {"get" | "post" | "put" | "delete"} method The HTTP method to use for the request.
   * @param {string} path The path of the Wonde API request to invoke. Any occurrences of `{{school}}` will be replaced
   * with the Wonde ID of this client's school.
   * @param mode The request mode.
   * @param options Configuration options for the request.
   *
   * @since 1.0.0
   * @async
   */
  public async invoke(
    method: "get" | "post" | "put" | "delete",
    path: string,
    mode: "aggregate",
    options?: InvokeOptions<any>
  ): Promise<{ data: any }>;

  public async invoke(
    method: "get" | "post" | "put" | "delete",
    path: string,
    mode: "group" | "aggregate",
    options?: InvokeOptions<any>
  ): Promise<any> {
    if (mode === "group") {
      return {
        data: Object.fromEntries(
          await Promise.all(
            Object.entries(this.schools).map(async ([school, client]) => [
              school,
              (await client.invoke(method, path, options)).data,
            ])
          )
        ),
      };
    }
    let data: any = null;

    const responses = await Promise.all(
      Object.entries(this.schools).map(
        async ([, client]) => (await client.invoke(method, path, options)).data
      )
    );

    responses.forEach((response) => {
      if (data === null) {
        data = response;
      } else if (Array.isArray(response)) {
        data = [...data, ...response];
      } else {
        data = { ...data, ...response };
      }
    });

    return { data };
  }
}
