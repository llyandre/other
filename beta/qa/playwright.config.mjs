import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir:"./e2e",
  timeout:45_000,
  expect:{timeout:10_000},
  fullyParallel:true,
  forbidOnly:Boolean(process.env.CI),
  retries:process.env.CI ? 1 : 0,
  reporter:[["line"],["html",{outputFolder:"qa-output/playwright",open:"never"}]],
  use:{
    baseURL:"http://127.0.0.1:4173",
    locale:"id-ID",
    timezoneId:"Asia/Tokyo",
    trace:"retain-on-failure",
    screenshot:"only-on-failure"
  },
  projects:[
    {name:"desktop",use:{viewport:{width:1440,height:900}}},
    {name:"ipad",use:{viewport:{width:820,height:1180},isMobile:true,hasTouch:true}},
    {name:"mobile",use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
  ],
  webServer:{
    command:"node qa/dev-server.mjs --host 127.0.0.1 --port 4173",
    url:"http://127.0.0.1:4173",
    reuseExistingServer:!process.env.CI,
    timeout:30_000
  }
});

