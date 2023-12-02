Math.clamp = function (num, min, max)
{
    if (num < min) return min;
    else if (num > max) return max;
    else return num;
}

const canvas = document.querySelector("#tractCanvas");
const ctx = canvas.getContext("2d");

const Audio =
{
    started: false,

    init: async function ()
    {
        if (this.started) return;
        window.AudioContext = window.AudioContext || window.WebkitAudioContext;
        this.ctx = new window.AudioContext();
        await this.ctx.audioWorklet.addModule("audio_worklet.js");
        this.worklet = new AudioWorkletNode(this.ctx, "trambone-processor");

        // White noise generator
        const frameCount = 2 * this.ctx.sampleRate; // 2 second loop
        const buffer = this.ctx.createBuffer(1, frameCount, this.ctx.sampleRate);
        const channel = buffer.getChannelData(0);
        for (var i = 0; i < frameCount; i++)
            channel[i] = Math.random();
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        // Aspirate noise filter
        const aspirateFilter = this.ctx.createBiquadFilter();
        aspirateFilter.type = "bandpass";
        aspirateFilter.frequency.value = 500;
        aspirateFilter.Q.value = 0.5;
        whiteNoise.connect(aspirateFilter);
        aspirateFilter.connect(this.worklet);

        // Fricative noise filter
        const fricativeFilter = this.ctx.createBiquadFilter();
        fricativeFilter.type = "bandpass";
        fricativeFilter.frequency.value = 1000;
        fricativeFilter.Q.value = 0.5;
        whiteNoise.connect(fricativeFilter);
        fricativeFilter.connect(this.worklet);

        whiteNoise.start(0);
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

const MainUI =
{
    inTitleCard: true,
    inInstructionCard: false,
    touches: [],
    width: 600,
    top: 0,
    left: 0,
    time: 0,

    init: function ()
    {
        // Buttons
        this.aboutButton = new Button(460, 392, 140, 30, "About...", true);
        this.alwaysVoiceButton = new Button(460, 428, 140, 30, "Always voice", true);
        this.pitchWobbleButton = new Button(460, 464, 140, 30, "Pitch wobble", true);

        // Make 'wherever' touches not mess things up
        document.addEventListener("touchstart", function (event) {
            event.preventDefault();
        });

        // Touch events
        canvas.addEventListener("touchstart", function (event) {
            event.preventDefault();
            MainUI.startTouches(event.changedTouches);
        });
        canvas.addEventListener("touchmove", function (event) {
            MainUI.moveTouches(event.changedTouches);
        });
        canvas.addEventListener("touchend", function (event) {
            MainUI.endTouches(event.changedTouches);
        });
        canvas.addEventListener("touchcancel", function (event) {
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

        Glottis.init();
        Tract.init();

        requestAnimationFrame(this.draw.bind(this));
    },

    draw: function ()
    {
        this.time = Date.now() / 1000;
        this.resize();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.aboutButton.draw(ctx);
        this.alwaysVoiceButton.draw(ctx);
        this.pitchWobbleButton.draw(ctx);

        Glottis.draw();
        Tract.draw();

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
            [touch.index, touch.diameter] = Tract.getTractPosition(touch.x, touch.y);
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
                [touch.index, touch.diameter] = Tract.getTractPosition(touch.x, touch.y);
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
        canvas.style.width = this.width + "px";
    },

    drawTitleCard: function ()
    {
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

    handleTouches: function ()
    {
        Glottis.handleTouches();
        Tract.handleTouches();
    }
};

const Glottis =
{
    init: function ()
    {},

    draw: function ()
    {},

    handleTouches: function ()
    {}
};

const Tract =
{
    originX: 340,
    originY: 449,
    radius: 298,
    scale: 60,
    angleOffset: -0.24,
    angleScale: 0.64,

    n: 44,
    bladeStart: 10,
    tipStart: 32,
    lipStart: 39,
    noseLength: 28,
    noseOffset : -0.8,

    // TODO: Allow tongue position to be controlled
    tongueIndex: 12.9,
    tongueDiameter: 2.43,

    init: function ()
    {
        this.diameter = new Float64Array(this.n);
        this.restDiameter = new Float64Array(this.n);
        for (var i = 0; i < this.n; i++) {
            var diameter = 0;
            if (i < 7 * this.n / 44 + 0.5) diameter = 0.6;
            else if (i < 12 * this.n / 44) diameter = 1.1;
            else diameter = 1.5;
            this.diameter[i] = this.restDiameter[i] = diameter;
        }

        this.noseStart = this.n - this.noseLength + 1;
        this.noseDiameter = new Float64Array(this.noseLength);
        for (var i = 0; i < this.noseLength; i++) {
            const d = 2 * i / this.noseLength;
            var diameter;
            if (d < 1) diameter = 0.4 + 1.6 * d;
            else diameter = 0.5 + 1.5 * (2 - d);
            diameter = Math.min(diameter, 1.9);
            this.noseDiameter[i] = diameter;
        }
    },

    draw: function ()
    {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const velum = this.noseDiameter[0];
        const velumAngle = velum * 4;

        // TODO: Tongue control

        // Oral cavity fill
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "pink";
        ctx.fillStyle = "pink";
        this.moveTo(1, 0);
        for (var i = 1; i < this.n; i++)
            this.lineTo(i, this.diameter[i]);
        for (var i = this.n-1; i >= 2; i--)
            this.lineTo(i, 0);
        ctx.closePath();
        // ctx.stroke();
        ctx.fill();

        // Nasal cavity fill
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "pink";
        ctx.fillStyle = "pink";
        this.moveTo(this.noseStart, this.noseOffset);
        for (var i = 1; i < this.noseLength; i++)
            this.lineTo(i + this.noseStart, this.noseOffset - this.noseDiameter[i] * 0.9);
        for (var i = this.noseLength - 1; i >= 1; i--)
            this.lineTo(i + this.noseStart, this.noseOffset);
        ctx.closePath();
        ctx.fill();

        // Velum fill
        ctx.beginPath();
        // ctx.lineWidth = 2;
        // ctx.strokeStyle = "pink";
        // ctx.fillStyle = "pink";
        this.moveTo(this.noseStart - 2, 0);
        this.lineTo(this.noseStart, this.noseOffset);
        this.lineTo(this.noseStart + velumAngle, this.noseOffset);
        this.lineTo(this.noseStart + velumAngle - 2, 0);
        ctx.closePath();
        // ctx.stroke();
        ctx.fill();

        // Text
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.globalAlpha = 1.0;
        this.drawText(this.n * 0.1, 0.425, "throat");
        this.drawText(this.n * 0.71, -1.8, "nasal");
        this.drawText(this.n * 0.71, -1.3, "cavity");
        ctx.font = "22px Arial";
        this.drawText(this.n * 0.6, 0.9, "oral");
        this.drawText(this.n * 0.7, 0.9, "cavity");
        ctx.fillStyle = "orchid";
        ctx.globalAlpha = 0.7;
        this.drawText(this.n * 0.95, 0.8 + 0.8 * this.diameter[this.n - 1], "lip");

        // TODO: Draw amplitudes?

        // Oral cavity stroke
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#C070C6";
        // ctx.lineJoin = "round";
        // ctx.lineCap = "round";
        this.moveTo(1, this.diameter[0]);
        for (var i = 2; i < this.n; i++)
            this.lineTo(i, this.diameter[i]);
        this.moveTo(1, 0);
        for (var i = 2; i <= this.noseStart - 2; i++)
            this.lineTo(i, 0);
        this.moveTo(this.noseStart + velumAngle - 2, 0);
        for (var i = this.noseStart + Math.ceil(velumAngle) - 2; i < this.n; i++)
            this.lineTo(i, 0);
        ctx.stroke();

        // Nasal cavity stroke
        ctx.beginPath();
        // ctx.lineWidth = 5;
        // ctx.strokeStyle = "#C070C6";
        // ctx.lineJoin = "round";
        this.moveTo(this.noseStart, this.noseOffset);
        for (var i = 1; i < this.noseLength; i++)
            this.lineTo(i + this.noseStart, this.noseOffset - this.noseDiameter[i] * 0.9);
        this.moveTo(this.noseStart + velumAngle, this.noseOffset);
        for (var i = Math.ceil(velumAngle); i < this.noseLength; i++)
            this.lineTo(i + this.noseStart, this.noseOffset);
        ctx.stroke();

        // Velum stroke
        ctx.globalAlpha = velum * 5;
        ctx.beginPath();
        this.moveTo(this.noseStart - 2, 0);
        this.lineTo(this.noseStart, this.noseOffset);
        this.moveTo(this.noseStart + velumAngle - 2, 0);
        this.lineTo(this.noseStart + velumAngle, this.noseOffset);
        ctx.stroke();
    },

    handleTouches: function ()
    {},

    getTractPosition: function (x, y)
    {
        const xx = x - this.originX;
        const yy = y - this.originY;
        const angle = Math.atan2(yy, xx) + Math.PI - this.angleOffset;
        const length = Math.sqrt(xx*xx + yy*yy);

        const index = angle * (this.lipStart - 1) / (this.angleScale * Math.PI);
        const diameter = (this.radius - length) / this.scale;
        return [index, diameter];
    },

    moveTo: function (i, d)
    {
        // TODO: Wobble based on sound intensity?
        const angle = this.angleOffset + i * this.angleScale * Math.PI / (this.lipStart - 1);
        const r = this.radius - this.scale * d;
        const x = this.originX - r * Math.cos(angle);
        const y = this.originY - r * Math.sin(angle);
        ctx.moveTo(x, y);
    },

    lineTo: function (i, d)
    {
        // TODO: Wobble based on sound intensity?
        const angle = this.angleOffset + i * this.angleScale * Math.PI / (this.lipStart - 1);
        const r = this.radius - this.scale * d;
        const x = this.originX - r * Math.cos(angle);
        const y = this.originY - r * Math.sin(angle);
        ctx.lineTo(x, y);
    },

    drawText: function (i, d, text)
    {
        const angle = this.angleOffset + i * this.angleScale * Math.PI / (this.lipStart - 1);
        const r = this.radius - this.scale * d;
        const x = this.originX - r * Math.cos(angle);
        const y = this.originY - r * Math.sin(angle);
        ctx.save();
        ctx.translate(x, y + 2);
        ctx.rotate(angle - Math.PI / 2);
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }
};

MainUI.init();
