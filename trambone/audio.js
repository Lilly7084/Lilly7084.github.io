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
                this.proc = Trambone.new(event.sampleRate, noiseBuf);
                this.port.postMessage({
                    type: "ready"
                });
                break;
            // Host is sending a new batch of parameters
            case "send-params":
                this.proc.set_frequency(event.frequency);
                this.proc.set_tenseness(event.tenseness);
                this.proc.set_pitch_wobble(event.pitchWobble);
                break;
        }
    }

    process (_inputs, outputs, _params)
    {
        const out = outputs[0][0]; // Attachment 0, channel 0 (TODO: Does this output left only?)
        for (var j = 0; j < out.length; j++) {
            const lambda0 = j / out.length;
            // TODO: Tract needs to be clocked twice as fast as glottis
            out[j] = this.proc.run_step(lambda0);
        }
        this.proc.finish_block();
        return true;
    }
}

registerProcessor("trambone-processor", TramboneProcessor);
