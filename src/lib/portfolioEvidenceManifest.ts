/** Reviewed support for generic question facets. Content-addressed references
 * survive source reordering; edited/deleted passages fail the editorial audit.
 * Decisions and lessons are omitted where the public account does not give them. */
export const projectAnswerEvidence:Record<string,Partial<Record<'contribution'|'process'|'decisions'|'outcomes'|'lessons',readonly string[]>>>={
  "artificial-intelligence-in-state-government-index": {
    "contribution": [
      "artificial-intelligence-in-state-government-index:paragraph:659700d36abbc4cd"
    ],
    "process": [
      "artificial-intelligence-in-state-government-index:bullet:f132fb48f6000c30",
      "artificial-intelligence-in-state-government-index:bullet:aa86d72be0a14479",
      "artificial-intelligence-in-state-government-index:bullet:0a74f79b8764f41d"
    ],
    "decisions": [
      "artificial-intelligence-in-state-government-index:paragraph:659700d36abbc4cd"
    ],
    "outcomes": [
      "artificial-intelligence-in-state-government-index:paragraph:ae601a4cb6993a22"
    ]
  },
  "congressional-office-setup-100-day-report": {
    "contribution": [
      "congressional-office-setup-100-day-report:paragraph:f1eaa951f4c748e9",
      "congressional-office-setup-100-day-report:paragraph:21c80816e489e15e"
    ],
    "process": [
      "congressional-office-setup-100-day-report:paragraph:2a3f2bbe7c4b82cc",
      "congressional-office-setup-100-day-report:paragraph:21c80816e489e15e"
    ],
    "decisions": [
      "congressional-office-setup-100-day-report:paragraph:af416ea14d2b7f5b"
    ],
    "outcomes": [
      "congressional-office-setup-100-day-report:paragraph:ee93c3cb8521ecdf",
      "congressional-office-setup-100-day-report:paragraph:26a8e5333adfe731"
    ],
    "lessons": [
      "congressional-office-setup-100-day-report:paragraph:2a3f2bbe7c4b82cc"
    ]
  },
  "senior-thesis-local-journalism": {
    "contribution": [
      "senior-thesis-local-journalism:paragraph:56fe6c2359d70247"
    ],
    "process": [
      "senior-thesis-local-journalism:paragraph:05230dabfcf2ffb1",
      "senior-thesis-local-journalism:paragraph:56fe6c2359d70247"
    ],
    "outcomes": [
      "senior-thesis-local-journalism:bullet:ab6e5df6d8bc607c",
      "senior-thesis-local-journalism:bullet:43310fd1c2c9d4af",
      "senior-thesis-local-journalism:bullet:0e50c8ff3c84b109",
      "senior-thesis-local-journalism:bullet:b4283ff930200545"
    ]
  },
  "fulbright-focus-group-sponsored-by-openai": {
    "contribution": [
      "fulbright-focus-group-sponsored-by-openai:paragraph:509bee0d4903ba17",
      "fulbright-focus-group-sponsored-by-openai:paragraph:d9b4749d3ea0585d"
    ],
    "process": [
      "fulbright-focus-group-sponsored-by-openai:paragraph:d9b4749d3ea0585d",
      "fulbright-focus-group-sponsored-by-openai:paragraph:1b9e85282ef7a7c4",
      "fulbright-focus-group-sponsored-by-openai:paragraph:48b0e71c7c71ea06"
    ],
    "decisions": [
      "fulbright-focus-group-sponsored-by-openai:paragraph:1b9e85282ef7a7c4",
      "fulbright-focus-group-sponsored-by-openai:paragraph:742e3d0b8f2ee377"
    ],
    "outcomes": [
      "fulbright-focus-group-sponsored-by-openai:paragraph:4461b08676c94082",
      "fulbright-focus-group-sponsored-by-openai:paragraph:48ebbec17c6ebb71"
    ],
    "lessons": [
      "fulbright-focus-group-sponsored-by-openai:paragraph:f7953a85cb0bd1c5",
      "fulbright-focus-group-sponsored-by-openai:paragraph:d4c79a0559f29cbb"
    ]
  },
  "boehringer-cares-foundation-rebrand-strategy-shift": {
    "contribution": [
      "boehringer-cares-foundation-rebrand-strategy-shift:paragraph:6a8a2dbfc8e462e9",
      "boehringer-cares-foundation-rebrand-strategy-shift:paragraph:7b8a7b69067aa255"
    ],
    "process": [
      "boehringer-cares-foundation-rebrand-strategy-shift:paragraph:f380d5bac9ec4f26",
      "boehringer-cares-foundation-rebrand-strategy-shift:paragraph:9c2344e98bb9d81d"
    ],
    "outcomes": [
      "boehringer-cares-foundation-rebrand-strategy-shift:paragraph:e40a99d9ebd71dad",
      "boehringer-cares-foundation-rebrand-strategy-shift:paragraph:1f1c111e2a988b8a"
    ]
  },
  "openai-product-testing-and-feedback": {
    "contribution": [
      "openai-product-testing-and-feedback:paragraph:fc4b7e68b2d7893e",
      "openai-product-testing-and-feedback:paragraph:985e39b3d3e15cdf"
    ],
    "process": [
      "openai-product-testing-and-feedback:paragraph:0bb5e00b846d6c05",
      "openai-product-testing-and-feedback:paragraph:5529cd471cff9e5d",
      "openai-product-testing-and-feedback:paragraph:7f53547e8a712806",
      "openai-product-testing-and-feedback:paragraph:c237aca235dd62d2"
    ],
    "decisions": [
      "openai-product-testing-and-feedback:paragraph:0bb5e00b846d6c05",
      "openai-product-testing-and-feedback:paragraph:5529cd471cff9e5d",
      "openai-product-testing-and-feedback:paragraph:7f53547e8a712806",
      "openai-product-testing-and-feedback:paragraph:c237aca235dd62d2"
    ],
    "outcomes": [
      "openai-product-testing-and-feedback:paragraph:bbb0266e6472568a",
      "openai-product-testing-and-feedback:paragraph:87a36b63d81e353f",
      "openai-product-testing-and-feedback:paragraph:6a766c8bbf4af645"
    ],
    "lessons": [
      "openai-product-testing-and-feedback:paragraph:b39b935cb1538146",
      "openai-product-testing-and-feedback:paragraph:8b313a2832349c14"
    ]
  }
};

