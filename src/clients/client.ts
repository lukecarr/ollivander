import got, { Got } from "got";
import CacheableRequest from "cacheable-request";

/**
 * HTTP configuration options that are passed along to `got`, the underlying library used for making HTTP requests.
 */
export interface HttpOptions {
  /**
   * The duration in milliseconds that the client should wait for a response before aborting the request.
   *
   * By default, there is no response timeout duration.
   */
  timeout?: number;

  /**
   * How many retries should the client attempt to make on failure.
   *
   * By default, the client will attempt 2 retries if the first request fails.
   */
  retries?: number;

  /**
   * An object that implements the Map API (such as a `new Map()` or a Keyv instance) can be supplied here to cache
   * requests. This caching behavior is compliant with RFC 7234, and uses the `If-None-Match`/`If-Modified-Since`
   * HTTP headers to revalidate stale cache entries.
   */
  cache?: string | false | CacheableRequest.StorageAdapter;

  /**
   * If set to true, Ollivander will additionally accept HTTP/2 requests. HTTP/1.1 or HTTP/2 will be used depending on
   * the ALPN protocol.
   */
  http2?: boolean;
}

/**
 * A client that can send HTTP requests to Wonde's API.
 *
 * @since 1.0.0
 * @abstract
 */
export abstract class Client {
  /**
   * The underlying got instance used for HTTP requests.
   *
   * @since 1.0.0
   */
  public got: Got;

  /**
   * Initializes the client as well as the client's `got` instance so HTTP requests can be made to Wonde's API.
   *
   * @param {HttpOptions} httpOptions HTTP configuration options to pass along to `got`.
   *
   * @since 1.0.0
   * @protected
   */
  protected constructor(httpOptions?: HttpOptions) {
    this.got = got.extend({
      timeout: (httpOptions && httpOptions.timeout) || undefined,
      retry: (httpOptions && httpOptions.retries) || 2,
      cache:
        httpOptions && httpOptions.cache !== undefined
          ? httpOptions.cache
          : undefined,
      http2:
        httpOptions && httpOptions.http2 !== undefined
          ? httpOptions.http2
          : false,
    });
  }
}
