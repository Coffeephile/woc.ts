/// <reference path="lib/es6-promise.d.ts" />

module Woc {

  // --
  // -- Embed
  // --

  // Service:
  // constructor: function (sc: Woc.ServiceContext)
  // constructor: function (ac: Woc.ApplicationContext, sc: Woc.ServiceContext)

  /**
   * constructor: function (cc: Woc.ComponentContext, props: any)
   * constructor: function (ac: Woc.ApplicationContext, cc: Woc.ComponentContext, props: any)
   */
  export interface Component {
    attachTo?(...elements: HTMLElement[]): void;
    destructInDOM?(): void;
    destruct?(): void;
  }

  export interface Initializer {
    init(): void;
  }

  // --
  // -- Core defined Services
  // --

  export interface StartingPoint {
    start(el: HTMLElement): void;
  }

  /**
   * The services that implements this interface can be declared as an alias of Woc.Log
   */
  export interface Log {
    log(something: any): void;
    error(err: any): void;
    warn(msg: any): void;
    info(msg: any): void;
    debug(msg: any): void;
  }

  export interface ContextPluginProvider {
    makeContextPlugin(tplStr: string, prop: EmbedProperties): ContextPlugin;
  }

  /**
   * constructor: function (ctc: ComponentTypeContext, tplStr: string)
   */
  export interface ContextPlugin {
    getContextMethods(): {[index: string]: Function};
    destruct(context: Woc.ComponentContext): void;
  }

  /**
   * The services that implements this interface can be declared as an alias of Woc.Router
   * Copy of EasyRouter.MinimalRouter
   */
  export interface Router {
    navigate(queryString: string): Promise<boolean>;
    navigateToUnknown(): Promise<boolean>;
    navigateBack(level?: number): Promise<boolean>;
    /**
     * @param cb returns a boolean or a Promise&lt;boolean&gt;
     * @param onNavRm default value is FALSE
     */
    addCanLeaveListener(cb: () => any, onNavRm?: boolean): number;
    removeCanLeaveListener(handle: number): void;
    /**
     * @param onNavRm default value is FALSE
     */
    addLeaveListener(cb: () => void, onNavRm?: boolean): number;
    removeLeaveListener(handle: number): void;
  }

  // --
  // -- Contexts
  // --

  export interface AppProperties {
    /**
     * The root URL for the Woc application
     */
    wocUrl: string;
    /**
     * The base URL for links to pages or external resources
     */
    baseUrl: string;
  }

  export interface AppConfig extends AppProperties {
    encoding: string;
    /**
     * The relative URL of the application page to open first
     */
    firstRelUrl: string;
  }

  export interface BundleLoadingOptions {
    name: string;
    version: string;
    autoLoadCss: boolean;
    w: boolean;
  }

  export interface ApplicationContext {
    appConfig: AppConfig;
    appProperties: AppProperties;
    loadBundles(optList: BundleLoadingOptions[]): Promise<void>;
    start(el: HTMLElement, startingPointName: string, preload?: BundleLoadingOptions[]): Promise<void>;
    getDebugTree(): {};
  }

  export interface EmbedProperties {
    name: string;
    baseUrl: string;
  }

  export interface EmbedContext {
    log: Log;
    logWrap(cb: () => any): any;
    getService(serviceName: string): any;
    getService<S>(serviceName: string): S;
    createComponent(componentName: string, props?: any): any;
    createComponent<C>(componentName: string, props?: any): C;
    /**
     * @param c
     * @param fromDOM default is FALSE
     */
    removeComponent(c: Component, fromDOM?: boolean): void;
    /**
     * @param cList
     * @param fromDOM default is FALSE
     */
    removeComponent(cList: Component[], fromDOM?: boolean): void;
    getChildComponents(): Component[];
    callChildComponents(methodName, ...args: any[]): any[];
    hasExternalLibrary(libName: string): boolean;
    hasExternalLibrary(libName: string[]): boolean;
    evalExternalLibrary(libName: string): void;
    evalExternalLibrary(libName: string[]): void;
    evalService(serviceName: string): void;
    evalService(serviceName: string[]): void;
    evalComponent(componentName: string): void;
    evalComponent(componentName: string[]): void;
    getName(): string;
    getBaseUrl(): string;
    getOwner(): {};
  }

  export interface ServiceContext extends EmbedContext {
    appConfig: AppConfig;
  }

  export interface InitializerContext extends EmbedContext {
    appConfig: AppConfig;
  }

  export interface ComponentContext extends EmbedContext {
    appProperties: AppProperties;
  }

  // --
  // -- The HttpClient service
  // --

  export interface HttpConfig {
    method?: string;
    url?: string;
    data?: any;
    headers?: { [index: string]: any };
    timeout?: number;
    /**
     * See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#responseType
     */
    responseType?: string;
  }

  export interface HttpResponse {
    data?: any;
    status: number;
    headers: () => { [index: string]: any };
    config: HttpConfig;
    statusText: string;
  }

  export interface HttpClient {
    request(config: HttpConfig): Promise<HttpResponse>;
    get(url: string, config?: HttpConfig): Promise<HttpResponse>;
    head(url: string, config?: HttpConfig): Promise<HttpResponse>;
    post(url: string, data: any, config?: HttpConfig): Promise<HttpResponse>;
    put(url: string, data: any, config?: HttpConfig): Promise<HttpResponse>;
    delete(url: string, config?: HttpConfig): Promise<HttpResponse>;
  }
}
