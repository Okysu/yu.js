# Yu.js


## What is Yu.js?

Yu.js is a JavaScript library for creating web applications. It is a framework that is designed to be simple and easy to use. It is also designed to be lightweight and fast.

## Why Yu.js?

Yu.js is very suitable for those new Web users. It avoids those complicated DOM operations, supports bidirectional binding and event binding, and has data monitoring and automatic local update.

## How to use Yu.js?

### 1. Download Yu.js

You can download Yu.js from the [GitHub](https://github.com/Okysu/Yu.js) Or [Website](https://yujs.yby.zone)

### 2. Import Yu.js(ESM) or Yu.js(UMD)

```html
<script src="./yu.js"></script>
```
You can use the Online CDN

```html
<script src="https://yujs.yby.zone/yu.js"></script>
```

```javascript
import { Yu } from "./yu.esm.js";
```

You can use the Online CDN

```javascript
import { Yu } from "https://yujs.yby.zone/yu.esm.js";
``` 

### 3. Create a new Yu.js application

#### 3.1. Create a new Yu.js application with ESM

```html
<div id="app">
    <h1>{{title}}</h1>
    <p>{{content}}</p>
    <button @click="changeTitle">Change Title</button>
</div>
```

```javascript
const app = new Yu(
    {
        el: "#app",
        data: {
            title: "Hello Yu.js",
            content: "This is a Yu.js application."
        },
        methods: {
            changeTitle() {
                this.title = "Hello World";
            }
        }
    }
)
```

#### 3.2. Create a new Yu.js application with UMD

```html
<div id="app">
    <h1>{{title}}</h1>
    <p>{{content}}</p>
    <button @click="changeTitle">Change Title</button>
</div>
```

Unlike ESM, UMD has a createApp method to create Yu.js instances.

```javascript
const app = Yu.createApp(
    {
        el: "#app",
        data: {
            title: "Hello Yu.js",
            content: "This is a Yu.js application."
        },
        methods: {
            changeTitle() {
                this.title = "Hello World";
            }
        }
    }
)
```

### 4. Run Yu.js application

if you use ESM to create a Yu.js application and you don't have a server, you can use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code to run the application.

if you use UMD to create a Yu.js application, you can debug the application in the browser.

## Documentation

### 1. Finsihed

- [x] Data binding
- [x] Event binding
- [x] Data monitoring
- [x] Automatic local update

### 2. Events supported by Form

- [x] @input
- [x] @change
- [x] @click
- [x] @blur
- [x] @focus

### 3. Attributes supported by Doucument

- [x] #value
- [x] #show
- [x] #if

### 4. Other

- [x] Support for multiple instances

## License

GNU General Public License v3.0

