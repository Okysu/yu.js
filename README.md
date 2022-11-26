# Yu.js


## What is Yu.js?

Yu.js is a JavaScript library for creating web applications. It is a framework that is designed to be simple and easy to use. It is also designed to be lightweight and fast.

## Why Yu.js?

Yu.js is very suitable for those new Web users. It avoids those complicated DOM operations, supports bidirectional binding and event binding, and has data monitoring and automatic local update.

## How to use Yu.js?

### 1. Download Yu.js

You can download Yu.js from the [GitHub](https://github.com/Okysu/Yu.js) Or [Website](https://yujs.yby.zone)

### 2. Import Yu.js

```javascript
import { Yu } from "./main.js";
```

### 3. Create a new Yu.js application

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

### 4. Run Yu.js application

Use the `Live Server` for VSCode to run the application.

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

