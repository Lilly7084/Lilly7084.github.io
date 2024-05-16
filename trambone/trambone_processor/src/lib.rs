// wasm-pack build --target web
// then copy the *_bg.wasm and *.js into the parent dir of the crate
use wasm_bindgen::prelude::*;

// Sample type
type Sample = f32;
// use std::f32::{ exp, ln, max, sin };
use std::f32::consts::{ PI };

fn clamp(x: Sample, l: Sample, h: Sample) -> Sample {
    if x < l {l}
    else if x > h {h}
    else {x}
}

fn lerp(a: Sample, b: Sample, fac: Sample) -> Sample {
    a + fac * (b - a)
}

// ==================== Top-level module ====================

#[wasm_bindgen]
pub struct Trambone {
    glottis: Glottis
}

#[wasm_bindgen]
impl Trambone {
    pub fn new(sample_rate: Sample) -> Trambone {
        let delta_time = 1. / sample_rate;
        Trambone {
            glottis: Glottis::new(delta_time)
        }
    }

    pub fn run_step(&mut self, lambda: Sample) -> Sample {
        let (excitation, noise_modulator) = self.glottis.run_step(lambda);
        excitation
    }

    pub fn finish_block(&mut self) -> () {
        self.glottis.finish_block()
    }

    pub fn set_frequency(&mut self, frequency: Sample) -> () {
        self.glottis.target_frequency = frequency;
    }

    pub fn set_tenseness(&mut self, tenseness: Sample) -> () {
        self.glottis.target_tenseness = tenseness;
    }
}

// ==================== Glottal source (Lin-Fant model) ====================

pub struct Glottis {
    // Settings
    target_frequency: Sample,
    target_tenseness: Sample,
    // Interpolators
    old_frequency: Sample,
    new_frequency: Sample,
    frequency: Sample,
    old_tenseness: Sample,
    new_tenseness: Sample,
    tenseness: Sample,
    // DDS parameters
    te: Sample,
    epsilon: Sample,
    shift: Sample,
    delta: Sample,
    e0: Sample,
    alpha: Sample,
    omega: Sample,
    // Synthesizer state
    delta_time: Sample,
    time_in_waveform: Sample,
    waveform_length: Sample
}

impl Glottis {
    pub fn new(delta_time: Sample) -> Glottis {
        let FREQUENCY = 140.;
        let TENSENESS = 0.6;
        Glottis {
            // Settings
            target_frequency: FREQUENCY,
            target_tenseness: TENSENESS,
            // Interpolators
            old_frequency: FREQUENCY,
            new_frequency: FREQUENCY,
            frequency: FREQUENCY,
            old_tenseness: TENSENESS,
            new_tenseness: TENSENESS,
            tenseness: TENSENESS,
            // DDS parameters
            te: 0.,
            epsilon: 0.,
            shift: 0.,
            delta: 0.,
            e0: 0.,
            alpha: 0.,
            omega: 0.,
            // Synthesizer state
            delta_time: delta_time,
            time_in_waveform: 0.,
            waveform_length: 1. / FREQUENCY
        }
    }

    // Returns excitation, then noise modulator
    pub fn run_step(&mut self, lambda: Sample) -> (Sample, Sample) {
        // Phase accumulator
        let t = self.time_in_waveform / self.waveform_length;
        self.time_in_waveform += self.delta_time;
        if self.time_in_waveform >= self.waveform_length {
            self.time_in_waveform -= self.waveform_length;
            self.setup_waveform(lambda);
        }
        // Synthesis
        ( self.normalized_lf_waveform(t), self.noise_modulator(t) )
    }

    pub fn finish_block(&mut self) -> () {
        // TODO: Exponentially approach target frequency
        // TODO: Vibrato
        // Interpolators
        self.old_frequency = self.new_frequency;
        self.new_frequency = self.target_frequency;
        self.old_tenseness = self.new_tenseness;
        self.new_tenseness = self.target_tenseness;
    }


    pub fn setup_waveform(&mut self, lambda: Sample) -> () {
        self.frequency = lerp(self.old_frequency, self.new_frequency, lambda);
        self.tenseness = lerp(self.old_tenseness, self.new_tenseness, lambda);
        self.waveform_length = 1. / Sample::max(self.frequency, 0.0001);

        let rd = clamp(3. * (1. - self.tenseness), 0.5, 2.7);
        let ra = -0.01 + 0.048 * rd;
        let rk = 0.224 + 0.118 * rd;
        let rg = (rk / 4.) * (0.5 + 1.2 * rk) / (0.11 * rd - ra * (0.5 + 1.2 * rk));

        let ta = ra;
        let tp = 1. / (2. * rg);
        let te = tp * (1. + rk);

        let epsilon = 1. / ta;
        let shift = Sample::exp(-self.epsilon * (1. - te));
        let delta = 1. - shift;

        let rhs_int = ((1. / epsilon) * (shift - 1.) + (1. - te) * shift) / delta;
        let tl_int = -(te - tp) / 2. + rhs_int;
        let tu_int = -tl_int;

        let omega = PI / tp;
        let s = Sample::sin(omega * te);
        let y = -PI * s * tu_int / (tp * 2.);
        let z = Sample::ln(y);
        let alpha = z / (tp / 2. - te);
        let e0 = -1. / (s * Sample::exp(alpha * te));

        self.te = te;
        self.epsilon = epsilon;
        self.shift = shift;
        self.delta = delta;
        self.e0 = e0;
        self.alpha = alpha;
        self.omega = omega;
    }

    pub fn normalized_lf_waveform(&self, t: Sample) -> Sample {
        if t > self.te
            { (-Sample::exp(-self.epsilon * (t - self.te)) + self.shift) / self.delta }
        else
            { self.e0 * Sample::exp(self.alpha * t) * Sample::sin(self.omega * t) }
    }

    pub fn noise_modulator(&self, t: Sample) -> Sample {
        let voiced = 0.1 + 0.2 * Sample::max(0., Sample::sin(2. * PI * t));
        lerp(0.3, voiced, self.tenseness)
    }
}
