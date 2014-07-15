declare module woc {

	// ##
	// ## Contexts
	// ##

	interface BundleMain {
		start(element): void;
	}

	interface Component {
		compose?(...props): Component;
		setData?(...data): Component;
		getElement?(): HTMLElement;
		reset?(): Component;
		show?(): Component;
		hide?(): Component;
		setEnabled?(b: boolean): Component;
		destruct?(removeFromDOM: boolean): void;
	}

	interface LiveState {
		isLive(): boolean;
		addLiveListener(cb: (live: boolean) => void): void;
	}

	interface Dialog {
		getDialogElement(): any;
		setDialogOpened(): void;
		setDialogClosed(): void;
	}

	/**
	 * The services that implement this interface can be declared as an alias of woc.Dialogs
	 */
	interface Dialogs {
		/**
		 * @param dialog woc.Dialog
		 * @param forcedOpen boolean
		 * @param hideBelow boolean
		 * @returns {number} The dialog ID
		 */
		addDialog(dialog: Dialog, forcedOpen?, hideBelow?): number;
		openDialog(dialogId: number): void;
		closeDialog(dialogId: number): boolean;
		removeDialog(dialogId: number): void;
		/**
		 *
		 * @param dialogElem
		 * @param setClosedCallback
		 * @param forcedOpen boolean
		 * @param hideBelow boolean
		 * @returns Function A callback for closing the dialog (the callback returns TRUE when dialog is closed, FALSE when the dialog remains)
		 */
		openDisposableDialog(dialogElem, setClosedCallback?: Function, forcedOpen?, hideBelow?): Function;
		clearDialogs(): boolean;
		showInfo(msgHtml: string): void;
		showWarning(msgHtml: string): void;
		reportError(e): void;
		/**
		 * @param msgHtml
		 * @param buttonList [{'label': string, 'callback': Function, 'ajax'?: boolean}]
		 */
		showConfirm(msgHtml: string, buttonList: any[]): void;
	}

	interface ApplicationContext {
		properties: {};
		isDebug(): boolean;
		getService(serviceName): any;
		createComponent(componentName: string, props: {}, st: LiveState): any;
		removeComponent(c: Component, fromDOM?: boolean): void;
		removeComponent(cList: Component[], fromDOM?: boolean): void;
		getServiceContext(serviceName: string): ServiceContext;
		getComponentTypeContext(componentName: string): ComponentTypeContext;
		/**
		 * Available options:
		 * <pre>{
		 * 	'autoLoadCss': boolean,
		 * 	'version': string,
		 * 	'w': boolean,
		 * 	'start': -DOM-element-,
		 * 	'done': Function,
		 * 	'fail': Function
		 * }</pre>
		 * @param bundlePath
		 * @param opt
		 */
		loadBundle(bundlePath: string, opt?: {}): void;
		hasLib(libName): boolean;
		includeLib(libName): boolean;
		requireLib(libName: any): void;
		requireService(serviceName: string): void;
		requireComponent(componentName: string): void;
		getDebugTree(): {};
	}

	interface ServiceContext {
		getApplicationContext(): ApplicationContext;
		getServiceName(): string;
		getServiceBaseUrl(): string;
		getOwnService(): any;
		getService(serviceName): any;
		createComponent(componentName: string, props: {}, st: LiveState): any;
		removeComponent(c: Component, fromDOM?: boolean): void;
		removeComponent(cList: Component[], fromDOM?: boolean): void;
		hasLib(libName): boolean;
		includeLib(libName): boolean;
		requireLib(libName): void;
		requireService(serviceName): void;
		requireComponent(componentName): void;
	}

	interface ComponentContext {
		getApplicationContext(): ApplicationContext;
		getLiveState(): LiveState;
		getComponentName(): string;
		getComponentBaseUrl(): string;
		getTemplate(sel: string, elMap?: {}): HTMLElement;
		createOwnComponent(props?: {}, st?: LiveState): any;
		createComponent(componentName: string, props?: {}, st?: LiveState): any;
		removeComponent(c: Component, fromDOM?: boolean): void;
		removeComponent(cList: Component[], fromDOM?: boolean): void;
		removeOwnComponent(fromDOM?: boolean): void;
		getService(serviceName): any;
		hasLib(libName): boolean;
		includeLib(libName): boolean;
		requireLib(libName): void;
		requireService(serviceName): void;
		requireComponent(componentName): void;
	}

	interface ComponentTypeContext {
		getComponentName(): string;
		getComponentBaseUrl(): string;
		getTemplate(sel: string, elMap?: {}): HTMLElement;
		createOwnComponent(props: {}, st: LiveState): any;
	}

	// ##
	// ## Ajax service
	// ##
	
	interface Ajax {
		addListener(cb: Function): void;
		/**
		* <pre><code>opt = {
		*	 'get'?: {
		*		 'baseUrl'?: string,
		*		 'rDataType'?: 'json|script|css|text|detect',
		*		 'attempts'?: integer // on XHR fail or malformed received JSON
		*	 },
		*	 'post'?: {
		*		 'url'?: string,
		*		 'rDataType'?: 'json|script|css|text|detect',
		*		 'sAsJson'?: string, // contains the parameter name
		*		 'attempts'?: integer // on XHR fail or HTTP 400 or malformed received JSON
		*	 }
		* }</code></pre>
		*/
		createCustom(opt: any): CustomAjax;
		/**
		* <pre><code>opt = {
		*	 'method': 'GET|POST|PUT|DELETE',
		*	 'url': string,
		*	 'sData'?: {},
		*	 'done'?: Function,
		*	 'fail'?: Function,
		*	 'rDataType'?: 'json|script|css|text|detect', [default: 'json']
		*	 'sAsJson'?: string, // contains the parameter name
		*	 'attempts'?: integer [default: 1] // on XHR fail or malformed received JSON
		* }</code></pre>
		*/
		ajax(opt: any): void;
		/**
		* <pre><code>opt = {
		*	 'url': string,
		*	 'sData'?: {},
		*	 'done'?: Function,
		*	 'fail'?: Function,
		*	 'rDataType'?: 'json|script|css|text|detect', [default: 'json']
		*	 'attempts'?: integer [default: 1] // on XHR fail or malformed received JSON
		* }</code></pre>
		*/
		get(opt: any): void;
		/**
		* <pre><code>bundleOpt = {
		*	 'urls': [opt],
		*	 'done'?: Function,
		*	 'fail'?: Function
		* }</code></pre>
		*/
		bundleAjax(bundleOpt: any): void;
		/**
		* <pre><code>opt = {
		*	 'url': string,
		*	 'sData'?: {},
		*	 'done'?: Function,
		*	 'fail'?: Function,
		*	 'rDataType'?: 'json|script|css|text|detect', [default: 'json']
		*	 'sAsJson'?: string, // contains the parameter name
		*	 'attempts'?: integer [default: 1] // on XHR fail or HTTP 400 or malformed received JSON
		* }</code></pre>
		*/
		post(opt: any): void;
		/**
		* <pre><code>opt = {
		*	 'url': string,
		*	 'sData'?: {},
		*	 'sFiles': {}[],
		*	 'done'?: Function,
		*	 'fail'?: Function,
		*	 'rDataType'?: 'json|script|css|text|detect', [default: 'json']
		*	 'sAsJson'?: string, // contains the parameter name
		*	 'attempts'?: integer [default: 1] // on XHR fail or HTTP 400 or malformed received JSON
		* }</code></pre>
		*/
		upload(opt: any): void;
	}
	
	interface CustomAjax {
		/**
		* <pre><code>defaultOpt = {
		*	 'get'?: {
		*		 'baseUrl'?: string,
		*		 'rDataType'?: 'json|script|text|detect',
		*		 'attempts'?: integer // on XHR fail or malformed received JSON
		*	 },
		*	 'post'?: {
		*		 'url'?: string,
		*		 'rDataType'?: 'json|script|text|detect',
		*		 'sAsJson'?: string, // contains the parameter name
		*		 'attempts'?: integer // on XHR fail or HTTP 400 or malformed received JSON
		*	 }
		* }</code></pre>
		*/
		ajax(opt: any): void;
		get(opt: any): void;
		/**
		* <pre><code>bundleOpt = {
		*	 'urls': [opt],
		*	 'done'?: Function,
		*	 'fail'?: Function
		* }</code></pre>
		*/
		bundleAjax(bundleOpt: any): void;
		post(opt: any): void;
		upload(opt: any): void;
	}

	// ##
	// ## Log service
	// ##
	
	interface Log {
		/**
		*
		* @param cb This function must return TRUE if the message is successfully logged
		*/
		addListener(cb: Function): void;
		error(msg: string, stack?: any): void;
		info(msg: any): void;
		warning(msg: any): void;
		trace(msg: string): void;
		unexpectedErr(err: any): void;
	}

	// ##
	// ## Router service
	// ##

	interface UrlProps {
		relUrl: string;
		args: {string: string};
		sel: string;
		title?: string;
	}

	interface UrlController {
		fillUrlProps(props: UrlProps): boolean;
	}

	interface Router {
		/**
		* @param selList
		* @param urlController
		* @returns Function A callback that deletes the added selectors
		*/
		addSelectors(selList: string[], urlController: UrlController): Function;
		start(opt?: {}): void;
		/**
		* @param cb The listener
		* @returns Function a callback for removing the listener
		*/
		addChangeListener(cb: Function): Function;
		/**
		* @param cb The listener
		* @returns Function a callback for removing the listener
		*/
		addBeforeListener(cb: Function): Function;
		goTo(relUrl: string): boolean;
		getCurrentUrlProps(): UrlProps;
	}
}

