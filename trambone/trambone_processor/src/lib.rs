// wasm-pack build --target web
// then copy the *_bg.wasm and *.js into the parent dir of the crate
use biquad::coefficients::{ Coefficients, Type };
use biquad::frequency::*;
use biquad::{ Biquad, DirectForm2Transposed };
use noise::{ NoiseFn, Simplex };
use wasm_bindgen::prelude::*;

// Sample type
type Sample = f32;
// use std::f32::{ exp, ln, max, sin };
use std::f32::consts::{ PI };
const EPSILON: Sample = 0.0001;

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
    noise_buf: Vec<Sample>,
    noise_idx: usize,
    glottis: Glottis,
    tract: Tract
}

#[wasm_bindgen]
impl Trambone {
    pub fn new(sample_rate: Sample, noise_buf: Vec<Sample>, length: usize, nose_length: usize, blade_start: usize, nose_start: usize, tip_start: usize, lip_start: usize) -> Trambone {
        console_error_panic_hook::set_once();
        Trambone {
            noise_buf: noise_buf,
            noise_idx: 0,
            glottis: Glottis::new(sample_rate, 140., 0.6),
            tract: Tract::new(length, nose_length, blade_start, nose_start, tip_start, lip_start)
        }
    }

    pub fn run_step(&mut self, lambda0: Sample, lambda1: Sample) -> Sample {
        let noise = self.noise_buf[self.noise_idx];
        self.noise_idx = (self.noise_idx + 1) % self.noise_buf.len();
        let (vocal, fricative) = self.glottis.run_step(lambda0, noise);
        let filt0 = self.tract.run_step(lambda0, vocal, fricative);
        let filt1 = self.tract.run_step(lambda1, vocal, fricative);
        (filt0 + filt1) * 0.125
    }

    pub fn finish_block(&mut self) {
        self.glottis.finish_block()
    }

    // Getters and setters to interface with javascript side

    pub fn set_frequency(&mut self, frequency: Sample) {
        self.glottis.target_frequency = frequency;
    }

    pub fn set_tenseness(&mut self, tenseness: Sample) {
        self.glottis.target_tenseness = tenseness;
    }

    pub fn set_pitch_wobble(&mut self, wobble: bool) {
        self.glottis.pitch_wobble = wobble;
    }

    pub fn set_tongue(&mut self, index: Sample, diameter: Sample) {
        self.tract.set_tongue(index, diameter);
    }

    pub fn add_constriction(&mut self, index: Sample, diameter: Sample) {
        self.tract.add_constriction(index, diameter);
    }

    pub fn get_throat_diameters(&self) -> Vec::<Sample> {
        self.tract.throat.diameter.clone()
    }
}

// ==================== Glottal source ====================

struct Glottis {
    simplex: Simplex,
    aspirate_filter: DirectForm2Transposed::<Sample>,
    fricative_filter: DirectForm2Transposed::<Sample>,
    // Settings
    target_frequency: Sample,
    target_tenseness: Sample,
    pitch_wobble: bool,
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
    total_time: Sample,
    time_in_waveform: Sample,
    waveform_length: Sample
}

impl Glottis {
    pub fn new(sample_rate: Sample, frequency: Sample, tenseness: Sample) -> Glottis {
        let delta_time = 1. / sample_rate;
        let aspirate_coeffs = Coefficients::<Sample>::from_params(
            /*type*/Type::BandPass, /*fs*/sample_rate.hz(), /*f0*/500.hz(), /*Q*/0.5).unwrap();
        let fricative_coeffs = Coefficients::<Sample>::from_params(
            /*type*/Type::BandPass, /*fs*/sample_rate.hz(), /*f0*/1000.hz(), /*Q*/0.5).unwrap();
        let mut g = Glottis {
            simplex: Simplex::default(),
            aspirate_filter: DirectForm2Transposed::<Sample>::new(aspirate_coeffs),
            fricative_filter: DirectForm2Transposed::<Sample>::new(fricative_coeffs),
            // Settings
            target_frequency: frequency,
            target_tenseness: tenseness,
            pitch_wobble: false,
            // Interpolators
            old_frequency: frequency,
            new_frequency: frequency,
            frequency: frequency,
            old_tenseness: tenseness,
            new_tenseness: tenseness,
            tenseness: tenseness,
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
            total_time: 0.,
            time_in_waveform: 0.,
            waveform_length: 1. / frequency
        };
        g.setup_waveform(0.);
        g
    }

