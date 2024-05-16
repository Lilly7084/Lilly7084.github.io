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
            // TODO: Implement
        }
    }

    process (_inputs, outputs, _params)
    {
        const out = outputs[0][0]; // Attachment 0, channel 0 (TODO: Does this output left only?)
        for (var j = 0; j < out.length; j++) {
            out[j] = this.proc.run_step(0.); // TODO provide lambda
        }
        this.proc.finish_block();
        return true;
    }
}

registerProcessor("trambone-processor", TramboneProcessor);
