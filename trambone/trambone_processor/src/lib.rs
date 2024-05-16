// wasm-pack build --target web
// then copy the *_bg.wasm and *.js into the parent dir of the crate
use wasm_bindgen::prelude::*;
use std::f32;

#[wasm_bindgen]
pub struct Trambone {
    delta_time: f32,
    time_in_waveform: f32,
    waveform_length: f32
    // ...
}

#[wasm_bindgen]
impl Trambone {
    pub fn new(sample_rate: f32) -> Trambone {
        Trambone {
            delta_time: 1. / sample_rate,
            time_in_waveform: 0.,
            waveform_length: 1. / 440.
        }
    }

    pub fn run_step(&mut self, lambda: f32) -> f32 {
        self.time_in_waveform += self.delta_time;
        if self.time_in_waveform >= self.waveform_length {
            self.time_in_waveform -= self.waveform_length;
        }
        (self.time_in_waveform / self.waveform_length * 2. * std::f32::consts::PI).sin()
    }

    pub fn finish_block(&self) -> () {
        // ...
    }
}
