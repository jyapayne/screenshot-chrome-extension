(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.htmlToImage = {}));
})(this, (function (exports) { 'use strict';

  /******************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


  function __awaiter(thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  }

  function __generator(thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
      return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
              if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
              if (y = 0, t) op = [op[0] & 2, t.value];
              switch (op[0]) {
                  case 0: case 1: t = op; break;
                  case 4: _.label++; return { value: op[1], done: false };
                  case 5: _.label++; y = op[1]; op = [0]; continue;
                  case 7: op = _.ops.pop(); _.trys.pop(); continue;
                  default:
                      if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                      if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                      if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                      if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                      if (t[2]) _.ops.pop();
                      _.trys.pop(); continue;
              }
              op = body.call(thisArg, _);
          } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
          if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
  }

  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
      var e = new Error(message);
      return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };

  function resolveUrl(url, baseUrl) {
      // url is absolute already
      if (url.match(/^[a-z]+:\/\//i)) {
          return url;
      }
      // url is absolute already, without protocol
      if (url.match(/^\/\//)) {
          return window.location.protocol + url;
      }
      // dataURI, mailto:, tel:, etc.
      if (url.match(/^[a-z]+:/i)) {
          return url;
      }
      var doc = document.implementation.createHTMLDocument();
      var base = doc.createElement('base');
      var a = doc.createElement('a');
      doc.head.appendChild(base);
      doc.body.appendChild(a);
      if (baseUrl) {
          base.href = baseUrl;
      }
      a.href = url;
      return a.href;
  }
  var uuid = (function () {
      // generate uuid for className of pseudo elements.
      // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
      var counter = 0;
      // ref: http://stackoverflow.com/a/6248722/2519373
      var random = function () {
          // eslint-disable-next-line no-bitwise
          return "0000".concat(((Math.random() * Math.pow(36, 4)) << 0).toString(36)).slice(-4);
      };
      return function () {
          counter += 1;
          return "u".concat(random()).concat(counter);
      };
  })();
  function toArray(arrayLike) {
      var arr = [];
      for (var i = 0, l = arrayLike.length; i < l; i++) {
          arr.push(arrayLike[i]);
      }
      return arr;
  }
  var styleProps = null;
  function getStyleProperties(options) {
      if (options === void 0) { options = {}; }
      if (styleProps) {
          return styleProps;
      }
      if (options.includeStyleProperties) {
          styleProps = options.includeStyleProperties;
          return styleProps;
      }
      styleProps = toArray(window.getComputedStyle(document.documentElement));
      return styleProps;
  }
  function px(node, styleProperty) {
      var win = node.ownerDocument.defaultView || window;
      var val = win.getComputedStyle(node).getPropertyValue(styleProperty);
      return val ? parseFloat(val.replace('px', '')) : 0;
  }
  function getNodeWidth(node) {
      var leftBorder = px(node, 'border-left-width');
      var rightBorder = px(node, 'border-right-width');
      return node.clientWidth + leftBorder + rightBorder;
  }
  function getNodeHeight(node) {
      var topBorder = px(node, 'border-top-width');
      var bottomBorder = px(node, 'border-bottom-width');
      return node.clientHeight + topBorder + bottomBorder;
  }
  function getImageSize(targetNode, options) {
      if (options === void 0) { options = {}; }
      var width = options.width || getNodeWidth(targetNode);
      var height = options.height || getNodeHeight(targetNode);
      return { width: width, height: height };
  }
  function getPixelRatio() {
      var ratio;
      var FINAL_PROCESS;
      try {
          FINAL_PROCESS = process;
      }
      catch (e) {
          // pass
      }
      var val = FINAL_PROCESS && FINAL_PROCESS.env
          ? FINAL_PROCESS.env.devicePixelRatio
          : null;
      if (val) {
          ratio = parseInt(val, 10);
          if (Number.isNaN(ratio)) {
              ratio = 1;
          }
      }
      return ratio || window.devicePixelRatio || 1;
  }
  // @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
  var canvasDimensionLimit = 16384;
  function checkCanvasDimensions(canvas) {
      if (canvas.width > canvasDimensionLimit ||
          canvas.height > canvasDimensionLimit) {
          if (canvas.width > canvasDimensionLimit &&
              canvas.height > canvasDimensionLimit) {
              if (canvas.width > canvas.height) {
                  canvas.height *= canvasDimensionLimit / canvas.width;
                  canvas.width = canvasDimensionLimit;
              }
              else {
                  canvas.width *= canvasDimensionLimit / canvas.height;
                  canvas.height = canvasDimensionLimit;
              }
          }
          else if (canvas.width > canvasDimensionLimit) {
              canvas.height *= canvasDimensionLimit / canvas.width;
              canvas.width = canvasDimensionLimit;
          }
          else {
              canvas.width *= canvasDimensionLimit / canvas.height;
              canvas.height = canvasDimensionLimit;
          }
      }
  }
  function canvasToBlob(canvas, options) {
      if (options === void 0) { options = {}; }
      if (canvas.toBlob) {
          return new Promise(function (resolve) {
              canvas.toBlob(resolve, options.type ? options.type : 'image/png', options.quality ? options.quality : 1);
          });
      }
      return new Promise(function (resolve) {
          var binaryString = window.atob(canvas
              .toDataURL(options.type ? options.type : undefined, options.quality ? options.quality : undefined)
              .split(',')[1]);
          var len = binaryString.length;
          var binaryArray = new Uint8Array(len);
          for (var i = 0; i < len; i += 1) {
              binaryArray[i] = binaryString.charCodeAt(i);
          }
          resolve(new Blob([binaryArray], {
              type: options.type ? options.type : 'image/png',
          }));
      });
  }
  function createImage(url) {
      return new Promise(function (resolve, reject) {
          var img = new Image();
          img.onload = function () {
              img.decode().then(function () {
                  requestAnimationFrame(function () { return resolve(img); });
              });
          };
          img.onerror = reject;
          img.crossOrigin = 'anonymous';
          img.decoding = 'async';
          img.src = url;
      });
  }
  function svgToDataURL(svg) {
      return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
              return [2 /*return*/, Promise.resolve()
                      .then(function () { return new XMLSerializer().serializeToString(svg); })
                      .then(encodeURIComponent)
                      .then(function (html) { return "data:image/svg+xml;charset=utf-8,".concat(html); })];
          });
      });
  }
  function nodeToDataURL(node, width, height) {
      return __awaiter(this, void 0, void 0, function () {
          var xmlns, svg, foreignObject;
          return __generator(this, function (_a) {
              xmlns = 'http://www.w3.org/2000/svg';
              svg = document.createElementNS(xmlns, 'svg');
              foreignObject = document.createElementNS(xmlns, 'foreignObject');
              svg.setAttribute('width', "".concat(width));
              svg.setAttribute('height', "".concat(height));
              svg.setAttribute('viewBox', "0 0 ".concat(width, " ").concat(height));
              foreignObject.setAttribute('width', '100%');
              foreignObject.setAttribute('height', '100%');
              foreignObject.setAttribute('x', '0');
              foreignObject.setAttribute('y', '0');
              foreignObject.setAttribute('externalResourcesRequired', 'true');
              svg.appendChild(foreignObject);
              foreignObject.appendChild(node);
              return [2 /*return*/, svgToDataURL(svg)];
          });
      });
  }
  var isInstanceOfElement = function (node, instance) {
      if (node instanceof instance)
          return true;
      var nodePrototype = Object.getPrototypeOf(node);
      if (nodePrototype === null)
          return false;
      return (nodePrototype.constructor.name === instance.name ||
          isInstanceOfElement(nodePrototype, instance));
  };

  function formatCSSText(style) {
      var content = style.getPropertyValue('content');
      return "".concat(style.cssText, " content: '").concat(content.replace(/'|"/g, ''), "';");
  }
  function formatCSSProperties(style, options) {
      return getStyleProperties(options)
          .map(function (name) {
          var value = style.getPropertyValue(name);
          var priority = style.getPropertyPriority(name);
          return "".concat(name, ": ").concat(value).concat(priority ? ' !important' : '', ";");
      })
          .join(' ');
  }
  function getPseudoElementStyle(className, pseudo, style, options) {
      var selector = ".".concat(className, ":").concat(pseudo);
      var cssText = style.cssText
          ? formatCSSText(style)
          : formatCSSProperties(style, options);
      return document.createTextNode("".concat(selector, "{").concat(cssText, "}"));
  }
  function clonePseudoElement(nativeNode, clonedNode, pseudo, options) {
      var style = window.getComputedStyle(nativeNode, pseudo);
      var content = style.getPropertyValue('content');
      if (content === '' || content === 'none') {
          return;
      }
      var className = uuid();
      try {
          clonedNode.className = "".concat(clonedNode.className, " ").concat(className);
      }
      catch (err) {
          return;
      }
      var styleElement = document.createElement('style');
      styleElement.appendChild(getPseudoElementStyle(className, pseudo, style, options));
      clonedNode.appendChild(styleElement);
  }
  function clonePseudoElements(nativeNode, clonedNode, options) {
      clonePseudoElement(nativeNode, clonedNode, ':before', options);
      clonePseudoElement(nativeNode, clonedNode, ':after', options);
  }

  var WOFF = 'application/font-woff';
  var JPEG = 'image/jpeg';
  var mimes = {
      woff: WOFF,
      woff2: WOFF,
      ttf: 'application/font-truetype',
      eot: 'application/vnd.ms-fontobject',
      png: 'image/png',
      jpg: JPEG,
      jpeg: JPEG,
      gif: 'image/gif',
      tiff: 'image/tiff',
      svg: 'image/svg+xml',
      webp: 'image/webp',
  };
  function getExtension(url) {
      var match = /\.([^./]*?)$/g.exec(url);
      return match ? match[1] : '';
  }
  function getMimeType(url) {
      var extension = getExtension(url).toLowerCase();
      return mimes[extension] || '';
  }

  function shouldLog$1(options, level) {
      var _a;
      var logLevel = (_a = options === null || options === void 0 ? void 0 : options.logLevel) !== null && _a !== void 0 ? _a : 'error';
      if (logLevel === 'silent')
          return false;
      if (logLevel === 'debug')
          return true;
      return level === 'error';
  }
  function logDebug$1(options) {
      var args = [];
      for (var _i = 1; _i < arguments.length; _i++) {
          args[_i - 1] = arguments[_i];
      }
      if (shouldLog$1(options, 'debug')) {
          // eslint-disable-next-line no-console
          console.debug.apply(console, args);
      }
  }
  function getContentFromDataUrl(dataURL) {
      return dataURL.split(/,/)[1];
  }
  function isDataUrl(url) {
      return url.search(/^(data:)/) !== -1;
  }
  function makeDataUrl(content, mimeType) {
      return "data:".concat(mimeType, ";base64,").concat(content);
  }
  function fetchAsDataURL(url, init, process) {
      return __awaiter(this, void 0, void 0, function () {
          var res, blob;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0: return [4 /*yield*/, fetch(url, init)];
                  case 1:
                      res = _a.sent();
                      if (res.status === 404) {
                          throw new Error("Resource \"".concat(res.url, "\" not found"));
                      }
                      return [4 /*yield*/, res.blob()];
                  case 2:
                      blob = _a.sent();
                      return [2 /*return*/, new Promise(function (resolve, reject) {
                              var reader = new FileReader();
                              reader.onerror = reject;
                              reader.onloadend = function () {
                                  try {
                                      resolve(process({ res: res, result: reader.result }));
                                  }
                                  catch (error) {
                                      reject(error);
                                  }
                              };
                              reader.readAsDataURL(blob);
                          })];
              }
          });
      });
  }
  var cache = {};
  function getCacheKey(url, contentType, includeQueryParams) {
      var key = url.replace(/\?.*/, '');
      if (includeQueryParams) {
          key = url;
      }
      // font resource
      if (/ttf|otf|eot|woff2?/i.test(key)) {
          key = key.replace(/.*\//, '');
      }
      return contentType ? "[".concat(contentType, "]").concat(key) : key;
  }
  function resourceToDataURL(resourceUrl, contentType, options) {
      return __awaiter(this, void 0, void 0, function () {
          var cacheKey, dataURL, content, error_1, msg;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0:
                      cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
                      if (cache[cacheKey] != null) {
                          return [2 /*return*/, cache[cacheKey]];
                      }
                      // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
                      if (options.cacheBust) {
                          // eslint-disable-next-line no-param-reassign
                          resourceUrl += (/\?/.test(resourceUrl) ? '&' : '?') + new Date().getTime();
                      }
                      _a.label = 1;
                  case 1:
                      _a.trys.push([1, 3, , 4]);
                      return [4 /*yield*/, fetchAsDataURL(resourceUrl, options.fetchRequestInit, function (_a) {
                              var res = _a.res, result = _a.result;
                              if (!contentType) {
                                  // eslint-disable-next-line no-param-reassign
                                  contentType = res.headers.get('Content-Type') || '';
                              }
                              return getContentFromDataUrl(result);
                          })];
                  case 2:
                      content = _a.sent();
                      dataURL = makeDataUrl(content, contentType);
                      return [3 /*break*/, 4];
                  case 3:
                      error_1 = _a.sent();
                      dataURL = options.imagePlaceholder || '';
                      msg = "Failed to fetch resource: ".concat(resourceUrl);
                      if (error_1) {
                          msg = typeof error_1 === 'string' ? error_1 : error_1.message;
                      }
                      if (msg) {
                          // Expected on many sites due to CORS; don't spam logs unless debugging.
                          logDebug$1(options, msg);
                      }
                      return [3 /*break*/, 4];
                  case 4:
                      cache[cacheKey] = dataURL;
                      return [2 /*return*/, dataURL];
              }
          });
      });
  }

  function cloneCanvasElement(canvas) {
      return __awaiter(this, void 0, void 0, function () {
          var dataURL;
          return __generator(this, function (_a) {
              dataURL = canvas.toDataURL();
              if (dataURL === 'data:,') {
                  return [2 /*return*/, canvas.cloneNode(false)];
              }
              return [2 /*return*/, createImage(dataURL)];
          });
      });
  }
  function cloneVideoElement(video, options) {
      return __awaiter(this, void 0, void 0, function () {
          var canvas, ctx, dataURL_1, poster, contentType, dataURL;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0:
                      if (video.currentSrc) {
                          canvas = document.createElement('canvas');
                          ctx = canvas.getContext('2d');
                          canvas.width = video.clientWidth;
                          canvas.height = video.clientHeight;
                          ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                          dataURL_1 = canvas.toDataURL();
                          return [2 /*return*/, createImage(dataURL_1)];
                      }
                      poster = video.poster;
                      contentType = getMimeType(poster);
                      return [4 /*yield*/, resourceToDataURL(poster, contentType, options)];
                  case 1:
                      dataURL = _a.sent();
                      return [2 /*return*/, createImage(dataURL)];
              }
          });
      });
  }
  function cloneIFrameElement(iframe, options) {
      var _a;
      return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_c) {
              switch (_c.label) {
                  case 0:
                      _c.trys.push([0, 3, , 4]);
                      if (!((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) return [3 /*break*/, 2];
                      return [4 /*yield*/, cloneNode(iframe.contentDocument.body, options, true)];
                  case 1: return [2 /*return*/, (_c.sent())];
                  case 2: return [3 /*break*/, 4];
                  case 3:
                      _c.sent();
                      return [3 /*break*/, 4];
                  case 4: return [2 /*return*/, iframe.cloneNode(false)];
              }
          });
      });
  }
  function cloneSingleNode(node, options) {
      return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
              if (isInstanceOfElement(node, HTMLCanvasElement)) {
                  return [2 /*return*/, cloneCanvasElement(node)];
              }
              if (isInstanceOfElement(node, HTMLVideoElement)) {
                  return [2 /*return*/, cloneVideoElement(node, options)];
              }
              if (isInstanceOfElement(node, HTMLIFrameElement)) {
                  return [2 /*return*/, cloneIFrameElement(node, options)];
              }
              return [2 /*return*/, node.cloneNode(isSVGElement(node))];
          });
      });
  }
  var isSlotElement = function (node) {
      return node.tagName != null && node.tagName.toUpperCase() === 'SLOT';
  };
  var isSVGElement = function (node) {
      return node.tagName != null && node.tagName.toUpperCase() === 'SVG';
  };
  function cloneChildren(nativeNode, clonedNode, options) {
      var _a, _b;
      return __awaiter(this, void 0, void 0, function () {
          var children;
          return __generator(this, function (_c) {
              switch (_c.label) {
                  case 0:
                      if (isSVGElement(clonedNode)) {
                          return [2 /*return*/, clonedNode];
                      }
                      children = [];
                      if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
                          children = toArray(nativeNode.assignedNodes());
                      }
                      else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) &&
                          ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
                          children = toArray(nativeNode.contentDocument.body.childNodes);
                      }
                      else {
                          children = toArray(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
                      }
                      if (children.length === 0 ||
                          isInstanceOfElement(nativeNode, HTMLVideoElement)) {
                          return [2 /*return*/, clonedNode];
                      }
                      return [4 /*yield*/, children.reduce(function (deferred, child) {
                              return deferred
                                  .then(function () { return cloneNode(child, options); })
                                  .then(function (clonedChild) {
                                  if (clonedChild) {
                                      clonedNode.appendChild(clonedChild);
                                  }
                              });
                          }, Promise.resolve())];
                  case 1:
                      _c.sent();
                      return [2 /*return*/, clonedNode];
              }
          });
      });
  }
  function cloneCSSStyle(nativeNode, clonedNode, options) {
      var targetStyle = clonedNode.style;
      if (!targetStyle) {
          return;
      }
      var sourceStyle = window.getComputedStyle(nativeNode);
      if (sourceStyle.cssText) {
          targetStyle.cssText = sourceStyle.cssText;
          targetStyle.transformOrigin = sourceStyle.transformOrigin;
      }
      else {
          getStyleProperties(options).forEach(function (name) {
              var value = sourceStyle.getPropertyValue(name);
              if (isInstanceOfElement(nativeNode, HTMLIFrameElement) &&
                  name === 'display' &&
                  value === 'inline') {
                  value = 'block';
              }
              if (name === 'd' && clonedNode.getAttribute('d')) {
                  value = "path(".concat(clonedNode.getAttribute('d'), ")");
              }
              targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
          });
      }
  }
  function cloneInputValue(nativeNode, clonedNode) {
      if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
          clonedNode.innerHTML = nativeNode.value;
      }
      if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
          clonedNode.setAttribute('value', nativeNode.value);
      }
  }
  function cloneSelectValue(nativeNode, clonedNode) {
      if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
          var clonedSelect = clonedNode;
          var selectedOption = Array.from(clonedSelect.children).find(function (child) { return nativeNode.value === child.getAttribute('value'); });
          if (selectedOption) {
              selectedOption.setAttribute('selected', '');
          }
      }
  }
  function decorate(nativeNode, clonedNode, options) {
      if (isInstanceOfElement(clonedNode, Element)) {
          cloneCSSStyle(nativeNode, clonedNode, options);
          clonePseudoElements(nativeNode, clonedNode, options);
          cloneInputValue(nativeNode, clonedNode);
          cloneSelectValue(nativeNode, clonedNode);
      }
      return clonedNode;
  }
  function ensureSVGSymbols(clone, options) {
      return __awaiter(this, void 0, void 0, function () {
          var uses, processedDefs, i, use, id, exist, definition, _a, _b, nodes, ns, svg, defs, i;
          return __generator(this, function (_c) {
              switch (_c.label) {
                  case 0:
                      uses = clone.querySelectorAll ? clone.querySelectorAll('use') : [];
                      if (uses.length === 0) {
                          return [2 /*return*/, clone];
                      }
                      processedDefs = {};
                      i = 0;
                      _c.label = 1;
                  case 1:
                      if (!(i < uses.length)) return [3 /*break*/, 4];
                      use = uses[i];
                      id = use.getAttribute('xlink:href');
                      if (!id) return [3 /*break*/, 3];
                      exist = clone.querySelector(id);
                      definition = document.querySelector(id);
                      if (!(!exist && definition && !processedDefs[id])) return [3 /*break*/, 3];
                      // eslint-disable-next-line no-await-in-loop
                      _a = processedDefs;
                      _b = id;
                      return [4 /*yield*/, cloneNode(definition, options, true)];
                  case 2:
                      // eslint-disable-next-line no-await-in-loop
                      _a[_b] = (_c.sent());
                      _c.label = 3;
                  case 3:
                      i++;
                      return [3 /*break*/, 1];
                  case 4:
                      nodes = Object.values(processedDefs);
                      if (nodes.length) {
                          ns = 'http://www.w3.org/1999/xhtml';
                          svg = document.createElementNS(ns, 'svg');
                          svg.setAttribute('xmlns', ns);
                          svg.style.position = 'absolute';
                          svg.style.width = '0';
                          svg.style.height = '0';
                          svg.style.overflow = 'hidden';
                          svg.style.display = 'none';
                          defs = document.createElementNS(ns, 'defs');
                          svg.appendChild(defs);
                          for (i = 0; i < nodes.length; i++) {
                              defs.appendChild(nodes[i]);
                          }
                          clone.appendChild(svg);
                      }
                      return [2 /*return*/, clone];
              }
          });
      });
  }
  function cloneNode(node, options, isRoot) {
      return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
              if (!isRoot && options.filter && !options.filter(node)) {
                  return [2 /*return*/, null];
              }
              return [2 /*return*/, Promise.resolve(node)
                      .then(function (clonedNode) { return cloneSingleNode(clonedNode, options); })
                      .then(function (clonedNode) { return cloneChildren(node, clonedNode, options); })
                      .then(function (clonedNode) { return decorate(node, clonedNode, options); })
                      .then(function (clonedNode) { return ensureSVGSymbols(clonedNode, options); })];
          });
      });
  }

  var URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
  var URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
  var FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
  function toRegex(url) {
      // eslint-disable-next-line no-useless-escape
      var escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
      return new RegExp("(url\\(['\"]?)(".concat(escaped, ")(['\"]?\\))"), 'g');
  }
  function parseURLs(cssText) {
      var urls = [];
      cssText.replace(URL_REGEX, function (raw, quotation, url) {
          urls.push(url);
          return raw;
      });
      return urls.filter(function (url) { return !isDataUrl(url); });
  }
  function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
      return __awaiter(this, void 0, void 0, function () {
          var resolvedURL, contentType, dataURL, content;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0:
                      _a.trys.push([0, 5, , 6]);
                      resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
                      contentType = getMimeType(resourceURL);
                      dataURL = void 0;
                      if (!getContentFromUrl) return [3 /*break*/, 2];
                      return [4 /*yield*/, getContentFromUrl(resolvedURL)];
                  case 1:
                      content = _a.sent();
                      dataURL = makeDataUrl(content, contentType);
                      return [3 /*break*/, 4];
                  case 2: return [4 /*yield*/, resourceToDataURL(resolvedURL, contentType, options)];
                  case 3:
                      dataURL = _a.sent();
                      _a.label = 4;
                  case 4: return [2 /*return*/, cssText.replace(toRegex(resourceURL), "$1".concat(dataURL, "$3"))];
                  case 5:
                      _a.sent();
                      return [3 /*break*/, 6];
                  case 6: return [2 /*return*/, cssText];
              }
          });
      });
  }
  function filterPreferredFontFormat(str, _a) {
      var preferredFontFormat = _a.preferredFontFormat;
      return !preferredFontFormat
          ? str
          : str.replace(FONT_SRC_REGEX, function (match) {
              // eslint-disable-next-line no-constant-condition
              while (true) {
                  var _a = URL_WITH_FORMAT_REGEX.exec(match) || [], src = _a[0], format = _a[2];
                  if (!format) {
                      return '';
                  }
                  if (format === preferredFontFormat) {
                      return "src: ".concat(src, ";");
                  }
              }
          });
  }
  function shouldEmbed(url) {
      return url.search(URL_REGEX) !== -1;
  }
  function embedResources(cssText, baseUrl, options) {
      return __awaiter(this, void 0, void 0, function () {
          var filteredCSSText, urls;
          return __generator(this, function (_a) {
              if (!shouldEmbed(cssText)) {
                  return [2 /*return*/, cssText];
              }
              filteredCSSText = filterPreferredFontFormat(cssText, options);
              urls = parseURLs(filteredCSSText);
              return [2 /*return*/, urls.reduce(function (deferred, url) {
                      return deferred.then(function (css) { return embed(css, url, baseUrl, options); });
                  }, Promise.resolve(filteredCSSText))];
          });
      });
  }

  function embedProp(propName, node, options) {
      var _a;
      return __awaiter(this, void 0, void 0, function () {
          var propValue, cssString;
          return __generator(this, function (_b) {
              switch (_b.label) {
                  case 0:
                      propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
                      if (!propValue) return [3 /*break*/, 2];
                      return [4 /*yield*/, embedResources(propValue, null, options)];
                  case 1:
                      cssString = _b.sent();
                      node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
                      return [2 /*return*/, true];
                  case 2: return [2 /*return*/, false];
              }
          });
      });
  }
  function embedBackground(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function () {
          var _a, _b, _c, _d;
          return __generator(this, function (_e) {
              switch (_e.label) {
                  case 0:
                      return [4 /*yield*/, embedProp('background', clonedNode, options)];
                  case 1:
                      _a = (_e.sent());
                      if (_a) return [3 /*break*/, 3];
                      return [4 /*yield*/, embedProp('background-image', clonedNode, options)];
                  case 2:
                      _a = (_e.sent());
                      _e.label = 3;
                  case 3:
                      return [4 /*yield*/, embedProp('mask', clonedNode, options)];
                  case 4:
                      _d = (_e.sent());
                      if (_d) return [3 /*break*/, 6];
                      return [4 /*yield*/, embedProp('-webkit-mask', clonedNode, options)];
                  case 5:
                      _d = (_e.sent());
                      _e.label = 6;
                  case 6:
                      _c = _d;
                      if (_c) return [3 /*break*/, 8];
                      return [4 /*yield*/, embedProp('mask-image', clonedNode, options)];
                  case 7:
                      _c = (_e.sent());
                      _e.label = 8;
                  case 8:
                      _b = _c;
                      if (_b) return [3 /*break*/, 10];
                      return [4 /*yield*/, embedProp('-webkit-mask-image', clonedNode, options)];
                  case 9:
                      _b = (_e.sent());
                      _e.label = 10;
                  case 10:
                      return [2 /*return*/];
              }
          });
      });
  }
  function embedImageNode(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function () {
          var isImageElement, url, dataURL;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0:
                      isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
                      if (!(isImageElement && !isDataUrl(clonedNode.src)) &&
                          !(isInstanceOfElement(clonedNode, SVGImageElement) &&
                              !isDataUrl(clonedNode.href.baseVal))) {
                          return [2 /*return*/];
                      }
                      url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
                      return [4 /*yield*/, resourceToDataURL(url, getMimeType(url), options)];
                  case 1:
                      dataURL = _a.sent();
                      return [4 /*yield*/, new Promise(function (resolve, reject) {
                              clonedNode.onload = resolve;
                              clonedNode.onerror = options.onImageErrorHandler
                                  ? function () {
                                      var attributes = [];
                                      for (var _i = 0; _i < arguments.length; _i++) {
                                          attributes[_i] = arguments[_i];
                                      }
                                      try {
                                          resolve(options.onImageErrorHandler.apply(options, attributes));
                                      }
                                      catch (error) {
                                          reject(error);
                                      }
                                  }
                                  : reject;
                              var image = clonedNode;
                              if (image.decode) {
                                  image.decode = resolve;
                              }
                              if (image.loading === 'lazy') {
                                  image.loading = 'eager';
                              }
                              if (isImageElement) {
                                  clonedNode.srcset = '';
                                  clonedNode.src = dataURL;
                              }
                              else {
                                  clonedNode.href.baseVal = dataURL;
                              }
                          })];
                  case 2:
                      _a.sent();
                      return [2 /*return*/];
              }
          });
      });
  }
  function embedChildren(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function () {
          var children, deferreds;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0:
                      children = toArray(clonedNode.childNodes);
                      deferreds = children.map(function (child) { return embedImages(child, options); });
                      return [4 /*yield*/, Promise.all(deferreds).then(function () { return clonedNode; })];
                  case 1:
                      _a.sent();
                      return [2 /*return*/];
              }
          });
      });
  }
  function embedImages(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0:
                      if (!isInstanceOfElement(clonedNode, Element)) return [3 /*break*/, 4];
                      return [4 /*yield*/, embedBackground(clonedNode, options)];
                  case 1:
                      _a.sent();
                      return [4 /*yield*/, embedImageNode(clonedNode, options)];
                  case 2:
                      _a.sent();
                      return [4 /*yield*/, embedChildren(clonedNode, options)];
                  case 3:
                      _a.sent();
                      _a.label = 4;
                  case 4: return [2 /*return*/];
              }
          });
      });
  }

  function applyStyle(node, options) {
      var style = node.style;
      if (options.backgroundColor) {
          style.backgroundColor = options.backgroundColor;
      }
      if (options.width) {
          style.width = "".concat(options.width, "px");
      }
      if (options.height) {
          style.height = "".concat(options.height, "px");
      }
      var manual = options.style;
      if (manual != null) {
          Object.keys(manual).forEach(function (key) {
              style[key] = manual[key];
          });
      }
      return node;
  }

  function shouldLog(options, level) {
      var _a;
      var logLevel = (_a = options === null || options === void 0 ? void 0 : options.logLevel) !== null && _a !== void 0 ? _a : 'error';
      if (logLevel === 'silent')
          return false;
      if (logLevel === 'debug')
          return true;
      return level === 'error';
  }
  function logDebug(options) {
      var args = [];
      for (var _i = 1; _i < arguments.length; _i++) {
          args[_i - 1] = arguments[_i];
      }
      if (shouldLog(options, 'debug')) {
          // eslint-disable-next-line no-console
          console.debug.apply(console, args);
      }
  }
  var cssFetchCache = {};
  function fetchCSS(url) {
      return __awaiter(this, void 0, void 0, function () {
          var cache, res, cssText;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0:
                      cache = cssFetchCache[url];
                      if (cache != null) {
                          return [2 /*return*/, cache];
                      }
                      return [4 /*yield*/, fetch(url)];
                  case 1:
                      res = _a.sent();
                      return [4 /*yield*/, res.text()];
                  case 2:
                      cssText = _a.sent();
                      cache = { url: url, cssText: cssText };
                      cssFetchCache[url] = cache;
                      return [2 /*return*/, cache];
              }
          });
      });
  }
  function embedFonts(data, options) {
      return __awaiter(this, void 0, void 0, function () {
          var cssText, regexUrl, fontLocs, loadFonts;
          var _this = this;
          return __generator(this, function (_a) {
              cssText = data.cssText;
              regexUrl = /url\(["']?([^"')]+)["']?\)/g;
              fontLocs = cssText.match(/url\([^)]+\)/g) || [];
              loadFonts = fontLocs.map(function (loc) { return __awaiter(_this, void 0, void 0, function () {
                  var url;
                  return __generator(this, function (_a) {
                      url = loc.replace(regexUrl, '$1');
                      if (!url.startsWith('https://')) {
                          url = new URL(url, data.url).href;
                      }
                      return [2 /*return*/, fetchAsDataURL(url, options.fetchRequestInit, function (_a) {
                              var result = _a.result;
                              cssText = cssText.replace(loc, "url(".concat(result, ")"));
                              return [loc, result];
                          })];
                  });
              }); });
              return [2 /*return*/, Promise.all(loadFonts).then(function () { return cssText; })];
          });
      });
  }
  function parseCSS(source) {
      if (source == null) {
          return [];
      }
      var result = [];
      var commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
      // strip out comments
      var cssText = source.replace(commentsRegex, '');
      // eslint-disable-next-line prefer-regex-literals
      var keyframesRegex = new RegExp('((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})', 'gi');
      // eslint-disable-next-line no-constant-condition
      while (true) {
          var matches = keyframesRegex.exec(cssText);
          if (matches === null) {
              break;
          }
          result.push(matches[0]);
      }
      cssText = cssText.replace(keyframesRegex, '');
      var importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
      // to match css & media queries together
      var combinedCSSRegex = '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]' +
          '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})';
      // unified regex
      var unifiedRegex = new RegExp(combinedCSSRegex, 'gi');
      // eslint-disable-next-line no-constant-condition
      while (true) {
          var matches = importRegex.exec(cssText);
          if (matches === null) {
              matches = unifiedRegex.exec(cssText);
              if (matches === null) {
                  break;
              }
              else {
                  importRegex.lastIndex = unifiedRegex.lastIndex;
              }
          }
          else {
              unifiedRegex.lastIndex = importRegex.lastIndex;
          }
          result.push(matches[0]);
      }
      return result;
  }
  function getCSSRules(styleSheets, options) {
      return __awaiter(this, void 0, void 0, function () {
          var ret, deferreds;
          return __generator(this, function (_a) {
              ret = [];
              deferreds = [];
              // First loop inlines imports
              styleSheets.forEach(function (sheet) {
                  if ('cssRules' in sheet) {
                      try {
                          toArray(sheet.cssRules || []).forEach(function (item, index) {
                              if (item.type === CSSRule.IMPORT_RULE) {
                                  var importIndex_1 = index + 1;
                                  var url = item.href;
                                  var deferred = fetchCSS(url)
                                      .then(function (metadata) { return embedFonts(metadata, options); })
                                      .then(function (cssText) {
                                      return parseCSS(cssText).forEach(function (rule) {
                                          try {
                                              sheet.insertRule(rule, rule.startsWith('@import')
                                                  ? (importIndex_1 += 1)
                                                  : sheet.cssRules.length);
                                          }
                                          catch (error) {
                                              logDebug(options, 'Error inserting rule from remote css', {
                                                  rule: rule,
                                                  error: error,
                                              });
                                          }
                                      });
                                  })
                                      .catch(function (e) {
                                      var _a, _b;
                                      logDebug(options, 'Error loading remote css', (_b = (_a = e === null || e === void 0 ? void 0 : e.toString) === null || _a === void 0 ? void 0 : _a.call(e)) !== null && _b !== void 0 ? _b : String(e));
                                  });
                                  deferreds.push(deferred);
                              }
                          });
                      }
                      catch (e) {
                          var inline_1 = styleSheets.find(function (a) { return a.href == null; }) || document.styleSheets[0];
                          if (sheet.href != null) {
                              deferreds.push(fetchCSS(sheet.href)
                                  .then(function (metadata) { return embedFonts(metadata, options); })
                                  .then(function (cssText) {
                                  return parseCSS(cssText).forEach(function (rule) {
                                      inline_1.insertRule(rule, inline_1.cssRules.length);
                                  });
                              })
                                  .catch(function (err) {
                                  logDebug(options, 'Error loading remote stylesheet', err);
                              }));
                          }
                          logDebug(options, 'Error inlining remote css file', e);
                      }
                  }
              });
              return [2 /*return*/, Promise.all(deferreds).then(function () {
                      // Second loop parses rules
                      styleSheets.forEach(function (sheet) {
                          if ('cssRules' in sheet) {
                              try {
                                  toArray(sheet.cssRules || []).forEach(function (item) {
                                      ret.push(item);
                                  });
                              }
                              catch (e) {
                                  // Usually a CORS-protected stylesheet; not actionable for end users.
                                  logDebug(options, "Error while reading CSS rules from ".concat(sheet.href), e);
                              }
                          }
                      });
                      return ret;
                  })];
          });
      });
  }
  function getWebFontRules(cssRules) {
      return cssRules
          .filter(function (rule) { return rule.type === CSSRule.FONT_FACE_RULE; })
          .filter(function (rule) { return shouldEmbed(rule.style.getPropertyValue('src')); });
  }
  function parseWebFontRules(node, options) {
      return __awaiter(this, void 0, void 0, function () {
          var styleSheets, cssRules;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0:
                      if (node.ownerDocument == null) {
                          throw new Error('Provided element is not within a Document');
                      }
                      styleSheets = toArray(node.ownerDocument.styleSheets);
                      return [4 /*yield*/, getCSSRules(styleSheets, options)];
                  case 1:
                      cssRules = _a.sent();
                      return [2 /*return*/, getWebFontRules(cssRules)];
              }
          });
      });
  }
  function normalizeFontFamily(font) {
      return font.trim().replace(/["']/g, '');
  }
  function getUsedFonts(node) {
      var fonts = new Set();
      function traverse(node) {
          var fontFamily = node.style.fontFamily || getComputedStyle(node).fontFamily;
          fontFamily.split(',').forEach(function (font) {
              fonts.add(normalizeFontFamily(font));
          });
          Array.from(node.children).forEach(function (child) {
              if (child instanceof HTMLElement) {
                  traverse(child);
              }
          });
      }
      traverse(node);
      return fonts;
  }
  function getWebFontCSS(node, options) {
      return __awaiter(this, void 0, void 0, function () {
          var rules, usedFonts, cssTexts;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0: return [4 /*yield*/, parseWebFontRules(node, options)];
                  case 1:
                      rules = _a.sent();
                      usedFonts = getUsedFonts(node);
                      return [4 /*yield*/, Promise.all(rules
                              .filter(function (rule) {
                              return usedFonts.has(normalizeFontFamily(rule.style.fontFamily));
                          })
                              .map(function (rule) {
                              var baseUrl = rule.parentStyleSheet
                                  ? rule.parentStyleSheet.href
                                  : null;
                              return embedResources(rule.cssText, baseUrl, options);
                          }))];
                  case 2:
                      cssTexts = _a.sent();
                      return [2 /*return*/, cssTexts.join('\n')];
              }
          });
      });
  }
  function embedWebFonts(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function () {
          var cssText, _a, _b, styleNode, sytleContent;
          return __generator(this, function (_c) {
              switch (_c.label) {
                  case 0:
                      if (!(options.fontEmbedCSS != null)) return [3 /*break*/, 1];
                      _a = options.fontEmbedCSS;
                      return [3 /*break*/, 5];
                  case 1:
                      if (!options.skipFonts) return [3 /*break*/, 2];
                      _b = null;
                      return [3 /*break*/, 4];
                  case 2: return [4 /*yield*/, getWebFontCSS(clonedNode, options)];
                  case 3:
                      _b = _c.sent();
                      _c.label = 4;
                  case 4:
                      _a = _b;
                      _c.label = 5;
                  case 5:
                      cssText = _a;
                      if (cssText) {
                          styleNode = document.createElement('style');
                          sytleContent = document.createTextNode(cssText);
                          styleNode.appendChild(sytleContent);
                          if (clonedNode.firstChild) {
                              clonedNode.insertBefore(styleNode, clonedNode.firstChild);
                          }
                          else {
                              clonedNode.appendChild(styleNode);
                          }
                      }
                      return [2 /*return*/];
              }
          });
      });
  }

  function toSvg(node, options) {
      if (options === void 0) { options = {}; }
      return __awaiter(this, void 0, void 0, function () {
          var _a, width, height, clonedNode, datauri;
          return __generator(this, function (_b) {
              switch (_b.label) {
                  case 0:
                      _a = getImageSize(node, options), width = _a.width, height = _a.height;
                      return [4 /*yield*/, cloneNode(node, options, true)];
                  case 1:
                      clonedNode = (_b.sent());
                      return [4 /*yield*/, embedWebFonts(clonedNode, options)];
                  case 2:
                      _b.sent();
                      return [4 /*yield*/, embedImages(clonedNode, options)];
                  case 3:
                      _b.sent();
                      applyStyle(clonedNode, options);
                      return [4 /*yield*/, nodeToDataURL(clonedNode, width, height)];
                  case 4:
                      datauri = _b.sent();
                      return [2 /*return*/, datauri];
              }
          });
      });
  }
  function toCanvas(node, options) {
      if (options === void 0) { options = {}; }
      return __awaiter(this, void 0, void 0, function () {
          var _a, width, height, svg, img, canvas, context, ratio, canvasWidth, canvasHeight;
          return __generator(this, function (_b) {
              switch (_b.label) {
                  case 0:
                      _a = getImageSize(node, options), width = _a.width, height = _a.height;
                      return [4 /*yield*/, toSvg(node, options)];
                  case 1:
                      svg = _b.sent();
                      return [4 /*yield*/, createImage(svg)];
                  case 2:
                      img = _b.sent();
                      canvas = document.createElement('canvas');
                      context = canvas.getContext('2d');
                      ratio = options.pixelRatio || getPixelRatio();
                      canvasWidth = options.canvasWidth || width;
                      canvasHeight = options.canvasHeight || height;
                      canvas.width = canvasWidth * ratio;
                      canvas.height = canvasHeight * ratio;
                      if (!options.skipAutoScale) {
                          checkCanvasDimensions(canvas);
                      }
                      canvas.style.width = "".concat(canvasWidth, "px");
                      canvas.style.height = "".concat(canvasHeight, "px");
                      if (options.backgroundColor) {
                          context.fillStyle = options.backgroundColor;
                          context.fillRect(0, 0, canvas.width, canvas.height);
                      }
                      context.drawImage(img, 0, 0, canvas.width, canvas.height);
                      return [2 /*return*/, canvas];
              }
          });
      });
  }
  function toPixelData(node, options) {
      if (options === void 0) { options = {}; }
      return __awaiter(this, void 0, void 0, function () {
          var _a, width, height, canvas, ctx;
          return __generator(this, function (_b) {
              switch (_b.label) {
                  case 0:
                      _a = getImageSize(node, options), width = _a.width, height = _a.height;
                      return [4 /*yield*/, toCanvas(node, options)];
                  case 1:
                      canvas = _b.sent();
                      ctx = canvas.getContext('2d');
                      return [2 /*return*/, ctx.getImageData(0, 0, width, height).data];
              }
          });
      });
  }
  function toPng(node, options) {
      if (options === void 0) { options = {}; }
      return __awaiter(this, void 0, void 0, function () {
          var canvas;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0: return [4 /*yield*/, toCanvas(node, options)];
                  case 1:
                      canvas = _a.sent();
                      return [2 /*return*/, canvas.toDataURL()];
              }
          });
      });
  }
  function toJpeg(node, options) {
      if (options === void 0) { options = {}; }
      return __awaiter(this, void 0, void 0, function () {
          var canvas;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0: return [4 /*yield*/, toCanvas(node, options)];
                  case 1:
                      canvas = _a.sent();
                      return [2 /*return*/, canvas.toDataURL('image/jpeg', options.quality || 1)];
              }
          });
      });
  }
  function toBlob(node, options) {
      if (options === void 0) { options = {}; }
      return __awaiter(this, void 0, void 0, function () {
          var canvas, blob;
          return __generator(this, function (_a) {
              switch (_a.label) {
                  case 0: return [4 /*yield*/, toCanvas(node, options)];
                  case 1:
                      canvas = _a.sent();
                      return [4 /*yield*/, canvasToBlob(canvas)];
                  case 2:
                      blob = _a.sent();
                      return [2 /*return*/, blob];
              }
          });
      });
  }
  function getFontEmbedCSS(node, options) {
      if (options === void 0) { options = {}; }
      return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
              return [2 /*return*/, getWebFontCSS(node, options)];
          });
      });
  }

  exports.getFontEmbedCSS = getFontEmbedCSS;
  exports.toBlob = toBlob;
  exports.toCanvas = toCanvas;
  exports.toJpeg = toJpeg;
  exports.toPixelData = toPixelData;
  exports.toPng = toPng;
  exports.toSvg = toSvg;

}));
//# sourceMappingURL=html-to-image.js.map
