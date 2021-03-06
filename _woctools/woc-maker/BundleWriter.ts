/// <reference path='../lib/node.d.ts' />
/// <reference path='../lib/es6-promise.d.ts' />
'use strict';

import fs = require('fs');
import path = require("path");
import rsvp = require('es6-promise');
var Promise = rsvp.Promise;

import fsp = require('../lib/fsp');
import minifiers = require('./minifiers');
import Project = require('./Project');
import Common = require('./Common');

// ##
// ## BundleWriter
// ##

class BundleWriter {

  private bundleDirName: string;
  private bundlePath: string;
  private jsMinifier: minifiers.JsMinifier;
  private cssMinifier: minifiers.CssMinifier;
  private htmlMinifier: minifiers.HtmlMinifier;
  private bundleProp = {};
  private externalLibraries = {};
  private contextThings;
  private hasBundleCss = false;
  private bundleCssChannels = {};
  private thingCssList: string[] = [];
  private otherFiles = {};

  constructor(private project: Project, private bundleName: string, bundleVersion: string) {
    this.bundleDirName = bundleName + (bundleVersion ? '-' + bundleVersion : '');
    this.bundlePath = this.project.makeOutputFsPath(this.bundleDirName);
    this.jsMinifier = project.getJsMinifier();
    this.cssMinifier = project.getCssMinifier();
    this.htmlMinifier = project.getHtmlMinifier();
    this.contextThings = {};
    this.contextThings[Common.EmbedType.Service] = {};
    this.contextThings[Common.EmbedType.Initializer] = {};
    this.contextThings[Common.EmbedType.Component] = {};
  }

  public putBundleVal(key: string, val: any) {
    this.bundleProp[key] = val;
  }

  public addBundleTheme(css: {}[], priorityChannel: string, priorityLevel: number, themeName: string): Promise<void> {
    if (!css)
      return Promise.resolve<void>();
    this.hasBundleCss = true;
    var channel = this.bundleCssChannels[priorityChannel];
    if (!channel)
      channel = this.bundleCssChannels[priorityChannel] = {};
    var byLevelCss = channel[priorityLevel]
    if (!byLevelCss)
      byLevelCss = channel[priorityLevel] = [];
    // - Concat files
    return BundleWriter.concatFiles(themeName, css, this.cssMinifier, 'css').
      then((content: string): void => {
        byLevelCss.push(content);
      });
  }

  public addExternalLibrary(name: string, useExternalLibraries: string[], scripts: {}[], css: {}[]): Promise<void> {
    if (this.externalLibraries[name] !== undefined)
      throw Error('Conflict in bundle "' + this.bundleName + '": several externalLibraries "' + name + '"');
    var lib = {};
    if (useExternalLibraries !== null)
      lib['useExternalLibraries'] = useExternalLibraries;
    var p = Promise.resolve<void>();
    if (scripts) {
      p = BundleWriter.concatFiles('ExternalLibrary ' + name, scripts, this.jsMinifier, 'js').then((content: string): void => {
        lib['js'] = content;
      });
    }
    if (css !== null) {
      if (css.length > 0) {
        p = p.then(() => {
          return BundleWriter.concatFiles('ExternalLibrary ' + name, css, this.cssMinifier, 'css').then((content: string): void => {
            this.thingCssList.push(content);
          });
        });
      }
    }
    return p.then(() => {
      this.externalLibraries[name] = lib;
    });
  }

  public addContextThing(type: Common.EmbedType, name: string, useApp: boolean, useExternalLibraries: string[], useServices: string[],
                         useComponents: string[], scripts: {}[], css: {}[], tpl: {}[], contextPlugins: string[], alias: string[],
                         isContextPluginProvider: boolean): Promise<void> {
    if (this.contextThings[type][name] !== undefined)
      throw Error('Conflict in bundle "' + this.bundleName + '": several ' + Common.toPluralLabel(type) + ' "' + name + '"');
    var prop = {},
      pList = [];
    //return BundleWriter.concatFiles(title, scripts, this.jsMinifier, 'js').then((content: string): void => {
    if (useApp)
      prop['useApplication'] = true;
    if (useExternalLibraries !== null)
      prop['useExternalLibraries'] = useExternalLibraries;
    if (useServices !== null)
      prop['useServices'] = useServices;
    if (useComponents !== null)
      prop['useComponents'] = useComponents;
    if (contextPlugins)
      prop['contextPlugins'] = contextPlugins;
    if (alias)
      prop['alias'] = alias;
    if (isContextPluginProvider)
      prop['isContextPluginProvider'] = isContextPluginProvider;
    var title = Common.EmbedType[type] +  ' ' + name;
    pList.push(BundleWriter.concatFiles(title, scripts, this.jsMinifier, 'js').then((content: string): void => {
      prop['js'] = content;
    }));
    if (tpl !== null) {
      if (!contextPlugins)
        console.log('[Warning] ' + title + ' has templates without context plugins');
      pList.push(BundleWriter.concatFiles(title, tpl, this.htmlMinifier, 'html').then((content: string): void => {
        prop['templates'] = content;
      }));
    }
    if (css !== null) {
      if (css.length > 0) {
        pList.push(BundleWriter.concatFiles(title, css, this.cssMinifier, 'css').then((content: string): void => {
          this.thingCssList.push(content);
        }));
      }
    }
    return Promise.all(pList).then(() => {
      this.contextThings[type][name] = prop;
    });
  }

