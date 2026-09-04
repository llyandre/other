const PROFILE_ASSET_BASE=new URL("../profile/",import.meta.url);

export const USER_PROFILES=Object.freeze([
  {id:"kitsune",file:"kitsune.webp",nicknameId:"Kitsune Cerdas",nicknameJa:"賢いキツネ"},
  {id:"usagi",file:"usagi.webp",nicknameId:"Usagi Tekun",nicknameJa:"努力家のうさぎ"},
  {id:"neko",file:"neko.webp",nicknameId:"Neko Ramah",nicknameJa:"やさしいねこ"},
  {id:"tanuki",file:"tanuki.webp",nicknameId:"Tanuki Tangguh",nicknameJa:"たくましいたぬき"},
  {id:"tsuru",file:"tsuru.webp",nicknameId:"Tsuru Fokus",nicknameJa:"集中する鶴"},
  {id:"koi",file:"koi.webp",nicknameId:"Koi Gigih",nicknameJa:"粘り強い鯉"},
  {id:"fukurou",file:"fukurou.webp",nicknameId:"Fukurou Bijak",nicknameJa:"賢者ふくろう"},
  {id:"book-spirit",file:"book-spirit.webp",nicknameId:"Penjaga Buku",nicknameJa:"本の守り人"},
  {id:"lantern",file:"lantern.webp",nicknameId:"Lentera Ilmu",nicknameJa:"学びの灯"},
  {id:"fuji-spirit",file:"fuji-spirit.webp",nicknameId:"Fuji Teguh",nicknameJa:"不動の富士"},
  {id:"sakura-spirit",file:"sakura-spirit.webp",nicknameId:"Sakura Ceria",nicknameJa:"笑顔の桜"},
  {id:"moon-spirit",file:"moon-spirit.webp",nicknameId:"Tsuki Tenang",nicknameJa:"静かな月"},
  {id:"sun-spirit",file:"sun-spirit.webp",nicknameId:"Taiyō Semangat",nicknameJa:"元気な太陽"},
  {id:"cloud-spirit",file:"cloud-spirit.webp",nicknameId:"Kumo Damai",nicknameJa:"穏やかな雲"},
  {id:"paper-plane",file:"paper-plane.webp",nicknameId:"Penjelajah Sora",nicknameJa:"空の探検家"},
  {id:"daruma",file:"daruma.webp",nicknameId:"Daruma Pantang Menyerah",nicknameJa:"あきらめない達磨"},
  {id:"onigiri",file:"onigiri.webp",nicknameId:"Onigiri Ceria",nicknameJa:"笑顔のおにぎり"},
  {id:"sensu",file:"sensu.webp",nicknameId:"Sensu Luwes",nicknameJa:"しなやかな扇"},
  {id:"take-spirit",file:"take-spirit.webp",nicknameId:"Take Bertumbuh",nicknameJa:"伸びる竹"},
  {id:"ame-spirit",file:"ame-spirit.webp",nicknameId:"Ame Sabar",nicknameJa:"忍耐の雨"},
  {id:"yuki-spirit",file:"yuki-spirit.webp",nicknameId:"Yuki Jernih",nicknameJa:"澄んだ雪"},
  {id:"nami-spirit",file:"nami-spirit.webp",nicknameId:"Nami Berani",nicknameJa:"勇気の波"},
  {id:"hoshi-spirit",file:"hoshi-spirit.webp",nicknameId:"Hoshi Pemandu",nicknameJa:"導きの星"},
  {id:"fude-spirit",file:"fude-spirit.webp",nicknameId:"Fude Kreatif",nicknameJa:"創造の筆"},
  {id:"suzume",file:"suzume.webp",nicknameId:"Suzume Gesit",nicknameJa:"素早い雀"},
  {id:"kame",file:"kame.webp",nicknameId:"Kame Konsisten",nicknameJa:"歩み続ける亀"},
  {id:"shiba",file:"shiba.webp",nicknameId:"Shiba Setia",nicknameJa:"忠実な柴"},
  {id:"kintsugi",file:"kintsugi.webp",nicknameId:"Kintsugi Tangguh",nicknameJa:"強い金継ぎ"},
  {id:"koma-spirit",file:"koma-spirit.webp",nicknameId:"Koma Seimbang",nicknameJa:"均衡の独楽"},
  {id:"kotoba-spirit",file:"kotoba-spirit.webp",nicknameId:"Kotoba Komunikatif",nicknameJa:"伝える言葉"}
]);

