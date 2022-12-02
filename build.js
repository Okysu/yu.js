var fs = require('fs');
var path = require('path');
if (!fs.existsSync(path.join(__dirname, 'build'))) {
    fs.mkdirSync(path.join(__dirname, 'build'));
} else {
    var files = fs.readdirSync(path.join(__dirname, 'build'));
    files.forEach(function (file) {
        fs.unlinkSync(path.join(__dirname, 'build', file));
    });
}
var html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
var styleReg = /<style>([\s\S]*)<\/style>/;
var scriptReg = /<script>([\s\S]*)<\/script>/;
var style = styleReg.exec(html)[1];
var script = scriptReg.exec(html)[1];
var yuReg = /<!--Yu Import-->[\s\S]*<!--Yu End-->/;
var yu = yuReg.exec(html)[0];
yu = yu.replace(/<!--[\s\S]*?-->/g, '');
var srcReg = /<script src="([\s\S]*)"><\/script>/g;
var yuSrc = srcReg.exec(yu)[1];
var isAbsolute = path.isAbsolute(yuSrc);
var isUrl = /^http(s)?:\/\//.test(yuSrc);
if (!isUrl)
    if (!isAbsolute) {
        let yuPath = path.join(__dirname, yuSrc);
        let yuContent = fs.readFileSync(yuPath, 'utf-8');
        fs.writeFileSync(path.join(__dirname, 'build', 'yu.js'), yuContent, 'utf-8');
        html = html.replace(yuReg, '');
        html = html.replace(/<\/head>/, `    <script src="./yu.js"></script>\n</head>`);
    }
html = html.replace(styleReg, '');
html = html.replace(scriptReg, '');
var fileName = Math.random().toString(36).slice(-6);
var uglify = require('uglify-js');
var result = uglify.minify(script);
script = result.code;
fs.writeFileSync(path.join(__dirname, 'build', "index." + fileName + '.css'), style, 'utf-8');
fs.writeFileSync(path.join(__dirname, 'build', "index." + fileName + '.js'), script, 'utf-8');

html = html.replace('</head>', "    <link rel=\"stylesheet\" href=\"./index." + fileName + ".css\">\n</head>");
html = html.replace('</body>', "</body>\n<script src=\"./index." + fileName + ".js\"></script>");

fs.writeFileSync(path.join(__dirname, 'build', 'index.html'), html, 'utf-8');
