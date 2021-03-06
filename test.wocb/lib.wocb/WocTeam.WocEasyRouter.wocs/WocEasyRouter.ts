/// <reference path='../defs/Woc.d.ts' />
/// <reference path='EasyRouter.d.ts' />

module WocTeam {
  'use strict';

  export interface WocEasyRouterConfig {
    /**
     * Default is true
     */
    hashMode?: boolean;
    /**
     * Default is false
     */
    noHistory?: boolean;
    firstQueryString?: string;
  }

  export class WocEasyRouter implements Woc.Router {

    private onErrCb: (err: any) => void;
    private onRejectCb: (err: any, query?: EasyRouter.Query) => void;
    private onUnknownRouteCb: (query: EasyRouter.Query) => void;
    private root: EasyRouter.Router;
    private started = false;

    constructor(private sc: Woc.ServiceContext) {
      var log = <Woc.Log>sc.getService('Woc.Log');
      this.onErrCb = function (err: any) {
        log.error(err);
      };
      this.onRejectCb = function (err: any, query?: EasyRouter.Query) {
        log.error('Error on route: "' + query.queryString + '"');
        log.error(err);
      };
      this.onUnknownRouteCb = function (query: EasyRouter.Query) {
        log.warn('Unknown route: "' + query.queryString + '"');
      };
      this.root = this.createRouter();
    }

    public getRoot(): EasyRouter.Router {
      return this.root;
    }

    public createRouter(): EasyRouter.Router {
      if (this.started)
        throw Error('WocEasyRouter is already started');
      return new EasyRouter.Router(this.onErrCb, this.onRejectCb, this.onUnknownRouteCb);
    }

    public start(config?: WocEasyRouterConfig): Promise<void> {
      if (this.started)
        throw Error('WocEasyRouter is already started');
      this.started = true;
      if (!config)
        config = {};
      return this.root.startRoot({
        baseUrl: this.sc.appConfig.baseUrl,
        hashMode: config['hashMode'] !== false,
        noHistory: config['noHistory'] ? true : false,
        firstQueryString: config['firstQueryString'] || this.sc.appConfig.firstRelUrl
      });
    }

    // --
    // -- EasyRouter.Router
    // --

    public map(activators: EasyRouter.RouteActivator[]): WocEasyRouter {
      this.root.map(activators);
      return this;
    }

    public mapUnknownRoutes(activator: EasyRouter.RouteActivator): WocEasyRouter {
      this.root.mapUnknownRoutes(activator);
      return this;
    }

    // --
    // -- Woc.Router
    // --

    public navigate(queryString: string): Promise<boolean> {
      if (!this.started)
        throw Error('WocEasyRouter is not started');
      return this.root.navigate(queryString);
    }

    public navigateToUnknown(): Promise<boolean> {
      if (!this.started)
        throw Error('WocEasyRouter is not started');
      return this.root.navigateToUnknown();
    }

    public navigateBack(level?: number): Promise<boolean> {
      if (!this.started)
        throw Error('WocEasyRouter is not started');
      return this.root.navigateBack(level);
    }

    public addCanLeaveListener(cb: () => any, onNavRm?: boolean): number {
      return this.root.addCanLeaveListener(cb, onNavRm);
    }

    public removeCanLeaveListener(handle: number): void {
      this.root.removeCanLeaveListener(handle);
    }

    public addLeaveListener(cb: () => void, onNavRm?: boolean): number {
      return this.root.addLeaveListener(cb, onNavRm);
    }

    public removeLeaveListener(handle: number): void {
      this.root.removeLeaveListener(handle);
    }
  }
}
