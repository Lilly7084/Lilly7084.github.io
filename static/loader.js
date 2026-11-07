(() => {

const SCRIPTS = [
    "https://cdn.jsdelivr.net/npm/markdown-it@14.3.0/dist/markdown-it.min.js",
    "https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/dist/markdown-it-footnote.min.js",
    "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js",
];

const STYLESHEETS = [
    "/static/style.css",
    "/static/hljs_github_light.css",
    "https://fonts.googleapis.com/css?family=Ubuntu+Condensed",
    "https://fonts.googleapis.com/css?family=Ubuntu+Mono",
];

const MARKDOWNIT_OPTIONS = {
    // Enable HTML tags in source
    html: true,
    // Use '/' to close single tags (<br />).
    // This is only for full CommonMark compatibility.
    xhtmlOut: true,
    // Convert '\n' in paragraphs into <br>
    breaks: false,
    // CSS language prefix for fenced blocks. Can be
    // useful for external highlighters.
    langPrefix: 'language-',
    // Autoconvert URL-like text to links
    linkify: false,
    // Enable some language-neutral replacement + quotes beautification
    // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.mjs
    typographer: true,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '“”‘’',
};

const $ = (sel) => document.querySelector(sel);

// // Recreates all <script> nodes to make them executable
// function refreshScripts (node)
// {
//     if (node.tagName === "SCRIPT") {
//         // Make a copy of the element which will be executable
//         const clone = document.createElement("script");
//         clone.text = node.innerHTML;  // Code
//         // Attributes
//         for (const attr of node.attributes) {
//             clone.setAttribute(attr.name, attr.value);
//         }
//         // <insert Indiana Jones gif>
//         node.parentNode.replaceChild(clone, node);
//         return;
//     } else {
//         // Not a script; recursively search its children for other scripts
//         for (const child of node.children) {
//             refreshScripts(child);
//         }
//     }
// }

// Stage 1: Install scripts and stylesheets
window.addEventListener("DOMContentLoaded", () => {
    SCRIPTS.forEach(src => {
        const e = document.createElement("script");
        e.src = src;
        document.head.appendChild(e);
    });
    STYLESHEETS.forEach(href => {
        const e = document.createElement("link");
        e.rel = "stylesheet";
        e.href = href;
        document.head.appendChild(e);
    });

    const e = document.createElement("title");
    e.innerText = "Lilly7084's website";
    document.head.appendChild(e);
});

window.addEventListener("load", () => {
    let content = document.body.innerHTML;

    // document.body.innerHTML = `
    //     <div id="header" class="glass-background">
    //         <p>This header intentionally left blank.</p>
    //     </div>
    //     <div id="outer">
    //         <div id="header-dummy"></div>
    //         <div id="content-frame" class="glass-background">
    //             <div id="content"></div>
    //         </div>
    //         <div id="footer" class="glass-background">
    //             <p>This footer intentionally left blank.</p>
    //         </div>
    //     </div>
    // `;
    document.body.innerHTML = `
        <div id="outer">
            <div id="content-frame" class="glass-background">
                <div id="content"></div>
            </div>
            <div id="footer" class="glass-background">
                <p>This footer intentionally left blank.</p>
            </div>
        </div>
    `;

    // TODO: Ugly!!!!
    const slices = content.split('----------\n');
    let properties = {
        title: "Lilly7084's website",
    };
    if (slices.length == 3) {
        content = slices[2];
        for (const line of slices[1].split('\n')) {
            let [ key, value ] = line.split(':');
            if (!key || !value) continue;
            key = key.trim().toLowerCase(); value = value.trim();
            properties[key] = value;
        }
    }

    $("title").innerText = properties.title;
    $("#footer").innerText = properties.title + "; last updated on " + properties.lastupdated;

    const renderer = markdownit(MARKDOWNIT_OPTIONS);
    // TODO: Should probably sanitize the DOM for peace of mind
    const html = renderer.render(content);
    $("#content").innerHTML = html;

    hljs.highlightAll();
    // refreshScripts($("#content"));
});

})();
