/**
 * Yu.js - A simple JavaScript framework
 * @version v0.0.4.1
 * @link    https://yujs.yby.zone
 * @license GNUAGPLv3
 * @author Okysu
 */

export class Yu {

	#local = {
		data: null,
		methods: null,
		mounted: null,
		beforeMounted: null,
		beforeUpdate: null,
		afterUpdate: null,
		watch: null,
		el: null,
		node: null,
		template: null,
		components: null,
		oldNode: null,
		newNode: null,
		dev: false,
		strict: false,
		dataPath: [],
		ast: [],
	}

	constructor(options) {
		if (!options) throw new YuError('No options provided.')
		this.#local = {
			dev: options?.dev || false,
			strict: options?.strict || false,
			data: options?.data,
			methods: options?.methods,
			watch: options?.watch,
			el: this.#elGet(options.el),
			node: this.#nodeGet(options.el),
			template: this.#templateGet(options.el),
			components: options?.components,
			mounted: options?.mounted,
			dataPath: this.#dataPath(options?.data),
			beforeMounted: options?.beforeMounted,
			beforeUpdate: options?.beforeUpdate,
			afterUpdate: options?.afterUpdate,
		}
		this.#local.oldNode = this.#local.node.cloneNode(true)
		this.$global = {
			instance: this,
			version: '0.0.4.1',
			app: this.#local.el,
			dev(isDev = null) {
				if (isDev !== null)
					this.instance.#local.dev = isDev
				else
					return this.instance.#local.dev
			},
			strict(isStrict = null) {
				if (isStrict !== null)
					this.instance.#local.strict = isStrict
				else
					return this.instance.#local.strict
			},
		}
		window.$yu = this.$global
		if (this.#local.dev)
			console.info(`[Yu.JS] Yu.js::${this.$global.version} is running.`)
		this.#render()
	}

	/**
	 * 获取构造函数中的el
	 * @param {string} optionsEl ID或者Class
	 * @returns {string} 没有#或者.的默认为ID
	 */
	#elGet(optionsEl) {
		if (!optionsEl) throw new YuError('No element provided.')
		if (!optionsEl.startsWith('#') && !optionsEl.startsWith('.')) {
			optionsEl = '#' + optionsEl
		}
		return optionsEl
	}

	/**
	 * 获取el对应的节点
	 * @param {string} optionsEl ID或者Class
	 * @returns {HTMLElement} 节点
	 */
	#nodeGet(optionsEl) {
		try {
			if (!optionsEl.startsWith('#') && !optionsEl.startsWith('.')) {
				optionsEl = '#' + optionsEl
			}
			return document.querySelector(optionsEl)
		}
		catch (e) {
			throw new YuError('No element found.')
		}
	}

	/**
	 * 获取模板内容
	 * @param {string} optionsEl ID或者Class
	 * @returns {string} 模板内容
	 */
	#templateGet(optionsEl) {
		try {
			if (!optionsEl.startsWith('#') && !optionsEl.startsWith('.')) {
				optionsEl = '#' + optionsEl
			}
			return document.querySelector(optionsEl).innerHTML
		}
		catch (e) {
			throw new YuError('No element found.')
		}
	}

	/**
	 * 获取data中的所有路径
	 * @param {object} data data
	 * @returns {array} 路径数组
	 */
	#dataPath(data) {
		if (!data) return []
		let path = []
		for (let key in data) {
			if (typeof data[key] === 'object') {
				let subPath = this.#dataPath(data[key])
				for (let subKey in subPath) {
					path.push(key + '.' + subPath[subKey])
				}
			}
			else {
				path.push(key)
			}
		}
		return path
	}

	/**
	 * 模板编译
	 * @param {string} template 模板内容
	 * @returns {string} 编译后的模板内容
	 */
	#templateCompile(template) {
		let templateStr = template
		let templateReg = /\{\{(.+?)\}\}/g
		let templateMatch = templateStr.match(templateReg)
		if (templateMatch) {
			templateMatch.forEach((item) => {
				let itemStr = item.replace('{{', '').replace('}}', '').trim()
				if (!itemStr) return
				let keys = itemStr.split('.')
				let value = this.#local.data
				let flag = true
				keys.forEach(key => {
					if (value[key]) {
						value = value[key]
					}
					else {
						if (value[key] === 0 || value[key] === false || value[key] === '') {
							value = value[key]
						} else {
							flag = false
							console.warn(`[Yu.JS] No property named '${itemStr}' in data.`)
						}
					}
				})
				if (flag) {
					if (typeof value === 'object') {
						try {
							value = JSON.stringify(value)
						}
						catch (e) {
							console.warn(`[Yu.JS] Cannot stringify '${itemStr}' in data.`)
						}
					}
					templateStr = templateStr.replace(item, value)
				}
			})
		}

		let templateReg2 = /#value="(.+?)"/g
		let templateMatch2 = templateStr.match(templateReg2)
		if (templateMatch2) {
			templateMatch2.forEach((item) => {
				let itemStr = item.replace('#value="', '').replace('"', '').trim()
				if (!itemStr) throw new YuError('No expression provided.')
				let keys = itemStr.split('.')
				let value = this.#local.data
				let flag = true
				keys.forEach(key => {
					if (value[key]) {
						value = value[key]
					}
					else {
						if (value[key] === 0 || value[key] === false || value[key] === '') {
							value = value[key]
						} else {
							flag = false
							console.warn(`[Yu.JS] No property named '${itemStr}' in data.`)
						}
					}
				})
				if (flag)
					if (value !== '') {
						if (typeof value === 'object') {
							try {
								value = JSON.stringify(value)
							}
							catch (e) {
								console.warn(`[Yu.JS] Cannot stringify '${itemStr}' in data.`)
							}
						}
						templateStr = templateStr.replace(item, `#value=${itemStr} value="${value}"`)
					}
			})
		}

		return templateStr
	}

	/**
	 * 页面渲染
	 */
	#render() {
		if (this.#local.beforeMounted)
			this.#beforeMounted()
		let renderTime = new Date().getTime()
		this.#methodsCompile()
		this.#watchCompile()
		this.#deepProxy()
		this.#proxyData()
		let template = this.#templateCompile(this.#local.template)
		this.#local.node.innerHTML = template
		this.#local.oldNode.innerHTML = template
		this.#showCompile(this.#local.node)
		this.#addEvent(this.#local.node)
		let renderTimeEnd = new Date().getTime()
		if (this.#local.dev)
			console.info(`[Yu.JS] Rendered in ${renderTimeEnd - renderTime} ms.`)
		window.$yu.renderTime = renderTimeEnd - renderTime
		this.#mounted()
	}

	#beforeMounted() {
		this.#local.beforeMounted()
		this.#local.node = this.#nodeGet(this.#local.el)
		this.#local.node.innerHTML = this.#templateGet(this.#local.el)
		this.#local.template = this.#local.node.innerHTML
	}

	/**
	 * watch函数更名
	 */
	#watchCompile() {
		let watch = this.#local.watch
		if (watch) {
			for (let key in watch) {
				this.#local.watch[`_watch_${key}`] = watch[key]
				delete this.#local.watch[key]
			}
		}
	}

	/**
	 * methods函数更名
	 */
	#methodsCompile() {
		let methods = this.#local.methods
		if (methods) {
			for (let key in methods) {
				this.#local.methods[`_methods_${key}`] = methods[key]
				delete this.#local.methods[key]
			}
		}
	}

	/**
	 * 深度代理
	 */
	#deepProxy() {
		let that = this
		let data = this.#local.data
		let handler = {
			get(target, key) {
				return Reflect.get(target, key)
			},
			set(target, key, value) {
				let oldVal = target[key]
				let newVal = value
				if (oldVal === newVal) {
					return true
				}
				Reflect.set(target, key, newVal)
				that.#update()
				if (typeof newVal === 'object') {
					newVal = new Proxy(newVal, handler)
				}
				if (that.#local.dev)
					console.info(`[Yu.JS] Data changed: ${key} = ${value}`)
				if (that.#local.watch && that.#local.watch[`_watch_${key}`]) {
					if (typeof that.#local?.watch[`_watch_${key}`] === 'function')
						that.#local.watch[`_watch_${key}`].call(that, newVal, oldVal, target)
					else if (typeof that.#local?.watch[`_watch_${key}`] === 'object') {
						if (that.#local.watch[`_watch_${key}`].handler)
							that.#local.watch[`_watch_${key}`].handler.call(that, newVal, oldVal, target[key])
					}
				}
				return true
			}
		}
		this.#local.data = new Proxy(data, handler)
		this.#deepProxyHandler(data, handler)
	}

	#deepProxyHandler(data, handler) {
		for (let key in data) {
			if (typeof data[key] === 'object') {
				data[key] = new Proxy(data[key], handler)
				this.#deepProxyHandler(data[key], handler)
			}
		}
	}

	/**
	 * diff 局部更新
	 * @param {HTMLElement} oldNode 
	 * @param {HTMLElement} newNode 
	 */
	#diff(oldNode, newNode) {
		let oldChildNodes = oldNode.childNodes
		let newChildNodes = newNode.childNodes
		for (let i = 0; i < oldChildNodes.length; i++) {
			let oldChildNode = oldChildNodes[i]
			let newChildNode = newChildNodes[i]
			if (oldChildNode?.nodeType === 3 && newChildNode?.nodeType === 3) {
				if (oldChildNode.nodeValue !== newChildNode.nodeValue) {
					oldChildNode.nodeValue = newChildNode.nodeValue
				}
			}
			else if (oldChildNode?.nodeType === 1 && newChildNode?.nodeType === 1) {
				if (oldChildNode.tagName === newChildNode.tagName) {
					if (oldChildNode.tagName === 'DIV' && oldChildNode.innerHTML !== newChildNode.innerHTML) {
						this.#diff(oldChildNode, newChildNode)
					}
					else if (oldChildNode.tagName === 'INPUT' || oldChildNode.tagName === 'TEXTAREA' || oldChildNode.tagName === 'SELECT') {
						if (oldChildNode.value !== newChildNode.value) {
							oldChildNode.value = newChildNode.value
						}
					}
					let oldAttrs = oldChildNode.attributes
					let newAttrs = newChildNode.attributes
					for (let j = 0; j < oldAttrs.length; j++) {
						let oldAttr = oldAttrs[j]
						let newAttr = newAttrs[j]
						if (oldAttr?.name === 'value') {
							if (newAttr?.value && oldChildNode.value !== '')
								oldChildNode.value = newAttr?.value
							else {
								oldChildNode.removeAttribute('value')
							}
							if (oldChildNode?.type === 'checkbox' || oldChildNode?.type === 'radio') {
								if (newAttr?.value === 'true') {
									oldChildNode.checked = true
								} else {
									oldChildNode.checked = false
								}
							}
						}
						if (oldAttr?.name === newAttr?.name) {
							if (oldAttr.value !== newAttr.value) {
								oldChildNode.setAttribute(oldAttr.name, newAttr.value)
							}
						}
					}
					this.#diff(oldChildNode, newChildNode)
				}
				else {
					oldChildNode.replaceWith(newChildNode)
				}
			}
		}
	}

	/**
	 * 数据更新后的视图刷新
	 */
	#update() {
		let renderTime = new Date().getTime()
		let newNode = this.#local.node.cloneNode(true)
		newNode.innerHTML = this.#templateCompile(this.#local.template)
		this.#diff(this.#local.node, newNode)
		this.#showCompile(this.#local.node)
		let renderTimeEnd = new Date().getTime()
		if (this.#local.dev)
			console.info(`[Yu.JS] Updated in ${renderTimeEnd - renderTime} ms.`)
		window.$yu.renderTime = renderTimeEnd - renderTime
		if (this.#local.afterUpdate)
			this.#local.afterUpdate.call(this)
	}

	/**
	 * Proxy data 到 methods和watch
	 */
	#proxyData() {
		let data = this.#local.data
		let methods = this.#local.methods
		let watch = this.#local.watch
		if (methods)
			methods = new Proxy(methods, {
				get(target, key) {
					if (key.startsWith('_methods_')) {
						return Reflect.get(target, key)
					} else {
						if (key in data) {
							return data[key]
						}
					}
				},
				set(target, key, value) {
					if (key.startsWith('_methods_')) {
						return Reflect.set(target, key, value)
					} else {
						if (key in data) {
							data[key] = value
							return true
						}
					}
				}
			})
		if (watch)
			watch = new Proxy(watch, {
				get(target, key) {
					if (key.startsWith('_watch_')) {
						return Reflect.get(target, key)
					} else {
						if (key in data) {
							return data[key]
						}
					}
				},
				set(target, key, value) {
					if (key.startsWith('_watch_')) {
						return Reflect.set(target, key, value)
					} else {
						if (key in data) {
							data[key] = value
							return true
						}
					}
				}
			})
		this.#local.methods = methods
		this.#local.watch = watch
	}

	/**
	 * 有#show的元素进行渲染
	 * TODO: 目前是和#if一样的逻辑，后续需要优化
	 */
	/**
	 * 有#show的元素进行渲染
	 * @param {HTMLElement} node 节点
	 */
	#showCompile(node) {
		let childNodes = node.childNodes
		for (let i = 0; i < childNodes.length; i++) {
			let childNode = childNodes[i]
			if (childNode.nodeType === 1) {
				if (childNode.hasAttribute('#show') || childNode.hasAttribute('#if')) {
					let itemStr = childNode.getAttribute('#show') || childNode.getAttribute('#if')
					if (!itemStr) throw new YuError('No expression provided.')
					if (itemStr === 'true') {
						if (!childNode.getAttribute('style'))
							childNode.removeAttribute('style')
						else {
							childNode.style.display = ''
						}
						continue
					} else if (itemStr === 'false') {
						childNode.style.display = 'none'
						continue
					}
					let keys = itemStr.split('.')
					let value = this.#local.data
					let flag = true
					keys.forEach(key => {
						if (value[key] || value[key] === false) {
							value = value[key]
						}
						else {
							console.warn(`[Yu.JS] No property named '${itemStr}' in data.`)
							flag = false
						}
					})
					if (flag)
						if (!value)
							childNode.style.display = 'none'
						else {
							if (!childNode.getAttribute('style'))
								childNode.removeAttribute('style')
							else {
								childNode.style.display = ''
							}
						}
				}
			}
			this.#showCompile(childNode)
		}
	}

	/**
	 * 添加事件监听
	 * @param {HTMLElement} node 结点 
	 */
	#addEvent(node) {
		let childNodes = node.childNodes
		for (let i = 0; i < childNodes.length; i++) {
			let child = childNodes[i]
			if (child.nodeType === 1) {
				let attrs = child.attributes
				for (let j = 0; j < attrs.length; j++) {
					let attr = attrs[j]
					if (attr.name.startsWith('@')) {
						let eventName = attr.name.slice(1)
						eventName = eventName.toLowerCase()
						let methodName = attr.value
						if (!eventName || !methodName) continue
						let eventMount
						let params = methodName.match(/\((.*?)\)/)
						if (params) {
							params = params[1].split(',')
							params.forEach((param, index) => {
								params[index] = param.replace(/['"]/g, '')
							})
							methodName = methodName.split('(')[0]
						}
						methodName = "_methods_" + methodName
						if (this.#local.methods[methodName]) {
							if (params) {
								eventMount = () => {
									this.#local.methods[methodName](...params)
								}
								child.addEventListener(eventName, eventMount)
							}
							else {
								eventMount = () => {
									this.#local.methods[methodName]()
								}
								child.addEventListener(eventName, eventMount)
							}
						}
						else {
							throw new YuError(`No method named '${methodName}' in methods.`)
						}
					}
					if (attr.name === '#value' && (child.tagName === 'INPUT' || child.tagName === 'TEXTAREA' || child.tagName === 'SELECT')) {
						console.log(child)
						let valueName = attr.value
						let keys = valueName.split('.')
						let value = this.#local.data
						let flag = true
						keys.forEach(key => {
							if (value[key] || value[key] === false || value[key] === 0 || value[key] === '') {
								value = value[key]
							}
							else {
								console.warn(`[Yu.JS] No property named '${valueName}' in data.`)
								flag = false
							}
						})
						if (flag) {
							if (typeof value === 'object') {
								try {
									value = JSON.stringify(value)
								}
								catch (e) {
									console.warn(`[Yu.JS] Cannot stringify '${itemStr}' in data.`)
								}
							}
							if (child.type === 'checkbox' || child.type === 'radio') {
								if (valueName === "true")
									child.checked = true
								else if (valueName === "false")
									child.checked = false
								else if (value)
									child.checked = true
								else
									child.checked = false
							}
							child.addEventListener('change', (e) => {
								console.log(e.target.value)
								let target = e.currentTarget
								let value = target.value
								if (target.type === 'checkbox' || target.type === 'radio') {
									if (target.checked)
										value = true
									else
										value = false
								}
								let data = this.#local.data
								keys.forEach((key, index) => {
									console.log(data)
									if (index === keys.length - 1) {
										let changeTarget = data[key]
										if (typeof changeTarget === 'number') {
											if (typeof value === 'number')
												data[key] = value
											else
												data[key] = Number(value)
										}
										else if (typeof changeTarget === 'boolean') {
											if (typeof value === 'boolean')
												data[key] = value
											else
												data[key] = Boolean(value)
										} else {
											data[key] = value
										}
									}
									else {
										data = data[key]
									}
								})
							})
							if (child.tagName === 'INPUT' || child.tagName === 'TEXTAREA') {
								console.log(child)
								child.addEventListener('input', (e) => {
									let target = e.currentTarget
									let value = target.value
									let data = this.#local.data
									keys.forEach((key, index) => {
										if (index === keys.length - 1) {
											let changeTarget = data[key]
											if (typeof changeTarget === 'number') {
												if (typeof value === 'number')
													data[key] = value
												else
													data[key] = Number(value)
											}
											else if (typeof changeTarget === 'boolean') {
												if (typeof value === 'boolean')
													data[key] = value
												else
													data[key] = Boolean(value)
											} else {
												data[key] = value
											}
										}
										else {
											data = data[key]
										}
									})
								})
							}
						}
					}
				}
				this.#addEvent(child)
			}
		}
	}

	/**
	 * 挂载后的事件
	 */
	#mounted() {
		if (this.#local.mounted)
			this.#local.mounted()
	}
}
/**
 * 
 * @param {string} selector 
 * @returns {Element} 
 */
