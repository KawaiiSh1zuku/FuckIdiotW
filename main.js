// ==UserScript==
// @name         FuckIdiotW
// @namespace    Sh1zuku
// @version      0.2
// @description  Bilibili 评论区按等级屏蔽 (暂时只支持 2024 新版评论区)
// @author       Sh1zuku
// @match        *://*.bilibili.com/*
// @exclude      *://member.bilibili.com*
// @icon         https://raw.githubusercontent.com/the1812/Bilibili-Evolved/preview/images/logo-small.png
// @icon64       https://raw.githubusercontent.com/the1812/Bilibili-Evolved/preview/images/logo.png
// @run-at       document-start
// @license      ISC
// @connect      bilibili.com
// @grant        unsafeWindow
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/KawaiiSh1zuku/FuckIdiotW/refs/heads/main/main.js
// @updateURL    https://raw.githubusercontent.com/KawaiiSh1zuku/FuckIdiotW/refs/heads/main/main.js
// @require      https://unpkg.com/jquery@3.6.0/dist/jquery.min.js
// ==/UserScript==

/*
Simple Logger Wrapper
Author: XUJINKAI
*/
var Logger = (function (undefined) {
    'use strict';
    var _LogLevel = {
        FATAL: 0,
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4,
        TRACE: 5,
    };
    var _LogDateTime = function () { };
    _LogDateTime.toString = function () {
        return (new Date).toLocaleString();
    };

    var Logger = function () {
        if (!(this instanceof Logger)) {
            throw new Error(`Please use the 'new' operator, this constructor function cannot be called as a function.`);
        }
        return this.init.apply(this, arguments);
    };
    Logger.prototype = {
        constructor: Logger,
        init: function (title, level) {
            this._title = title;
            this.level = level || this.LEVEL.INFO;
            this._freshFunctions();
            return this;
        },

        canLog(level) {
            return this.level >= level;
        },

        get level() {
            return this._level;
        },
        set level(value) {
            if (typeof value === 'string') {
                value = this.LEVEL[value.toUpperCase()];
            }
            if (typeof value !== 'number') {
                throw new Error('level must be number or string');
            }
            if (value < 0 || value > this.LEVEL.TRACE) {
                throw new Error(`level must be between 0 and ${this.LEVEL.TRACE}`);
            }
            this._level = value;
        },
        get title() {
            return this._title;
        },
        set title(value) {
            this._title = value;
            this._freshFunctions();
        },

        get fatal() {
            return this.level >= this.LEVEL.FATAL ? this._fatal : this._empty;
        },
        get error() {
            return this.level >= this.LEVEL.ERROR ? this._error : this._empty;
        },
        get warn() {
            return this.level >= this.LEVEL.WARN ? this._warn : this._empty;
        },
        get info() {
            return this.level >= this.LEVEL.INFO ? this._info : this._empty;
        },
        get debug() {
            return this.level >= this.LEVEL.DEBUG ? this._debug : this._empty;
        },
        get trace() {
            return this.level >= this.LEVEL.TRACE ? this._trace : this._empty;
        },

        _empty() { },
        _freshFunctions() {
            var title = this.title ? '[' + this.title + ']' : '';
            this._fatal = console.error.bind(console, '%c%s[%s][FATAL]', 'font-weight:bold;', title, _LogDateTime);
            this._error = console.error.bind(console, '%s[%s][ERROR]', title, _LogDateTime);
            this._warn = console.warn.bind(console, '%s[%s][WARN]', title, _LogDateTime);
            this._info = console.log.bind(console, '%c%s[%s][INFO]', 'color:blue', title, _LogDateTime);
            this._debug = console.log.bind(console, '%c%s[%s][DEBUG]', "color:green", title, _LogDateTime);
            this._trace = console.trace.bind(console, '%c%s[%s][TRACE]', "color:purple", title, _LogDateTime);
        },
    };
    Object.defineProperty(Logger, 'LEVEL', { value: Object.freeze(_LogLevel), writable: false });
    Object.defineProperty(Logger.prototype, 'LEVEL', { value: Object.freeze(_LogLevel), writable: false });
    return Logger;
})();

/**
 * 是否在控制台显示大多数错误消息
 */
let debug = false;
var log;
if (debug) {
    log = new Logger("FuckIdiotW", 4)
} else {
    log = new Logger("FuckIdiotW", 3)
}

