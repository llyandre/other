import fs from "node:fs";
import path from "node:path";
import { fileURLToPath,pathToFileURL } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const moduleUrl=pathToFileURL(path.join(root,"assets/js/profile-assets.js"));
moduleUrl.searchParams.set("qa",Date.now());
const {USER_PROFILES,ADMIN_PROFILE,DEFAULT_PROFILE,profileIndexForName,resolveProfile}=await import(moduleUrl.href);
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

assert(USER_PROFILES.length===30,"Jumlah avatar pengguna harus 30");
assert(ADMIN_PROFILE.id==="admin-guardian"&&ADMIN_PROFILE.admin===true,"Avatar admin khusus tidak valid");
assert(DEFAULT_PROFILE.id==="default-account"&&DEFAULT_PROFILE.default===true,"Avatar akun default tidak valid");
const profiles=[...USER_PROFILES,ADMIN_PROFILE];
assert(new Set(profiles.map(profile=>profile.id)).size===31,"ID avatar harus unik");
assert(new Set(profiles.map(profile=>profile.file)).size===31,"Nama file avatar harus unik");
assert(new Set(profiles.map(profile=>profile.nicknameId)).size===31,"Julukan Indonesia harus unik");
assert(new Set(profiles.map(profile=>profile.nicknameJa)).size===31,"Julukan Jepang harus unik");

for(const profile of profiles){
  const target=path.join(root,"assets/profile",profile.file);
  assert(fs.existsSync(target),`Aset profil hilang: ${profile.file}`);
  const bytes=fs.readFileSync(target);
  assert(bytes.length>5000,`Aset profil terlalu kecil/rusak: ${profile.file}`);
  assert(bytes.subarray(0,4).toString("ascii")==="RIFF"&&bytes.subarray(8,12).toString("ascii")==="WEBP",`Format WebP rusak: ${profile.file}`);
}

const testNames=["Ayu","Budi","Citra","Dewi","Eko","Fajar","Gita","Hana","Indra","Joko","Komang","Lina","Made","Nina","Putri","Raka","Sari","Tono","Yuki","Zahra"];
for(const name of testNames){
  assert(profileIndexForName(name)===profileIndexForName(name),`Mapping tidak stabil: ${name}`);
  assert(profileIndexForName(`  ${name.toUpperCase()}  `)===profileIndexForName(name),`Normalisasi nama gagal: ${name}`);
  const id=resolveProfile(name,{language:"id"});
  const ja=resolveProfile(name,{language:"ja"});
  assert(id.id===ja.id&&id.file===ja.file,"Bahasa mengubah avatar");
  assert(id.nickname!==ja.nickname,"Julukan bilingual tidak diterapkan");
}
const distribution=Array(USER_PROFILES.length).fill(0);
for(let index=1;index<=3000;index+=1)distribution[profileIndexForName(`Pengguna ${index}`)]+=1;
assert(distribution.every(count=>count>0),"Ada avatar pengguna yang tidak pernah terpilih oleh pemetaan nama");
const admin=resolveProfile("nama-bebas",{admin:true,language:"id"});
assert(admin.id==="admin-guardian"&&admin.nickname==="Penjaga Utama Wikaru","Admin tidak memakai profil khusus");
assert(resolveProfile("Admin404",{language:"ja"}).id==="admin-guardian","Nama admin tidak dikenali");
for(const value of ["","Masuk","Login","Wikaru","ログイン"]){
  const guest=resolveProfile(value,{language:"id"});
  assert(guest.id==="default-account"&&guest.default===true,`Placeholder ${value||"kosong"} tidak memakai akun default`);
}
const defaultTarget=path.join(root,"assets/profile",DEFAULT_PROFILE.file);
assert(fs.existsSync(defaultTarget),"Aset akun default hilang");
const defaultSvg=fs.readFileSync(defaultTarget,"utf8");
assert(/<svg\b[\s\S]*<circle\b[\s\S]*<path\b/i.test(defaultSvg),"SVG akun default rusak");
const profilePreview=fs.readFileSync(path.join(root,"qa/profile-preview.html"),"utf8");
assert(/import\{USER_PROFILES,ADMIN_PROFILE,DEFAULT_PROFILE\}/.test(profilePreview),"Preview profil belum menampilkan akun default");
assert(/1 default \+ 30 pengguna \+ 1 admin/.test(profilePreview),"Ringkasan preview profil salah");

const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
assert(/<div class="home-theme-scene" aria-hidden="true">/.test(html),"Scene beranda awal tidak dipulihkan");
assert(!/home-asset-scene|home-scene-asset-main|data-day-asset=/.test(html),"Scene Horizon masih aktif di beranda");
for(const token of ["home-scene-orb","home-scene-cloud-one","home-scene-kana-one","home-scene-star-one"]){
  assert(html.includes(token),`Elemen beranda awal hilang: ${token}`);
}
const css=fs.readFileSync(path.join(root,"assets/css/asset-system.css"),"utf8");
assert(!/wikaruHorizonScene|home-asset-scene/.test(css),"Override Horizon masih aktif");
assert(/\.wikaru-profile-image\s*\{[^{}]*object-fit:contain!important/is.test(css),"Profile image tidak memakai object-fit contain");
assert(/\.has-profile-asset\s*\{[^{}]*overflow:visible!important/is.test(css),"Wadah profil masih memotong gambar");
assert(/\.profile-menu-avatar\.has-profile-asset[\s\S]{0,220}border-radius:50%!important/.test(css),"Avatar menu profil belum berbentuk lingkaran aman");

console.log(JSON.stringify({status:"PASS",userAvatars:USER_PROFILES.length,adminAvatars:1,defaultAvatars:1,totalProfileIcons:USER_PROFILES.length+2,totalAssignedAvatars:profiles.length,uniqueNicknames:31,stableNameMapping:true,bilingualNicknames:true,allUserAvatarsReachable:true,emptyNameUsesDefault:true,previewIncludesDefault:true,avatarObjectFitSafe:true,avatarContainerNoCrop:true,originalHomepageScene:true,horizonSceneDisabled:true}));
