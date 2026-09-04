import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const css=read("assets/css/question-page-final.css");
const html=read("index.html");
const composition=read("assets/js/question-page-final.js");
const headerRuntime=read("assets/js/deploy-v35.js");

// Approved desktop composition: 1440px reference.
assert(css.includes("width:min(1440px,calc(100% - 36px))"),"Desktop 1440px container rule missing");
assert(css.includes("grid-template-columns:minmax(0,2.15fr) minmax(300px,.76fr)"),"Desktop quiz/card + control panel grid missing");
assert(css.includes("grid-template-columns:1fr!important")&&css.includes("#quizPage .quiz-answer-row"),"Desktop stacked answer controls missing");

// Approved tablet composition: 820px reference.
assert(css.includes("@media(min-width:768px) and (max-width:1180px)"),"Tablet breakpoint missing");
assert(css.includes("width:min(820px,calc(100% - 28px))"),"820px tablet target width missing");
assert(css.includes("#quizPage #voicePresetSwitcher{grid-template-columns:repeat(2,minmax(0,1fr))!important}"),"Tablet 2x2 voice selector missing");
assert(css.includes("#quizPage .quiz-answer-row{grid-template-columns:1fr 1fr!important}"),"Tablet Benar/Salah row missing");

// Approved mobile composition: 390px reference lives inside <=767px rules.
assert(css.includes("@media(max-width:767px)"),"Mobile breakpoint missing");
assert(css.includes("body.quiz-mode #quizPage{width:100%!important"),"390px mobile full-width layout missing");
assert(css.includes("#quizPage #voicePresetSwitcher{grid-template-columns:1fr!important}"),"Mobile voice selector missing");
assert(css.includes("#quizPage .quiz-answer-row{position:fixed!important"),"Mobile fixed answer action bar missing");

// Reference content hierarchy and required controls.
for(const token of [
  'id="quizPage"','id="exampleBtn"','id="correctBtn"','id="wrongBtn"','id="micBox"','id="voiceProfileCard"',
  'id="hearBtn"','id="cardCounter"','class="question-text"'
]) assert(html.includes(token),`Required quiz element missing: ${token}`);
for(const token of ["wkQuestionCardTools","wk-question-seal","wkQuestionExampleSlot","wkQuestionVoiceHeading"])
  assert(composition.includes(token),`Reference composition hook missing: ${token}`);
for(const token of ["wkQuizExit","wk-quiz-head-mark","wkQuizTitle","wkQuizCounter","wkQuizProgress","wkQuestionTimer","wkQuizSettings"])
  assert(headerRuntime.includes(token),`Reference header control missing: ${token}`);
assert(composition.includes("assets/generated/seal-guide-clean-v39u1.png"),"Clean seal not wired to quiz card");

console.log(JSON.stringify({status:"PASS",release:"v39u1",viewports:[1440,820,390],desktop:"two-column",tablet:"stacked + 2x2 voice",mobile:"single-column + fixed answers",requiredQuizControls:true}));
