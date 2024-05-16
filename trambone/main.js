"use strict";

// Settings
const PALE_PINK = "#ffeef5";
const DARK_PINK = "#c070c6";
const FONT = (size) => size.toString() + "px Arial";

class Button
{
    constructor (x, y, width, height, text, state)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.state = state;
    }

    draw (ctx)
    {
        const radius = 10;
        const left = this.x + radius;
        const right = this.x + this.width - radius;
        const top = this.y + radius;
        const bottom = this.y + this.height - radius;
        // Outline
        ctx.strokeStyle = PALE_PINK;
        ctx.fillStyle = PALE_PINK;
        ctx.globalAlpha = 1.0;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2 * radius;
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        // Text
        ctx.font = FONT(16);
        ctx.textAlign = "center";
        ctx.fillStyle = this.state ? "orchid" : "white";
        ctx.globalAlpha = this.state ? 0.6 : 1.0;
        ctx.fillText(this.text, (left + right) / 2, (top + bottom) / 2 + 6);
    }

    handleTouchStart (touch)
    {
        if (touch.x >= this.x &&
            touch.x <= this.x + this.width &&
            touch.y >= this.y &&
            touch.y <= this.y + this.height)
            this.state = !this.state;
    }
};

const AudioSystem =
{
    ready: false,

    init: async function ()
    {
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        this.ctx = new AudioContext();
        // await this.ctx.resume();
        await this.initProcessor();
        this.unmute();
        this.ready = true;
    },

    initProcessor: async function ()
    {
        // Create the worklet node
        await this.ctx.audioWorklet.addModule("./audio.js");
        this.proc = new AudioWorkletNode(this.ctx, "trambone-processor");
        // Send the processor an ArrayBuffer containing a WASM module
        const wasmBytes = await fetch("trambone_processor_bg.wasm")
            .then((response) => response.arrayBuffer())
            .catch((err) => console.error(err));
        this.proc.port.onmessage = (event) => this.onProcMessage(event.data);
        this.proc.port.postMessage({
            type: "send-wasm",
            wasmBytes
        });
        // TODO: Send the call to initialize the module
    },

    onProcMessage: function (data)
    {
        if (data.type == "wasm-loaded") {
            console.log("Remote processor assembly loaded.");
            this.proc.port.postMessage({
                type: "init",
                sampleRate: this.ctx.sampleRate
            })
        }
    },

    mute: function ()
    {
        this.proc.disconnect();
    },

    unmute: function ()
    {
        this.proc.connect(this.ctx.destination);
    }
};

const UI =
{
    inTitleScreen: true,

    init: function ()
    {
        // Buttons
        this.aboutButton = new Button(460, 392, 140, 30, "about...", true);
        this.voiceButton = new Button(460, 428, 140, 30, "always voice", true);
        this.wobbleButton = new Button(460, 464, 140, 30, "pitch wobble", true);
    },

    draw: function (ctx)
    {
        // Buttons
        this.aboutButton.draw(ctx);
        this.voiceButton.draw(ctx);
        this.wobbleButton.draw(ctx);
        // Overlay screens
        if (this.inTitleScreen)
            this.drawTitleScreen(ctx);
        else if (!this.aboutButton.state)
            this.drawInstructionsScreen(ctx);
    },

    handleTouches: function (touches)
    {},

    handleTouchStart: function (touch)
    {
        // Set up the audio now that we've been poked
        if (!AudioSystem.ready)
            AudioSystem.init();
        // Overlay screens
        if (this.inTitleScreen) {
            this.inTitleScreen = false;
            return;
        }
        if (!this.aboutButton.state) { // In instructions screen
            // TODO: Unmute audio system
            this.aboutButton.state = true;
            return;
        }
        // Buttons
        this.aboutButton.handleTouchStart(touch);
        this.voiceButton.handleTouchStart(touch);
        this.wobbleButton.handleTouchStart(touch);
    },


    drawTitleScreen: function (ctx)
    {
        // Backdrop
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "white";
        ctx.rect(0, 0, 600, 600);
        ctx.fill();
        // Title text
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = DARK_PINK;
        ctx.strokeStyle = DARK_PINK;
        ctx.font = FONT(50);
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.strokeText("T r a m b o n e", 300, 230);
        ctx.fillText("T r a m b o n e", 300, 230);
        // Subtitle text
        ctx.font = FONT(20);
        ctx.fillText("bare-handed  speech synthesis", 300, 300);
        ctx.fillText("modern remake of Pink Trombone:", 300, 350);
        ctx.fillText("Copyright (C) 2017 Neil Thapen", 300, 380);
        ctx.fillText("dood.al/pinktrombone", 300, 410);
    },

    drawInstructionsScreen: function (ctx)
    {
        // TODO: Mute audio system when in instructions
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "white";
        ctx.rect(0, 0, 600, 600);
        ctx.fill();   
        
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = DARK_PINK;
        ctx.strokeStyle = DARK_PINK;
        ctx.font = FONT(24);
        ctx.lineWidth = 2;
        ctx.textAlign = "center";
        
        ctx.font = FONT(19);
        ctx.textAlign = "left";
        var instructionsLine = 0;
        function write(text)
        {
            ctx.fillText(text, 50, 80 + instructionsLine * 22);
            instructionsLine += 1;
            if (text == "") instructionsLine -= 0.3;
        }

        write("Sound is generated in the glottis (at the bottom left) then ");
        write("filtered by the shape of the vocal tract. The voicebox ");
        write("controls the pitch and intensity of the initial sound.");
        write("");
        write("Then, to talk:");
        write("");
        write("- move the body of the tongue to shape vowels");
        write("");
        write("- touch the oral cavity to narrow it, for fricative consonants");
        write("");
        write("- touch above the oral cavity to close it, for stop consonants");
        write("");
        write("- touch the nasal cavity to open the velum and let sound ");
        write("   flow through the nose.");
        write("");
        write("");
        write("(tap anywhere to continue)");
        
        // ctx.textAlign = "center";
        // ctx.fillText("[tap here to RESET]", 470, 535);
        
        instructionsLine = 18.0;
        ctx.textAlign = "left";
        write("Trambone v0.1.0 by Lilly7084");
        write("");
        write("Remake of Pink Trombone   Copyright (C) 2017 Neil Thapen")
        ctx.fillStyle = "blue";
        ctx.globalAlpha = 0.6;
        write("dood.al/pinktrombone");
    }
};

