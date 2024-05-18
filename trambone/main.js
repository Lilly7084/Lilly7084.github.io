"use strict";

// Settings
const PALE_PINK = "#ffeef5";
const DARK_PINK = "#c070c6";
const FONT = (size) => size.toString() + "px Arial";

Math.clamp = function(number, min, max)
{
    if (number<min) return min;
    else if (number>max) return max;
    else return number;
}

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
    loading: false,
    ready: false,

    init: function ()
    {
        if (this.loading)
            return; // Don't let init() be poked more than once.
        this.loading = true;
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        this.ctx = new AudioContext();
        // await this.ctx.resume();
        this.initProcessor();
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
            // WASM module has been loaded. Now to instantiate the synth.
            this.proc.port.postMessage({
                type: "init",
                sampleRate: this.ctx.sampleRate
            });
        }
        else if (data.type == "ready") {
            // Synth is ready, so patch it in!
            console.log("Audio synthesizer initialized.");
            this.unmute();
            this.ready = true;
        }
    },

    pushParams: function ()
    {
        if (this.ready) // Only push if the synth is ready to handle the message
            this.proc.port.postMessage({
                type: "send-params",
                frequency: Glottis.frequency,
                tenseness: Glottis.tenseness,
                pitchWobble: UI.wobbleButton.state,
                tongue: { index: 12.9, diameter: 2.43 },
                constrictions: []
            });
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

const Glottis =
{
    frequency: 140.6,
    tenseness: 0.6,
    x: 240,
    y: 530,
    touch: 0,

    KEYBOARD_LEFT: 0,
    KEYBOARD_TOP: 500,
    KEYBOARD_WIDTH: 600,
    KEYBOARD_HEIGHT: 100,
    BAR1_TOP: 0.0,
    BAR1_BOTTOM: 0.4,
    BAR2_TOP: 0.52,
    BAR2_BOTTOM: 0.72,
    SEMITONES: 20,
    SEMI_MARKS: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    BASE_NOTE: 87.3071, // F2

    init: function ()
    {},

    draw: function (ctx)
    {
        this.drawKeyboard(ctx);
        // Pitch control
        const w = 9;
        const h = 15;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "orchid";
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(this.x - w, this.y - h);
        ctx.lineTo(this.x + w, this.y - h);
        ctx.lineTo(this.x + w, this.y + h);
        ctx.lineTo(this.x - w, this.y + h);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 0.15;
        ctx.fill();
    },

    handleTouches: function (touches)
    {
        // Release current touch handle if it's dead
        if (this.touch != 0 && !this.touch.alive)
            this.touch = 0;
        // Find a suitable touch to fill its place
        if (this.touch == 0)
            for (var j = 0; j < touches.length; j++) {
                const touch = touches[j];
                if (!touch.alive ||
                    touch.x < this.KEYBOARD_LEFT ||
                    touch.x > this.KEYBOARD_LEFT + this.KEYBOARD_WIDTH ||
                    touch.y < this.KEYBOARD_TOP ||
                    touch.y > this.KEYBOARD_TOP + this.KEYBOARD_HEIGHT)
                    continue;
                this.touch = touch;
            }
        // The rest of the code is only relevant if there is a touch
        if (this.touch == 0)
            return;
        // TODO: Refactor and clean up this code, ported from original PT
        const y = Math.clamp(this.touch.y - this.KEYBOARD_TOP - 10,
                0, this.KEYBOARD_HEIGHT - 26);
        this.x = this.touch.x;
        this.y = y + this.KEYBOARD_TOP + 10;
        const semitone = (this.touch.x - this.KEYBOARD_LEFT)
                * this.SEMITONES / this.KEYBOARD_WIDTH + 0.5;
        this.frequency = this.BASE_NOTE * Math.pow(2, semitone / 12);
        // if (Glottis.intensity == 0) Glottis.smoothFrequency = Glottis.UIFrequency;
        const t = Math.clamp(1 - y / (this.KEYBOARD_HEIGHT - 28), 0, 1);
        // FIXME: Really low tenseness makes the sound cut out.
        // I don't know where this issue is coming from, but Pink Trombone doesn't have it.
        this.tenseness = 1 - Math.cos(0.5 * Math.PI * t);
        // Glottis.loudness = Math.pow(Glottis.UITenseness, 0.25);
    },

    handleTouchStart: function (touch)
    {},


    drawKeyboard: function (ctx)
    {
        ctx.strokeStyle = PALE_PINK;
        ctx.fillStyle = PALE_PINK;
        ctx.globalAlpha = 1.0;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        this.drawRibbon(ctx, this.BAR1_TOP, this.BAR1_BOTTOM, 8);
        this.drawRibbon(ctx, this.BAR2_TOP, this.BAR2_BOTTOM, 8);
        // Vertical markings
        ctx.strokeStyle = "orchid";
        ctx.fillStyle = "orchid";
        const keyWidth = this.KEYBOARD_WIDTH / this.SEMITONES;
        const radius = 9;
        for (var j = 0; j < this.SEMITONES; j++) {
            const x = this.KEYBOARD_LEFT + (j + 1/2) * keyWidth;
            const marked = this.SEMI_MARKS[(j + 3) % 12] == 1;
            // Top ribbon
            ctx.lineWidth = marked ? 4 : 3;
            ctx.globalAlpha = marked ? 0.4 : 0.2;
            ctx.beginPath();
            ctx.moveTo(x, this.KEYBOARD_TOP + this.KEYBOARD_HEIGHT * this.BAR1_TOP    + radius);
            ctx.lineTo(x, this.KEYBOARD_TOP + this.KEYBOARD_HEIGHT * this.BAR1_BOTTOM - radius);
            ctx.stroke();
            // Bottom ribbon
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.moveTo(x, this.KEYBOARD_TOP + this.KEYBOARD_HEIGHT * this.BAR2_TOP    + radius);
            ctx.lineTo(x, this.KEYBOARD_TOP + this.KEYBOARD_HEIGHT * this.BAR2_BOTTOM - radius);
            ctx.stroke();
        }
        // Text
        ctx.font = FONT(17);
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.7;
        ctx.fillText("voicebox control", 300, 490);
        ctx.fillText("pitch", 300, 592);
        // Arrows 
        ctx.globalAlpha = 0.3;
        ctx.save();
        ctx.translate(410, 587);
        this.drawArrow(ctx, 80, 2, 10);
        ctx.translate(-220, 0);
        ctx.rotate(Math.PI);
        this.drawArrow(ctx, 80, 2, 10);
        ctx.restore();
    },

    drawRibbon: function (ctx, topFac, bottomFac, radius)
    {
        const left = this.KEYBOARD_LEFT + radius;
        const right = this.KEYBOARD_LEFT + this.KEYBOARD_WIDTH - radius;
        const top = this.KEYBOARD_TOP + topFac * this.KEYBOARD_HEIGHT + radius;
        const bottom = this.KEYBOARD_TOP + bottomFac * this.KEYBOARD_HEIGHT - radius;
        ctx.lineWidth = radius * 2; 
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    },

    drawArrow: function (ctx, length, headWidth, headLength)
    {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-length, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, -headWidth);
        ctx.lineTo(headLength, 0);
        ctx.lineTo(0, headWidth);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
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
        // Subsystems
        Glottis.init();
    },

    draw: function (ctx)
    {
        AudioSystem.pushParams();
        // Buttons
        this.aboutButton.draw(ctx);
        this.voiceButton.draw(ctx);
        this.wobbleButton.draw(ctx);
        // Subsystems
        Glottis.draw(ctx);
        // Overlay screens
        if (this.inTitleScreen)
            this.drawTitleScreen(ctx);
        else if (!this.aboutButton.state)
            this.drawInstructionsScreen(ctx);
    },

    handleTouches: function (touches)
    {
        // Ignore if we're in an overlay screen
        if (this.inTitleScreen || !this.aboutButton.state)
            return;
        // Subsystems
        Glottis.handleTouches(touches);
    },

    handleTouchStart: function (touch)
    {
        AudioSystem.init(); // We've been poked, so the audio context will now work
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
        // Subsystems
        Glottis.handleTouchStart(touch);
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