    // Returns excitation, then fricative noise source
    pub fn run_step(&mut self, lambda: Sample, noise: Sample) -> (Sample, Sample) {
        let t = self.time_in_waveform / self.waveform_length;
        self.total_time += self.delta_time;
        self.time_in_waveform += self.delta_time;
        if self.time_in_waveform >= self.waveform_length {
            self.time_in_waveform -= self.waveform_length;
            self.setup_waveform(lambda);
        }
        // Synthesis
        let glottal = self.normalized_lf_waveform(t);
        let (aspirate_mod, fricative_mod) = self.noise_modulator(t);
        let aspirate = self.aspirate_filter.run(noise) * aspirate_mod;
        let fricative = self.fricative_filter.run(noise) * fricative_mod;
        ( glottal + aspirate, fricative )
    }

    pub fn finish_block(&mut self) {
        // TODO: Exponentially approach target frequency
        // Parameter fluctuation
        let mut freq_mod: Sample = 0.; // TODO: Vibrato LFO
        freq_mod += 0.02 * self.noise1d(self.total_time * 4.07);
        freq_mod += 0.04 * self.noise1d(self.total_time * 2.15);
        if self.pitch_wobble {
            freq_mod += 0.2 * self.noise1d(self.total_time * 0.98);
            freq_mod += 0.4 * self.noise1d(self.total_time * 0.5);
        }
        let mut tense_mod: Sample = 0.;
        tense_mod += 0.1 * self.noise1d(self.total_time * 0.46);
        tense_mod += 0.05 * self.noise1d(self.total_time * 0.36);
        // Interpolators
        self.old_frequency = self.new_frequency;
        self.new_frequency = self.target_frequency * (1. + freq_mod);
        self.old_tenseness = self.new_tenseness;
        self.new_tenseness = clamp(self.target_tenseness + tense_mod, EPSILON, 1. - EPSILON);
    }


    fn setup_waveform(&mut self, lambda: Sample) {
        self.frequency = lerp(self.old_frequency, self.new_frequency, lambda);
        self.tenseness = lerp(self.old_tenseness, self.new_tenseness, lambda);
        self.waveform_length = 1. / Sample::max(self.frequency, EPSILON);

        let rd = clamp(3. * (1. - self.tenseness), 0.5, 2.7);
        let ra = -0.01 + 0.048 * rd;
        let rk = 0.224 + 0.118 * rd;
        let rg = (rk / 4.) * (0.5 + 1.2 * rk) / (0.11 * rd - ra * (0.5 + 1.2 * rk));

        let ta = ra;
        let tp = 1. / (2. * rg);
        let te = tp * (1. + rk);

        let epsilon = 1. / ta;
        let shift = Sample::exp(-epsilon * (1. - te));
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

    fn normalized_lf_waveform(&self, t: Sample) -> Sample {
        if self.frequency < EPSILON
            { 0. }
        else if t > self.te
            { (-Sample::exp(-self.epsilon * (t - self.te)) + self.shift) / self.delta }
        else
            { self.e0 * Sample::exp(self.alpha * t) * Sample::sin(self.omega * t) }
    }

    fn noise_modulator(&self, t: Sample) -> (Sample, Sample) {
        let voiced = 0.1 + 0.2 * Sample::max(0., Sample::sin(2. * PI * t));
        let fricative = lerp(0.3, voiced, self.tenseness);
        let aspirate = fricative
            * (1. - Sample::sqrt(self.tenseness))
            * (0.2 + 0.02 * self.noise1d(self.total_time * 1.99));
        ( aspirate, fricative )
    }

    fn noise1d(&self, x: Sample) -> Sample {
        let x: f64 = x.into();
        self.simplex.get([x * 1.2, -x * 0.7]) as Sample
    }
}

// ==================== Tract model ====================

struct Tract {
    // Settings
    glottal_reflection: Sample,
    lip_reflection: Sample,
    // Shape information
    length: usize,
    nose_length: usize,
    blade_start: usize,
    nose_start: usize,
    tip_start: usize,
    lip_start: usize,
    // Waveguide data
    throat_diameter: Vec::<Sample>,
    throat: WaveguideChannel
}

impl Tract {
    pub fn new(length: usize, nose_length: usize, blade_start: usize, nose_start: usize, tip_start: usize, lip_start: usize) -> Tract {
        let glottal_reflection = 0.75;
        let lip_reflection = -0.85;
        let mut t = Tract {
            glottal_reflection: glottal_reflection,
            lip_reflection: lip_reflection,
            length: length,
            nose_length: nose_length,
            blade_start: blade_start,
            nose_start: nose_start,
            tip_start: tip_start,
            lip_start: lip_start,
            throat_diameter: vec![1. as Sample; length],
            throat: WaveguideChannel::new(length, |j| {
                if j < 7 { 0.6 }
                else if j < 12 { 1.1 }
                else { 1.5 }
            })
        };
        t.calculate_reflections();
        t
    }