export const ADMIN_PROFILE=Object.freeze({
  id:"admin-guardian",
  file:"admin-guardian.webp",
  nicknameId:"Penjaga Utama Wikaru",
  nicknameJa:"Wikaruの守護者",
  admin:true
});

export const DEFAULT_PROFILE=Object.freeze({
  id:"default-account",
  file:"default-account.svg",
  nicknameId:"Tamu",
  nicknameJa:"ゲスト",
  default:true
});

const DEFAULT_PROFILE_NAMES=new Set(["","masuk","login","ログイン","nama pengguna","名前を入力","wikaru"]);

export function normalizeProfileName(value){
  return String(value||"").normalize("NFKC").trim().toLowerCase();
}

export function profileHash(value){
  let hash=2166136261;
  for(const character of Array.from(normalizeProfileName(value))){
    hash^=character.codePointAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

export function profileIndexForName(name){
  return profileHash(name)%USER_PROFILES.length;
}

export function resolveProfile(name,{admin=false,language="id"}={}){
  const normalized=normalizeProfileName(name);
  if(admin||normalized==="admin404"){
    return {...ADMIN_PROFILE,nickname:language==="ja"?ADMIN_PROFILE.nicknameJa:ADMIN_PROFILE.nicknameId,assetUrl:new URL(ADMIN_PROFILE.file,PROFILE_ASSET_BASE).href};
  }
  if(DEFAULT_PROFILE_NAMES.has(normalized)){
    return {...DEFAULT_PROFILE,nickname:language==="ja"?DEFAULT_PROFILE.nicknameJa:DEFAULT_PROFILE.nicknameId,assetUrl:new URL(DEFAULT_PROFILE.file,PROFILE_ASSET_BASE).href,admin:false};
  }
  const selected=USER_PROFILES[profileIndexForName(normalized)];
  return {...selected,nickname:language==="ja"?selected.nicknameJa:selected.nicknameId,assetUrl:new URL(selected.file,PROFILE_ASSET_BASE).href,admin:false};
}

function readSession(){
  try{
    const value=JSON.parse(localStorage.getItem("minna_bab23_progress")||"null");
    return value&&typeof value==="object"&&!Array.isArray(value)?value:null;
  }catch(_){return null;}
}

function currentLanguage(){
  return document.documentElement.lang==="ja"?"ja":"id";
}

function directChild(element,selector){
  return Array.from(element?.children||[]).find(child=>child.matches(selector))||null;
}

export function applyProfileAsset(element,profile){
  if(!element)return profile;
  let image=directChild(element,"img.wikaru-profile-image");
  if(!profile?.assetUrl){
    image?.remove();
    element.classList.remove("has-profile-asset","is-admin-avatar","is-default-avatar");
    delete element.dataset.profileId;
    return profile;
  }
  if(!image){
    image=document.createElement("img");
    image.className="wikaru-profile-image";
    image.alt="";
    image.setAttribute("aria-hidden","true");
    image.decoding="async";
    image.draggable=false;
    element.prepend(image);
  }
  if(image.src!==profile.assetUrl)image.src=profile.assetUrl;
  element.classList.add("has-profile-asset");
  element.classList.toggle("is-admin-avatar",!!profile.admin);
  element.classList.toggle("is-default-avatar",!!profile.default);
  element.dataset.profileId=profile.id;
  return profile;
}

function setText(selector,value){
  const element=document.querySelector(selector);
  if(element&&element.textContent!==value)element.textContent=value;
}

function syncProfile(){
  const language=currentLanguage();
  const session=readSession();
  const logged=!!String(session?.username||"").trim();
  const admin=session?.role==="admin";
  const name=logged?String(session.username):"";
  const profile=resolveProfile(name,{admin,language});

  [
    document.querySelector("#userAvatar"),
    document.querySelector("#profileMenuHeader .profile-menu-avatar"),
    document.querySelector(".home-profile-avatar")
  ].forEach(element=>applyProfileAsset(element,profile));

  if(logged){
    setText("#userRoleText",profile.nickname);
    setText("#profileMenuRole",profile.nickname);
    setText("#homeProfileRole",profile.nickname);
  }else{
    setText("#userRoleText",language==="ja"?"ゲスト":"Tamu");
    setText("#profileMenuRole",language==="ja"?"ログインしていません":"Belum masuk");
    setText("#homeProfileRole",language==="ja"?"はじめる準備":"Siap mulai");
  }
  return profile;
}

function syncLoginPreview(){
  const input=document.querySelector("#usernameInput");
  const preview=document.querySelector("#loginModal .wikaru-login-preview");
  const avatar=preview?.querySelector(".wikaru-user-avatar");
  if(!preview||!avatar)return;
  const language=currentLanguage();
  const name=String(input?.value||"").trim();
  const admin=normalizeProfileName(name)==="admin404";
  const profile=resolveProfile(name,{admin,language});
  applyProfileAsset(avatar,profile);
  const title=preview.querySelector(":scope > div > strong");
  const note=preview.querySelector(":scope > div > span");
  if(title)title.textContent=name||(language==="ja"?"Wikaruの学習プロフィール":"Identitas belajar Wikaru");
  if(note)note.textContent=name
    ? (language==="ja"?`称号：${profile.nickname}`:`Julukan: ${profile.nickname}`)
    : (language==="ja"?"名前を入力すると専用アバターが決まります。":"Ketik nama untuk menentukan avatar dan julukanmu.");
}

let frame=0;
function scheduleSync(){
  if(frame)return;
  frame=requestAnimationFrame(()=>{
    frame=0;
    syncProfile();
    syncLoginPreview();
  });
}

function observeText(selector){
  const element=document.querySelector(selector);
  if(element)new MutationObserver(scheduleSync).observe(element,{childList:true,subtree:true,characterData:true});
}

function initializeProfileAssets(){
  syncProfile();
  syncLoginPreview();
  ["#userMenuText","#userRoleText","#profileMenuRole","#homeProfileRole"].forEach(observeText);
  const dropdown=document.querySelector("#userDropdown");
  if(dropdown)new MutationObserver(scheduleSync).observe(dropdown,{attributes:true,attributeFilter:["class","aria-hidden"]});
  const login=document.querySelector("#loginModal");
  if(login)new MutationObserver(scheduleSync).observe(login,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});
  document.querySelector("#usernameInput")?.addEventListener("input",scheduleSync);
  document.querySelector("#userMenuBtn")?.addEventListener("click",()=>setTimeout(scheduleSync,0));
  new MutationObserver(scheduleSync).observe(document.documentElement,{attributes:true,attributeFilter:["lang","data-theme"]});
  window.addEventListener("storage",scheduleSync);
  setTimeout(scheduleSync,250);
  setTimeout(scheduleSync,1200);
}

if(typeof window!=="undefined"){
  window.WIKARU_PROFILE_ASSETS=Object.freeze({USER_PROFILES,ADMIN_PROFILE,DEFAULT_PROFILE,resolveProfile,profileIndexForName,applyProfileAsset,sync:syncProfile});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeProfileAssets,{once:true});
  else initializeProfileAssets();
}