// Type definitions for es6-promise
// Project: https://github.com/jakearchibald/ES6-Promise
// Definitions by: François de Campredon <https://github.com/fdecampredon/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

interface Thenable<R> {
	then<U>(onFulfilled?: (value: R) => Thenable<U>,  onRejected?: (error: any) => Thenable<U>): Thenable<U>;
	then<U>(onFulfilled?: (value: R) => Thenable<U>, onRejected?: (error: any) => U): Thenable<U>;
	then<U>(onFulfilled?: (value: R) => Thenable<U>, onRejected?: (error: any) => void): Thenable<U>;
	then<U>(onFulfilled?: (value: R) => U, onRejected?: (error: any) => Thenable<U>): Thenable<U>;
	then<U>(onFulfilled?: (value: R) => U, onRejected?: (error: any) => U): Thenable<U>;
	then<U>(onFulfilled?: (value: R) => U, onRejected?: (error: any) => void): Thenable<U>;
}

declare class Promise<R> implements Thenable<R> {
	/**
	 * If you call resolve in the body of the callback passed to the constructor,
	 * your promise is fulfilled with result object passed to resolve.
	 * If you call reject your promise is rejected with the object passed to resolve.
	 * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
	 * Any errors thrown in the constructor callback will be implicitly passed to reject().
	 */
	constructor(callback: (resolve : (result?: R) => void, reject: (error: any) => void) => void);
	/**
	 * If you call resolve in the body of the callback passed to the constructor,
	 * your promise will be fulfilled/rejected with the outcome of thenable passed to resolve.
	 * If you call reject your promise is rejected with the object passed to resolve.
	 * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
	 * Any errors thrown in the constructor callback will be implicitly passed to reject().
	 */
	constructor(callback: (resolve : (thenable?: Thenable<R>) => void, reject: (error: any) => void) => void);

