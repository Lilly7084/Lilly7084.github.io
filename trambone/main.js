Math.clamp = function (num, min, max) {
    if (num < min) return min;
    else if (num > max) return max;
    else return num;
}

const Audio =
{
    started: false,

    // ! Incomplete !
    init: async function ()
    {
        if (this.started) return;
        window.AudioContext = window.AudioContext || window.WebkitAudioContext;
        this.ctx = new window.AudioContext();
        await this.ctx.audioWorklet.addModule("audio_worklet.js");
        this.worklet = new AudioWorkletNode(this.ctx, "trambone-processor");
        this.unmute();
        this.started = true;
    },

    mute: function ()
    {
        this.worklet.disconnect();
    },

    unmute: function ()
    {
        this.worklet.connect(this.ctx.destination);
    }
};

class Button
{
    constructor(x, y, w, h, text, state)
    {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.text = text;
        this.state = state;
    }

    draw(ctx)
    {
        const radius = 10;

        ctx.strokeStyle = "#FFEEF5";
        ctx.fillStyle = "#FFEEF5";
        ctx.globalAlpha = 1.0;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = radius * 2;

        const left = this.x + radius;
        const right = this.x + this.width - radius;
        const top = this.y + radius;
        const bottom = this.y + this.height - radius;

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = this.state ? "orchid" : "white";
        ctx.globalAlpha = this.state ? 0.6 : 1.0;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.fillText(this.text, cx, cy + 6);
    }

    handleTouchStart(touch)
    {
        if (touch.x >= this.x && touch.x <= this.x + this.width &&
            touch.y >= this.y && touch.y <= this.y + this.height) {
            this.state = !this.state;
        }
    }
}

