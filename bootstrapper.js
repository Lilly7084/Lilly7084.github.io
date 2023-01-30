// TODO: Integrate this script into index.html

const Bluestone =
{
    requireIntegrityCheck: false,

    fileHashes: {},
    pageTable: {},
    moduleCache: {},

    main: function()
    {
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
        .then(() => this.loadPage(this.pageTable.defaultPage));
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
        const data = await this.fetch(page.file);

        const container = document.getElementById("container");
        this.autoFit(container);

        const parsed = new DOMParser().parseFromString(data, "text/html");
        const sections = parsed.body.childNodes;

        for (const section of sections) {
            if (section.nodeName == "#text") {
                continue;
            }

            // Special behavior: Scripts won't run if they're appended directly
            if (section.nodeName == "SCRIPT") {
                const e = document.createElement("script");
                e.type = "text/javascript";
                e.text = section.textContent;
                container.appendChild(e);
            }
            
            else {
                container.appendChild(section);
            }
        }
    },

    autoFit: async function(e)
    {
        const f = this.autoFitCallback.bind(e);
        window.addEventListener("resize", f);
        setTimeout(f, 10);
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

Bluestone.main();