export const $ = (selector) => {
	return document.querySelector(selector)
}
/**
 * h渲染
 * @param {string | object} tag 
 * @param {object} props 
 * @param {string | object} children 
 * @returns {VNode} 
 */
export const h = (tag, props, children) => {
	return new VNode(tag, props, children)
}

class VNode {
	constructor(tag, props, children) {
		this.tag = tag
		this.props = props
		this.children = children
	}

	render() {
		let el = document.createElement(this.tag)
		for (let key in this.props) {
			if (key === 'style') {
				for (let style in this.props[key]) {
					let arr
					if (/[A-Z]/.test(style)) {
						arr = style.replace(/[A-Z]/g, (match) => {
							return '-' + match.toLowerCase()
						})
					}
					el.style[arr || style] = this.props[key][style]
				}
			} else if (key === 'class') {
				el.className = this.props[key]
			} else if (/^on/.test(key)) {
				el.addEventListener(key.slice(2).toLowerCase().toString(), this.props[key])
			}
			else {
				el.setAttribute(key, this.props[key])
			}
		}
		if (this.children) {
			if (typeof this.children === 'string') {
				el.appendChild(document.createTextNode(this.children))
			}
			else if (typeof this.children === 'object') {
				if (this.children instanceof Array) {
					this.children.forEach(child => {
						el.appendChild(child.render())
					})
				} else {
					el.appendChild(this.children.render())
				}
			}
			else if (Array.isArray(this.children)) {
				this.children.forEach(child => {
					render(child, el)
				})
			}
		}
		return el
	}
}

/**
 * 
 * @param {HTMLElement} vnode 
 * @param {Yu} that 
 */
export const render = (vnode, that) => {
	if (!that && window.$yu.dev() && window.$yu.strict())
		console.warn('[Yu.JS] render() must have a second parameter, if not use window.$yu.app instead.')
	let instance = that?.el || window.$yu.app
	if (!instance.startsWith('#') && !instance.startsWith('.')) {
		instance = '#' + instance
	}
	let container = document.querySelector(instance)
	container.appendChild(vnode.render())
}

/**
 * 自定义错误
 */
export class YuError extends Error {
	constructor(message) {
		super(message)
		this.name = '[Yu.JS]'
	}
}

export const getCurrentInstance = () => {
	return window.$yu.instance
}

export const createApp = (app) => {
	return new Yu(app)
}

export default Yu