const UI =
{
    originX: 340,
    originY: 449,
    radius: 298,
    scale: 60,
    angleOffset: -0.24,
    angleScale: 0.64,

    lipStart: 0, // ! Incorrect !

    inTitleCard: true,
    inInstructionCard: false,
    touches: [],
    width: 600,
    top: 0,
    left: 0,
    time: 0,

    // ! Incomplete !
    init: function ()
    {
        // Canvases
        this.tractCanvas = document.querySelector("#tractCanvas");
        this.tractCtx = this.tractCanvas.getContext("2d");
        this.backCanvas = document.querySelector("#backCanvas");
        this.backCtx = this.backCanvas.getContext("2d");

        // Buttons
        this.aboutButton = new Button(460, 392, 140, 30, "About...", true);
        this.alwaysVoiceButton = new Button(460, 428, 140, 30, "Always voice", true);
        this.pitchWobbleButton = new Button(460, 464, 140, 30, "Pitch wobble", true);

        // Make 'wherever' touches not mess things up
        document.addEventListener("touchstart", function (event) {
            event.preventDefault();
        });

        // Touch events
        this.tractCanvas.addEventListener("touchstart", function (event) {
            event.preventDefault();
            UI.startTouches(event.changedTouches);
        });
        this.tractCanvas.addEventListener("touchmove", function (event) {
            UI.moveTouches(event.changedTouches);
        });
        this.tractCanvas.addEventListener("touchend", function (event) {
            UI.endTouches(event.changedTouches);
        });
        this.tractCanvas.addEventListener("touchcancel", function (event) {
            UI.endTouches(event.changedTouches);
        });

        // Mouse events
        document.addEventListener("mousedown", function (event) {
            event.preventDefault();
            UI.startTouches([ {
                pageX: event.pageX,
                pageY: event.pageY,
                identifier: "mouse"
            } ]);
        });
        document.addEventListener("mousemove", function (event) {
            UI.moveTouches([ {
                pageX: event.pageX,
                pageY: event.pageY,
                identifier: "mouse"
            } ]);
        });
        document.addEventListener("mouseup", function (event) {
            UI.endTouches([ {
                pageX: event.pageX,
                pageY: event.pageY,
                identifier: "mouse"
            } ]);
        });

        // ...

        requestAnimationFrame(this.draw.bind(this));
    },

    // ! Incomplete !
    draw: function ()
    {
        this.time = Date.now() / 1000;
        this.resize();
        this.tractCtx.clearRect(0, 0, this.tractCanvas.width, this.tractCanvas.height);

        this.aboutButton.draw(this.tractCtx);
        this.alwaysVoiceButton.draw(this.tractCtx);
        this.pitchWobbleButton.draw(this.tractCtx);

        // ...

        if (this.inTitleCard)
            this.drawTitleCard();
        else if (this.inInstructionCard)
            this.drawInstructionCard();

        this.updateTouches();
        requestAnimationFrame(this.draw.bind(this));
    },

    getTouchById: function (id)
    {
        for (const touch of this.touches)
            if (touch.id == id && touch.alive)
                return touch;
        return null;
    },

    getTouchPosition: function (touch)
    {
        const x = (touch.pageX - this.left) * 600 / this.width;
        const y = (touch.pageY - this.top) * 600 / this.width;
        return [x, y];
    },

    getTractPosition: function (x,y)
    {
        const xx = x - this.originX;
        const yy = y - this.originY;
        const angle = Math.atan2(yy, xx) + Math.PI - this.angleOffset;
        const length = Math.sqrt(xx*xx + yy*yy);

        const index = angle * (this.lipStart - 1) / (this.angleScale * Math.PI);
        const diameter = (this.radius - length) / this.scale;
        return [index, diameter];
    },

    startTouches: function (touches)
    {
        Audio.init();
        if (this.inTitleCard) {
            this.inTitleCard = false;
            return;
        }
        if (this.inInstructionCard) {
            this.inInstructionCard = false;
            this.aboutButton.state = true;
            Audio.unmute();
            return;
        }
        for (const _touch of touches) {
            const touch = {};
            touch.startTime = this.time;
            touch.endTime = 0;
            touch.alive = true;
            touch.id = _touch.identifier;
            [touch.x, touch.y] = this.getTouchPosition(_touch);
            [touch.index, touch.diameter] = this.getTractPosition(touch.x, touch.y);
            touch.fricativeIntensity = 0;
            this.touches.push(touch);
            this.aboutButton.handleTouchStart(touch);
            this.alwaysVoiceButton.handleTouchStart(touch);
            this.pitchWobbleButton.handleTouchStart(touch);
        }
        this.handleTouches();
    },

    moveTouches: function (touches)
    {
        for (const _touch of touches) {
            const touch = this.getTouchById(_touch.identifier);
            if (touch != null) {
                [touch.x, touch.y] = this.getTouchPosition(_touch);
                [touch.index, touch.diameter] = this.getTractPosition(touch.x, touch.y);
            }
        }
        this.handleTouches();
    },

    endTouches: function (touches)
    {
        for (const _touch of touches) {
            const touch = this.getTouchById(_touch.identifier);
            if (touch != null) {
                touch.alive = false;
                touch.endTime = this.time;
            }
        }
        if (!this.aboutButton.state) 
            this.inInstructionCard = true;
        this.handleTouches();
    },

    resize: function ()
    {
        const spacing = 5;
        if (window.innerWidth <= window.innerHeight) {
            this.width = window.innerWidth - spacing * 2;
            this.left = spacing;
            this.top = (window.innerHeight - this.width) / 2;
        }
        else {
            this.width = window.innerHeight - spacing * 2;
            this.left = (window.innerWidth - this.width) / 2;
            this.top = spacing;
        }
        document.body.style.marginLeft = this.left + "px";
        document.body.style.marginTop = this.top + "px";
        this.tractCanvas.style.width = this.width + "px";
        this.backCanvas.style.width = this.width + "px";
    },

    drawTitleCard: function ()
    {
        const ctx = this.tractCtx;

        // Backdrop
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 600, 600);

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#C070C6";
        ctx.strokeStyle = "#C070C6";
        ctx.font = "50px Arial";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.strokeText("T r a m b o n e", 300, 230);
        ctx.fillText("T r a m b o n e", 300, 230);
        
        ctx.font = "28px Arial";
        ctx.fillText("bare-handed  speech synthesis", 300, 330);

        ctx.font = "20px Arial";        
        ctx.fillText("(tap to start)", 300, 380);   
    },

    drawInstructionCard: function ()
    {
        Audio.mute();
        const ctx = this.tractCtx;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "white";
        ctx.fillRect(0,0,600,600);

        const instructions =
                "Sound is generated in the glottis (at the bottom left) then\nfiltered by the shape of the vocal tract. "+
                "The voicebox\ncontrols the pitch and intensity of the initial sound.\n\n"+
                "Then, to talk:\n\n"+
                "- Move the body of the tongue to shape vowels\n\n"+
                "- Touch the oral cavity to narrow it, for fricative consonants\n\n"+
                "- Touch above the oral cavity to close it, for stop consonants\n\n"+
                "- Touch the nasal cavity to open the velum and let sound\n   flow through the nose\n\n\n"+
                "(tap anywhere to continue)";
        
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#C070C6";
        ctx.strokeStyle = "#C070C6";
        ctx.font = "19px Arial";
        ctx.lineWidth = 2;
        ctx.textAlign = "left";

        var py = 100;
        for (const line of instructions.split("\n")) {
            ctx.fillText(line, 50, py);
            py += 22;
            if (line == "")
                py -= 6.6;
        }

        ctx.globalAlpha = 1.0;
    },

    updateTouches: function ()
    {
        const fricativeAttackTime = 0.1;
        for (const [i, touch] of this.touches.entries()) {
            // Delete touches which have been expired long enough to be useless
            if (!touch.alive && (this.time > touch.endTime + 1))
                this.touches.splice(i, 1);
            else {
                const ramp = (this.time - touch.startTime) / fricativeAttackTime;
                const clamp = Math.clamp(ramp, 0, 1);
                touch.fricativeIntensity = touch.alive ? clamp : (1 - clamp);
            }
        }
    },

    // ! Incomplete !
    handleTouches: function ()
    {}
};

UI.init();
