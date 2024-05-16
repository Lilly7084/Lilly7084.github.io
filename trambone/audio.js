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
        if (event.type == "send-wasm") {
            init(WebAssembly.compile(event.wasmBytes)).then(() => {
                this.port.postMessage({
                    type: "wasm-loaded"
                });
            });
        }
        else if (event.type == "init") {
            const { sampleRate } = event;
            this.proc = Trambone.new(sampleRate);
        }
        else if (event.type == "send-params") {
            this.proc.set_frequency(event.frequency);
            this.prox.set_tenseness(event.tenseness);
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
