import { Response } from "got";

/**
 * The response returned by a function call to Wonde's API.
 *
 * @since 0.1.0
 */
export interface FunctionResponse {
  /**
   * Returns the raw HTTP response returned from the API call for this function.
   */
  getHttpResponse(): Response;

  /**
   * Metadata returned by Wonde's API.
   */
  meta: {
    /**
     * Pagination metadata returned by Wonde's API.
     */
    pagination: {
      /**
       * The URL of the next page in the paginated response.
       */
      next: string | null;

      /**
       * The URL of the previous page in the paginated response.
       */
      previous: string | null;

      /**
       * Is there another page after the current one in the paginated response?
       */
      more: boolean;

      /**
       * How many rows/results are currently being returned per page/response.
       */
      // eslint-disable-next-line camelcase
      per_page: number;

      /**
       * The current paginated page number within the response.
       */
      // eslint-disable-next-line camelcase
      current_page: number;
    };
  };

  /**
   * Response data returned from Wonde.
   */
  data: any;
}