(function FuckIdiot() {
    /**
	 * 屏蔽哪些评论？
	 * 等级 <=n 的将被屏蔽
     * 懒得写设置面板
	 */
    const level_n = 4;

	/**
	 * 防止代码因其他原因被执行多次
	 * 这段代码出自 Via轻插件，作者谷花泰
	 */
	let key = encodeURIComponent('FuckIdiotW');
	if (window[key]) return;
	window[key] = true;
	log.info("Running...")

    // 2024版评论
	waitForKeyElements("div#info div#user-name[data-user-profile-id]", (element) => {
		if (element && element.length > 0) {
            const userNameElement = element[0]; // 转换为原生 DOM
            if (userNameElement) {
                const replyRenderer = findParentInShadowTree(userNameElement, 'bili-comment-reply-renderer');
                if (replyRenderer) {
                    log.debug('找到元素: ', replyRenderer);
                    // 判断其等级
                    const userLevel = replyRenderer.__data.member.level_info.current_level
                    if (userLevel <= level_n) {
                        log.debug(replyRenderer.__data.rpid, "触发等级屏蔽");
                        replyRenderer.remove();
                    }
                } else {
                    const threadRenderer = findParentInShadowTree(userNameElement, 'bili-comment-thread-renderer');
                    if (threadRenderer) {
                        log.debug('找到元素: ', threadRenderer);
                        // 判断其等级
                        const userLevel = threadRenderer.__data.member.level_info.current_level
                        if (userLevel <= level_n) {
                            log.debug(threadRenderer.__data.rpid, "触发等级屏蔽");
                            threadRenderer.remove();
                        }
                    } else {
                        log.debug('未找到任何父元素');
                    }
                }
            }
		}
	});

	class CodeError extends Error {
		constructor(message) {
			super(message);
			this.name = '';
		}
	}

	function generateBuvid3() {
		const uuid = () => {
			return 'xxxxxx'.replace(/[x]/g, function () {
				return Math.floor(Math.random() * 16).toString(16);
			});
		};
		const randomInt = Math.floor(Math.random() * 99999) + 1;
		const buvid3 = `${uuid()}${randomInt.toString().padStart(5, '0')}infoc`;
		return buvid3;
	}

    function findParentInShadowTree(element, selector) {
        while (element) {
            if (element.matches && element.matches(selector)) {
                return element;
            }
            // 如果当前元素有 Shadow DOM，进入 Shadow DOM 查找
            if (element.getRootNode() instanceof ShadowRoot) {
                const found = element.getRootNode().querySelector(selector);
                if (found) return found;
            }
            // 向上遍历父节点
            element = element.parentNode || element.host;
        }
        return null;
    }


	/*--- waitForKeyElements(): 一个实用函数，用于 Greasemonkey 脚本，
	它可以检测和处理AJAX加载的内容。
	此外，此函数还支持在使用 `shadowRoot` 的页面上运行。
	使用示例：
		base.waitForKeyElements (
			"div.comments"
			, commentCallbackFunction
		);
		// 页面特定的函数，用于在找到节点时执行我们想要的操作。
		function commentCallbackFunction (jNode) {
			jNode.text ("waitForKeyElements() 更改了这段注释。");
		}
	重要提示：这个函数需要你的脚本加载了jQuery。
	*/
	function waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector) {
		function findInShadowRoots(root, selector) {
			let elements = $(root).find(selector).toArray();
			$(root).find('*').each(function () {
				const shadowRoot = this.shadowRoot;
				if (shadowRoot) {
					elements = elements.concat(findInShadowRoots(shadowRoot, selector));
				}
			});
			return elements;
		}
		var targetElements;
		if (iframeSelector) {
			targetElements = $(iframeSelector).contents();
		} else {
			targetElements = $(document);
		}
		let allElements = findInShadowRoots(targetElements, selectorTxt);
		if (allElements.length > 0) {
			for (let element of allElements) {
				var jThis = $(element);
				var alreadyFound = jThis.data('alreadyFound') || false;
				if (!alreadyFound) {
					var cancelFound = actionFunction(jThis);
					if (cancelFound) {
						return false;
					} else {
						jThis.data('alreadyFound', true);
					}
				}
			};
		}
		var controlObj = waitForKeyElements.controlObj || {};
		var controlKey = selectorTxt.replace(/[^\w]/g, "_");
		var timeControl = controlObj[controlKey];
		if (allElements.length > 0 && bWaitOnce && timeControl) {
			clearInterval(timeControl);
			delete controlObj[controlKey];
		} else {
			if (!timeControl) {
				timeControl = setInterval(function () {
					waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector);
				}, 500);
				controlObj[controlKey] = timeControl;
			}
		}
		waitForKeyElements.controlObj = controlObj;
	}
})()