	/**
	 * onFulfilled is called when/if "promise" resolves. onRejected is called when/if "promise" rejects.
	 * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called.
	 * Both callbacks have a single parameter , the fulfillment value or rejection reason.
	 * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after being passed through Promise.resolve.
	 * If an error is thrown in the callback, the returned promise rejects with that error.
	 *
	 * @param onFulfilled called when/if "promise" resolves
	 * @param onRejected called when/if "promise" rejects
	 */
	then<U>(onFulfilled?: (value: R) => Thenable<U>,  onRejected?: (error: any) => Thenable<U>): Promise<U>;
	/**
	 * onFulfilled is called when/if "promise" resolves. onRejected is called when/if "promise" rejects.
	 * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called.
	 * Both callbacks have a single parameter , the fulfillment value or rejection reason.
	 * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after being passed through Promise.resolve.
	 * If an error is thrown in the callback, the returned promise rejects with that error.
	 *
	 * @param onFulfilled called when/if "promise" resolves
	 * @param onRejected called when/if "promise" rejects
	 */
	then<U>(onFulfilled?: (value: R) => Thenable<U>, onRejected?: (error: any) => U): Promise<U>;
	/**
	 * onFulfilled is called when/if "promise" resolves. onRejected is called when/if "promise" rejects.
	 * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called.
	 * Both callbacks have a single parameter , the fulfillment value or rejection reason.
	 * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after being passed through Promise.resolve.
	 * If an error is thrown in the callback, the returned promise rejects with that error.
	 *
	 * @param onFulfilled called when/if "promise" resolves
	 * @param onRejected called when/if "promise" rejects
	 */
	then<U>(onFulfilled?: (value: R) => Thenable<U>,  onRejected?: (error: any) => void): Promise<U>;
	/**
	 * onFulfilled is called when/if "promise" resolves. onRejected is called when/if "promise" rejects.
	 * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called.
	 * Both callbacks have a single parameter , the fulfillment value or rejection reason.
	 * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after being passed through Promise.resolve.
	 * If an error is thrown in the callback, the returned promise rejects with that error.
	 *
	 * @param onFulfilled called when/if "promise" resolves
	 * @param onRejected called when/if "promise" rejects
	 */
	then<U>(onFulfilled?: (value: R) => U, onRejected?: (error: any) => Thenable<U>): Promise<U>;
	/**
	 * onFulfilled is called when/if "promise" resolves. onRejected is called when/if "promise" rejects.
	 * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called.
	 * Both callbacks have a single parameter , the fulfillment value or rejection reason.
	 * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after being passed through Promise.resolve.
	 * If an error is thrown in the callback, the returned promise rejects with that error.
	 *
	 * @param onFulfilled called when/if "promise" resolves
	 * @param onRejected called when/if "promise" rejects
	 */
	then<U>(onFulfilled?: (value: R) => U, onRejected?: (error: any) => U): Promise<U>;
	/**
	 * onFulfilled is called when/if "promise" resolves. onRejected is called when/if "promise" rejects.
	 * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called.
	 * Both callbacks have a single parameter , the fulfillment value or rejection reason.
	 * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after being passed through Promise.resolve.
	 * If an error is thrown in the callback, the returned promise rejects with that error.
	 *
	 * @param onFulfilled called when/if "promise" resolves
	 * @param onRejected called when/if "promise" rejects
	 */
	then<U>(onFulfilled?: (value: R) => U, onRejected?: (error: any) => void): Promise<U>;

