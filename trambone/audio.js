import "./TextEncoder.js";
import init, {Trambone} from "./trambone_processor.js";

class TramboneProcessor extends AudioWorkletProcessor
{
    constructor ()
    {
        super();
        this.port.onmessage = (event) => this.message(event.data);
    }

    message (event)
    {
        switch (event.type) {
            // Host is sending over the WASM module for the processor
            case "send-wasm":
                init(WebAssembly.compile(event.wasmBytes)).then(() => {
                    this.port.postMessage({
                        type: "wasm-loaded"
                    });
                });
                break;
            // Host is telling us to (re)initialize the processor
            case "init":
                // Generate a 1 second noise buffer
                var noiseBuf = [];
                for (var j = 0; j < event.sampleRate; j++)
                    noiseBuf.push(Math.random());
                this.proc = Trambone.new(event.sampleRate, noiseBuf,
                    event.length,
                    event.noseLength,
                    event.bladeStart,
                    event.noseStart,
                    event.tipStart,
                    event.lipStart
                );
                this.port.postMessage({
                    type: "ready"
                });
                break;
            // Host is sending a new batch of parameters
            case "send-params":
                this.proc.set_frequency(event.frequency);
                this.proc.set_tenseness(event.tenseness);
                this.proc.set_pitch_wobble(event.pitchWobble);
                this.proc.set_tongue(event.tongue.index, event.tongue.diameter);
                for (const cons of event.constrictions)
                    this.proc.add_constriction(cons.index, cons.diameter);
                // Reshaping happens immediately when the params are sent,
                // so we can send back the calculated tract shape now.
                this.port.postMessage({
                    type: "tract-shape",
                    throat: this.proc.get_throat_diameters()
                })
                break;
        }
    }

    process (_inputs, outputs, _params)
    {
        // Only process the audio if the synth has already been loaded!
        if (this.proc) {
            const out = outputs[0][0];
            for (var j = 0; j < out.length; j++) {
                const lambda0 = j / out.length;
                const lambda1 = (j + 0.5) / out.length;
                var synth = this.proc.run_step(lambda0, lambda1);
                if (isNaN(synth)) {
                    console.error("STOP: Synthesizer produced NaN result!");
                    return false;
                }
                out[j] = synth;
            }
            this.proc.finish_block();
        }
        return true;
    }
}

registerProcessor("trambone-processor", TramboneProcessor);
