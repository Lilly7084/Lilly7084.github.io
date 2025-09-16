// geneMap.js : Lookup tables for the layout of Wobbledog genetic information
// Extracted from file: Dog_12.0.prefab
// Applicable to game version 1.05d.00

// Static genes: STANDARD and LOOPED types. STANDARD is functionally the same
// as LOOPED with a loop count of 1, so I can store them together.
const STATIC_GENES = [
    { name: "Random Seed",                     length: 10, loopCount:  1, plusMinus: false },
    { name: "Body Metallic",                   length:  5, loopCount:  1, plusMinus: true  },
    { name: "Body Gloss",                      length:  5, loopCount:  1, plusMinus: true  },
    { name: "Body Emission Color (Red)",       length:  5, loopCount:  1, plusMinus: true  },
    { name: "Body Emission Color (Green)",     length:  5, loopCount:  1, plusMinus: true  },
    { name: "Body Emission Color (Blue)",      length:  5, loopCount:  1, plusMinus: true  },
    { name: "Body Color (Red)",                length:  5, loopCount:  1, plusMinus: true  },
    { name: "Body Color (Green)",              length:  5, loopCount:  1, plusMinus: true  },
    { name: "Body Color (Blue)",               length:  5, loopCount:  1, plusMinus: true  },
    { name: "Leg Metallic",                    length:  5, loopCount:  1, plusMinus: true  },
    { name: "Leg Gloss",                       length:  5, loopCount:  1, plusMinus: true  },
    { name: "Leg Emission Color (Red)",        length:  5, loopCount:  1, plusMinus: true  },
    { name: "Leg Emission Color (Green)",      length:  5, loopCount:  1, plusMinus: true  },
    { name: "Leg Emission Color (Blue)",       length:  5, loopCount:  1, plusMinus: true  },
    { name: "Leg Color (Red)",                 length:  5, loopCount:  1, plusMinus: true  },
    { name: "Leg Color (Green)",               length:  5, loopCount:  1, plusMinus: true  },
    { name: "Leg Color (Blue)",                length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose/Ear Metallic",               length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose/Ear Gloss",                  length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose/Ear Emission Color (Red)",   length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose/Ear Emission Color (Green)", length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose/Ear Emission Color (Blue)",  length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose/Ear Color (Red)",            length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose/Ear Color (Green)",          length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose/Ear Color (Blue)",           length:  5, loopCount:  1, plusMinus: true  },
    { name: "Nose Size",                       length:  5, loopCount:  1, plusMinus: true  },
    { name: "Horn Size",                       length:  5, loopCount:  1, plusMinus: true  },
    { name: "Ear Length",                      length:  5, loopCount:  1, plusMinus: true  },
    { name: "Ear Curl Left",                   length:  5, loopCount:  1, plusMinus: false },
    { name: "Ear Curl Right",                  length:  5, loopCount:  1, plusMinus: false },
    { name: "Snout Rotation",                  length:  5, loopCount:  1, plusMinus: true  },
    { name: "Snout Length",                    length:  5, loopCount:  1, plusMinus: true  },
    { name: "Snout Size",                      length:  5, loopCount:  1, plusMinus: true  },
    { name: "Head Size",                       length:  5, loopCount:  1, plusMinus: true  },
    { name: "Wing Size",                       length:  5, loopCount:  1, plusMinus: true  },
    { name: "Front Leg Stance Width",          length:  5, loopCount:  1, plusMinus: true  },
    { name: "Back Leg Stance Width",           length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Color (Red)",             length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Color (Green)",           length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Color (Blue)",            length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Emission Color (Red)",    length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Emission Color (Green)",  length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Emission Color (Blue)",   length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Intensity",               length:  5, loopCount:  1, plusMinus: false },
    { name: "Pattern Metallic",                length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Smoothness",              length:  5, loopCount:  1, plusMinus: true  },
    { name: "Pattern Frequency",               length:  5, loopCount:  1, plusMinus: false },
    { name: "Pattern Horizontal Flip",         length:  1, loopCount: 25, plusMinus: false },
    { name: "Pattern Vertical Flip",           length:  1, loopCount: 25, plusMinus: false },
    { name: "Pattern Variation",               length:  5, loopCount: 25, plusMinus: false }
];

// Dynamic genes: SUPER type. These genes are stored after the static ones, and
// preceded by a pipe symbol for each gene, since their lengths are variable.
// Longer genes have a higher max value; the amount this value increases for
// each added bit is represented by the 'superBonus' value.
const DYNAMIC_GENES = [
    { name: "Head Number",             length:  5, plusMinus: false, superBonus: 1    },
    { name: "Body Length",             length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Body Height",             length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Body Width",              length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Body Girth",              length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Body Size",               length:  5, plusMinus: true,  superBonus: 0.05 },
    { name: "Tail Size",               length:  5, plusMinus: true,  superBonus: 0    },
    { name: "Tail Number",             length:  5, plusMinus: false, superBonus: 1    },
    { name: "Wing Number",             length: 10, plusMinus: false, superBonus: 1    },
    { name: "Front Leg Girth",         length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Back Leg Girth",          length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Front Top Leg Length",    length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Front Bottom Leg Length", length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Back Top Leg Length",     length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Back Bottom Leg Length",  length:  5, plusMinus: true,  superBonus: 0.1  },
    { name: "Front Leg Number",        length: 15, plusMinus: false, superBonus: 1    },
    { name: "Back Leg Number",         length: 15, plusMinus: false, superBonus: 1    }
];

// Dominant/recessive genes. Unlike the other genes, these do NOT change during
// pupation, and thus are fixed at birth. These are used to decide the types of
// body parts such as the mouth, nose, eyes, ears, wings (if present), pattern,
// missing legs, etc. Index: [ aa, Aa/aA, AA ]
const DOMREC_GENES = [
    [ "MISSING_FRONT_LEFT_LEG",  "NONE",                 "NONE"              ],
    [ "MISSING_FRONT_RIGHT_LEG", "NONE",                 "NONE"              ],
    [ "MISSING_BACK_LEFT_LEG",   "NONE",                 "NONE"              ],
    [ "MISSING_BACK_RIGHT_LEG",  "NONE",                 "NONE"              ],
    [ "VOICE_PITCH_HIGH",        "NONE",                 "NONE"              ],
    [ "VOICE_PITCH_LOW",         "NONE",                 "NONE"              ],
    [ "VOICE_HOARSE",            "NONE",                 "NONE"              ],
    [ "SMALL_PUPILS",            "NONE",                 "NONE"              ],
    [ "EYELIDS",                 "NONE",                 "NONE"              ],
    [ "OBLONG_EYES",             "NONE",                 "NONE"              ],
    [ "MULTI_PUPILS",            "NONE",                 "NONE"              ],
    [ "TEETH",                   "NONE",                 "NONE"              ],
    [ "V_MOUTH",                 "NONE",                 "NONE"              ],
    [ "OPEN_MOUTH",              "NONE",                 "NONE"              ],
    [ "NONE",                    "TILTED_EARS",          "NONE"              ],
    [ "NONE",                    "NUB_TAIL",             "NO_TAIL"           ],
    [ "CURLED_TAIL",             "SLIGHTLY_CURLED_TAIL", "NONE"              ],
    [ "NONE",                    "STIFF_TAIL",           "STIFF_TAIL"        ],
    [ "STRIPE_PATTERN",          "NONE",                 "NONE"              ],
    [ "REPEATING_PATTERN",       "SPLOTCH_PATTERN",      "NONE"              ],
    [ "NONE",                    "NONE",                 "NO_PATTERN"        ],
    [ "NONE",                    "NO_WINGS",             "NO_WINGS"          ],
    [ "WING_ISSUES",             "NONE",                 "NONE"              ],
    [ "MISSING_RIGHT_WING",      "NONE",                 "MISSING_LEFT_WING" ],
    [ "ALIGNMENT_EVIL",          "ALIGNMENT_NEUTRAL",    "ALIGNMENT_GOOD"    ],
    [ "WING_FEATHERS",           "NONE",                 "NONE"              ],
    [ "LONG_EYES",               "NONE",                 "NONE"              ],
    [ "HORIZONTAL_EYES",         "NONE",                 "NONE"              ],
    [ "TRIANGLE_EYES",           "NONE",                 "NONE"              ],
    [ "MISSING_PUPIL_EYES",      "NONE",                 "NONE"              ],
    [ "DECORATIVE_EYES",         "NONE",                 "NONE"              ],
    [ "LASHES_EYES",             "NONE",                 "NONE"              ],
    [ "SPIRAL_EYES",             "NONE",                 "NONE"              ],
    [ "TRIANGLE_EYES",           "NONE",                 "NONE"              ],
    [ "GEOMETRIC_EYES",          "NONE",                 "NONE"              ],
    [ "FLAT_TAIL",               "NONE",                 "NONE"              ],
    [ "BULBOUS_TAIL",            "NONE",                 "NONE"              ],
    [ "REPEATED_TAIL",           "NONE",                 "NONE"              ],
    [ "THIN_TAIL",               "NONE",                 "NONE"              ],
    [ "TAIL_3D",                 "NONE",                 "NONE"              ],
    [ "NONE",                    "NOSE_EXTRUSION",       "NONE"              ],
    [ "NOSE_STRETCH",            "NONE",                 "NOSE_SQUISH"       ],
    [ "NOSE_FLAT",               "NONE",                 "NONE"              ],
    [ "NOSE_REPEATED",           "NONE",                 "NONE"              ],
    [ "EAR_FILLED",              "NONE",                 "NONE"              ],
    [ "EAR_PARTIAL_FLOP",        "EAR_FLOPPY",           "NONE"              ],
    [ "EAR_SHARP",               "NONE",                 "NONE"              ],
    [ "NONE",                    "EAR_HALVED",           "NONE"              ],
    [ "EAR_CONIC",               "NONE",                 "NONE"              ],
    [ "NONE",                    "EAR_CURL_SYNCED",      "EAR_CURL_SYNCED"   ],
    [ "HORNS_TRADITIONAL",       "HORNS_TRADITIONAL",    "NONE"              ],
    [ "HORNS_CENTER",            "NONE",                 "NONE"              ],
    [ "NONE",                    "HORNS_NONE",           "HORNS_NONE"        ],
    [ "HORNS_CURLED",            "NONE",                 "NONE"              ],
    [ "HORNS_NUB",               "NONE",                 "NONE"              ],
    [ "MOUTH_FROWN",             "MOUTH_NEUTRAL",        "MOUTH_SMILE"       ],
    [ "MOUTH_CHEEKS",            "NONE",                 "NONE"              ],
    [ "HORNS_THICK",             "NONE",                 "NONE"              ],
    [ "HORNS_THIN",              "NONE",                 "NONE"              ],
    [ "MOUTH_MISSING_TEETH",     "NONE",                 "NONE"              ],
    [ "MOUTH_POINTED",           "NONE",                 "NONE"              ],
    [ "MOUTH_CUTOFF",            "NONE",                 "NONE"              ],
    [ "MOUTH_WIGGLE",            "NONE",                 "NONE"              ]
];

// Various redundant bits of info to help verify the tables kept above
const GENEMAP_CHECK = {
    staticGeneCount:   50,  // Number of STANDARD and LOOPED genes
    staticGeneLength: 625,  // Number of bits those genes occupy
    dynamicGeneCount:  17,  // Number of SUPER genes
    domrecGeneCount:   63,  // Number of domrec genes
};