	/**
	 * Sugar for promise.then(undefined, onRejected)
	 *
	 * @param onRejected called when/if "promise" rejects
	 */
	catch<U>(onRejected?: (error: any) => Thenable<U>): Promise<U>;
	/**
	 * Sugar for promise.then(undefined, onRejected)
	 *
	 * @param onRejected called when/if "promise" rejects
	 */
	catch<U>(onRejected?: (error: any) => U): Promise<U>;
	/**
	 * Sugar for promise.then(undefined, onRejected)
	 *
	 * @param onRejected called when/if "promise" rejects
	 */
	catch<U>(onRejected?: (error: any) => void): Promise<U>;
}

declare module Promise {
	/**
	 * Returns promise (only if promise.constructor == Promise)
	 */
	function cast<R>(promise: Promise<R>): Promise<R>;
	/**
	 * Make a promise that fulfills to obj.
	 */
	function cast<R>(object: R): Promise<R>;

	/**
	 * Make a new promise from the thenable.
	 * A thenable is promise-like in as far as it has a "then" method.
	 * This also creates a new promise if you pass it a genuine JavaScript promise, making it less efficient for casting than Promise.cast.
	 */
	function resolve<R>(thenable?: Thenable<R>): Promise<R>;
	/**
	 * Make a promise that fulfills to obj. Same as Promise.cast(obj) in this situation.
	 */
	function resolve<R>(object?: R): Promise<R>;

	/**
	 * Make a promise that rejects to obj. For consistency and debugging (eg stack traces), obj should be an instanceof Error
	 */
	function reject(error: any): Promise<any>;

	/**
	 * Make a promise that fulfills when every item in the array fulfills, and rejects if (and when) any item rejects.
	 * the array passed to all can be a mixture of promise-like objects and other objects.
	 * The fulfillment value is an array (in order) of fulfillment values. The rejection value is the first rejection value.
	 */
	function all<R>(promises: Promise<R>[]): Promise<R[]>;

	/**
	 * Make a Promise that fulfills when any item fulfills, and rejects if any item rejects.
	 */
	function race<R>(promises: Promise<R>[]): Promise<R>;
}

declare module 'es6-promise' {
	var foo: typeof Promise; // Temp variable to reference Promise in local context
	module rsvp {
		export var Promise: typeof foo;
	}
	export = rsvp;
}
