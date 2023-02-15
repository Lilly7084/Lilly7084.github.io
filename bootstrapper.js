// TODO: Integrate this script into index.html

const Bluestone =
{
    requireIntegrityCheck: false,

    container: null,

    fileHashes: {},
    pageTable: {},
    moduleCache: {},

    main: function()
    {
        this.container = document.getElementById("container");

        // We can trust sha256sum.json to be fine (for now)
        fetch("/sha256sum.json")
        .then(response => response.json())
        .then(response => Object.assign(this.fileHashes, response))

        // Load page information table
        .then(() => this.fetch("/pages.json"))
        .then(response => JSON.parse(response))
        .then(response => Object.assign(this.pageTable, response))

        // Load main stylesheet
        .then(() => this.fetch("/style.css"))
        .then(response => {
            const e = document.createElement("style");
            e.innerText = response;
            document.head.appendChild(e);
        })

        // Load default page
        .then(() => this.loadPage(this.getPageID()))
        .then(() => __page_entry()) // Only necessary for pages with async entry (i.e. module loading)
    },

    getPageID: function()
    {
        const fragment = window.location.hash;
        if (fragment.length > 0) {
            return fragment.slice(1).toLowerCase();
        }
        return this.pageTable.defaultPage;
    },

    fetch: async function(path)
    {
        if (this.requireIntegrityCheck && !this.fileHashes.hasOwnProperty(path))
            throw new Error(`fetch error: ${path}: Cannot verify file integrity`);
        const data = await fetch(path).then(response => response.text());
        const dataHash = await this.sha256(data);
        if (this.requireIntegrityCheck && this.fileHashes[path] !== dataHash)
            throw new Error(`fetch error: ${path}: File integrity check failed`);
        return data;
    },

    sha256: async function(data)
    {
        const utf8 = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
        return hashHex;
    },

    loadPage: async function(name)
    {
        if (!this.pageTable.pages.hasOwnProperty(name))
            throw new Error(`loadPage error: ${name}: Page not found`);

        const page = this.pageTable.pages[name];
        await this.loadModule(page.file);

        this.autoFit(this.container);
    },

    loadModule: async function(path)
    {
        console.debug("Loading module:", path);
        const data = await this.fetch(path);

        const parsed = new DOMParser().parseFromString(data, "text/html");
        // New fix: Some modules will load their sections into the documet HEAD, not BODY.
        const headNodes = Array.prototype.slice.call(parsed.head.childNodes);
        const bodyNodes = Array.prototype.slice.call(parsed.body.childNodes);
        const sections = Array.prototype.concat.call(headNodes, bodyNodes);

        for (const section of sections) {
            if (section.nodeName == "#text") {
                continue;
            }

            // Special behavior: Scripts won't run if they're appended directly
            if (section.nodeName == "SCRIPT") {
                const e = document.createElement("script");
                e.type = "text/javascript";
                e.text = section.textContent;
                this.container.appendChild(e);
            }
            
            else {
                this.container.appendChild(section);
            }
        }
    },

    autoFit: async function(e)
    {
        const f = this.autoFitCallback.bind(e);
        window.addEventListener("resize", f);
        setTimeout(f, 100);
    },

    autoFitCallback: async function()
    {
        const proportionX = this.offsetWidth / this.parentNode.offsetWidth;
        const proportionY = this.offsetHeight / this.parentNode.offsetHeight;
        const scale = Math.max(proportionX, proportionY);
        const newWidth = (this.offsetWidth / scale).toString(10) + "px";
        const newHeight = (this.offsetHeight / scale).toString(10) + "px";
        Object.assign(this.style, { width: newWidth, height: newHeight });
    },

    importScript: async function(path)
    {
        // Cache
        if (this.moduleCache.hasOwnProperty(path)) {
            return this.moduleCache[path];
        }

        const fnstr = await this.fetch(path);
        const result = new Function(fnstr)();
        this.moduleCache[path] = result; // Cache
        return result;
    }
};

// setTimeout(Bluestone.main, 100);

window.addEventListener("load", Bluestone.main.bind(Bluestone));

// Bluestone.main();
