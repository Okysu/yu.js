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
        watch: null,
        el: null,
        node: null,
        template: null,
        components: null,
        oldNode: null,
        newNode: null,
    }

    constructor(options) {
        if (!options) throw new Error('\n[Yu.JS] No options provided.')
        this.#local = {
            data: options.data,
            methods: options.methods,
            computed: options.computed,
            watch: options.watch,
            el: this.#elGet(options.el),
            node: this.#nodeGet(options.el),
            template: this.#templateGet(options.el),
            components: options.components,
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
        console.info(`[Yu.JS] Yu.js::${this.$global.version} is running.`)
        this.#render()
    }


    #elGet(optionsEl) {
        if (!optionsEl) throw new Error('\n[Yu.JS] No element provided.')
        if (!optionsEl.startsWith('#') && !optionsEl.startsWith('.')) {
            optionsEl = '#' + optionsEl
        }
        return optionsEl
    }

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
                        flag = false
                        console.warn(`[Yu.JS] No property named '${itemStr}' in data.`)
                    }
                })
                if (flag)
                    templateStr = templateStr.replace(item, value)
            })
        }
        return templateStr
    }

    #render() {
        let renderTime = new Date().getTime()
        this.#dataProxy()
        let template = this.#templateCompile(this.#local.template)
        this.#local.node.innerHTML = template
        this.#local.oldNode.innerHTML = template
        let renderTimeEnd = new Date().getTime()
        console.info(`[Yu.JS] Rendered in ${renderTimeEnd - renderTime} ms.`)
    }

    // 响应式数据 Proxy
    #dataProxy() {
        let that = this
        let data = this.#local.data
        this.#local.data = new Proxy(data, {
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
                return true
            }
        })
    }

    // diff 算法
    #diff(oldNode, newNode) {
        let index = 0
        let patches = {}
        this.#dfsWalk(oldNode, newNode, index, patches)
        return patches
    }

    #diffChildren(oldChildren, newChildren, index, patches, currentPatch) {
        console.log(patches)
        let leftNode = null
        let currentNodeIndex = index

        for (let i = oldChildren.length; i < newChildren.length; i++) {
            let newChild = newChildren[i]
            currentNodeIndex = (leftNode && leftNode.count) ? currentNodeIndex + leftNode.count + 1 : currentNodeIndex + 1
            this.#dfsWalk(oldChildren[i], newChild, currentNodeIndex, patches)
            leftNode = oldChildren[i]
        }
    }

    #dfsWalk(oldNode, newNode, index, patches) {
        let currentPatch = []
        if (newNode === null) {
        }
        else if (this.#isString(oldNode) && this.#isString(newNode)) {
            if (oldNode !== newNode) {
                currentPatch.push({ type: "TEXT", content: newNode })
            }
        }
        else if (oldNode.tagName === newNode.tagName && oldNode.key === newNode.key) {
            let propsPatches = this.#diffProps(oldNode, newNode)
            if (propsPatches) {
                currentPatch.push({ type: "PROPS", props: propsPatches })
            }
            this.#diffChildren(oldNode.children, newNode.children, index, patches, currentPatch)
        }
        else {
            currentPatch.push({ type: "REPLACE", node: newNode })
        }
        if (currentPatch.length) {
            patches[index] = currentPatch
        }
    }

    #patch(node, patches) {
        let walker = { index: 0 }
        this.#dfsPatch(node, walker, patches)
    }

    #isString(obj) {
        return Object.prototype.toString.call(obj) === '[object String]'
    }

    #dfsPatch(node, walker, patches) {
        let currentPatches = patches[walker.index]
        let len = node.childNodes ? node.childNodes.length : 0
        for (let i = 0; i < len; i++) {
            let child = node.childNodes[i]
            walker.index++
            this.#dfsPatch(child, walker, patches)
        }
        if (currentPatches) {
            this.#doPatch(node, currentPatches)
        }
    }

    #doPatch(node, currentPatches) {
        currentPatches.forEach(currentPatch => {
            switch (currentPatch.type) {
                case "TEXT":
                    node.textContent = currentPatch.content
                    break
                case "REPLACE":
                    node.parentNode.replaceChild(currentPatch.node.render(), node)
                    break
                case "PROPS":
                    this.#setProps(node, currentPatch.props)
                    break
                default:
                    throw new Error("Unknown patch type " + currentPatch.type)
            }
        })
    }

    #setProps(node, props) {
        for (let key in props) {
            if (props[key] === void 666) {
                node.removeAttribute(key)
            }
            else {
                let value = props[key]
                node.setAttribute(key, value)
            }
        }
    }

    #diffProps(oldNode, newNode) {
        let count = 0
        let oldProps = oldNode.props
        let newProps = newNode.props
        let key, value
        let propsPatches = {}
        for (key in oldProps) {
            value = oldProps[key]
            if (newProps[key] !== value) {
                count++
                propsPatches[key] = newProps[key]
            }
        }
        for (key in newProps) {
            value = newProps[key]
            if (!oldProps.hasOwnProperty(key)) {
                count++
                propsPatches[key] = value
            }
        }
        if (count === 0) {
            return null
        }
        return propsPatches
    }

    #isSameNode(oldNode, newNode) {
        if (oldNode.tagName !== newNode.tagName) {
            return false
        }
        if (oldNode.key !== newNode.key) {
            return false
        }
        for (let name in oldNode.props) {
            if (oldNode.props[name] !== newNode.props[name]) {
                return false
            }
        }
        return true
    }

    #isIgnoreChildren(node) {
        return (node.props && node.props.hasOwnProperty('ignore'))
    }

    #isSameChildren(oldChildren, newChildren) {
        if (oldChildren.length !== newChildren.length) {
            return false
        }
        let len = oldChildren.length
        for (let i = 0; i < len; i++) {
            if (!this.#isSameNode(oldChildren[i], newChildren[i])) {
                return false
            }
        }
        return true
    }

    #update() {
        let newNode = this.#local.node.cloneNode(true)
        newNode.innerHTML = this.#templateCompile(this.#local.template)
        let oldNode = this.#local.oldNode
        let patches = this.#diff(oldNode, newNode)
        this.#patch(oldNode, patches)
        this.#local.oldNode = newNode
    }
}
