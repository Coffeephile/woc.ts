/// <reference path='../Todos.d.ts' />

module Todos {
  'use strict';

  export class CreateTask implements Woc.Component {
    private model: Todos.Model;
    private refreshCb: () => void;
    private task: ModelTask;
    private tplData;

    constructor(private cc: Woc.VueComponentContext, props: {}) {
      this.model = cc.getService<Todos.Model>('Todos.Model');
      this.refreshCb = props['refreshCb'];
      this.task = this.model.newTask();
    }

    public attachTo(el: HTMLElement): void {
      this.tplData = {
        title: this.task.title
      };
      this.cc.bindTemplate({
        el: el,
        wocTemplate: 'CreateTask',
        data: this.tplData,
        methods: {
          addCb: (e) => {
            e.preventDefault();
            this.cc.logWrap(() => this.add());
          }
        }
      });
    }

    public destruct() {
      console.log('CreateTask: DESTRUCT ' + (this.task ? '' + this.task.id : 'NULL'));
    }

    private add() {
      this.task.title = this.tplData.title;
      this.model.addTask(this.task);
      this.task = this.model.newTask();
      this.tplData.title = this.task.title;
      this.refreshCb();
    }
  }
}