  public addOtherFileOrDir(fileName: string, relPath: string, fullPath: string, st: fs.Stats): void {
    if (this.otherFiles[fileName]) {
      if (!st.isDirectory() || !this.otherFiles[fileName]['stat'].isDirectory())
        throw Error('Conflict, several files "' + fileName + '", please rename one');
      if (!this.otherFiles[fileName]['merge'])
        this.otherFiles[fileName]['merge'] = [];
      this.otherFiles[fileName]['merge'].push({
        'relPath': relPath,
        'fullPath': fullPath,
        'stat': st
      });
    } else {
      this.otherFiles[fileName] = {
        'relPath': relPath,
        'fullPath': fullPath,
        'stat': st
      };
    }
  }

  public write(rmDestination: boolean): Promise<boolean> {
    return this.cleanOutputDir(rmDestination).then((ready: boolean): any => {
      if (!ready)
        return false;
      var p: Promise<any> = this.writeFile(this.bundleName + '.json', JSON.stringify(this.makeData()));
      if (this.hasCss()) {
        var cssArr = [];
        cssArr.push('@charset "' + this.project.getDefaultEncoding() + '";');
        Array.prototype.push.apply(cssArr, this.makeBundleCssBychannel('before'));
        Array.prototype.push.apply(cssArr, this.thingCssList);
        Array.prototype.push.apply(cssArr, this.makeBundleCssBychannel(''));
        Array.prototype.push.apply(cssArr, this.makeBundleCssBychannel('after'));
        var cssP = this.writeFile(this.bundleName + '.css',cssArr.join('\n'));
        p = Promise.all([p, cssP]);
      }
      return p.then(() => {
        return this.copyOtherFiles();
      }).then(() => {
        return true;
      });
    });
  }

  public static mustExcludeFromOtherFile(fileName: string): boolean {
    if (fileName === '.' || fileName === '..')
      return true;
    var ext: string;
    for (var type = 0; Common.EmbedType[type] !== undefined; ++type) {
      ext = Common.toWDir('', type);
      if (fileName.indexOf(ext, fileName.length - ext.length) !== -1)
        return true;
    }
    return false;
  }

  private makeBundleCssBychannel(channelName: string): string[] {
    var channel = this.bundleCssChannels[channelName];
    if (!channel)
      return [];
    var levels = [];
    for (var k in channel) {
      if (channel.hasOwnProperty(k))
        levels.push(k);
    }
    levels.sort();
    var arr = [];
    for (var i = 0, len = levels.length; i < len; ++i)
      Array.prototype.push.apply(arr, channel[levels[i]]);
    return arr;
  }

  private cleanOutputDir(rmDestination: boolean): Promise<boolean> {
    return fsp.exists(this.bundlePath).then((b): any => {
      var p: Promise<any>;
      if (b) {
        if (!rmDestination) {
          console.log('[Warning] The bundle directory already exists: ' + this.bundleName + ' (skip)');
          return false;
        }
        p = this.project.clearOutputDir(this.bundleDirName);
      } else
        p = fsp.mkdir(this.bundlePath);
      return p.then(() => {
        return true;
      });
    });
  }

  private hasCss(): boolean {
    return this.hasBundleCss || this.thingCssList.length > 0;
  }

  private makeData() {
    var data = {
      'woc': this.project.getWocVersion(),
      'encoding': this.project.getOutputEncoding()
    };
    for (var k in this.bundleProp) {
      if (this.bundleProp.hasOwnProperty(k) && this.bundleProp[k])
        data[k] = this.bundleProp[k];
    }
    if (!Project.isEmpty(this.externalLibraries))
      data['externalLibraries'] = this.externalLibraries;
    if (!Project.isEmpty(this.contextThings[Common.EmbedType.Service]))
      data['services'] = this.contextThings[Common.EmbedType.Service];
    if (!Project.isEmpty(this.contextThings[Common.EmbedType.Initializer]))
      data['initializers'] = this.contextThings[Common.EmbedType.Initializer];
    if (!Project.isEmpty(this.contextThings[Common.EmbedType.Component]))
      data['components'] = this.contextThings[Common.EmbedType.Component];
    if (this.hasCss())
      data['css'] = true;
    return data;
  }

  private writeFile(fileName: string, data: string): Promise<void> {
    return this.project.writeOutputFile(path.join(this.bundleDirName, fileName), data);
  }

