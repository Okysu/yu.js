/**
 * Yu.js - A simple JavaScript framework
 * @version v0.0.1
 * @link    https://yujs.yby.zone
 * @license GNUAGPLv3
 * @author Okysu
 */

export class Yu {

    #local = {
        options: null,
        data: null,
        methods: null,
        computed: null,
        mounted: null,
        watch: null,
        el: null,
        node: null,
        template: null,
        components: null,
        oldNode: null,
        newNode: null,
        dev: false,
    }

    constructor(options) {
        if (!options) throw new Error('\n[Yu.JS] No options provided.')
        this.#local = {
            dev: options.dev || false,
            data: options.data,
            methods: options.methods,
            computed: options.computed,
            watch: options.watch,
            el: this.#elGet(options.el),
            node: this.#nodeGet(options.el),
            template: this.#templateGet(options.el),
            components: options.components,
            mounted: options.mounted,
        }
        this.#local.oldNode = this.#local.node.cloneNode(true)
        this.$global = {
            $yu: {
                instance: this,
                version: '0.0.1',
                app: this.#local.node,
            }
        }
        window.$global = this.$global
        this.$global = this.$global.$yu
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
        if (!optionsEl) throw new Error('\n[Yu.JS] No element provided.')
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
            throw new Error('\n[Yu.JS] No element found.\n[Origin] ' + e)
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
            throw new Error('\n[Yu.JS] No element found.\n[Origin] ' + e)
        }
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
                    if (value !== '')
                        templateStr = templateStr.replace(item, `#value=${itemStr} value="${value}"`)
            })
        }

        return templateStr
    }

    /**
     * 页面渲染
     */
    #render() {
        let renderTime = new Date().getTime()
        this.#deepProxy()
        this.#proxyDataToMethods()
        let template = this.#templateCompile(this.#local.template)
        this.#local.node.innerHTML = template
        this.#local.oldNode.innerHTML = template
        this.#showCompile()
        this.#addEventListeners()
        let renderTimeEnd = new Date().getTime()
        if (this.#local.dev)
            console.info(`[Yu.JS] Rendered in ${renderTimeEnd - renderTime} ms.`)
        this.#mounted()
    }

    //进行对data的深度代理，监听多级属性的变化
    #deepProxy() {
        let that = this
        let data = this.#local.data
        let handler = {
            get(target, key) {
                return Reflect.get(target, key)
            },
            set(target, key, value) {
                if (that.#local.dev)
                    console.info(`[Yu.JS] Data changed: ${key} = ${value}`)
                let oldVal = target[key]
                let newVal = value
                if (oldVal === newVal) {
                    return true
                }
                Reflect.set(target, key, newVal)
                that.#update()
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
                        oldChildNode.innerHTML = newChildNode.innerHTML
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
                        if (oldAttr?.name === newAttr?.name) {
                            if (oldAttr.value !== newAttr.value) {
                                oldChildNode.setAttribute(oldAttr.name, newAttr.value)
                                if (oldAttr.name === 'value') {
                                    oldChildNode.value = newAttr.value
                                    if (oldChildNode.type === 'checkbox' || oldChildNode.type === 'radio') {
                                        if (newAttr.value === 'true') {
                                            oldChildNode.checked = true
                                        } else {
                                            oldChildNode.checked = false
                                        }
                                    }
                                }
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
        this.#showCompile()
        let renderTimeEnd = new Date().getTime()
        if (this.#local.dev)
            console.info(`[Yu.JS] Updated in ${renderTimeEnd - renderTime} ms.`)
    }

    /**
     * 将data中的数据代理到methods中
     */
    #proxyDataToMethods() {
        let that = this
        Object.keys(this.#local.data).forEach(key => {
            Object.defineProperty(this.#local.methods, key, {
                get() {
                    return that.#local.data[key]
                },
                set(newVal) {
                    that.#local.data[key] = newVal
                }
            })
        })
    }

    /**
     * 有#show的元素进行渲染
     * TODO: 目前是和#if一样的逻辑，后续需要优化
     */
    #showCompile() {
        let children = this.#local.node.children
        for (let i = 0; i < children.length; i++) {
            let child = children[i]
            if (child.hasAttribute('#show') || child.hasAttribute('#if')) {
                let itemStr = child.getAttribute('#show') || child.getAttribute('#if')
                if (itemStr === 'true') {
                    continue
                } else if (itemStr === 'false') {
                    child.style.display = 'none'
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
                        child.style.display = 'none'
                    else
                        child.style.display = ''
            }
        }
    }


    /**
     * 添加事件监听
     */
    #addEventListeners() {
        let children = this.#local.node.children
        for (let i = 0; i < children.length; i++) {
            let child = children[i]
            if (child.hasAttribute('@click')) {
                child.addEventListener('click', e => {
                    let target = e.target
                    let attr = target.getAttribute('@click')
                    let key = attr.indexOf('(') > -1 ? attr.slice(0, attr.indexOf('(')) : attr
                    let reg = new RegExp(`${key}\\((.+?)\\)`)
                    if (attr === key || attr === `${key}()`) {
                        if (this.#local.methods[key])
                            this.#local.methods[key]()
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    } else if (reg.test(attr)) {
                        let params = attr.match(reg)[1].split(',')
                        params = params.map(param => {
                            return param.replace(/\'|\"/g, '')
                        })
                        if (this.#local.methods[key])
                            this.#local.methods[key](...params)
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    }
                })
            }
            if (child.hasAttribute('@submit')) {
                child.addEventListener('submit', e => {
                    e.preventDefault()
                    let target = e.target
                    let attr = target.getAttribute('@submit')
                    let key = attr.indexOf('(') > -1 ? attr.slice(0, attr.indexOf('(')) : attr
                    let reg = new RegExp(`${key}\\((.+?)\\)`)
                    if (attr === key || attr === `${key}()`) {
                        if (this.#local.methods[key])
                            this.#local.methods[key]()
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    } else if (reg.test(attr)) {
                        let params = attr.match(reg)[1].split(',')
                        params = params.map(param => {
                            return param.replace(/\'|\"/g, '')
                        })
                        if (this.#local.methods[key])
                            this.#local.methods[key](...params)
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    }
                })
            }
        }
        let inputs = this.#local.node.querySelectorAll('input, textarea')
        inputs.forEach(input => {
            let value = input.getAttribute('#value')
            if (value) {
                let keys = value.split('.')
                let data = this.#local.data
                for (let i = 0; i < keys.length; i++) {
                    data = data[keys[i]]
                }
                input.value = data
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = data
                    input.addEventListener('change', e => {
                        let target = e.target
                        let keys = target.getAttribute('#value').split('.')
                        let data = this.#local.data
                        for (let i = 0; i < keys.length - 1; i++) {
                            data = data[keys[i]]
                        }
                        data[keys[keys.length - 1]] = target.checked
                    })
                } else {
                    input.addEventListener('input', (e) => {
                        let keys = value.split('.')
                        let data = this.#local.data
                        keys.forEach((key, index) => {
                            if (index === keys.length - 1) {
                                data[key] = e.target.value
                            }
                            else {
                                data = data[key]
                            }
                        })
                    })
                }
            }
            if (input.hasAttribute('@change')) {
                input.addEventListener('change', e => {
                    let target = e.target
                    let attr = target.getAttribute('@change')
                    let key = attr.indexOf('(') > -1 ? attr.slice(0, attr.indexOf('(')) : attr
                    let reg = new RegExp(`${key}\\((.+?)\\)`)
                    if (attr === key || attr === `${key}()`) {
                        if (this.#local.methods[key])
                            this.#local.methods[key]()
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    } else if (reg.test(attr)) {
                        let params = attr.match(reg)[1].split(',')
                        params = params.map(param => {
                            return param.replace(/\'|\"/g, '')
                        })
                        if (this.#local.methods[key])
                            this.#local.methods[key](...params)
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    }
                })
            }
            if (input.hasAttribute('@blur')) {
                input.addEventListener('blur', e => {
                    let target = e.target
                    let attr = target.getAttribute('@blur')
                    let key = attr.indexOf('(') > -1 ? attr.slice(0, attr.indexOf('(')) : attr
                    let reg = new RegExp(`${key}\\((.+?)\\)`)
                    if (attr === key || attr === `${key}()`) {
                        if (this.#local.methods[key])
                            this.#local.methods[key]()
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    } else if (reg.test(attr)) {
                        let params = attr.match(reg)[1].split(',')
                        params = params.map(param => {
                            return param.replace(/\'|\"/g, '')
                        })
                        if (this.#local.methods[key])
                            this.#local.methods[key](...params)
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    }
                })
            }
            if (input.hasAttribute('@focus')) {
                input.addEventListener('focus', e => {
                    let target = e.target
                    let attr = target.getAttribute('@focus')
                    let key = attr.indexOf('(') > -1 ? attr.slice(0, attr.indexOf('(')) : attr
                    let reg = new RegExp(`${key}\\((.+?)\\)`)
                    if (attr === key || attr === `${key}()`) {
                        if (this.#local.methods[key])
                            this.#local.methods[key]()
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    } else if (reg.test(attr)) {
                        let params = attr.match(reg)[1].split(',')
                        params = params.map(param => {
                            return param.replace(/\'|\"/g, '')
                        })
                        if (this.#local.methods[key])
                            this.#local.methods[key](...params)
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    }
                })
            }

        })

        let selects = this.#local.node.querySelectorAll('select')
        selects.forEach(select => {
            let value = select.getAttribute('#value')
            if (value) {
                let keys = value.split('.')
                let data = this.#local.data
                for (let i = 0; i < keys.length; i++) {
                    data = data[keys[i]]
                }
                select.value = data
                select.addEventListener('change', e => {
                    let target = e.target
                    let keys = target.getAttribute('#value').split('.')
                    let data = this.#local.data
                    for (let i = 0; i < keys.length - 1; i++) {
                        data = data[keys[i]]
                    }
                    data[keys[keys.length - 1]] = target.value
                })
            }
            if (select.hasAttribute('@change')) {
                select.addEventListener('change', e => {
                    let target = e.target
                    let attr = target.getAttribute('@change')
                    let key = attr.indexOf('(') > -1 ? attr.slice(0, attr.indexOf('(')) : attr
                    let reg = new RegExp(`${key}\\((.+?)\\)`)
                    if (attr === key || attr === `${key}()`) {
                        if (this.#local.methods[key])
                            this.#local.methods[key]()
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    } else if (reg.test(attr)) {
                        let params = attr.match(reg)[1].split(',')
                        params = params.map(param => {
                            return param.replace(/\'|\"/g, '')
                        })
                        if (this.#local.methods[key])
                            this.#local.methods[key](...params)
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    }
                })
            }
            if (select.hasAttribute('@blur')) {
                select.addEventListener('blur', e => {
                    let target = e.target
                    let attr = target.getAttribute('@blur')
                    let key = attr.indexOf('(') > -1 ? attr.slice(0, attr.indexOf('(')) : attr
                    let reg = new RegExp(`${key}\\((.+?)\\)`)
                    if (attr === key || attr === `${key}()`) {
                        if (this.#local.methods[key])
                            this.#local.methods[key]()
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    } else if (reg.test(attr)) {
                        let params = attr.match(reg)[1].split(',')
                        params = params.map(param => {
                            return param.replace(/\'|\"/g, '')
                        })
                        if (this.#local.methods[key])
                            this.#local.methods[key](...params)
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    }
                })
            }
            if (select.hasAttribute('@focus')) {
                select.addEventListener('focus', e => {
                    let target = e.target
                    let attr = target.getAttribute('@focus')
                    let key = attr.indexOf('(') > -1 ? attr.slice(0, attr.indexOf('(')) : attr
                    let reg = new RegExp(`${key}\\((.+?)\\)`)
                    if (attr === key || attr === `${key}()`) {
                        if (this.#local.methods[key])
                            this.#local.methods[key]()
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    } else if (reg.test(attr)) {
                        let params = attr.match(reg)[1].split(',')
                        params = params.map(param => {
                            return param.replace(/\'|\"/g, '')
                        })
                        if (this.#local.methods[key])
                            this.#local.methods[key](...params)
                        else
                            console.error(`[Yu.JS] ${key} is not a function.`)
                    }
                })
            }
        })
    }

    /**
     * 挂载后的事件
     */
    #mounted() {
        if (this.#local.mounted)
            this.#local.mounted()
    }
}

export const $ = (selector) => {
    return document.querySelector(selector)
}