/// <reference path='definitions.ts' />
/// <reference path="utils.ts" />
'use strict';

module Woc {
  export class CoreHttpClient implements HttpClient {
    private defaultEncoding: string;

    constructor(ac: ApplicationContext) {
      this.defaultEncoding = ac.appConfig.encoding;
    }

    // --
    // -- Public
    // --

    public request(config: HttpConfig): Promise<HttpResponse> {
      var completed = this.makeCompleteConfig(config);
      return CoreHttpClient.doXHR(completed, config);
    }

    public get(url: string, config: HttpConfig = null): Promise<HttpResponse> {
      var completed = this.makeCompleteConfig(config, 'GET', url);
      return CoreHttpClient.doXHR(completed, config);
    }

    public head(url: string, config: HttpConfig = null): Promise<HttpResponse> {
      var completed = this.makeCompleteConfig(config, 'HEAD', url);
      return CoreHttpClient.doXHR(completed, config);
    }

    public post(url: string, data: any, config: HttpConfig = null): Promise<HttpResponse> {
      var completed = this.makeCompleteConfig(config, 'POST', url, data);
      return CoreHttpClient.doXHR(completed, config);
    }

    public put(url: string, data: any, config: HttpConfig = null): Promise<HttpResponse> {
      var completed = this.makeCompleteConfig(config, 'PUT', url, data);
      return CoreHttpClient.doXHR(completed, config);
    }

    public delete: (url: string, config?: HttpConfig) => Promise<HttpResponse>;

    // --
    // -- Private - Handle AJAX events - Loadings
    // --

    private makeCompleteConfig(config?: HttpConfig, method?: string, url?: string, data?: any): HttpConfig {
      if (!config)
        config = {};
      if (method === undefined)
        method = config.method;
      if (!method)
        throw Error('Missing HTTP method');
      if (url === undefined)
        url = config.url;
      if (!url)
        throw Error('Missing HTTP url');
      return {
        method: method,
        url: url,
        data: data !== undefined ? data : config.data,
        headers: this.makeXhrHeaders(method, config.headers),
        timeout: config.timeout,
        responseType: config.responseType || 'json'
      };
    }

    private makeXhrHeaders(method: string, headers?: { [index: string]: any }): { [index: string]: any } {
      var h: any = {};
      if (headers) {
        for (var k in headers) {
          if (headers.hasOwnProperty(k))
            h[k] = headers[k];
        }
      }
      if (method === 'POST' || method === 'PUT') {
        if (h['Content-Type']) {
          if (!h['Content-Type'].indexOf('charset'))
            h['Content-Type'] += ';charset=' + this.defaultEncoding;
        } else
          h['Content-Type'] = 'application/json;charset=' + this.defaultEncoding;
      }
      return h;
    }

    private static doXHR(completed: HttpConfig, orig: HttpConfig): Promise<HttpResponse> {
      return new Promise<HttpResponse>((resolve, reject) => {
        var req = new XMLHttpRequest();
        req.open(completed.method, completed.url, true);
        if (completed.timeout !== undefined)
          req.timeout = completed.timeout;
        // - Handlers
        var makeResponse = (): HttpResponse => {
          return {
            data: req.responseText,
            status: req.status,
            headers: () => {
              return CoreHttpClient.parseResponseHeaders(req.getAllResponseHeaders());
            },
            config: orig,
            statusText: req.statusText
          };
        };
        req.onload = () => {
          var response = makeResponse();
          if (req.status < 200 || req.status >= 400) {
            reject(CoreHttpClient.mergeResponseError(Error('Error on server: ' + req.status), response));
            return;
          }
          switch (completed.responseType) {
            case 'script':
              globalEval(req.responseText);
              resolve(response);
              break;
            case 'json':
              try {
                response.data = JSON.parse(req.responseText);
                resolve(response);
              } catch (e) {
                reject(CoreHttpClient.mergeResponseError(Error('Invalid JSON'), response));
                return;
              }
              break;
            default:
              resolve(response);
          }
        };
        req.onerror = () => {
          reject(CoreHttpClient.mergeResponseError(Error('Network error'), makeResponse()));
        };
        // - Send
        for (var k in completed.headers) {
          if (completed.headers.hasOwnProperty(k))
            req.setRequestHeader(k, completed.headers[k]);
        }
        req.send(JSON.stringify(completed.data));
      });
    }

    private static mergeResponseError(err: Error, resp: HttpResponse): Error {
      for (var k in resp) {
        if (resp.hasOwnProperty(k))
          err[k] = resp[k];
      }
      return err;
    }

    /**
     * Thanks to https://gist.github.com/monsur/706839
     */
    private static parseResponseHeaders(headerStr: string): { [index: string]: any } {
      var headers: any = {};
      if (!headerStr)
        return headers;
      var headerPairs = headerStr.split('\u000d\u000a'),
        headerPair,
        index;
      for (var i = 0; i < headerPairs.length; i++) {
        headerPair = headerPairs[i];
        index = headerPair.indexOf('\u003a\u0020');
        if (index > 0)
          headers[headerPair.substring(0, index)] = headerPair.substring(index + 2);
      }
      return headers;
    }
  }

  // IE8
  CoreHttpClient.prototype['delete'] = function (url, config: HttpConfig = null): Promise<HttpResponse> {
    var completed = this.makeCompleteConfig(config, 'DELETE', url);
    return CoreHttpClient['doXHR'](completed, config);
  };
}