// ==================== Application framework ====================

const Framework =
{
    width: 600,
    marginTop: 5,
    marginLeft: 5,
    time: Date.now() / 1000,
    touches: [],
    mouseDown: false,

    init: function (applet)
    {
        this.applet = applet;
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.mouseTouch = { alive: false, endTime: 0 };
        document.body.style.cursor = "pointer";
        // Register events
        this.canvas.addEventListener("touchstart", this.startTouches.bind(this));
        this.canvas.addEventListener("touchmove", this.moveTouches.bind(this));
        this.canvas.addEventListener("touchend", this.endTouches.bind(this));
        this.canvas.addEventListener("touchcancel", this.endTouches.bind(this));
        document.addEventListener("mousedown", this.startMouse.bind(this));
        document.addEventListener("mousemove", this.moveMouse.bind(this));
        document.addEventListener("mouseup", this.endMouse.bind(this));
        document.addEventListener("touchstart", function (event) {
            event.preventDefault();
        });
        // Start the show
        this.applet.init();
        requestAnimationFrame(this.draw.bind(this));
    },

    draw: function ()
    {
        this.resizeCanvas();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.applet.draw(this.ctx);
        requestAnimationFrame(this.draw.bind(this));
        this.time = Date.now() / 1000;
        this.updateTouches();
    },

    startTouches: function (event)
    {
        event.preventDefault();
        console.error("Touchscreen support is not yet implemented! (I don't have any touchscreens to test it on)");
    },

    moveTouches: function (event)
    {
        console.error("Touchscreen support is not yet implemented! (I don't have any touchscreens to test it on)");
    },

    endTouches: function (event)
    {
        console.error("Touchscreen support is not yet implemented! (I don't have any touchscreens to test it on)");
    },

    startMouse: function (event)
    {
        event.preventDefault();
        var touch = {};
        touch.startTime = this.time;
        touch.endTime = 0;
        // TODO: Fricative intensity?
        touch.alive = true;
        touch.id = "mouse-" + Math.random();
        touch.x = (event.pageX - this.canvas.offsetLeft) / this.width * 600;
        touch.y = (event.pageY - this.canvas.offsetTop) / this.width * 600;
        // TODO: Index and diameter?
        this.mouseTouch = touch;
        this.touches.push(touch);
        this.applet.handleTouchStart(touch);
        this.applet.handleTouches(this.touches);
    },

    moveMouse: function (event)
    {
        var touch = this.mouseTouch;
        if (!touch.alive) return;
        touch.x = (event.pageX - this.canvas.offsetLeft) / this.width * 600;
        touch.y = (event.pageY - this.canvas.offsetTop) / this.width * 600;
        // TODO: Index and diameter?
        this.applet.handleTouches(this.touches);
    },

    endMouse: function (event)
    {
        var touch = this.mouseTouch;
        if (!touch.alive) return;
        touch.alive = false;
        touch.endTime = this.time;
        this.applet.handleTouches(this.touches);
    },

    updateTouches: function ()
    {
        for (var j = this.touches.length - 1; j >= 0; j--) {
            var touch = this.touches[j];
            // Erase touches which have been dead for more than 1 second
            if (!touch.alive && (this.time > touch.endTime + 1))
                    this.touches.splice(j, 1);
            // TODO: Fricative intensity?
        }
    },
    
    resizeCanvas: function ()
    {
        if (window.innerWidth <= window.innerHeight) {
            this.width = window.innerWidth - 10;
            this.marginLeft = 5;
            this.marginTop = (window.innerHeight - this.width) / 2;
        }
        else {
            this.width = window.innerHeight - 10;
            this.marginLeft = (window.innerWidth - this.width) / 2;
            this.marginTop = 5;
        }
        document.body.style.marginLeft = this.marginLeft.toString() + "px";
        document.body.style.marginTop = this.marginTop.toString() + "px";
        this.canvas.style.width = this.width.toString() + "px";
    }
};

Framework.init(UI);
