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

    mute: async function ()
    {
        this.worklet.disconnect();
    },

    unmute: async function ()
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

const MainUI =
{
    inTitleCard: true,
    inInstructionCard: false,

    touches: [],
    width: 600,
    top: 0,
    left: 0,
    time: 0,

    // ! Incomplete !
    init: async function ()
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
            MainUI.startTouches(event.changedTouches);
        });
        this.tractCanvas.addEventListener("touchmove", function (event) {
            MainUI.moveTouches(event.changedTouches);
        });
        this.tractCanvas.addEventListener("touchend", function (event) {
            MainUI.endTouches(event.changedTouches);
        });
        this.tractCanvas.addEventListener("touchcancel", function (event) {
            MainUI.endTouches(event.changedTouches);
        });

        // Mouse events
        document.addEventListener("mousedown", function (event) {
            event.preventDefault();
            MainUI.startTouches([ {
                pageX: event.pageX,
                pageY: event.pageY,
                identifier: "mouse"
            } ]);
        });
        document.addEventListener("mousemove", function (event) {
            MainUI.moveTouches([ {
                pageX: event.pageX,
                pageY: event.pageY,
                identifier: "mouse"
            } ]);
        });
        document.addEventListener("mouseup", function (event) {
            MainUI.endTouches([ {
                pageX: event.pageX,
                pageY: event.pageY,
                identifier: "mouse"
            } ]);
        });

        requestAnimationFrame(this.update.bind(this));
    },

    // ! Incomplete !
    update: async function ()
    {
        this.resize();
        this.tractCtx.clearRect(0, 0, this.tractCanvas.width, this.tractCanvas.height);

        this.aboutButton.draw(this.tractCtx);
        this.alwaysVoiceButton.draw(this.tractCtx);
        this.pitchWobbleButton.draw(this.tractCtx);

        if (this.inTitleCard)
            this.drawTitleCard();
        else if (this.inInstructionCard)
            this.drawInstructionCard();

        this.time = Date.now() / 1000;
        requestAnimationFrame(this.update.bind(this));
    },

    // ! Incomplete !
    startTouches: async function (touches)
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
            const touch = {
                startTime: this.time,
                endTime: 0,
                alive: true,
                id: _touch.identifier,
                x: (_touch.pageX - this.left) * 600 / this.width,
                y: (_touch.pageY - this.top) * 600 / this.width
            };
            this.touches.push(touch);
            this.aboutButton.handleTouchStart(touch);
            this.alwaysVoiceButton.handleTouchStart(touch);
            this.pitchWobbleButton.handleTouchStart(touch);
        }
    },

    // ! Incomplete !
    moveTouches: async function (touches)
    {},

    // ! Incomplete !
    endTouches: async function (touches)
    {
        if (!this.aboutButton.state) 
        {
            this.inInstructionCard = true;
        }
    },

    resize: async function ()
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

    drawTitleCard: async function ()
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

    drawInstructionCard: async function ()
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
    }
};

MainUI.init();
