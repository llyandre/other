import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root=path.resolve(import.meta.dirname,"..");
const out=path.join(root,"output","previews","v33");
const baseURL=process.env.WIKARU_PREVIEW_URL||"http://127.0.0.1:4173";
const prefix=process.env.WIKARU_PREVIEW_PREFIX||"Wikaru_v33";
await fs.mkdir(out,{recursive:true});

const viewports=[
  {name:"Desktop",width:1440,height:900,isMobile:false,hasTouch:false},
  {name:"iPad",width:820,height:1180,isMobile:true,hasTouch:true},
  {name:"Mobile",width:390,height:844,isMobile:true,hasTouch:true}
];
const browser=await chromium.launch({headless:true});
const report=[];

for(const viewport of viewports){
  const context=await browser.newContext({
    viewport:{width:viewport.width,height:viewport.height},
    isMobile:viewport.isMobile,
    hasTouch:viewport.hasTouch,
    deviceScaleFactor:1,
    locale:"id-ID",
    colorScheme:"light",
    reducedMotion:"reduce"
  });
  await context.addInitScript(() => {
    const base="minna_bab23";
    localStorage.setItem(`${base}_dataVersion`,"wikaru-mnii-b50-ranges-20260825-v1-copyedit");
    localStorage.setItem(`${base}_setupCompleted`,"true");
    localStorage.setItem(`${base}_lang`,"id");
    localStorage.setItem(`${base}_settings`,JSON.stringify({book:"Minna no Nihongo I (2nd Edition)",materialCategory:"Materi Umum",chapter:"Bab 12"}));
    localStorage.setItem(`${base}_progress`,JSON.stringify({username:"Preview",group:"Umum",role:"participant",loggedAt:new Date().toISOString()}));
    localStorage.setItem("wikaru_mascot_v1_onboarding_completed","completed");
    localStorage.setItem("wikaru_quiz_guide_v1_preview%7Cumum_study","seen");
    localStorage.setItem("wikaru_mascot_cursor_enabled_v3","1");
  });
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(String(error?.message||error)));
  await page.goto(baseURL,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.documentElement.dataset.wikaruCoreReady==="true",null,{timeout:15000});
  await page.evaluate(()=>{
    const loader=document.getElementById("loadingScreen");
    if(loader){loader.hidden=true;loader.style.setProperty("display","none","important")}
    document.querySelectorAll(".modal.show,.wk-mascot-notice,.wk-quiz-guide:not([hidden])").forEach(element=>element.classList.remove("show"));
  });
  await page.waitForTimeout(300);
  const homeFile=path.join(out,`${prefix}_Home_Cloud_${viewport.name}.png`);
  await page.screenshot({path:homeFile,fullPage:false,animations:"disabled"});
  const homeMetrics=await page.evaluate(()=>({
    width:innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    cloudDisplay:getComputedStyle(document.querySelector("#homePage .home-theme-scene")).display,
    replacementDisplay:getComputedStyle(document.querySelector("#homeMainReferenceImage")).display
  }));

  await page.evaluate(async()=>{
    await window.WIKARU_APP.startCustomQuiz({
      ids:["mni-b12-008","mni-b12-009","mni-b12-010","mni-b12-011","mni-b12-012"],
      chapters:[12],mode:"study",direction:"jpToId",shuffle:false,context:{kind:"preview"}
    });
  });
  await page.waitForSelector("body.quiz-mode #quizPage.active",{timeout:10000});
  await page.evaluate(()=>{
    const guide=document.getElementById("wikaruQuizGuide");
    if(guide)guide.hidden=true;
    const notice=document.querySelector(".wk-mascot-notice");
    if(notice)notice.remove();
  });
  await page.waitForTimeout(500);
  const flash=page.locator("#flashcard");
  if(await flash.count()) await flash.click({position:{x:260,y:220}}).catch(()=>{});
  await page.waitForTimeout(300);
  const quizFile=path.join(out,`${prefix}_Quiz_${viewport.name}.png`);
  await page.screenshot({path:quizFile,fullPage:false,animations:"disabled"});
  const quizMetrics=await page.evaluate(()=>{
    const quiz=document.getElementById("quizPage");
    const rect=quiz?.getBoundingClientRect();
    return{
      width:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      quizLeft:Math.round(rect?.left||0),quizRight:Math.round(rect?.right||0),
      quizHeight:Math.round(rect?.height||0),
      lowerSeal:getComputedStyle(quiz,"::after").display,
      lowerSealWidth:getComputedStyle(quiz,"::after").width,
      lowerSealBottom:getComputedStyle(quiz,"::after").bottom
    };
  });
  report.push({viewport:viewport.name,homeFile,quizFile,homeMetrics,quizMetrics,pageErrors});
  await context.close();
}

await browser.close();
const errors=report.flatMap(item=>item.pageErrors.map(error=>`${item.viewport}: ${error}`));
const overflow=report.filter(item=>item.homeMetrics.scrollWidth>item.homeMetrics.width+1||item.quizMetrics.scrollWidth>item.quizMetrics.width+1);
if(errors.length)throw new Error(`Browser errors:\n${errors.join("\n")}`);
if(overflow.length)throw new Error(`Horizontal overflow: ${overflow.map(item=>item.viewport).join(", ")}`);
if(report.some(item=>item.homeMetrics.cloudDisplay==="none"||item.homeMetrics.replacementDisplay!=="none"))throw new Error("Cloud home guard failed");
await fs.writeFile(path.join(out,`${prefix}_Browser_QA.json`),JSON.stringify({status:"PASS",baseURL,report},null,2));
console.log(JSON.stringify({status:"PASS",screenshots:report.length*2,viewports:report.map(item=>item.viewport),report:path.join(out,`${prefix}_Browser_QA.json`)}));