    pub fn run_step(&mut self, lambda: Sample, vocal: Sample, fricative: Sample) -> Sample {
        self.throat.propagate(lambda);
        self.throat.left().propagate(self.glottal_reflection);
        self.throat.right().propagate(self.lip_reflection);
        self.throat.left().feed(vocal);
        // Write back
        self.throat.commit();
        self.throat.flow_right[self.throat.n-1] //lips
    }

    pub fn finish_block(&mut self) {
        // self.throat.reshape(&self.throat_diameter, 0.); // TODO provide actual delta_time value
        self.calculate_reflections();
    }

    pub fn set_tongue(&mut self, index: Sample, diameter: Sample) {
        // TODO: Implement
    }

    pub fn add_constriction(&mut self, index: Sample, diameter: Sample) {
        // TODO: Implement
    }

    fn calculate_reflections(&mut self) {
        self.throat.calculate_reflections();
    }
}

// ==================== Digital waveguide model ====================

struct WaveguidePort<'a> {
    flow_in: &'a Sample,
    flow_out: &'a mut Sample,
    diameter: &'a Sample
}

impl WaveguidePort<'_> {
    pub fn propagate(&mut self, reflection: Sample) -> Sample {
        *self.flow_out = *self.flow_in * reflection;
        *self.flow_in
    }

    pub fn feed(&mut self, flow: Sample) {
        *self.flow_out += flow;
    }
}

struct WaveguideChannel {
    n: usize,
    diameter: Vec::<Sample>,
    old_reflection: Vec::<Sample>,
    new_reflection: Vec::<Sample>,
    flow_left: Vec::<Sample>,
    flow_right: Vec::<Sample>,
    tmp_flow_left: Vec::<Sample>,
    tmp_flow_right: Vec::<Sample>
}

impl WaveguideChannel {
    pub fn new(n: usize, shape_init: fn(usize)->Sample) -> WaveguideChannel {
        let mut w = WaveguideChannel {
            n: n,
            diameter: vec![0. as Sample; n],
            old_reflection: vec![0. as Sample; n-1],
            new_reflection: vec![0. as Sample; n-1],
            flow_left: vec![0. as Sample; n],
            flow_right: vec![0. as Sample; n],
            tmp_flow_left: vec![0. as Sample; n],
            tmp_flow_right: vec![0. as Sample; n]
        };
        for j in 0..n {
            w.diameter[j] = shape_init(j);
        }
        w.calculate_reflections();
        w
    }

    pub fn propagate(&mut self, lambda: Sample) {
        for j in 0..self.n-1 {
            let in_left = self.flow_left[j+1];
            let in_right = self.flow_right[j];
            let r = lerp(self.old_reflection[j], self.new_reflection[j], lambda);
            let w = r * (in_right + in_left);
            self.tmp_flow_left[j] = in_left + w;
            self.tmp_flow_right[j+1] = in_right - w;
        }
    }

    pub fn commit(&mut self) {
        for j in 0..self.n {
            self.flow_left[j] = self.tmp_flow_left[j];
            self.flow_right[j] = self.tmp_flow_right[j];
        }
    }

    pub fn reshape(&mut self, target: &Vec::<Sample>, delta_time: Sample) {
        // TODO: Implement
        self.calculate_reflections();
    }

    pub fn left(&mut self) -> WaveguidePort {
        WaveguidePort {
            flow_in: &self.flow_left[0],
            flow_out: &mut self.tmp_flow_right[0],
            diameter: &self.diameter[0]
        }
    }

    pub fn right(&mut self) -> WaveguidePort {
        WaveguidePort {
            flow_in: &self.flow_right[self.n-1],
            flow_out: &mut self.tmp_flow_left[self.n-1],
            diameter: &self.diameter[self.n-1]
        }
    }

    fn calculate_reflections(&mut self) {
        let mut prev_area: Sample = self.diameter[0] * self.diameter[0];
        for j in 0..self.n-1 {
            let area = self.diameter[j+1] * self.diameter[j+1];
            self.old_reflection[j] = self.new_reflection[j];
            self.new_reflection[j] =
                if prev_area < EPSILON { 0.999 }
                else { (prev_area - area) / (prev_area + area) };
            prev_area = area;
        }
    }
}