  private copyOtherFiles(): Promise<void> {
    var makeP = (inputRelPath, inputFullPath, st: fs.Stats, outputRelPath, outputFullPath, dirMerge): Promise<void> => {
      return fsp.exists(outputFullPath).then((b): any => {
        if (b)
          throw Error('Name conflict: cannot overwrite file "' + outputRelPath + '" with other file "' + inputRelPath + '"');
        if (st.isDirectory())
          return this.copyOtherDir(inputRelPath, inputFullPath, outputFullPath, this.project, dirMerge);
        else
          return fsp.ext.copyFile(inputFullPath, outputFullPath);
      });
    };
    var allP: Promise<void>[] = [];
    for (var fileName in this.otherFiles) {
      if (!this.otherFiles.hasOwnProperty(fileName))
        continue;
      allP.push(makeP(
        this.otherFiles[fileName]['relPath'],
        this.otherFiles[fileName]['fullPath'],
        this.otherFiles[fileName]['stat'],
        path.join(this.bundleDirName, fileName),
        path.join(this.bundlePath, fileName),
        this.otherFiles[fileName]['merge']
      ));
    }
    return <any>Promise.all(allP);
  }

  private copyOtherDir(inputRelPath, inputDirPath: string, outputDirPath: string, project: Project, dirMerge): Promise<boolean> {
    var makeCb = (prop) => {
      return () => this.copyOrMergeOtherDir(prop['relPath'], prop['fullPath'], outputDirPath, project);
    };
    var p = this.copyOrMergeOtherDir(inputRelPath, inputDirPath, outputDirPath, project);
    if (dirMerge) {
      for (var i = 0, len = dirMerge.length; i < len; ++i)
        p = p.then(makeCb(dirMerge[i]));
    }
    return p;
  }

  private copyOrMergeOtherDir(inputRelPath, inputDirPath: string, outputDirPath: string, project: Project): Promise<boolean> {
    var copyChildren = () => {
      return fsp.readdir(inputDirPath).then((list: string[]) => {
        var inRelChildPath, inChildPath, outChildPath, allP: Promise<any>[] = [];
        for(var i = 0; i < list.length; i++) {
          if (BundleWriter.mustExcludeFromOtherFile(list[i]))
            continue;
          inRelChildPath = path.join(inputRelPath, list[i]);
          inChildPath = path.join(inputDirPath, list[i]);
          outChildPath = path.join(outputDirPath, list[i]);
          allP.push(fsp.stat(inChildPath).then<boolean>(makeStatCb(inRelChildPath, inChildPath, outChildPath, list[i])));
        }
        return Promise.all(allP);
      });
    };
    var makeStatCb = (inRelChildPath, inChildPath, outChildPath, childName) => {
      return (st: fs.Stats): any => {
        if (st.isDirectory())
          return this.copyOrMergeOtherDir(inRelChildPath, inChildPath, outChildPath, project);
        else if (project.canIncludeOtherFile(childName))
          return fsp.ext.copyFile(inChildPath, outChildPath);
      };
    };
    return this.otherDirContainsSomething(inputRelPath, inputDirPath, project).then((b): any => {
      if (!b)
        return false;
      fsp.mkdir(outputDirPath).then(copyChildren, copyChildren).then(() => {
        return true;
      });
    });
  }

  private otherDirContainsSomething(inputRelPath, inputDirPath: string, project: Project): Promise<boolean> {
    return fsp.readdir(inputDirPath).then((list: string[]) => {
      return list.reduce((sequence: Promise<boolean>, childName: string) => {
        if (BundleWriter.mustExcludeFromOtherFile(childName))
          return sequence;
        return sequence.then((hasSomeThing: boolean): any => {
          if (hasSomeThing)
            return true;
          var inRelChildPath = path.join(inputRelPath, childName);
          var inChildPath = path.join(inputDirPath, childName);
          return fsp.stat(inChildPath).then<boolean>((st: fs.Stats): any => {
            if (st.isDirectory())
              return this.otherDirContainsSomething(inRelChildPath, inChildPath, project);
            else
              return project.canIncludeOtherFile(childName);
          });
        });
      }, Promise.resolve(false));
    });
  }

  private static concatFiles(title: string, files: {}[], minifier: minifiers.StringMinifier, syntax: string): Promise<string> {
    var arr = [];
    return files.map((fileProp: {}, index: number) => {
      var p: Promise<string>;
      if (fileProp['minified'])
        p = fileProp['contentPromise'];
      else
        p = fileProp['contentPromise'].then((content: string) => {
          return minifier.minify(content, fileProp['path']);
        });
      if (syntax === 'css') {
        p = p.then((content: string) => {
          content = BundleWriter.cleanCssMeta(content);
          if (index > 0)
            return content;
          return BundleWriter.makeFilePrefix(index === 0 ? title : title + ' - ' + fileProp['name'], syntax) + '\n' + content;
        });
      }
      return p;
    }).reduce((sequence: Promise<any>, filePromise: Promise<string>) => {
      return sequence.then(() => {
        return filePromise;
      }).then((content: string) => {
        arr.push(content);
      });
    }, Promise.resolve()).then(() => {
      return arr.join('\n');
    });
  }

  private static cleanCssMeta(s: string): string {
    return s.replace(/@charset\s+"[a-zA-Z0-9\-]+"\s*;?\s*/, '');
  }

  private static makeFilePrefix(title: string, syntax: string): string {
    switch (syntax) {
      case 'js':
        return '// == ' + title + ' ==';
      case 'css':
        return '/*! == ' + title + ' == */';
      default:
        return '';
    }
  }
}

export = BundleWriter;
