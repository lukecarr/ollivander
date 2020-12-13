import { Response } from "got";
import { Client, HttpOptions } from "./client";
import { FunctionResponse } from "../functions";

interface ClientOptions {
  /**
   * The Wonde ID of the school to make requests for. If this value is not provided, then the client falls back to the
   * `OLLIVANDER_WONDE_SCHOOL_ID` environment variable.
   */
  school?: string;

  /**
   * The token used to authenticate with the Wonde API for the client's configured school. If this value is not
   * provided, then the client falls back to the `OLLIVANDER_WONDE_TOKEN` environment variable.
   */
  token?: string;
}

export type InvokeOptions<E = undefined> = {
  /**
   * The base URL of the Wonde API request.
   */
  baseURL?: string;

  /**
   * The JSON body to send with the request.
   */
  body?: Record<string, any>;

  /**
   * The maximum number of results to return in a request. Wonde caps this value at 200 (5000 on GET attendance session
   * data).
   */
  perPage?: number;

  /**
   * Entity relationships to include in the result.
   */
  include?: string[];

  /**
   * Additional URL parameters to add to the request made to Wonde's API.
   */
  searchParams?:
    | Record<string, string | number | boolean | null | undefined>
    | URLSearchParams;
} & (E extends undefined
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : {
      /**
       * If set to true, Ollivander will examine the `meta.pagination` response from Wonde, and
       * make subsequent API calls if the response comprises of multiple pages. All of the responses are aggregated into a
       * single response. `getHttpResponse()` will return the last HTTP response.
       */
      paginate: E;
    });

/**
 * A single school client for Wonde's API. With this client, requests can be made against a single school (referenced
 * by their Wonde ID).
 *
 * @since 1.0.0
 */
export default class OllivanderClient extends Client {
  /**
   * The Wonde ID of the school to make requests for.
   */
  public readonly school?: string;

  /**
   * The token used to authenticate with the Wonde API for the client's configured school.
   */
  public readonly token?: string;

  /**
   * Initializes the client as well as the client's `got` instance so HTTP requests can be made to Wonde's API.
   *
   * @param {ClientOptions} options The client options used to configure Ollivander.
   * @param {HttpOptions} httpOptions HTTP configuration options to pass along to `got`.
   *
   * @since 1.0.0
   */
  public constructor(options?: ClientOptions, httpOptions?: HttpOptions) {
    super(httpOptions);

    this.school =
      (options && options.school) || process.env.OLLIVANDER_WONDE_SCHOOL_ID;
    this.token =
      (options && options.token) || process.env.OLLIVANDER_WONDE_TOKEN;

    if (this.school === undefined) {
      throw new Error("`school` cannot be undefined!");
    } else if (this.token === undefined) {
      throw new Error("`token` cannot be undefined!");
    }
  }

  /**
   * Makes a request to Wonde's API, with the pagination mode enabled.
   *
   * @param {"get" | "post" | "put" | "delete"} method The HTTP method to use for the request.
   * @param {string} path The path of the Wonde API request to invoke. Any occurrences of `{{school}}` will be replaced
   * with the Wonde ID of this client's school.
   * @param options Configuration options for the request.
   *
   * @since 1.0.0
   * @async
   */
  public async invoke(
    method: "get" | "post" | "put" | "delete",
    path: string,
    options?: InvokeOptions<true>
  ): Promise<{ data: any }>;

  /**
   * Makes a request to Wonde's API, with the pagination mode disabled.
   *
   * @param {"get" | "post" | "put" | "delete"} method The HTTP method to use for the request.
   * @param {string} path The path of the Wonde API request to invoke. Any occurrences of `{{school}}` will be replaced
   * with the Wonde ID of this client's school.
   * @param options Configuration options for the request.
   *
   * @since 1.0.0
   * @async
   */
  public async invoke(
    method: "get" | "post" | "put" | "delete",
    path: string,
    options?: InvokeOptions<false | undefined>
  ): Promise<FunctionResponse>;

  public async invoke(
    method: "get" | "post" | "put" | "delete",
    path: string,
    options?: InvokeOptions<boolean>
  ): Promise<any> {
    // eslint-disable-next-line no-param-reassign
    path = path.replace(/{{2}( )*school( )*}{2}/gi, String(this.school));

    if (options && options.paginate) {
      let data: any = null;
      let meta: any = null;
      let response: Response<string>;

      while (
        meta === null ||
        (meta && meta.pagination && meta.pagination.next)
      ) {
        // eslint-disable-next-line no-await-in-loop
        response = await this.got[method](
          (meta && meta.pagination && meta.pagination.next) || path,
          {
            prefixUrl:
              meta && meta.pagination && meta.pagination.next
                ? undefined
                : options.baseURL || "https://api.wonde.com/v1.0",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
            searchParams: {
              ...(options && options.searchParams),
              ...(meta && meta.pagination && meta.pagination.next
                ? undefined
                : {
                    per_page: options.perPage,
                    include: options.include
                      ? options.include.join(",")
                      : undefined,
                  }),
            },
            json: options.body || undefined,
          }
        );
        const body = JSON.parse(response.body);
        meta = body.meta;
        if (data === null) {
          data = body.data;
        } else if (Array.isArray(body.data)) {
          data = [...data, ...body.data];
        } else {
          data = { ...data, ...body.data };
        }
      }

      return {
        data,
      };
    }
    const response = await this.got[method](path, {
      prefixUrl: (options && options.baseURL) || "https://api.wonde.com/v1.0",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      searchParams: {
        ...(options && options.searchParams),
        per_page: options && options.perPage,
        include:
          options && options.include ? options.include.join(",") : undefined,
      },
      json: options && options.body,
    });
    return {
      getHttpResponse: () => response,
      ...(JSON.parse(response.body) as any),
    };
  }
}
