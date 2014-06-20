/// <reference path='../../wot.d.ts' />
/// <reference path='../jquery.d.ts' />

module wotsingle {
	'use strict';

	export class Button implements wot.Component {

		private withAjax: boolean;
		private manualDisabled: boolean = false;
		private autoDisableMode: boolean;
		private autoDisabled: boolean = false;
		private $btn: JQuery;
		private $ajaxFlag: JQuery;

		// --
		// -- Component
		// --

		constructor(private cc: wot.ComponentContext, props: {}) {
			this.withAjax = props['ajax'] ? true : false;
			this.autoDisableMode = this.withAjax || (props['autoDisable'] ? true : false);
			if (this.withAjax) {
				this.$btn = $(cc.getTemplate('.ajax-btn'));
				this.$ajaxFlag = $('<img class="ajax-flag" alt="">');
				this.$ajaxFlag.attr('src', cc.getComponentBaseUrl() + '/ajax-loader.gif');
				this.$ajaxFlag.hide();
				this.$ajaxFlag.appendTo(this.$btn);
			} else
				this.$btn = $(cc.getTemplate('.simple-btn'));
			if (props['cssClass'])
				this.$btn.addClass(props['cssClass']);
			if (props['label'] !== undefined)
				this.setLabel(props['label']);
		}

		public getElement(): HTMLElement {
			return this.$btn[0];
		}

		public show(): Button {
			this.$btn.show();
			return this;
		}

		public hide(): Button {
			this.$btn.hide();
			return this;
		}

		public setEnabled(b: boolean): Button {
			this.manualDisabled = !b;
			if (!this.autoDisabled)
				this.$btn.prop('disabled', this.manualDisabled);
			return this;
		}

		public destruct(removeFromDOM: boolean) {
			if (removeFromDOM)
				this.$btn.remove();
		}

		// --
		// -- Public
		// --

		public setSelected(b: boolean) {
			if (b)
				this.$btn.addClass('btn-cur');
			else
				this.$btn.removeClass('btn-cur');
		}

		public click(cb: Function = null): Button {
			if (cb === null) {
				this.$btn.click();
				return this;
			}
			var that = this;
			this.$btn.click(function (e) {
				try {
					if (that.autoDisableMode) {
						that.autoDisabled = true;
						that.$btn.prop('disabled', true);
					}
					if (that.withAjax)
						that.$ajaxFlag.show();
					cb(e);
				} catch (err) {
					that.cc.getService('wot.Log').unexpectedErr(err);
				}
			});
			return this;
		}

		public setLabel(text: string): Button {
			if (this.withAjax)
				this.$btn.find('.lbl').text(text);
			else
				this.$btn.text(text);
			return this;
		}

		public reset(): Button {
			this.autoDisabled = false;
			if (this.withAjax)
				this.$ajaxFlag.hide();
			if (!this.manualDisabled)
				this.$btn.prop('disabled', false);
			return this;
		}
	}
}