/** Scope is editorial metadata, not a claim that any individual caused a result. */
export const projectEvidenceScope:Record<string,{
  ownership:'individual-research'|'program-lead'|'office-communications'|'implementation'|'cohort-contributor';
  outcomeAttribution:'individual-output'|'office-team'|'rollout-team'|'cohort-feedback';
  outcomeTypes:readonly('artifact'|'participation'|'adoption-observation'|'feedback'|'reported-project-metric')[];
  snapshot?:string; editorialGaps:readonly('causal-impact'|'rejected-alternatives'|'personal-retrospective'|'detailed-conclusions'|'shipped-feature-attribution')[];
}>={
  'artificial-intelligence-in-state-government-index':{ownership:'individual-research',outcomeAttribution:'individual-output',outcomeTypes:['artifact','adoption-observation'],snapshot:'August 2025',editorialGaps:['causal-impact','rejected-alternatives','personal-retrospective']},
  'congressional-office-setup-100-day-report':{ownership:'office-communications',outcomeAttribution:'office-team',outcomeTypes:['artifact','reported-project-metric'],editorialGaps:['causal-impact','rejected-alternatives']},
  'senior-thesis-local-journalism':{ownership:'individual-research',outcomeAttribution:'individual-output',outcomeTypes:['artifact'],editorialGaps:['causal-impact','detailed-conclusions','personal-retrospective']},
  'fulbright-focus-group-sponsored-by-openai':{ownership:'program-lead',outcomeAttribution:'individual-output',outcomeTypes:['artifact','participation','adoption-observation'],editorialGaps:['causal-impact']},
  'boehringer-cares-foundation-rebrand-strategy-shift':{ownership:'implementation',outcomeAttribution:'rollout-team',outcomeTypes:['artifact','reported-project-metric'],editorialGaps:['causal-impact','rejected-alternatives','personal-retrospective']},
  'openai-product-testing-and-feedback':{ownership:'cohort-contributor',outcomeAttribution:'cohort-feedback',outcomeTypes:['artifact','feedback'],editorialGaps:['causal-impact','shipped-feature-attribution']},
};
