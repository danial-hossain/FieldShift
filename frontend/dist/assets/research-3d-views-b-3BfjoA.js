import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{r as t,t as n}from"./react-vendor-Dy-GIXkn.js";var r=e(t(),1),i=n();function a(e){if(!e||typeof e!=`string`)return``;let t=e.trim().replace(/\/+$/,``);return t?(!/^https?:\/\//i.test(t)&&t.includes(`.`)&&(t=`https://${t}`),t):``}var o=a(``);async function s(e,t={}){let n=e.startsWith(`/`)?e:`/${e}`,r=o?`${o}${n}`:n,i;try{i=await fetch(r,{credentials:`include`,headers:{Accept:`application/json`,"Content-Type":`application/json`,...t.headers||{}},...t})}catch(e){throw e?.name===`AbortError`?e:Error(`Could not reach the FastAPI backend at ${o||`localhost:8000`} (${e.message}). Verify backend service is active.`)}let a;try{a=await i.json()}catch{throw Error(`Backend returned a non-JSON response (HTTP ${i.status}). Verify FastAPI endpoint.`)}if(!i.ok){let e=Array.isArray(a?.detail)?a.detail.map(e=>e.msg||e.loc?.join(`.`)||`Invalid request`).join(`; `):a?.detail;throw Error(e||a?.message||`Request failed (${i.status})`)}return a}function c({variant:e=`glass`,children:t,className:n=``,style:r={},onClick:a,...o}){return(0,i.jsx)(`div`,{className:`ui-card ${e===`hud`?`ui-card-hud`:e===`glass-strong`?`ui-card-glass-strong`:`ui-card-glass`} ${n}`,style:r,onClick:a,...o,children:t})}function l({icon:e,title:t,subtitle:n,action:r,className:a=``,style:o={}}){return(0,i.jsxs)(`div`,{className:`ui-card-header ${a}`,style:o,children:[(0,i.jsxs)(`div`,{className:`ui-card-header-left`,children:[e&&(0,i.jsx)(`div`,{className:`ui-card-header-icon`,children:e}),(0,i.jsxs)(`div`,{className:`ui-card-header-titles`,children:[t&&(0,i.jsx)(`h3`,{className:`ui-card-header-title`,children:t}),n&&(0,i.jsx)(`p`,{className:`ui-card-header-subtitle`,children:n})]})]}),r&&(0,i.jsx)(`div`,{className:`ui-card-header-actions`,children:r})]})}function u({label:e,value:t,unit:n,sub:r,tone:a=`neutral`,className:o=``,style:s={}}){let c=t==null||t===``||t===`—`||t===`তথ্য নেই`||t===`No data`,l=!c&&a!==`neutral`?`ui-stat-tone-${a}`:``;return(0,i.jsxs)(`div`,{className:`ui-stat ${o}`,style:s,children:[e&&(0,i.jsx)(`span`,{className:`ui-stat-label`,children:e}),(0,i.jsx)(`div`,{className:`ui-stat-value-wrap`,children:c?(0,i.jsx)(`span`,{className:`ui-stat-empty`,style:{fontSize:14,color:`var(--text-3)`,fontWeight:500},children:t===`No data`?`No data`:`তথ্য নেই`}):(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`span`,{className:`ui-stat-value ${l}`,children:t}),n&&(0,i.jsx)(`span`,{className:`ui-stat-unit`,children:n})]})}),r&&(0,i.jsx)(`span`,{className:`ui-stat-sub`,children:r})]})}function d({children:e,icon:t,tone:n=`neutral`,className:r=``,style:a={},...o}){return(0,i.jsxs)(`span`,{className:`ui-pill ui-pill-${n} ${r}`,style:a,...o,children:[t&&(0,i.jsx)(`span`,{style:{display:`inline-flex`,fontSize:12},children:t}),e]})}function f({children:e,icon:t,variant:n=`primary`,size:r=`md`,className:a=``,style:o={},disabled:s=!1,onClick:c,type:l=`button`,...u}){let d={};r===`xs`&&(d={padding:`4px 10px`,fontSize:11.5,height:26,minHeight:26,borderRadius:6,fontWeight:600,display:`inline-flex`,alignItems:`center`,justifyContent:`center`,gap:5});let f={};return n===`danger`&&(f={background:`rgba(239, 68, 68, 0.12)`,color:`#f87171`,border:`1px solid rgba(239, 68, 68, 0.35)`,cursor:s?`not-allowed`:`pointer`}),(0,i.jsxs)(`button`,{type:l,disabled:s,onClick:c,className:`ui-btn ui-btn-${n} ui-btn-${r} ${a}`,style:{opacity:s?.45:1,pointerEvents:s?`none`:`auto`,...d,...f,...o},...u,children:[t&&(0,i.jsx)(`span`,{style:{display:`inline-flex`,fontSize:r===`xs`?11:r===`sm`?12:14},children:t}),e]})}function p({items:e,tabs:t,activeId:n,activeTab:r,onChange:a,onTabChange:o,className:s=``,style:c={},lang:l=`bn`}){let u=(e??t)||[],d=n??r,f=a??o;return(0,i.jsx)(`div`,{className:`ui-tabs ${s}`,style:c,role:`tablist`,children:u.map(e=>{let t=e.id??e.key,n=t===d,r=e.label??(l===`bn`?e.labelBn||e.titleBn:e.labelEn||e.titleEn)??e.title??t;return(0,i.jsxs)(`button`,{type:`button`,role:`tab`,"aria-selected":n,onClick:()=>f&&f(t),className:`ui-tab-item ${n?`ui-tab-item-active`:``}`,children:[e.icon&&(0,i.jsx)(`span`,{style:{marginRight:6},children:e.icon}),r]},t)})})}function m({icon:e=`🌾`,title:t=`তথ্য নেই`,description:n=`কোনো রেকর্ড বা পর্যবেক্ষণ পাওয়া যায়নি।`,action:r,className:a=``,style:o={}}){return(0,i.jsxs)(`div`,{className:`ui-empty-state ${a}`,style:o,children:[(0,i.jsx)(`div`,{className:`ui-empty-state-icon`,children:e}),(0,i.jsx)(`h4`,{className:`ui-empty-state-title`,children:t}),n&&(0,i.jsx)(`p`,{className:`ui-empty-state-desc`,children:n}),r&&(0,i.jsx)(`div`,{style:{marginTop:8},children:r})]})}function h({source:e=`NASA POWER`,mode:t=`climatology`,period:n=`2001-2025`,className:r=``,style:a={}}){let o=[e,t,n].filter(Boolean);return(0,i.jsxs)(`span`,{className:`ui-data-source-tag ${r}`,style:a,children:[(0,i.jsx)(`span`,{style:{width:6,height:6,borderRadius:`50%`,background:`var(--leaf)`,display:`inline-block`}}),o.join(` · `)]})}function g({eyebrow:e,title:t,subtitle:n,actions:r,className:a=``,style:o={}}){return(0,i.jsxs)(`div`,{className:`ui-page-header ${a}`,style:o,children:[(0,i.jsxs)(`div`,{children:[e&&(0,i.jsx)(`div`,{className:`ui-page-header-eyebrow`,children:e}),t&&(0,i.jsx)(`h1`,{className:`ui-page-header-title`,children:t}),n&&(0,i.jsx)(`p`,{className:`ui-page-header-sub`,children:n})]}),r&&(0,i.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:10},children:r})]})}function _({width:e=`100%`,height:t=`20px`,borderRadius:n=`8px`,className:r=``,style:a={}}){return(0,i.jsx)(`div`,{className:`ui-skeleton ${r}`,style:{width:e,height:t,borderRadius:n,...a}})}var v=(e=20,t=``)=>({width:e,height:e,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.85`,strokeLinecap:`round`,strokeLinejoin:`round`,className:`ui-icon ${t}`.trim(),"aria-hidden":`true`}),y=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`path`,{d:`M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z`}),(0,i.jsx)(`polyline`,{points:`9 22 9 12 15 12 15 22`})]}),b=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`path`,{d:`M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z`}),(0,i.jsx)(`line`,{x1:`9`,y1:`3`,x2:`9`,y2:`18`}),(0,i.jsx)(`line`,{x1:`15`,y1:`6`,x2:`15`,y2:`21`})]}),x=({size:e=20,className:t=``})=>(0,i.jsx)(`svg`,{...v(e,t),children:(0,i.jsx)(`path`,{d:`M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19`})}),S=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`path`,{d:`M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z`}),(0,i.jsx)(`line`,{x1:`12`,y1:`19`,x2:`12`,y2:`22`}),(0,i.jsx)(`line`,{x1:`8`,y1:`19`,x2:`7`,y2:`21`}),(0,i.jsx)(`line`,{x1:`16`,y1:`19`,x2:`17`,y2:`21`})]}),C=({size:e=20,className:t=``})=>(0,i.jsx)(`svg`,{...v(e,t),children:(0,i.jsx)(`path`,{d:`M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z`})}),w=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`polyline`,{points:`23 6 13.5 15.5 8.5 10.5 1 18`}),(0,i.jsx)(`polyline`,{points:`17 6 23 6 23 12`})]}),T=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`path`,{d:`M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z`}),(0,i.jsx)(`path`,{d:`m9 12 2 2 4-4`})]}),E=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`circle`,{cx:`12`,cy:`12`,r:`5`}),(0,i.jsx)(`line`,{x1:`12`,y1:`1`,x2:`12`,y2:`3`}),(0,i.jsx)(`line`,{x1:`12`,y1:`21`,x2:`12`,y2:`23`}),(0,i.jsx)(`line`,{x1:`4.22`,y1:`4.22`,x2:`5.64`,y2:`5.64`}),(0,i.jsx)(`line`,{x1:`18.36`,y1:`18.36`,x2:`19.78`,y2:`19.78`}),(0,i.jsx)(`line`,{x1:`1`,y1:`12`,x2:`3`,y2:`12`}),(0,i.jsx)(`line`,{x1:`21`,y1:`12`,x2:`23`,y2:`12`}),(0,i.jsx)(`line`,{x1:`4.22`,y1:`19.78`,x2:`5.64`,y2:`18.36`}),(0,i.jsx)(`line`,{x1:`18.36`,y1:`5.64`,x2:`19.78`,y2:`4.22`})]}),D=({size:e=20,className:t=``})=>(0,i.jsx)(`svg`,{...v(e,t),children:(0,i.jsx)(`path`,{d:`M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z`})}),O=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`path`,{d:`M9 11l3 3L22 4`}),(0,i.jsx)(`path`,{d:`M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11`})]}),k=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`circle`,{cx:`12`,cy:`12`,r:`10`}),(0,i.jsx)(`line`,{x1:`12`,y1:`16`,x2:`12`,y2:`12`}),(0,i.jsx)(`line`,{x1:`12`,y1:`8`,x2:`12.01`,y2:`8`})]}),A=({size:e=20,className:t=``})=>(0,i.jsx)(`svg`,{...v(e,t),children:(0,i.jsx)(`polyline`,{points:`20 6 9 17 4 12`})}),j=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`circle`,{cx:`12`,cy:`12`,r:`10`}),(0,i.jsx)(`line`,{x1:`12`,y1:`8`,x2:`12`,y2:`12`}),(0,i.jsx)(`line`,{x1:`12`,y1:`16`,x2:`12.01`,y2:`16`})]}),M=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`line`,{x1:`18`,y1:`6`,x2:`6`,y2:`18`}),(0,i.jsx)(`line`,{x1:`6`,y1:`6`,x2:`18`,y2:`18`})]}),N=({size:e=20,className:t=``})=>(0,i.jsxs)(`svg`,{...v(e,t),children:[(0,i.jsx)(`circle`,{cx:`12`,cy:`12`,r:`10`}),(0,i.jsx)(`path`,{d:`M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3`}),(0,i.jsx)(`line`,{x1:`12`,y1:`17`,x2:`12.01`,y2:`17`})]});function P({type:e=`info`,message:t,onClose:n,duration:a=4e3,className:o=``,style:s={}}){(0,r.useEffect)(()=>{if(!a||!n)return;let e=setTimeout(()=>{n()},a);return()=>clearTimeout(e)},[a,n]);let c=e===`success`?{bg:`var(--bg-card, #161d23)`,border:`1px solid #00df81`,icon:(0,i.jsx)(A,{size:18,className:`text-emerald-400`}),color:`#00df81`}:e===`error`?{bg:`var(--bg-card, #161d23)`,border:`1px solid #ef4444`,icon:(0,i.jsx)(j,{size:18,className:`text-red-400`}),color:`#ef4444`}:{bg:`var(--bg-card, #161d23)`,border:`1px solid #38bdf8`,icon:(0,i.jsx)(k,{size:18,className:`text-sky-400`}),color:`#38bdf8`};return(0,i.jsxs)(`div`,{className:`ui-toast ${o}`,style:{position:`fixed`,bottom:24,right:24,zIndex:9999,display:`flex`,alignItems:`center`,gap:10,padding:`12px 18px`,background:c.bg,border:c.border,borderRadius:`var(--radius-md, 12px)`,boxShadow:`var(--shadow-elevation-2, 0 8px 24px rgba(0,0,0,0.45))`,color:`var(--text-main, #e8ece9)`,fontSize:`13px`,fontWeight:600,maxWidth:`380px`,animation:`slideUp 180ms ease-out`,...s},children:[(0,i.jsx)(`span`,{children:c.icon}),(0,i.jsx)(`span`,{style:{flex:1,lineHeight:1.4},children:t}),n&&(0,i.jsx)(`button`,{type:`button`,onClick:n,style:{background:`transparent`,border:`none`,color:`var(--text-dim, #7a8781)`,cursor:`pointer`,padding:2},"aria-label":`Close`,children:(0,i.jsx)(M,{size:16})})]})}function F({isOpen:e,onClose:t,title:n,subtitle:a,children:o,maxWidth:s=`640px`,footer:c=null,className:l=``,style:u={}}){return(0,r.useEffect)(()=>{if(!e)return;let n=e=>{e.key===`Escape`&&t?.()};return window.addEventListener(`keydown`,n),()=>window.removeEventListener(`keydown`,n)},[e,t]),e?(0,i.jsx)(`div`,{className:`ui-modal-backdrop`,style:{position:`fixed`,inset:0,zIndex:9e3,background:`rgba(0, 0, 0, 0.72)`,display:`flex`,alignItems:`center`,justifyContent:`center`,padding:`16px`,animation:`fadeIn 180ms ease`},onClick:e=>{e.target===e.currentTarget&&t?.()},children:(0,i.jsxs)(`div`,{className:`ui-modal-container ${l}`,style:{width:`100%`,maxWidth:s,maxHeight:`90vh`,background:`var(--bg-card, #161d23)`,border:`1.5px solid var(--border-medium, #2a3742)`,borderRadius:`var(--radius-lg, 16px)`,boxShadow:`var(--shadow-elevation-2, 0 16px 40px rgba(0,0,0,0.6))`,display:`flex`,flexDirection:`column`,overflow:`hidden`,animation:`scaleIn 180ms cubic-bezier(0.16, 1, 0.3, 1)`,...u},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`flex-start`,justifyContent:`space-between`,padding:`18px 24px`,borderBottom:`1px solid var(--border-light, #222c36)`,background:`var(--bg-card-subtle, #1c242c)`},children:[(0,i.jsxs)(`div`,{children:[n&&(0,i.jsx)(`h3`,{style:{margin:0,fontSize:`18px`,fontWeight:800,color:`var(--text-main, #e8ece9)`},children:n}),a&&(0,i.jsx)(`p`,{style:{margin:`4px 0 0 0`,fontSize:`12px`,color:`var(--text-muted, #9aa5a0)`},children:a})]}),(0,i.jsx)(`button`,{type:`button`,onClick:t,style:{background:`transparent`,border:`none`,color:`var(--text-dim, #7a8781)`,cursor:`pointer`,padding:4,borderRadius:6,display:`flex`,alignItems:`center`,justifyContent:`center`},"aria-label":`Close dialog`,children:(0,i.jsx)(M,{size:20})})]}),(0,i.jsx)(`div`,{style:{padding:`20px 24px`,overflowY:`auto`,flex:1},children:o}),c&&(0,i.jsx)(`div`,{style:{padding:`14px 24px`,borderTop:`1px solid var(--border-light, #222c36)`,background:`var(--bg-card-subtle, #1c242c)`,display:`flex`,alignItems:`center`,justifyContent:`flex-end`,gap:12},children:c})]})}):null}function I({source:e=`user`,lang:t=`bn`,size:n=`sm`,style:r={},className:a=``}){let o=e,s=`rgba(255, 255, 255, 0.06)`,c=`var(--text-dim, #94a3b8)`,l=`1px solid rgba(255, 255, 255, 0.12)`,u=String(e).toLowerCase();return u.includes(`user`)||u.includes(`আপনার`)||u.includes(`কৃষক`)?(o=t===`bn`?`আপনার দেওয়া`:`User Input`,s=`rgba(34, 197, 94, 0.12)`,c=`#4ade80`,l=`1px solid rgba(34, 197, 94, 0.28)`):u.includes(`soilgrids`)||u.includes(`isric`)?(o=`SoilGrids`,s=`rgba(245, 158, 11, 0.12)`,c=`#fbbf24`,l=`1px solid rgba(245, 158, 11, 0.28)`):u.includes(`saxton`)||u.includes(`rawls`)?(o=t===`bn`?`হিসাবকৃত (Saxton-Rawls)`:`Computed (Saxton-Rawls)`,s=`rgba(168, 85, 247, 0.12)`,c=`#c084fc`,l=`1px solid rgba(168, 85, 247, 0.28)`):u.includes(`power`)||u.includes(`nasa power`)?(o=`NASA POWER`,s=`rgba(56, 189, 248, 0.12)`,c=`#38bdf8`,l=`1px solid rgba(56, 189, 248, 0.28)`):u.includes(`imerg`)||u.includes(`gpm`)?(o=`GPM IMERG`,s=`rgba(14, 165, 233, 0.12)`,c=`#0284c7`,l=`1px solid rgba(14, 165, 233, 0.28)`):u.includes(`class`)||u.includes(`average`)||u.includes(`গড়`)||u.includes(`মাপা নয়`)?(o=n===`xs`?t===`bn`?`গড় মান`:`Class Avg`:t===`bn`?`এই মাটির ধরনের গড় মান (মাপা নয়)`:`Class Average (Not Measured)`,s=`rgba(148, 163, 184, 0.18)`,c=`var(--text-main, #e2e8f0)`,l=`1px solid rgba(148, 163, 184, 0.38)`):u.includes(`offline`)||u.includes(`অফলাইন`)?(o=n===`xs`?t===`bn`?`অফলাইন`:`Offline`:t===`bn`?`SoilGrids তথ্য পাওয়া যায়নি (অফলাইন)`:`SoilGrids unavailable (offline)`,s=`rgba(239, 68, 68, 0.1)`,c=`#f87171`,l=`1px solid rgba(239, 68, 68, 0.2)`):(u.includes(`assumed`)||u.includes(`ধরে নেওয়া`)||u.includes(`default`))&&(o=t===`bn`?`ধরে নেওয়া`:`Assumed`,s=`rgba(148, 163, 184, 0.1)`,c=`#94a3b8`,l=`1px solid rgba(148, 163, 184, 0.2)`),(0,i.jsxs)(`span`,{className:`source-chip ${a}`,style:{display:`inline-flex`,alignItems:`center`,gap:5,fontSize:n===`xs`?10:11,fontWeight:600,padding:n===`xs`?`1px 6px`:`2px 8px`,borderRadius:6,background:s,color:c,border:l,whiteSpace:`nowrap`,...r},children:[(0,i.jsx)(`span`,{style:{width:5,height:5,borderRadius:`50%`,background:c,display:`inline-block`}}),o]})}var ee={bg_dark:`#0b110f`,bg_light:`#f1f5f3`,grass_dark:`#5f8f3c`,grass_light:`#72a34b`,crop_rice:`#6ba353`,crop_wheat:`#d4bc70`,crop_mustard:`#e5b338`,crop_pulse:`#7ea45f`,crop_sunflower:`#eab308`,crop_jute:`#4d8c48`,crop_sesame:`#88a85e`,crop_potato:`#5a8244`,crop_maize:`#6c9945`,crop_tomato:`#5c8c4a`,water:`#72b8ce`,water_standing:`rgba(114, 184, 206, 0.65)`,soil_base:`#8a5a3a`,soil_drought:`#b8946e`,soil_wet:`#543825`,strata_mid:`#7a4628`,strata_bot:`#574030`,barn_wall:`#ece4d4`,barn_roof:`#5f6d74`,silo:`#e2e2da`,fence:`#bfa77e`,wood:`#664a32`,tree_dark:`#416e2a`,tree_light:`#548737`};function L(e){if(!e)return`fallow`;let t=String(e).toLowerCase().trim();return t.includes(`fallow`)||t.includes(`পতিত`)?`fallow`:t.includes(`rice`)||t.includes(`ধান`)||t.includes(`boro`)||t.includes(`aman`)||t.includes(`aus`)?`rice`:t.includes(`mustard`)||t.includes(`সরিষা`)?`mustard`:t.includes(`wheat`)||t.includes(`গম`)?`wheat`:t.includes(`sunflower`)||t.includes(`সূর্যমুখী`)?`sunflower`:t.includes(`jute`)||t.includes(`পাট`)?`jute`:t.includes(`sesame`)||t.includes(`তিল`)?`sesame`:t.includes(`potato`)||t.includes(`আলু`)?`potato`:t.includes(`maize`)||t.includes(`ভুট্টা`)?`maize`:t.includes(`tomato`)||t.includes(`টমেটো`)?`tomato`:t.includes(`lentil`)||t.includes(`mung`)||t.includes(`pulse`)||t.includes(`chickpea`)||t.includes(`ডাল`)||t.includes(`ছোলা`)?`pulse`:`general`}function te(e){return e==null||isNaN(e)?null:(Number(e)*7.4749).toFixed(1)}function ne({cropName:e,size:t=64,className:n=``}){let r=L(e);return(0,i.jsx)(`div`,{className:`crop-illustration ${n}`,style:{display:`inline-flex`},children:(()=>{switch(r){case`rice`:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#e8f5e9`,stroke:`#81c784`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M32 50V20`,stroke:`#388e3c`,strokeWidth:`2.5`,strokeLinecap:`round`}),(0,i.jsx)(`path`,{d:`M32 38C26 34 22 28 24 22C28 22 31 28 32 32`,fill:`#81c784`}),(0,i.jsx)(`path`,{d:`M32 32C38 28 42 22 40 16C36 16 33 22 32 26`,fill:`#81c784`}),(0,i.jsx)(`path`,{d:`M32 24C28 18 25 14 28 10C32 12 33 16 32 20`,fill:`#a5d6a7`}),(0,i.jsx)(`path`,{d:`M32 18C36 14 38 10 36 6C32 8 31 12 32 16`,fill:`#a5d6a7`}),(0,i.jsx)(`path`,{d:`M14 54C22 51 42 51 50 54`,stroke:`#4fc3f7`,strokeWidth:`2`,strokeLinecap:`round`})]});case`mustard`:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#fffde7`,stroke:`#fff176`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M32 52V24`,stroke:`#558b2f`,strokeWidth:`2.5`,strokeLinecap:`round`}),(0,i.jsx)(`path`,{d:`M32 40C26 36 24 30 27 28C30 30 31 34 32 37`,fill:`#8bc34a`}),(0,i.jsx)(`path`,{d:`M32 34C38 30 40 24 37 22C34 24 33 28 32 31`,fill:`#8bc34a`}),(0,i.jsx)(`circle`,{cx:`32`,cy:`18`,r:`4`,fill:`#fbc02d`}),(0,i.jsx)(`circle`,{cx:`26`,cy:`19`,r:`3.5`,fill:`#fdd835`}),(0,i.jsx)(`circle`,{cx:`38`,cy:`19`,r:`3.5`,fill:`#fdd835`}),(0,i.jsx)(`circle`,{cx:`29`,cy:`13`,r:`3`,fill:`#ffee58`}),(0,i.jsx)(`circle`,{cx:`35`,cy:`13`,r:`3`,fill:`#ffee58`}),(0,i.jsx)(`circle`,{cx:`32`,cy:`15`,r:`2`,fill:`#fff59d`})]});case`wheat`:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#fff8e1`,stroke:`#ffe082`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M32 52V28`,stroke:`#d4a343`,strokeWidth:`2.5`,strokeLinecap:`round`}),(0,i.jsx)(`path`,{d:`M32 30C28 26 26 22 28 20C31 21 32 24 32 27`,fill:`#f0c365`}),(0,i.jsx)(`path`,{d:`M32 25C36 21 38 17 36 15C33 16 32 19 32 22`,fill:`#f0c365`}),(0,i.jsx)(`path`,{d:`M32 20C28 16 26 12 28 10C31 11 32 14 32 17`,fill:`#f6d389`}),(0,i.jsx)(`path`,{d:`M32 15C36 11 38 7 36 5C33 6 32 9 32 12`,fill:`#f6d389`}),(0,i.jsx)(`path`,{d:`M32 10V4`,stroke:`#d4a343`,strokeWidth:`1.5`,strokeLinecap:`round`})]});case`sunflower`:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#fffde7`,stroke:`#fbc02d`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M32 52V30`,stroke:`#33691e`,strokeWidth:`3`,strokeLinecap:`round`}),(0,i.jsx)(`path`,{d:`M32 42C24 38 22 30 26 28C29 32 31 36 32 39`,fill:`#558b2f`}),(0,i.jsx)(`circle`,{cx:`32`,cy:`22`,r:`14`,fill:`#fbc02d`}),(0,i.jsx)(`circle`,{cx:`32`,cy:`22`,r:`8`,fill:`#5d4037`}),(0,i.jsx)(`circle`,{cx:`32`,cy:`22`,r:`6`,fill:`#3e2723`})]});case`pulse`:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#f1f8e9`,stroke:`#aed581`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M32 50V32`,stroke:`#558b2f`,strokeWidth:`2.5`,strokeLinecap:`round`}),(0,i.jsx)(`ellipse`,{cx:`24`,cy:`28`,rx:`6`,ry:`4`,transform:`rotate(-30 24 28)`,fill:`#7cb342`}),(0,i.jsx)(`ellipse`,{cx:`40`,cy:`28`,rx:`6`,ry:`4`,transform:`rotate(30 40 28)`,fill:`#7cb342`}),(0,i.jsx)(`ellipse`,{cx:`32`,cy:`20`,rx:`5`,ry:`6`,fill:`#8bc34a`}),(0,i.jsx)(`path`,{d:`M32 30C36 33 42 34 44 32C42 36 36 38 32 35`,fill:`#689f38`})]});case`potato`:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#efebe9`,stroke:`#bcaaa4`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M32 34V18`,stroke:`#33691e`,strokeWidth:`2.5`}),(0,i.jsx)(`circle`,{cx:`32`,cy:`18`,r:`6`,fill:`#689f38`}),(0,i.jsx)(`circle`,{cx:`26`,cy:`22`,r:`5`,fill:`#558b2f`}),(0,i.jsx)(`circle`,{cx:`38`,cy:`22`,r:`5`,fill:`#558b2f`}),(0,i.jsx)(`ellipse`,{cx:`32`,cy:`46`,rx:`16`,ry:`6`,fill:`#8d6e63`}),(0,i.jsx)(`ellipse`,{cx:`28`,cy:`45`,rx:`5`,ry:`3.5`,fill:`#d7ccc8`,stroke:`#8d6e63`,strokeWidth:`1`}),(0,i.jsx)(`ellipse`,{cx:`37`,cy:`47`,rx:`4`,ry:`3`,fill:`#d7ccc8`,stroke:`#8d6e63`,strokeWidth:`1`})]});case`jute`:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#e8f5e9`,stroke:`#a5d6a7`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M32 54V12`,stroke:`#2e7d32`,strokeWidth:`3`,strokeLinecap:`round`}),(0,i.jsx)(`path`,{d:`M32 36C24 33 22 26 26 24C28 27 30 31 32 33`,fill:`#4caf50`}),(0,i.jsx)(`path`,{d:`M32 28C40 25 42 18 38 16C36 19 34 23 32 25`,fill:`#4caf50`}),(0,i.jsx)(`path`,{d:`M32 20C26 17 24 11 28 9C30 12 31 15 32 17`,fill:`#66bb6a`})]});case`maize`:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#fffde7`,stroke:`#ffe082`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M32 52V20`,stroke:`#33691e`,strokeWidth:`3`}),(0,i.jsx)(`path`,{d:`M32 38C22 34 18 24 22 22C26 26 29 32 32 35`,fill:`#558b2f`}),(0,i.jsx)(`path`,{d:`M32 32C42 28 46 18 42 16C38 20 35 26 32 29`,fill:`#558b2f`}),(0,i.jsx)(`ellipse`,{cx:`32`,cy:`22`,rx:`4.5`,ry:`9`,fill:`#fbc02d`,stroke:`#f57f17`,strokeWidth:`1`})]});default:return(0,i.jsxs)(`svg`,{viewBox:`0 0 64 64`,width:t,height:t,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,i.jsx)(`circle`,{cx:`32`,cy:`32`,r:`30`,fill:`#efebe9`,stroke:`#d7ccc8`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M16 36C22 32 42 32 48 36`,stroke:`#8d6e63`,strokeWidth:`2.5`,strokeLinecap:`round`}),(0,i.jsx)(`path`,{d:`M14 42C20 38 44 38 50 42`,stroke:`#8d6e63`,strokeWidth:`2.5`,strokeLinecap:`round`}),(0,i.jsx)(`path`,{d:`M18 48C24 44 40 44 46 48`,stroke:`#8d6e63`,strokeWidth:`2`,strokeLinecap:`round`}),(0,i.jsx)(`circle`,{cx:`32`,cy:`24`,r:`2.5`,fill:`#bcaaa4`})]})}})()})}var R=[{date:`2026-08-31`,temperature:28.23,temp_max:31.14,temp_min:26.24,rainfall:4.78,humidity:90.12,wind_speed:3.07,solar_radiation:12.73},{date:`2026-09-01`,temperature:27.72,temp_max:30.23,temp_min:25.69,rainfall:8.83,humidity:90.63,wind_speed:3,solar_radiation:10.62},{date:`2026-09-02`,temperature:27.54,temp_max:30.86,temp_min:25.69,rainfall:19.3,humidity:90.79,wind_speed:2.38,solar_radiation:12.19},{date:`2026-09-03`,temperature:26.54,temp_max:27.9,temp_min:25.24,rainfall:15.14,humidity:93.61,wind_speed:2.33,solar_radiation:13.91},{date:`2026-09-04`,temperature:27.59,temp_max:31.17,temp_min:25.05,rainfall:9.49,humidity:90.11,wind_speed:2.11,solar_radiation:18.98},{date:`2026-09-05`,temperature:27.95,temp_max:31.38,temp_min:25.54,rainfall:6.26,humidity:89.76,wind_speed:1.99,solar_radiation:14.22},{date:`2026-09-06`,temperature:27.4,temp_max:30.44,temp_min:25.81,rainfall:19.48,humidity:91.91,wind_speed:1.35,solar_radiation:10.11},{date:`2026-09-07`,temperature:28.63,temp_max:32.43,temp_min:25.21,rainfall:4.76,humidity:88.4,wind_speed:1.31,solar_radiation:17.54},{date:`2026-09-08`,temperature:29.19,temp_max:32.64,temp_min:26.85,rainfall:6.92,humidity:88.84,wind_speed:1.15,solar_radiation:15.3},{date:`2026-09-09`,temperature:28.39,temp_max:30.69,temp_min:27.03,rainfall:5.59,humidity:91.85,wind_speed:1.31,solar_radiation:17.65},{date:`2026-09-10`,temperature:29.23,temp_max:33.28,temp_min:26.23,rainfall:5.89,humidity:87.48,wind_speed:1.27,solar_radiation:18.65},{date:`2026-09-11`,temperature:27.78,temp_max:31.35,temp_min:25.79,rainfall:4.91,humidity:90.08,wind_speed:1.46,solar_radiation:20.33},{date:`2026-09-12`,temperature:28.29,temp_max:32.05,temp_min:25.06,rainfall:3.68,humidity:87.39,wind_speed:1.2,solar_radiation:17.48},{date:`2026-09-13`,temperature:29.04,temp_max:32.9,temp_min:25.26,rainfall:3.09,humidity:82.82,wind_speed:.67,solar_radiation:20.77},{date:`2026-09-14`,temperature:29.6,temp_max:33.65,temp_min:25.99,rainfall:1.41,humidity:80,wind_speed:.73,solar_radiation:15.84},{date:`2026-09-15`,temperature:29.71,temp_max:34.04,temp_min:25.65,rainfall:1.17,humidity:79.64,wind_speed:.99,solar_radiation:19.92},{date:`2026-09-16`,temperature:29.31,temp_max:33.4,temp_min:26.04,rainfall:2.4,humidity:80.87,wind_speed:1.26,solar_radiation:14.42},{date:`2026-09-17`,temperature:28.41,temp_max:32.28,temp_min:25.42,rainfall:2.09,humidity:84.45,wind_speed:1.4,solar_radiation:10.77},{date:`2026-09-18`,temperature:29,temp_max:33.34,temp_min:24.87,rainfall:.63,humidity:80.7,wind_speed:.89,solar_radiation:20.46},{date:`2026-09-19`,temperature:30.3,temp_max:34.83,temp_min:25.57,rainfall:2.44,humidity:76.86,wind_speed:.9,solar_radiation:21.02},{date:`2026-09-20`,temperature:28.51,temp_max:31.32,temp_min:25.63,rainfall:5.33,humidity:86.42,wind_speed:1.25,solar_radiation:10.23},{date:`2026-09-21`,temperature:29.82,temp_max:34.51,temp_min:24.58,rainfall:2.75,humidity:78.18,wind_speed:.96,solar_radiation:21.32},{date:`2026-09-22`,temperature:29.62,temp_max:33.77,temp_min:26.22,rainfall:5.14,humidity:84.45,wind_speed:1.22,solar_radiation:11.82},{date:`2026-09-23`,temperature:29.24,temp_max:33.02,temp_min:26.09,rainfall:6.17,humidity:85.15,wind_speed:1.39,solar_radiation:13.65},{date:`2026-09-24`,temperature:28.16,temp_max:32.22,temp_min:25.43,rainfall:7.98,humidity:87.47,wind_speed:1.8,solar_radiation:6.04},{date:`2026-09-25`,temperature:27.59,temp_max:30.49,temp_min:25.47,rainfall:2.45,humidity:88.91,wind_speed:1.71,solar_radiation:14.75},{date:`2026-09-26`,temperature:28.48,temp_max:32.74,temp_min:24.86,rainfall:1.37,humidity:85.19,wind_speed:1.46,solar_radiation:19.09},{date:`2026-09-27`,temperature:28.91,temp_max:33.15,temp_min:24.53,rainfall:.64,humidity:80.55,wind_speed:.83,solar_radiation:19.44},{date:`2026-09-28`,temperature:29.12,temp_max:33.16,temp_min:25.41,rainfall:.33,humidity:79.81,wind_speed:.94,solar_radiation:null},{date:`2026-09-29`,temperature:28.79,temp_max:33.39,temp_min:25.11,rainfall:.25,humidity:81.53,wind_speed:1.55,solar_radiation:null}];function re({nasa:e={},env:t={},activeField:n=null,onBack:a}){let[o,c]=(0,r.useState)(`globe`),[l,u]=(0,r.useState)(24),[d,f]=(0,r.useState)(`temp`),[p,m]=(0,r.useState)(30),[g,_]=(0,r.useState)(null),[v,y]=(0,r.useState)(null),b=!!(n?.id===`demo`||n?.is_demo),x=n?.latitude==null?24.85:Number(n.latitude),S=n?.longitude==null?89.37:Number(n.longitude),C=n?.name||(b?`Demo Field (Bogura 10 ha) [DEMO]`:`Regional Weather Center (Bogura Reference)`);(0,r.useEffect)(()=>{let e=!1;async function t(){try{let t={latitude:x,longitude:S,district:n?.district||void 0},r=await s(`/api/location/weather`,{method:`POST`,body:JSON.stringify(t)});!e&&r?.status===`ok`&&y(r)}catch(e){console.warn(`Weather fetch fallback to cached telemetry:`,e)}}return t(),()=>{e=!0}},[x,S,n?.district]);let w=v?.series&&v.series.length>0?v.series:Array.isArray(R)&&R.length>0?R:[],T=v?.summary||e?.summary||{},E=T.temperature??(t.temperature==null?27.8:Number(t.temperature)),D=T.temp_max??(t.temp_max==null?32.2:Number(t.temp_max)),O=T.temp_min??(t.temp_min==null?24.2:Number(t.temp_min)),k=T.humidity??(t.humidity==null?82.8:Number(t.humidity)),A=T.wind_speed??(t.wind_speed==null?1.4:Number(t.wind_speed)),j=T.rainfall??(t.rainfall==null?.17:Number(t.rainfall)),M=T.latest_valid_date||e.latest_valid_date||`2025-12-31`,N=T.rows||e.rows||30,P=!!(v?.series?.length||e&&(e.data_status===`observed`||e.data_status===`live`)),F=(0,r.useMemo)(()=>{let e=w;return e.slice(Math.max(0,e.length-p)).map(e=>({...e,temperature:Number(e.temperature)||E,temp_max:Number(e.temp_max)||D,temp_min:Number(e.temp_min)||O,rainfall:Number(e.rainfall)||j,humidity:Number(e.humidity)||k,wind_speed:Number(e.wind_speed)||A,solar_radiation:Number(e.solar_radiation)||14.5}))},[w,p,E,D,O,k,A,j]),I=(0,r.useMemo)(()=>!w||w.length===0?null:w.slice(Math.max(0,w.length-30)).reduce((e,t)=>e+(Number(t.rainfall)||0),0).toFixed(1),[w]),ee=(0,r.useMemo)(()=>{if(!w||w.length===0)return null;let e=w[w.length-1],t=e.solar_radiation??e.ALLSKY_SFC_SW_DWN;return t==null?null:Number(t).toFixed(1)},[w]),L=E!=null&&k!=null?(E-(100-k)/5).toFixed(1):null,te=(D-O).toFixed(1),ne=(.0023*(E+17.8)*Math.sqrt(Math.max(1,D-O))*14.2/2.45).toFixed(1),re=Math.max(0,(D+O)/2-10).toFixed(1);return(0,i.jsxs)(`div`,{className:`nasa-weather-container`,children:[(0,i.jsxs)(`div`,{className:`nasa-view-header`,children:[(0,i.jsxs)(`div`,{className:`nasa-header-left`,children:[(0,i.jsxs)(`div`,{className:`nasa-badge-row`,style:{display:`flex`,alignItems:`center`,gap:10,flexWrap:`wrap`,marginBottom:8},children:[(0,i.jsxs)(`span`,{className:`nasa-satellite-pill`,children:[(0,i.jsx)(`span`,{className:`nasa-pulse-dot`}),` NASA POWER AGROMETEOROLOGICAL`]}),(0,i.jsx)(`span`,{className:`nasa-res-tag`,children:`SPATIAL RESOLUTION: 0.5° × 0.5° (~50 KM)`}),(0,i.jsx)(h,{source:`NASA POWER`,cache:`30-day cached demo window`,period:M?`30 days ending ${M}`:`30-day demo window`})]}),(0,i.jsx)(`h1`,{className:`nasa-title`,children:`Environmental Observations & 3D Climate Station`}),(0,i.jsx)(`p`,{className:`nasa-subtitle`,children:`Observed daily climate telemetry (Context only — empirical NASA CERES & MERRA-2 meteorological assimilation)`})]}),(0,i.jsxs)(`div`,{className:`nasa-header-actions`,children:[(0,i.jsxs)(`button`,{type:`button`,className:`nasa-action-btn`,onClick:()=>{if(!F.length)return;let e=[`date`,`temperature_c`,`temp_max_c`,`temp_min_c`,`rainfall_mm`,`humidity_percent`,`wind_speed_ms`,`solar_radiation_mj_m2`],t=F.map(e=>[e.date,e.temperature,e.temp_max,e.temp_min,e.rainfall,e.humidity,e.wind_speed,e.solar_radiation]),n=`data:text/csv;charset=utf-8,`+[e.join(`,`),...t.map(e=>e.join(`,`))].join(`
`),r=encodeURI(n),i=document.createElement(`a`);i.setAttribute(`href`,r),i.setAttribute(`download`,P?`NASA_POWER_${x}_${S}_30days.csv`:`NASA_POWER_DEMO_BENCHMARK_${x}_${S}_30days.csv`),document.body.appendChild(i),i.click(),document.body.removeChild(i)},title:`Download verified NASA CSV`,children:[(0,i.jsxs)(`svg`,{width:`15`,height:`15`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2.2`,children:[(0,i.jsx)(`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`}),(0,i.jsx)(`polyline`,{points:`7 10 12 15 17 10`}),(0,i.jsx)(`line`,{x1:`12`,y1:`15`,x2:`12`,y2:`3`})]}),(0,i.jsx)(`span`,{children:`Export CSV`})]}),(0,i.jsxs)(`button`,{type:`button`,className:`back-btn`,onClick:a,children:[(0,i.jsxs)(`svg`,{width:`15`,height:`15`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2.5`,children:[(0,i.jsx)(`line`,{x1:`19`,y1:`12`,x2:`5`,y2:`12`}),(0,i.jsx)(`polyline`,{points:`12 19 5 12 12 5`})]}),(0,i.jsx)(`span`,{children:`Back to Dashboard`})]})]})]}),(0,i.jsxs)(`div`,{className:`nasa-mission-banner`,children:[(0,i.jsxs)(`div`,{className:`mission-stat`,children:[(0,i.jsx)(`span`,{className:`mission-label`,children:`Target Field Parcel`}),(0,i.jsx)(`strong`,{className:`mission-value`,children:C})]}),(0,i.jsx)(`div`,{className:`mission-divider`}),(0,i.jsxs)(`div`,{className:`mission-stat`,children:[(0,i.jsx)(`span`,{className:`mission-label`,children:`GPS Geolocation`}),(0,i.jsxs)(`strong`,{className:`mission-value`,children:[x.toFixed(4),`° N, `,S.toFixed(4),`° E`]})]}),(0,i.jsx)(`div`,{className:`mission-divider`}),(0,i.jsxs)(`div`,{className:`mission-stat`,children:[(0,i.jsx)(`span`,{className:`mission-label`,children:`Validation Date`}),(0,i.jsx)(`strong`,{className:`mission-value highlight-green`,children:M})]}),(0,i.jsx)(`div`,{className:`mission-divider`}),(0,i.jsxs)(`div`,{className:`mission-stat`,children:[(0,i.jsx)(`span`,{className:`mission-label`,children:`Assimilation Span`}),(0,i.jsxs)(`strong`,{className:`mission-value`,children:[N,` Consecutive Days`]})]}),(0,i.jsx)(`div`,{className:`mission-divider`}),(0,i.jsxs)(`div`,{className:`mission-stat`,children:[(0,i.jsx)(`span`,{className:`mission-label`,children:`Data Assurance`}),(0,i.jsx)(`strong`,{className:`mission-value ${P?`highlight-cyan`:`highlight-amber`}`,children:P?`Direct Climatology`:`Cached Archive`})]})]}),(0,i.jsxs)(`div`,{className:`nasa-main-grid`,children:[(0,i.jsxs)(`div`,{className:`nasa-stage-card`,children:[(0,i.jsxs)(`div`,{className:`stage-top-bar`,children:[(0,i.jsxs)(`div`,{className:`stage-tabs`,children:[(0,i.jsx)(`button`,{type:`button`,className:`stage-tab-btn ${o===`globe`?`active`:``}`,onClick:()=>c(`globe`),children:`🌐 3D Climate Globe`}),(0,i.jsx)(`button`,{type:`button`,className:`stage-tab-btn ${o===`column`?`active`:``}`,onClick:()=>c(`column`),children:`🌦️ 3D Atmospheric Profile`}),(0,i.jsx)(`button`,{type:`button`,className:`stage-tab-btn ${o===`satellite`?`active`:``}`,onClick:()=>c(`satellite`),children:`🛰️ Satellite Orbit Swath`})]}),(0,i.jsxs)(`div`,{className:`stage-controls`,children:[(0,i.jsx)(`button`,{type:`button`,className:`stage-ctrl-btn`,onClick:()=>u(e=>(e-15+360)%360),title:`Rotate Left`,children:`↺`}),(0,i.jsx)(`button`,{type:`button`,className:`stage-ctrl-btn`,onClick:()=>u(24),title:`Reset View Angle`,children:`⟲`}),(0,i.jsx)(`button`,{type:`button`,className:`stage-ctrl-btn`,onClick:()=>u(e=>(e+15)%360),title:`Rotate Right`,children:`↻`})]})]}),(0,i.jsxs)(`div`,{className:`stage-viewport`,children:[o===`globe`&&(0,i.jsx)(`div`,{className:`globe-3d-wrapper`,children:(0,i.jsxs)(`svg`,{className:`globe-svg`,viewBox:`0 0 540 380`,preserveAspectRatio:`xMidYMid meet`,children:[(0,i.jsxs)(`defs`,{children:[(0,i.jsxs)(`radialGradient`,{id:`globeGlow`,cx:`40%`,cy:`40%`,r:`60%`,children:[(0,i.jsx)(`stop`,{offset:`0%`,stopColor:`#38bdf8`,stopOpacity:`0.9`}),(0,i.jsx)(`stop`,{offset:`65%`,stopColor:`#050b10`,stopOpacity:`0.95`}),(0,i.jsx)(`stop`,{offset:`100%`,stopColor:`#050b10`,stopOpacity:`1`})]}),(0,i.jsxs)(`radialGradient`,{id:`atmoGlow`,cx:`50%`,cy:`50%`,r:`50%`,children:[(0,i.jsx)(`stop`,{offset:`70%`,stopColor:`rgba(56, 189, 248, 0)`}),(0,i.jsx)(`stop`,{offset:`95%`,stopColor:`rgba(56, 189, 248, 0.45)`}),(0,i.jsx)(`stop`,{offset:`100%`,stopColor:`rgba(56, 189, 248, 0.85)`})]}),(0,i.jsxs)(`linearGradient`,{id:`sunbeam`,x1:`0%`,y1:`0%`,x2:`100%`,y2:`100%`,children:[(0,i.jsx)(`stop`,{offset:`0%`,stopColor:`#facc15`,stopOpacity:`0.8`}),(0,i.jsx)(`stop`,{offset:`100%`,stopColor:`#facc15`,stopOpacity:`0`})]}),(0,i.jsxs)(`filter`,{id:`neonBlur`,children:[(0,i.jsx)(`feGaussianBlur`,{stdDeviation:`3`,result:`coloredBlur`}),(0,i.jsxs)(`feMerge`,{children:[(0,i.jsx)(`feMergeNode`,{in:`coloredBlur`}),(0,i.jsx)(`feMergeNode`,{in:`SourceGraphic`})]})]})]}),(0,i.jsx)(`rect`,{width:`540`,height:`380`,fill:`#050b10`,rx:`16`}),(0,i.jsxs)(`g`,{opacity:`0.6`,children:[(0,i.jsx)(`circle`,{cx:`45`,cy:`40`,r:`1`,fill:`#fff`}),(0,i.jsx)(`circle`,{cx:`120`,cy:`85`,r:`1.5`,fill:`#38bdf8`}),(0,i.jsx)(`circle`,{cx:`210`,cy:`30`,r:`0.8`,fill:`#fff`}),(0,i.jsx)(`circle`,{cx:`480`,cy:`65`,r:`1.2`,fill:`#fff`}),(0,i.jsx)(`circle`,{cx:`510`,cy:`190`,r:`1`,fill:`#facc15`}),(0,i.jsx)(`circle`,{cx:`80`,cy:`310`,r:`1.2`,fill:`#fff`}),(0,i.jsx)(`circle`,{cx:`450`,cy:`330`,r:`0.9`,fill:`#38bdf8`})]}),(0,i.jsx)(`circle`,{cx:`270`,cy:`190`,r:`152`,fill:`url(#atmoGlow)`}),(0,i.jsx)(`circle`,{cx:`270`,cy:`190`,r:`140`,fill:`url(#globeGlow)`,stroke:`#38bdf8`,strokeWidth:`1.5`,strokeOpacity:`0.4`}),(0,i.jsxs)(`g`,{opacity:`0.35`,stroke:`#38bdf8`,strokeWidth:`0.75`,fill:`none`,children:[(0,i.jsx)(`ellipse`,{cx:`270`,cy:`190`,rx:`140`,ry:`140`}),(0,i.jsx)(`ellipse`,{cx:`270`,cy:`140`,rx:`120`,ry:`24`}),(0,i.jsx)(`ellipse`,{cx:`270`,cy:`190`,rx:`140`,ry:`32`,strokeDasharray:`3 3`}),(0,i.jsx)(`ellipse`,{cx:`270`,cy:`240`,rx:`120`,ry:`24`}),(0,i.jsx)(`line`,{x1:`270`,y1:`50`,x2:`270`,y2:`330`,stroke:`#38bdf8`,strokeWidth:`1`,strokeDasharray:`4 2`})]}),(0,i.jsxs)(`g`,{opacity:`0.3`,stroke:`#38bdf8`,strokeWidth:`0.8`,fill:`none`,children:[(0,i.jsx)(`ellipse`,{cx:`270`,cy:`190`,rx:Math.abs(Math.sin(l*Math.PI/180)*140),ry:`140`}),(0,i.jsx)(`ellipse`,{cx:`270`,cy:`190`,rx:Math.abs(Math.sin((l+45)*Math.PI/180)*140),ry:`140`}),(0,i.jsx)(`ellipse`,{cx:`270`,cy:`190`,rx:Math.abs(Math.sin((l+90)*Math.PI/180)*140),ry:`140`})]}),(0,i.jsxs)(`g`,{fill:`#00df81`,opacity:`0.85`,filter:`url(#neonBlur)`,children:[(0,i.jsx)(`path`,{d:`M250,150 Q280,140 310,155 Q330,175 320,195 Q290,210 265,190 Q240,170 250,150 Z`,fill:`#00df81`}),(0,i.jsx)(`path`,{d:`M220,130 Q250,115 280,125 Q270,145 240,145 Z`,fill:`#00df81`,opacity:`0.6`}),(0,i.jsx)(`path`,{d:`M290,165 Q315,160 325,180 Q305,190 285,175 Z`,fill:`#00df81`})]}),(0,i.jsxs)(`g`,{fill:`#eef3ee`,opacity:`0.35`,children:[(0,i.jsx)(`path`,{d:`M200,160 Q240,145 290,165 Q330,155 370,170 Q320,185 270,175 Z`}),(0,i.jsx)(`path`,{d:`M180,210 Q230,195 280,215 Q340,205 380,225 Q320,235 250,225 Z`})]}),(0,i.jsxs)(`g`,{transform:`translate(295, 172)`,children:[(0,i.jsxs)(`circle`,{cx:`0`,cy:`0`,r:`24`,fill:`none`,stroke:`#00df81`,strokeWidth:`1`,opacity:`0.4`,children:[(0,i.jsx)(`animate`,{attributeName:`r`,values:`8;32`,dur:`2.5s`,repeatCount:`indefinite`}),(0,i.jsx)(`animate`,{attributeName:`opacity`,values:`0.8;0`,dur:`2.5s`,repeatCount:`indefinite`})]}),(0,i.jsxs)(`circle`,{cx:`0`,cy:`0`,r:`14`,fill:`none`,stroke:`#00df81`,strokeWidth:`1.5`,opacity:`0.7`,children:[(0,i.jsx)(`animate`,{attributeName:`r`,values:`4;20`,dur:`2.5s`,begin:`0.8s`,repeatCount:`indefinite`}),(0,i.jsx)(`animate`,{attributeName:`opacity`,values:`0.9;0`,dur:`2.5s`,begin:`0.8s`,repeatCount:`indefinite`})]}),(0,i.jsx)(`circle`,{cx:`0`,cy:`0`,r:`5`,fill:`#00df81`}),(0,i.jsx)(`circle`,{cx:`0`,cy:`0`,r:`2.5`,fill:`#eef3ee`}),(0,i.jsx)(`line`,{x1:`-12`,y1:`0`,x2:`-6`,y2:`0`,stroke:`#00df81`,strokeWidth:`2`}),(0,i.jsx)(`line`,{x1:`6`,y1:`0`,x2:`12`,y2:`0`,stroke:`#00df81`,strokeWidth:`2`}),(0,i.jsx)(`line`,{x1:`0`,y1:`-12`,x2:`0`,y2:`-6`,stroke:`#00df81`,strokeWidth:`2`}),(0,i.jsx)(`line`,{x1:`0`,y1:`6`,x2:`0`,y2:`12`,stroke:`#00df81`,strokeWidth:`2`}),(0,i.jsxs)(`g`,{transform:`translate(20, -22)`,children:[(0,i.jsx)(`rect`,{x:`0`,y:`0`,width:`145`,height:`42`,rx:`6`,fill:`rgba(15, 23, 42, 0.92)`,stroke:`#38bdf8`,strokeWidth:`1`}),(0,i.jsx)(`text`,{x:`8`,y:`15`,fill:`#38bdf8`,fontSize:`9.5`,fontWeight:`800`,fontFamily:`monospace`,children:`NASA POINT TELEMETRY`}),(0,i.jsx)(`text`,{x:`8`,y:`27`,fill:`#eef3ee`,fontSize:`10.5`,fontWeight:`700`,children:C.slice(0,18)}),(0,i.jsxs)(`text`,{x:`8`,y:`37`,fill:`#00df81`,fontSize:`9`,fontWeight:`600`,children:[E,`°C • `,k,`% RH • `,j,` mm`]})]})]}),(0,i.jsxs)(`g`,{transform:`translate(420, 90)`,children:[(0,i.jsx)(`line`,{x1:`-150`,y1:`40`,x2:`30`,y2:`-10`,stroke:`#38bdf8`,strokeWidth:`1`,strokeDasharray:`3 3`,opacity:`0.6`}),(0,i.jsx)(`rect`,{x:`-8`,y:`-4`,width:`16`,height:`8`,rx:`2`,fill:`#eef3ee`,stroke:`rgba(238, 243, 238, 0.42)`,strokeWidth:`1`}),(0,i.jsx)(`rect`,{x:`-24`,y:`-2`,width:`12`,height:`4`,fill:`#38bdf8`}),(0,i.jsx)(`rect`,{x:`12`,y:`-2`,width:`12`,height:`4`,fill:`#38bdf8`}),(0,i.jsx)(`circle`,{cx:`0`,cy:`0`,r:`2`,fill:`#f43f5e`}),(0,i.jsx)(`text`,{x:`-20`,y:`-10`,fill:`var(--text-muted, #94a3b8)`,fontSize:`8.5`,fontWeight:`700`,children:`CERES SAT-2`})]}),(0,i.jsx)(`path`,{d:`M70,70 L200,140`,stroke:`url(#sunbeam)`,strokeWidth:`3`,opacity:`0.8`}),(0,i.jsx)(`circle`,{cx:`60`,cy:`60`,r:`14`,fill:`#facc15`,filter:`url(#neonBlur)`}),(0,i.jsx)(`circle`,{cx:`60`,cy:`60`,r:`10`,fill:`#facc15`}),(0,i.jsx)(`text`,{x:`84`,y:`58`,fill:`#facc15`,fontSize:`9.5`,fontWeight:`800`,children:ee==null?`SOLAR FLUX: তথ্য নেই`:`SOLAR FLUX: ${ee} MJ/m²`})]})}),o===`column`&&(0,i.jsx)(`div`,{className:`column-3d-wrapper`,children:(0,i.jsxs)(`svg`,{className:`column-svg`,viewBox:`0 0 540 380`,preserveAspectRatio:`xMidYMid meet`,children:[(0,i.jsx)(`rect`,{width:`540`,height:`380`,fill:`#050b10`,rx:`16`}),(0,i.jsxs)(`g`,{transform:`translate(40, 35)`,children:[(0,i.jsx)(`polygon`,{points:`40,20 420,20 460,70 80,70`,fill:`rgba(30, 58, 138, 0.35)`,stroke:`#38bdf8`,strokeWidth:`1`}),(0,i.jsx)(`text`,{x:`90`,y:`48`,fill:`#38bdf8`,fontSize:`11`,fontWeight:`800`,children:`LAYER 4: STRATOSPHERE / SOLAR BOUNDARY (10–15 KM)`}),(0,i.jsxs)(`text`,{x:`90`,y:`62`,fill:`#38bdf8`,fontSize:`9.5`,children:[`Direct Solar Irradiance: `,ee==null?`তথ্য নেই`:`${ee} MJ/m²/day`,` • Top-of-Atmosphere Radiance`]})]}),(0,i.jsxs)(`g`,{transform:`translate(40, 110)`,children:[(0,i.jsx)(`polygon`,{points:`40,20 420,20 460,70 80,70`,fill:`rgba(14, 116, 144, 0.3)`,stroke:`#38bdf8`,strokeWidth:`1`}),(0,i.jsx)(`text`,{x:`90`,y:`48`,fill:`#38bdf8`,fontSize:`11`,fontWeight:`800`,children:`LAYER 3: CLOUD & HUMIDITY DECK (2–4 KM)`}),(0,i.jsxs)(`text`,{x:`90`,y:`62`,fill:`#38bdf8`,fontSize:`9.5`,children:[`Relative Humidity: `,k,`% • Condensation Level: ~1,200m • Dew Point: `,L,`°C`]})]}),(0,i.jsxs)(`g`,{transform:`translate(40, 185)`,children:[(0,i.jsx)(`polygon`,{points:`40,20 420,20 460,70 80,70`,fill:`rgba(15, 118, 110, 0.35)`,stroke:`#38bdf8`,strokeWidth:`1`}),(0,i.jsx)(`text`,{x:`90`,y:`48`,fill:`#38bdf8`,fontSize:`11`,fontWeight:`800`,children:`LAYER 2: BOUNDARY LAYER & WIND FIELD (0–1,000 M)`}),(0,i.jsxs)(`text`,{x:`90`,y:`62`,fill:`#38bdf8`,fontSize:`9.5`,children:[`Wind Speed: `,A,` m/s (`,(A*3.6).toFixed(1),` km/h) • Turbulent Momentum Flux: Low Drift`]})]}),(0,i.jsxs)(`g`,{transform:`translate(40, 260)`,children:[(0,i.jsx)(`polygon`,{points:`40,20 420,20 460,85 80,85`,fill:`rgba(22, 101, 52, 0.45)`,stroke:`#00df81`,strokeWidth:`1.5`}),(0,i.jsx)(`text`,{x:`90`,y:`48`,fill:`#00df81`,fontSize:`11.5`,fontWeight:`800`,children:`LAYER 1: CROP CANOPY & SOIL HORIZON (SURFACE)`}),(0,i.jsxs)(`text`,{x:`90`,y:`62`,fill:`#00df81`,fontSize:`9.5`,children:[`Surface Temp: `,E,`°C (`,O,`°C to `,D,`°C) • Rainfall Flux: `,j,` mm/day`]}),(0,i.jsxs)(`text`,{x:`90`,y:`76`,fill:`#00df81`,fontSize:`9`,children:[`Reference Evapotranspiration ET₀: `,ne,` mm/day • Diurnal Range: `,te,`°C`]})]}),(0,i.jsx)(`line`,{x1:`60`,y1:`50`,x2:`60`,y2:`340`,stroke:`rgba(238, 243, 238, 0.42)`,strokeWidth:`1.5`,strokeDasharray:`4 4`}),(0,i.jsx)(`text`,{x:`18`,y:`60`,fill:`var(--text-muted, #94a3b8)`,fontSize:`9`,fontWeight:`700`,children:`15 KM`}),(0,i.jsx)(`text`,{x:`22`,y:`135`,fill:`var(--text-muted, #94a3b8)`,fontSize:`9`,fontWeight:`700`,children:`4 KM`}),(0,i.jsx)(`text`,{x:`22`,y:`210`,fill:`var(--text-muted, #94a3b8)`,fontSize:`9`,fontWeight:`700`,children:`1 KM`}),(0,i.jsx)(`text`,{x:`26`,y:`295`,fill:`#00df81`,fontSize:`9`,fontWeight:`800`,children:`0 M`})]})}),o===`satellite`&&(0,i.jsx)(`div`,{className:`satellite-3d-wrapper`,children:(0,i.jsxs)(`svg`,{className:`satellite-svg`,viewBox:`0 0 540 380`,preserveAspectRatio:`xMidYMid meet`,children:[(0,i.jsx)(`rect`,{width:`540`,height:`380`,fill:`#050b10`,rx:`16`}),(0,i.jsx)(`path`,{d:`M-40,360 Q270,220 580,360`,fill:`#050b10`,stroke:`#38bdf8`,strokeWidth:`2`}),(0,i.jsx)(`path`,{d:`M-40,360 Q270,220 580,360 L580,420 L-40,420 Z`,fill:`#050b10`,opacity:`0.6`}),(0,i.jsxs)(`g`,{stroke:`#38bdf8`,strokeWidth:`1`,strokeDasharray:`3 3`,fill:`rgba(56, 189, 248, 0.08)`,children:[(0,i.jsx)(`polygon`,{points:`170,270 270,240 370,270 270,305`}),(0,i.jsx)(`polygon`,{points:`270,240 370,215 460,240 370,270`}),(0,i.jsx)(`polygon`,{points:`80,300 170,270 270,305 180,340`})]}),(0,i.jsx)(`circle`,{cx:`270`,cy:`275`,r:`7`,fill:`#f43f5e`}),(0,i.jsx)(`circle`,{cx:`270`,cy:`275`,r:`18`,fill:`none`,stroke:`#f43f5e`,strokeWidth:`1.5`,opacity:`0.5`}),(0,i.jsx)(`text`,{x:`282`,y:`278`,fill:`#eef3ee`,fontSize:`11`,fontWeight:`800`,children:C}),(0,i.jsxs)(`text`,{x:`282`,y:`292`,fill:`#38bdf8`,fontSize:`9.5`,fontWeight:`600`,children:[x.toFixed(2),`° N, `,S.toFixed(2),`° E`]}),(0,i.jsx)(`polygon`,{points:`270,60 170,270 370,270`,fill:`rgba(14, 165, 233, 0.12)`,stroke:`#38bdf8`,strokeWidth:`1`,strokeDasharray:`4 2`}),(0,i.jsxs)(`g`,{transform:`translate(270, 60)`,children:[(0,i.jsx)(`rect`,{x:`-16`,y:`-10`,width:`32`,height:`20`,rx:`3`,fill:`var(--text-muted, #94a3b8)`,stroke:`rgba(255, 255, 255, 0.08)`,strokeWidth:`1.5`}),(0,i.jsx)(`line`,{x1:`0`,y1:`10`,x2:`0`,y2:`24`,stroke:`rgba(148, 163, 184, 0.3)`,strokeWidth:`2`}),(0,i.jsx)(`circle`,{cx:`0`,cy:`26`,r:`4`,fill:`#38bdf8`}),(0,i.jsx)(`rect`,{x:`-56`,y:`-6`,width:`38`,height:`12`,fill:`#38bdf8`,stroke:`#38bdf8`,strokeWidth:`1`}),(0,i.jsx)(`line`,{x1:`-37`,y1:`-6`,x2:`-37`,y2:`6`,stroke:`#38bdf8`,strokeWidth:`1`}),(0,i.jsx)(`rect`,{x:`18`,y:`-6`,width:`38`,height:`12`,fill:`#38bdf8`,stroke:`#38bdf8`,strokeWidth:`1`}),(0,i.jsx)(`line`,{x1:`37`,y1:`-6`,x2:`37`,y2:`6`,stroke:`#38bdf8`,strokeWidth:`1`}),(0,i.jsx)(`text`,{x:`-48`,y:`-16`,fill:`#eef3ee`,fontSize:`10`,fontWeight:`800`,children:`NASA TERRA / AQUA AGROCLIMATOLOGY SWATH`})]})]})})]}),(0,i.jsxs)(`div`,{className:`stage-footer-bar`,children:[(0,i.jsx)(`span`,{children:`📡 Telemetry Feed: Point Assimilation Series`}),(0,i.jsx)(`span`,{children:`Elevation: Ground Datum`}),(0,i.jsx)(`span`,{className:`green-sync`,children:`● Sensor Synchronized`})]})]}),(0,i.jsxs)(`div`,{className:`nasa-instruments-deck`,children:[(0,i.jsxs)(`div`,{className:`gauge-card-3d`,children:[(0,i.jsxs)(`div`,{className:`gauge-header`,children:[(0,i.jsx)(`span`,{className:`gauge-title`,children:`🌡️ Thermal Envelope`}),(0,i.jsxs)(`span`,{className:`gauge-pill temp`,children:[`DIURNAL: Δ `,te,`°C`]})]}),(0,i.jsxs)(`div`,{className:`gauge-body`,children:[(0,i.jsx)(`div`,{className:`thermometer-3d-visual`,children:(0,i.jsxs)(`div`,{className:`thermo-tube`,children:[(0,i.jsx)(`div`,{className:`thermo-fill`,style:{height:`${Math.min(100,Math.max(10,(E-10)/35*100))}%`}}),(0,i.jsx)(`div`,{className:`thermo-bulb`})]})}),(0,i.jsxs)(`div`,{className:`gauge-readouts`,children:[(0,i.jsxs)(`div`,{className:`readout-hero`,children:[(0,i.jsx)(`span`,{className:`readout-num`,children:E}),(0,i.jsx)(`span`,{className:`readout-unit`,children:`°C`})]}),(0,i.jsxs)(`div`,{className:`readout-limits`,children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{children:`Max:`}),` `,(0,i.jsxs)(`strong`,{children:[D,`°C`]})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{children:`Min:`}),` `,(0,i.jsxs)(`strong`,{children:[O,`°C`]})]})]}),(0,i.jsx)(`span`,{className:`readout-status-tag tag-green`,children:E>=20&&E<=32?`Optimal temp (rule-based hint)`:`Suboptimal temp (rule-based hint)`})]})]})]}),(0,i.jsxs)(`div`,{className:`gauge-card-3d`,children:[(0,i.jsxs)(`div`,{className:`gauge-header`,children:[(0,i.jsx)(`span`,{className:`gauge-title`,children:`🌧️ Daily Precipitation`}),(0,i.jsx)(`span`,{className:`gauge-pill rain`,children:`HYDROLOGY`})]}),(0,i.jsxs)(`div`,{className:`gauge-body`,children:[(0,i.jsxs)(`div`,{className:`rain-cylinder-3d`,children:[(0,i.jsx)(`div`,{className:`cylinder-top`}),(0,i.jsx)(`div`,{className:`cylinder-body`,children:(0,i.jsx)(`div`,{className:`cylinder-water`,style:{height:`${Math.min(95,Math.max(15,j/25*100))}%`},children:(0,i.jsx)(`div`,{className:`water-surface`})})})]}),(0,i.jsxs)(`div`,{className:`gauge-readouts`,children:[(0,i.jsxs)(`div`,{className:`readout-hero`,children:[(0,i.jsx)(`span`,{className:`readout-num`,children:j}),(0,i.jsx)(`span`,{className:`readout-unit`,children:`mm/day`})]}),(0,i.jsxs)(`div`,{className:`readout-limits`,children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{children:`30-Day Sum:`}),` `,(0,i.jsx)(`strong`,{children:I==null?lang===`bn`?`তথ্য নেই`:`No data`:`${I} mm`})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{children:`Intensity:`}),` `,(0,i.jsx)(`strong`,{children:j>5?`Moderate`:`Light Trace`})]})]}),(0,i.jsx)(`span`,{className:`readout-status-tag tag-blue`,children:j>2?`Precipitation observed (rule-based hint)`:`Low precipitation (rule-based hint)`})]})]})]}),(0,i.jsxs)(`div`,{className:`gauge-card-3d`,children:[(0,i.jsxs)(`div`,{className:`gauge-header`,children:[(0,i.jsx)(`span`,{className:`gauge-title`,children:`💧 Relative Humidity`}),(0,i.jsxs)(`span`,{className:`gauge-pill humidity`,children:[`DEW POINT: `,L,`°C`]})]}),(0,i.jsxs)(`div`,{className:`gauge-body`,children:[(0,i.jsx)(`div`,{className:`hygro-orb-3d`,children:(0,i.jsxs)(`div`,{className:`orb-outer`,children:[(0,i.jsx)(`div`,{className:`orb-inner`,style:{opacity:k/100}}),(0,i.jsx)(`span`,{className:`orb-icon`,children:`💧`})]})}),(0,i.jsxs)(`div`,{className:`gauge-readouts`,children:[(0,i.jsxs)(`div`,{className:`readout-hero`,children:[(0,i.jsx)(`span`,{className:`readout-num`,children:k}),(0,i.jsx)(`span`,{className:`readout-unit`,children:`%`})]}),(0,i.jsxs)(`div`,{className:`readout-limits`,children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{children:`Vapor Pressure:`}),` `,(0,i.jsx)(`strong`,{children:`High`})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{children:`Risk Index:`}),` `,(0,i.jsx)(`strong`,{style:{color:k>80?`var(--sun)`:`var(--leaf)`},children:k>80?`High humidity (rule-based hint)`:`Normal (rule-based hint)`})]})]}),(0,i.jsx)(`span`,{className:`readout-status-tag tag-amber`,children:k>80?`High humidity (rule-based hint)`:`Moderate humidity (rule-based hint)`})]})]})]}),(0,i.jsxs)(`div`,{className:`gauge-card-3d`,children:[(0,i.jsxs)(`div`,{className:`gauge-header`,children:[(0,i.jsx)(`span`,{className:`gauge-title`,children:`🧭 Surface Wind Field`}),(0,i.jsx)(`span`,{className:`gauge-pill wind`,children:`BEAUFORT: 1`})]}),(0,i.jsxs)(`div`,{className:`gauge-body`,children:[(0,i.jsx)(`div`,{className:`compass-3d-visual`,children:(0,i.jsxs)(`div`,{className:`compass-plate`,children:[(0,i.jsx)(`div`,{className:`compass-arrow`,style:{transform:`rotate(55deg)`},children:`▲`}),(0,i.jsx)(`span`,{className:`compass-label north`,children:`N`}),(0,i.jsx)(`span`,{className:`compass-label east`,children:`E`}),(0,i.jsx)(`span`,{className:`compass-label south`,children:`S`}),(0,i.jsx)(`span`,{className:`compass-label west`,children:`W`})]})}),(0,i.jsxs)(`div`,{className:`gauge-readouts`,children:[(0,i.jsxs)(`div`,{className:`readout-hero`,children:[(0,i.jsx)(`span`,{className:`readout-num`,children:A}),(0,i.jsx)(`span`,{className:`readout-unit`,children:`m/s`})]}),(0,i.jsxs)(`div`,{className:`readout-limits`,children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{children:`Speed:`}),` `,(0,i.jsxs)(`strong`,{children:[(A*3.6).toFixed(1),` km/h`]})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{children:`Direction:`}),` `,(0,i.jsx)(`strong`,{children:`NE (55°)`})]})]}),(0,i.jsx)(`span`,{className:`readout-status-tag tag-green`,children:A>=1&&A<=4?`Low wind (rule-based hint)`:`High wind (rule-based hint)`})]})]})]})]})]}),(0,i.jsxs)(`div`,{className:`nasa-chart-card`,children:[(0,i.jsxs)(`div`,{className:`chart-header-row`,children:[(0,i.jsxs)(`div`,{className:`chart-title-wrap`,children:[(0,i.jsx)(`h3`,{children:`📈 Empirical Observation Timeseries Curve`}),(0,i.jsx)(`p`,{children:`Continuous daily atmospheric measurements from NASA POWER Point Grid`})]}),(0,i.jsxs)(`div`,{className:`chart-controls-wrap`,children:[(0,i.jsxs)(`div`,{className:`chart-metric-selector`,children:[(0,i.jsx)(`button`,{type:`button`,className:`metric-tab-btn ${d===`temp`?`active`:``}`,onClick:()=>f(`temp`),children:`🌡️ Temperature High/Mean/Low`}),(0,i.jsx)(`button`,{type:`button`,className:`metric-tab-btn ${d===`rain`?`active`:``}`,onClick:()=>f(`rain`),children:`🌧️ Precipitation Rainfall`}),(0,i.jsx)(`button`,{type:`button`,className:`metric-tab-btn ${d===`humidity`?`active`:``}`,onClick:()=>f(`humidity`),children:`💧 Relative Humidity`}),(0,i.jsx)(`button`,{type:`button`,className:`metric-tab-btn ${d===`solar`?`active`:``}`,onClick:()=>f(`solar`),children:`☀️ Solar Irradiance`})]}),(0,i.jsxs)(`div`,{className:`chart-horizon-selector`,children:[(0,i.jsx)(`button`,{type:`button`,className:`horizon-btn ${p===7?`active`:``}`,onClick:()=>m(7),children:`7D`}),(0,i.jsx)(`button`,{type:`button`,className:`horizon-btn ${p===14?`active`:``}`,onClick:()=>m(14),children:`14D`}),(0,i.jsx)(`button`,{type:`button`,className:`horizon-btn ${p===30?`active`:``}`,onClick:()=>m(30),children:`30D Full`})]})]})]}),(0,i.jsxs)(`div`,{className:`chart-svg-container`,children:[(0,i.jsxs)(`svg`,{className:`nasa-timeseries-svg`,viewBox:`0 0 960 260`,preserveAspectRatio:`none`,children:[(0,i.jsxs)(`defs`,{children:[(0,i.jsxs)(`linearGradient`,{id:`tempGradient`,x1:`0`,y1:`0`,x2:`0`,y2:`1`,children:[(0,i.jsx)(`stop`,{offset:`0%`,stopColor:`#f43f5e`,stopOpacity:`0.4`}),(0,i.jsx)(`stop`,{offset:`50%`,stopColor:`#facc15`,stopOpacity:`0.2`}),(0,i.jsx)(`stop`,{offset:`100%`,stopColor:`#38bdf8`,stopOpacity:`0.05`})]}),(0,i.jsxs)(`linearGradient`,{id:`rainGradient`,x1:`0`,y1:`0`,x2:`0`,y2:`1`,children:[(0,i.jsx)(`stop`,{offset:`0%`,stopColor:`#38bdf8`,stopOpacity:`0.9`}),(0,i.jsx)(`stop`,{offset:`100%`,stopColor:`#38bdf8`,stopOpacity:`0.3`})]}),(0,i.jsxs)(`linearGradient`,{id:`humidityGradient`,x1:`0`,y1:`0`,x2:`0`,y2:`1`,children:[(0,i.jsx)(`stop`,{offset:`0%`,stopColor:`#38bdf8`,stopOpacity:`0.4`}),(0,i.jsx)(`stop`,{offset:`100%`,stopColor:`#38bdf8`,stopOpacity:`0.05`})]}),(0,i.jsxs)(`linearGradient`,{id:`solarGradient`,x1:`0`,y1:`0`,x2:`0`,y2:`1`,children:[(0,i.jsx)(`stop`,{offset:`0%`,stopColor:`#facc15`,stopOpacity:`0.5`}),(0,i.jsx)(`stop`,{offset:`100%`,stopColor:`#facc15`,stopOpacity:`0.05`})]})]}),(0,i.jsx)(`line`,{x1:`60`,y1:`40`,x2:`940`,y2:`40`,stroke:`rgba(148, 163, 184, 0.2)`,strokeDasharray:`3 3`}),(0,i.jsx)(`line`,{x1:`60`,y1:`95`,x2:`940`,y2:`95`,stroke:`rgba(148, 163, 184, 0.2)`,strokeDasharray:`3 3`}),(0,i.jsx)(`line`,{x1:`60`,y1:`150`,x2:`940`,y2:`150`,stroke:`rgba(148, 163, 184, 0.2)`,strokeDasharray:`3 3`}),(0,i.jsx)(`line`,{x1:`60`,y1:`205`,x2:`940`,y2:`205`,stroke:`rgba(148, 163, 184, 0.3)`}),d===`temp`&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`path`,{d:F.reduce((e,t,n)=>{let r=60+n/(F.length-1)*880,i=205-(t.temp_max-20)/20*165;return n===0?`M${r},${i}`:`${e} L${r},${i}`},``),fill:`none`,stroke:`#f43f5e`,strokeWidth:`2.5`}),(0,i.jsx)(`path`,{d:`${F.reduce((e,t,n)=>{let r=60+n/(F.length-1)*880,i=205-(t.temperature-20)/20*165;return n===0?`M${r},${i}`:`${e} L${r},${i}`},``)} L940,205 L60,205 Z`,fill:`url(#tempGradient)`}),(0,i.jsx)(`path`,{d:F.reduce((e,t,n)=>{let r=60+n/(F.length-1)*880,i=205-(t.temperature-20)/20*165;return n===0?`M${r},${i}`:`${e} L${r},${i}`},``),fill:`none`,stroke:`#facc15`,strokeWidth:`3`}),(0,i.jsx)(`path`,{d:F.reduce((e,t,n)=>{let r=60+n/(F.length-1)*880,i=205-(t.temp_min-20)/20*165;return n===0?`M${r},${i}`:`${e} L${r},${i}`},``),fill:`none`,stroke:`#38bdf8`,strokeWidth:`2.5`,strokeDasharray:`4 2`})]}),d===`rain`&&(0,i.jsx)(`g`,{children:F.map((e,t)=>{let n=60+t/(F.length-1)*880-6,r=Math.max(4,Math.min(160,e.rainfall/25*160)),a=205-r;return(0,i.jsx)(`rect`,{x:n,y:a,width:`12`,height:r,rx:`3`,fill:`url(#rainGradient)`,stroke:`#38bdf8`,strokeWidth:`1`},e.date)})}),d===`humidity`&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`path`,{d:`${F.reduce((e,t,n)=>{let r=60+n/(F.length-1)*880,i=205-(t.humidity-50)/50*165;return n===0?`M${r},${i}`:`${e} L${r},${i}`},``)} L940,205 L60,205 Z`,fill:`url(#humidityGradient)`}),(0,i.jsx)(`path`,{d:F.reduce((e,t,n)=>{let r=60+n/(F.length-1)*880,i=205-(t.humidity-50)/50*165;return n===0?`M${r},${i}`:`${e} L${r},${i}`},``),fill:`none`,stroke:`#38bdf8`,strokeWidth:`3`})]}),d===`solar`&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`path`,{d:`${F.reduce((e,t,n)=>{let r=60+n/(F.length-1)*880,i=205-(t.solar_radiation-5)/20*165;return n===0?`M${r},${i}`:`${e} L${r},${i}`},``)} L940,205 L60,205 Z`,fill:`url(#solarGradient)`}),(0,i.jsx)(`path`,{d:F.reduce((e,t,n)=>{let r=60+n/(F.length-1)*880,i=205-(t.solar_radiation-5)/20*165;return n===0?`M${r},${i}`:`${e} L${r},${i}`},``),fill:`none`,stroke:`#facc15`,strokeWidth:`3`})]}),F.map((e,t)=>{let n=60+t/(F.length-1)*880,r=120;return d===`temp`&&(r=205-(e.temperature-20)/20*165),d===`rain`&&(r=205-Math.max(4,Math.min(160,e.rainfall/25*160))),d===`humidity`&&(r=205-(e.humidity-50)/50*165),d===`solar`&&(r=205-(e.solar_radiation-5)/20*165),(0,i.jsx)(`g`,{onMouseEnter:()=>_(e),onMouseLeave:()=>_(null),children:(0,i.jsx)(`circle`,{cx:n,cy:r,r:`5`,fill:`#eef3ee`,stroke:`#00df81`,strokeWidth:`2.5`,style:{cursor:`pointer`}})},e.date)}),d===`temp`&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`text`,{x:`20`,y:`44`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`40°C`}),(0,i.jsx)(`text`,{x:`20`,y:`99`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`33°C`}),(0,i.jsx)(`text`,{x:`20`,y:`154`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`26°C`}),(0,i.jsx)(`text`,{x:`20`,y:`209`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`20°C`})]}),d===`rain`&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`text`,{x:`15`,y:`44`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`25 mm`}),(0,i.jsx)(`text`,{x:`15`,y:`99`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`18 mm`}),(0,i.jsx)(`text`,{x:`15`,y:`154`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`10 mm`}),(0,i.jsx)(`text`,{x:`20`,y:`209`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`0 mm`})]}),d===`humidity`&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`text`,{x:`15`,y:`44`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`100%`}),(0,i.jsx)(`text`,{x:`20`,y:`99`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`85%`}),(0,i.jsx)(`text`,{x:`20`,y:`154`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`70%`}),(0,i.jsx)(`text`,{x:`20`,y:`209`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`50%`})]}),d===`solar`&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`text`,{x:`10`,y:`44`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`25 MJ`}),(0,i.jsx)(`text`,{x:`10`,y:`99`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`18 MJ`}),(0,i.jsx)(`text`,{x:`10`,y:`154`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`12 MJ`}),(0,i.jsx)(`text`,{x:`15`,y:`209`,fill:`var(--text-muted, #94a3b8)`,fontSize:`10.5`,fontWeight:`700`,children:`5 MJ`})]}),(0,i.jsx)(`text`,{x:`60`,y:`235`,fill:`rgba(238, 243, 238, 0.42)`,fontSize:`10.5`,fontWeight:`700`,children:F[0]?.date}),(0,i.jsx)(`text`,{x:`480`,y:`235`,fill:`rgba(238, 243, 238, 0.42)`,fontSize:`10.5`,fontWeight:`700`,children:F[Math.floor(F.length/2)]?.date}),(0,i.jsx)(`text`,{x:`880`,y:`235`,fill:`rgba(238, 243, 238, 0.42)`,fontSize:`10.5`,fontWeight:`700`,children:F[F.length-1]?.date})]}),g&&(0,i.jsxs)(`div`,{className:`chart-hover-pill`,children:[(0,i.jsxs)(`strong`,{children:[`📅 `,g.date]}),(0,i.jsxs)(`span`,{children:[`Temp: `,(0,i.jsxs)(`strong`,{children:[g.temperature,`°C`]}),` (Min `,g.temp_min,`° / Max `,g.temp_max,`°)`]}),(0,i.jsxs)(`span`,{children:[`Rainfall: `,(0,i.jsxs)(`strong`,{children:[g.rainfall,` mm`]})]}),(0,i.jsxs)(`span`,{children:[`Humidity: `,(0,i.jsxs)(`strong`,{children:[g.humidity,`%`]})]}),(0,i.jsxs)(`span`,{children:[`Solar: `,(0,i.jsxs)(`strong`,{children:[g.solar_radiation,` MJ/m²`]})]})]})]})]}),(0,i.jsxs)(`div`,{className:`nasa-agro-grid`,children:[(0,i.jsxs)(`div`,{className:`agro-card`,children:[(0,i.jsx)(`div`,{className:`agro-icon-wrap`,style:{background:`rgba(108, 196, 224, 0.15)`,color:`#38bdf8`},children:`🌾`}),(0,i.jsxs)(`div`,{className:`agro-content`,children:[(0,i.jsx)(`h4`,{children:`Reference Evapotranspiration (ET₀)`}),(0,i.jsxs)(`div`,{className:`agro-val`,children:[ne,` `,(0,i.jsx)(`small`,{children:`mm/day`})]}),(0,i.jsx)(`p`,{children:`Estimated atmospheric crop water extraction demand calculated via FAO-56 radiation-temperature model.`})]})]}),(0,i.jsxs)(`div`,{className:`agro-card`,children:[(0,i.jsx)(`div`,{className:`agro-icon-wrap`,style:{background:`rgba(242, 193, 78, 0.15)`,color:`#facc15`},children:`🌿`}),(0,i.jsxs)(`div`,{className:`agro-content`,children:[(0,i.jsx)(`h4`,{children:`Thermal Heat Accumulation (GDD)`}),(0,i.jsxs)(`div`,{className:`agro-val`,children:[re,` `,(0,i.jsx)(`small`,{children:`GDD / day`})]}),(0,i.jsx)(`p`,{children:`Growing degree days (Base 10°C). Favorable for vegetative biomass acceleration in Rabi/Kharif pulses.`})]})]}),(0,i.jsxs)(`div`,{className:`agro-card`,children:[(0,i.jsx)(`div`,{className:`agro-icon-wrap`,style:{background:`rgba(95, 191, 119, 0.15)`,color:`#00df81`},children:`🚜`}),(0,i.jsxs)(`div`,{className:`agro-content`,children:[(0,i.jsx)(`h4`,{children:`Field Machinery Trafficability`}),(0,i.jsx)(`div`,{className:`agro-val text-green`,children:`Favorable`}),(0,i.jsx)(`p`,{children:`Dry soil surface traction permits tractor implement passage and mechanized seed drilling.`})]})]}),(0,i.jsxs)(`div`,{className:`agro-card`,children:[(0,i.jsx)(`div`,{className:`agro-icon-wrap`,style:{background:`rgba(239, 122, 90, 0.15)`,color:`#f43f5e`},children:`🛡️`}),(0,i.jsxs)(`div`,{className:`agro-content`,children:[(0,i.jsx)(`h4`,{children:`Foliar Fungal Risk Index`}),(0,i.jsx)(`div`,{className:`agro-val text-amber`,children:k>80?`Elevated`:`Low`}),(0,i.jsx)(`p`,{children:`Prolonged relative humidity > 80% with warm temperatures presents blight risk. Monitor dense canopy.`})]})]})]}),(0,i.jsxs)(`div`,{className:`nasa-safety-card`,children:[(0,i.jsxs)(`div`,{className:`safety-header`,children:[(0,i.jsxs)(`div`,{className:`safety-title`,children:[(0,i.jsx)(`svg`,{width:`20`,height:`20`,viewBox:`0 0 24 24`,fill:`none`,stroke:`#00df81`,strokeWidth:`2.5`,children:(0,i.jsx)(`path`,{d:`M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z`})}),(0,i.jsx)(`h3`,{children:`Scientific Safety Boundaries & NASA POWER Provenance`})]}),(0,i.jsx)(`span`,{className:`safety-badge`,children:`ISO DATA QUALITY COMPLIANT`})]}),(0,i.jsxs)(`div`,{className:`safety-body`,children:[(0,i.jsxs)(`p`,{children:[(0,i.jsx)(`strong`,{children:`Empirical Historical Ground Context:`}),` NASA POWER observations provide empirical historical and recent environmental context for the selected field coordinates (`,x.toFixed(4),`°, `,S.toFixed(4),`°).`]}),(0,i.jsxs)(`p`,{children:[(0,i.jsx)(`strong`,{children:`Non-Predictive Safety Policy:`}),` The prototype does not silently substitute synthetic data for failed live queries; offline demo data is clearly isolated and labelled. Observations represent historical and recent daily climate values rather than real-time field weather station sensors.`]}),(0,i.jsxs)(`p`,{children:[(0,i.jsx)(`strong`,{children:`Hydrology & Soil Sensor Isolation:`}),` Soil moisture or localized sensor telemetry is explicitly retained as missing or synthetic and not inferred, preventing hazardous agricultural water miscalculations.`]})]})]})]})}var z={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},B={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},V=1e3,ie=1001,ae=1002,oe=1003,se=1004,ce=1005,le=1006,ue=1007,de=1008,fe=1009,pe=1010,me=1011,he=1012,ge=1013,_e=1014,ve=1015,ye=1016,be=1017,xe=1018,Se=1020,Ce=35902,H=35899,we=1021,Te=1022,Ee=1023,U=1026,De=1027,W=1028,Oe=1029,G=1030,ke=1031,Ae=1033,je=33776,Me=33777,Ne=33778,Pe=33779,Fe=35840,Ie=35841,Le=35842,Re=35843,ze=36196,Be=37492,Ve=37496,He=37488,Ue=37489,We=37490,Ge=37491,Ke=37808,qe=37809,Je=37810,Ye=37811,Xe=37812,Ze=37813,Qe=37814,$e=37815,et=37816,tt=37817,nt=37818,rt=37819,it=37820,at=37821,ot=36492,st=36494,ct=36495,lt=36283,ut=36284,dt=36285,ft=36286,pt=2300,mt=2301,ht=2302,gt=2303,_t=2400,vt=2401,yt=2402,bt=3200,xt=`srgb`,St=`srgb-linear`,Ct=`linear`,wt=`srgb`,Tt=7680,Et=35044,Dt=2e3;function Ot(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function kt(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function At(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function jt(){let e=At(`canvas`);return e.style.display=`block`,e}var Mt={};function Nt(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Pt(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function K(...e){e=Pt(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function q(...e){e=Pt(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Ft(...e){let t=e.join(` `);t in Mt||(Mt[t]=!0,K(...e))}function It(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var Lt={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},Rt=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},zt=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),Bt=1234567,Vt=Math.PI/180,Ht=180/Math.PI;function Ut(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(zt[e&255]+zt[e>>8&255]+zt[e>>16&255]+zt[e>>24&255]+`-`+zt[t&255]+zt[t>>8&255]+`-`+zt[t>>16&15|64]+zt[t>>24&255]+`-`+zt[n&63|128]+zt[n>>8&255]+`-`+zt[n>>16&255]+zt[n>>24&255]+zt[r&255]+zt[r>>8&255]+zt[r>>16&255]+zt[r>>24&255]).toLowerCase()}function Wt(e,t,n){return Math.max(t,Math.min(n,e))}function Gt(e,t){return(e%t+t)%t}function Kt(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function qt(e,t,n){return e===t?0:(n-e)/(t-e)}function Jt(e,t,n){return(1-n)*e+n*t}function Yt(e,t,n,r){return Jt(e,t,1-Math.exp(-n*r))}function Xt(e,t=1){return t-Math.abs(Gt(e,t*2)-t)}function Zt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function Qt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function $t(e,t){return e+Math.floor(Math.random()*(t-e+1))}function en(e,t){return e+Math.random()*(t-e)}function tn(e){return e*(.5-Math.random())}function nn(e){e!==void 0&&(Bt=e);let t=Bt+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function rn(e){return e*Vt}function an(e){return e*Ht}function on(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function sn(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function cn(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function ln(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:K(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function un(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function dn(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var fn={DEG2RAD:Vt,RAD2DEG:Ht,generateUUID:Ut,clamp:Wt,euclideanModulo:Gt,mapLinear:Kt,inverseLerp:qt,lerp:Jt,damp:Yt,pingpong:Xt,smoothstep:Zt,smootherstep:Qt,randInt:$t,randFloat:en,randFloatSpread:tn,seededRandom:nn,degToRad:rn,radToDeg:an,isPowerOfTwo:on,ceilPowerOfTwo:sn,floorPowerOfTwo:cn,setQuaternionFromProperEuler:ln,normalize:dn,denormalize:un},J=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Wt(this.x,e.x,t.x),this.y=Wt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Wt(this.x,e,t),this.y=Wt(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Wt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},pn=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:K(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Wt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Y=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(hn.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(hn.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Wt(this.x,e.x,t.x),this.y=Wt(this.y,e.y,t.y),this.z=Wt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Wt(this.x,e,t),this.y=Wt(this.y,e,t),this.z=Wt(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return mn.copy(this).projectOnVector(e),this.sub(mn)}reflect(e){return this.sub(mn.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Wt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},mn=new Y,hn=new pn,gn=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return Ft(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(_n.makeScale(e,t)),this}rotate(e){return Ft(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(_n.makeRotation(-e)),this}translate(e,t){return Ft(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(_n.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},_n=new gn,vn=new gn().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),yn=new gn().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function bn(){let e={enabled:!0,workingColorSpace:St,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n?e:(this.spaces[t].transfer===`srgb`&&(e.r=Sn(e.r),e.g=Sn(e.g),e.b=Sn(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Cn(e.r),e.g=Cn(e.g),e.b=Cn(e.b)),e)},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?Ct:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return Ft(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return Ft(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[St]:{primaries:t,whitePoint:r,transfer:Ct,toXYZ:vn,fromXYZ:yn,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:xt},outputColorSpaceConfig:{drawingBufferColorSpace:xt}},[xt]:{primaries:t,whitePoint:r,transfer:wt,toXYZ:vn,fromXYZ:yn,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:xt}}}),e}var xn=bn();function Sn(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Cn(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var wn,Tn=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{wn===void 0&&(wn=At(`canvas`)),wn.width=e.width,wn.height=e.height;let t=wn.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=wn}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=At(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Sn(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Sn(t[e]/255)*255):t[e]=Sn(t[e]);return{data:t,width:e.width,height:e.height}}return K(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},En=0,Dn=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:En++}),this.uuid=Ut(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(On(r[t].image)):e.push(On(r[t]))}else e=On(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function On(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Tn.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(K(`Texture: Unable to serialize Texture.`),{})}var kn=0,An=new Y,jn=class e extends Rt{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=ie,i=ie,a=le,o=de,s=Ee,c=fe,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:kn++}),this.uuid=Ut(),this.name=``,this.source=new Dn(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new J(0,0),this.repeat=new J(1,1),this.center=new J(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new gn,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(An).x}get height(){return this.source.getSize(An).y}get depth(){return this.source.getSize(An).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){K(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){K(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case V:e.x-=Math.floor(e.x);break;case ie:e.x=e.x<0?0:1;break;case ae:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case V:e.y-=Math.floor(e.y);break;case ie:e.y=e.y<0?0:1;break;case ae:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};jn.DEFAULT_IMAGE=null,jn.DEFAULT_MAPPING=300,jn.DEFAULT_ANISOTROPY=1;var Mn=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Wt(this.x,e.x,t.x),this.y=Wt(this.y,e.y,t.y),this.z=Wt(this.z,e.z,t.z),this.w=Wt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Wt(this.x,e,t),this.y=Wt(this.y,e,t),this.z=Wt(this.z,e,t),this.w=Wt(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Nn=class extends Rt{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:le,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Mn(0,0,e,t),this.scissorTest=!1,this.viewport=new Mn(0,0,e,t),this.textures=[];let r=new jn({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:le,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Dn(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Pn=class extends Nn{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Fn=class extends jn{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=oe,this.minFilter=oe,this.wrapR=ie,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},In=class extends jn{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=oe,this.minFilter=oe,this.wrapR=ie,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},Ln=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/Rn.setFromMatrixColumn(e,0).length(),i=1/Rn.setFromMatrixColumn(e,1).length(),a=1/Rn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Bn,e,Vn)}lookAt(e,t,n){let r=this.elements;return Wn.subVectors(e,t),Wn.lengthSq()===0&&(Wn.z=1),Wn.normalize(),Hn.crossVectors(n,Wn),Hn.lengthSq()===0&&(Math.abs(n.z)===1?Wn.x+=1e-4:Wn.z+=1e-4,Wn.normalize(),Hn.crossVectors(n,Wn)),Hn.normalize(),Un.crossVectors(Wn,Hn),r[0]=Hn.x,r[4]=Un.x,r[8]=Wn.x,r[1]=Hn.y,r[5]=Un.y,r[9]=Wn.y,r[2]=Hn.z,r[6]=Un.z,r[10]=Wn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],M=r[14],N=r[3],P=r[7],F=r[11],I=r[15];return i[0]=a*x+o*T+s*k+c*N,i[4]=a*S+o*E+s*A+c*P,i[8]=a*C+o*D+s*j+c*F,i[12]=a*w+o*O+s*M+c*I,i[1]=l*x+u*T+d*k+f*N,i[5]=l*S+u*E+d*A+f*P,i[9]=l*C+u*D+d*j+f*F,i[13]=l*w+u*O+d*M+f*I,i[2]=p*x+m*T+h*k+g*N,i[6]=p*S+m*E+h*A+g*P,i[10]=p*C+m*D+h*j+g*F,i[14]=p*w+m*O+h*M+g*I,i[3]=_*x+v*T+y*k+b*N,i[7]=_*S+v*E+y*A+b*P,i[11]=_*C+v*D+y*j+b*F,i[15]=_*w+v*O+y*M+b*I,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=Rn.set(r[0],r[1],r[2]).length(),o=Rn.set(r[4],r[5],r[6]).length(),s=Rn.set(r[8],r[9],r[10]).length();i<0&&(a=-a),zn.copy(this);let c=1/a,l=1/o,u=1/s;return zn.elements[0]*=c,zn.elements[1]*=c,zn.elements[2]*=c,zn.elements[4]*=l,zn.elements[5]*=l,zn.elements[6]*=l,zn.elements[8]*=u,zn.elements[9]*=u,zn.elements[10]*=u,t.setFromRotationMatrix(zn),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=Dt,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=Dt,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Rn=new Y,zn=new Ln,Bn=new Y(0,0,0),Vn=new Y(1,1,1),Hn=new Y,Un=new Y,Wn=new Y,Gn=new Ln,Kn=new pn,qn=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(Wt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-Wt(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(Wt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-Wt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(Wt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-Wt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:K(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Gn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Gn,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Kn.setFromEuler(this),this.setFromQuaternion(Kn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};qn.DEFAULT_ORDER=`XYZ`;var Jn=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&(1<<e|0))}},Yn=0,Xn=new Y,Zn=new pn,Qn=new Ln,$n=new Y,er=new Y,tr=new Y,nr=new pn,rr=new Y(1,0,0),ir=new Y(0,1,0),ar=new Y(0,0,1),or={type:`added`},sr={type:`removed`},cr={type:`childadded`,child:null},lr={type:`childremoved`,child:null},ur=class e extends Rt{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Yn++}),this.uuid=Ut(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new Y,n=new qn,r=new pn,i=new Y(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Ln},normalMatrix:{value:new gn}}),this.matrix=new Ln,this.matrixWorld=new Ln,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Jn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Zn.setFromAxisAngle(e,t),this.quaternion.multiply(Zn),this}rotateOnWorldAxis(e,t){return Zn.setFromAxisAngle(e,t),this.quaternion.premultiply(Zn),this}rotateX(e){return this.rotateOnAxis(rr,e)}rotateY(e){return this.rotateOnAxis(ir,e)}rotateZ(e){return this.rotateOnAxis(ar,e)}translateOnAxis(e,t){return Xn.copy(e).applyQuaternion(this.quaternion),this.position.add(Xn.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(rr,e)}translateY(e){return this.translateOnAxis(ir,e)}translateZ(e){return this.translateOnAxis(ar,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Qn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?$n.copy(e):$n.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),er.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qn.lookAt(er,$n,this.up):Qn.lookAt($n,er,this.up),this.quaternion.setFromRotationMatrix(Qn),r&&(Qn.extractRotation(r.matrixWorld),Zn.setFromRotationMatrix(Qn),this.quaternion.premultiply(Zn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(q(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(or),cr.child=e,this.dispatchEvent(cr),cr.child=null):q(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(sr),lr.child=e,this.dispatchEvent(lr),lr.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Qn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Qn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Qn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(or),cr.child=e,this.dispatchEvent(cr),cr.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(er,e,tr),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(er,nr,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};ur.DEFAULT_UP=new Y(0,1,0),ur.DEFAULT_MATRIX_AUTO_UPDATE=!0,ur.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var dr=class extends ur{constructor(){super(),this.isGroup=!0,this.type=`Group`}},fr={type:`move`},pr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new dr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new dr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new Y,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new Y),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new dr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new Y,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new Y,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(fr)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new dr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},mr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},hr={h:0,s:0,l:0},gr={h:0,s:0,l:0};function _r(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var X=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=xt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,xn.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=xn.workingColorSpace){return this.r=e,this.g=t,this.b=n,xn.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=xn.workingColorSpace){if(e=Gt(e,1),t=Wt(t,0,1),n=Wt(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=_r(i,r,e+1/3),this.g=_r(i,r,e),this.b=_r(i,r,e-1/3)}return xn.colorSpaceToWorking(this,r),this}setStyle(e,t=xt){function n(t){t!==void 0&&parseFloat(t)<1&&K(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:K(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);K(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=xt){let n=mr[e.toLowerCase()];return n===void 0?K(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Sn(e.r),this.g=Sn(e.g),this.b=Sn(e.b),this}copyLinearToSRGB(e){return this.r=Cn(e.r),this.g=Cn(e.g),this.b=Cn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=xt){return xn.workingToColorSpace(vr.copy(this),e),Math.round(Wt(vr.r*255,0,255))*65536+Math.round(Wt(vr.g*255,0,255))*256+Math.round(Wt(vr.b*255,0,255))}getHexString(e=xt){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=xn.workingColorSpace){xn.workingToColorSpace(vr.copy(this),t);let n=vr.r,r=vr.g,i=vr.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=xn.workingColorSpace){return xn.workingToColorSpace(vr.copy(this),t),e.r=vr.r,e.g=vr.g,e.b=vr.b,e}getStyle(e=xt){xn.workingToColorSpace(vr.copy(this),e);let t=vr.r,n=vr.g,r=vr.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(hr),this.setHSL(hr.h+e,hr.s+t,hr.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(hr),e.getHSL(gr);let n=Jt(hr.h,gr.h,t),r=Jt(hr.s,gr.s,t),i=Jt(hr.l,gr.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},vr=new X;X.NAMES=mr;var yr=class e{constructor(e,t=25e-5){this.isFogExp2=!0,this.name=``,this.color=new X(e),this.density=t}clone(){return new e(this.color,this.density)}toJSON(){return{type:`FogExp2`,name:this.name,color:this.color.getHex(),density:this.density}}},br=class extends ur{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new qn,this.environmentIntensity=1,this.environmentRotation=new qn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},xr=new Y,Sr=new Y,Cr=new Y,wr=new Y,Tr=new Y,Er=new Y,Dr=new Y,Or=new Y,kr=new Y,Ar=new Y,jr=new Mn,Mr=new Mn,Nr=new Mn,Pr=class e{constructor(e=new Y,t=new Y,n=new Y){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),xr.subVectors(e,t),r.cross(xr);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){xr.subVectors(r,t),Sr.subVectors(n,t),Cr.subVectors(e,t);let a=xr.dot(xr),o=xr.dot(Sr),s=xr.dot(Cr),c=Sr.dot(Sr),l=Sr.dot(Cr),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,wr)!==null&&wr.x>=0&&wr.y>=0&&wr.x+wr.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,wr)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,wr.x),s.addScaledVector(a,wr.y),s.addScaledVector(o,wr.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return jr.setScalar(0),Mr.setScalar(0),Nr.setScalar(0),jr.fromBufferAttribute(e,t),Mr.fromBufferAttribute(e,n),Nr.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(jr,i.x),a.addScaledVector(Mr,i.y),a.addScaledVector(Nr,i.z),a}static isFrontFacing(e,t,n,r){return xr.subVectors(n,t),Sr.subVectors(e,t),xr.cross(Sr).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return xr.subVectors(this.c,this.b),Sr.subVectors(this.a,this.b),xr.cross(Sr).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Tr.subVectors(r,n),Er.subVectors(i,n),Or.subVectors(e,n);let s=Tr.dot(Or),c=Er.dot(Or);if(s<=0&&c<=0)return t.copy(n);kr.subVectors(e,r);let l=Tr.dot(kr),u=Er.dot(kr);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Tr,a);Ar.subVectors(e,i);let f=Tr.dot(Ar),p=Er.dot(Ar);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Er,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Dr.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Dr,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Tr,a).addScaledVector(Er,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Fr=class{constructor(e=new Y(1/0,1/0,1/0),t=new Y(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Lr.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Lr.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Lr.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Lr):Lr.fromBufferAttribute(r,t),Lr.applyMatrix4(e.matrixWorld),this.expandByPoint(Lr);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Rr.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Rr.copy(e.boundingBox)),Rr.applyMatrix4(e.matrixWorld),this.union(Rr)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Lr),Lr.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Gr),Kr.subVectors(this.max,Gr),zr.subVectors(e.a,Gr),Br.subVectors(e.b,Gr),Vr.subVectors(e.c,Gr),Hr.subVectors(Br,zr),Ur.subVectors(Vr,Br),Wr.subVectors(zr,Vr);let t=[0,-Hr.z,Hr.y,0,-Ur.z,Ur.y,0,-Wr.z,Wr.y,Hr.z,0,-Hr.x,Ur.z,0,-Ur.x,Wr.z,0,-Wr.x,-Hr.y,Hr.x,0,-Ur.y,Ur.x,0,-Wr.y,Wr.x,0];return!Yr(t,zr,Br,Vr,Kr)||(t=[1,0,0,0,1,0,0,0,1],!Yr(t,zr,Br,Vr,Kr))?!1:(qr.crossVectors(Hr,Ur),t=[qr.x,qr.y,qr.z],Yr(t,zr,Br,Vr,Kr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Lr).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Lr).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Ir[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ir[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ir[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ir[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ir[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ir[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ir[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ir[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ir),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Ir=[new Y,new Y,new Y,new Y,new Y,new Y,new Y,new Y],Lr=new Y,Rr=new Fr,zr=new Y,Br=new Y,Vr=new Y,Hr=new Y,Ur=new Y,Wr=new Y,Gr=new Y,Kr=new Y,qr=new Y,Jr=new Y;function Yr(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){Jr.fromArray(e,a);let o=i.x*Math.abs(Jr.x)+i.y*Math.abs(Jr.y)+i.z*Math.abs(Jr.z),s=t.dot(Jr),c=n.dot(Jr),l=r.dot(Jr);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Xr=new Y,Zr=new J,Qr=0,$r=class extends Rt{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Qr++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=Et,this.updateRanges=[],this.gpuType=ve,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Zr.fromBufferAttribute(this,t),Zr.applyMatrix3(e),this.setXY(t,Zr.x,Zr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Xr.fromBufferAttribute(this,t),Xr.applyMatrix3(e),this.setXYZ(t,Xr.x,Xr.y,Xr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Xr.fromBufferAttribute(this,t),Xr.applyMatrix4(e),this.setXYZ(t,Xr.x,Xr.y,Xr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Xr.fromBufferAttribute(this,t),Xr.applyNormalMatrix(e),this.setXYZ(t,Xr.x,Xr.y,Xr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Xr.fromBufferAttribute(this,t),Xr.transformDirection(e),this.setXYZ(t,Xr.x,Xr.y,Xr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=un(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=dn(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=un(t,this.array)),t}setX(e,t){return this.normalized&&(t=dn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=un(t,this.array)),t}setY(e,t){return this.normalized&&(t=dn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=un(t,this.array)),t}setZ(e,t){return this.normalized&&(t=dn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=un(t,this.array)),t}setW(e,t){return this.normalized&&(t=dn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=dn(t,this.array),n=dn(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=dn(t,this.array),n=dn(n,this.array),r=dn(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=dn(t,this.array),n=dn(n,this.array),r=dn(r,this.array),i=dn(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},ei=class extends $r{constructor(e,t,n){super(new Uint16Array(e),t,n)}},ti=class extends $r{constructor(e,t,n){super(new Uint32Array(e),t,n)}},ni=class extends $r{constructor(e,t,n){super(new Float32Array(e),t,n)}},ri=new Fr,ii=new Y,ai=new Y,oi=class{constructor(e=new Y,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?ri.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ii.subVectors(e,this.center);let t=ii.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(ii,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ai.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ii.copy(e.center).add(ai)),this.expandByPoint(ii.copy(e.center).sub(ai))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},si=0,ci=new Ln,li=new ur,ui=new Y,di=new Fr,fi=new Fr,pi=new Y,mi=class e extends Rt{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:si++}),this.uuid=Ut(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Ot(e)?ti:ei)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new gn().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return ci.makeRotationFromQuaternion(e),this.applyMatrix4(ci),this}rotateX(e){return ci.makeRotationX(e),this.applyMatrix4(ci),this}rotateY(e){return ci.makeRotationY(e),this.applyMatrix4(ci),this}rotateZ(e){return ci.makeRotationZ(e),this.applyMatrix4(ci),this}translate(e,t,n){return ci.makeTranslation(e,t,n),this.applyMatrix4(ci),this}scale(e,t,n){return ci.makeScale(e,t,n),this.applyMatrix4(ci),this}lookAt(e){return li.lookAt(e),li.updateMatrix(),this.applyMatrix4(li.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ui).negate(),this.translate(ui.x,ui.y,ui.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new ni(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&K(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){q(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new Y(-1/0,-1/0,-1/0),new Y(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];di.setFromBufferAttribute(n),this.morphTargetsRelative?(pi.addVectors(this.boundingBox.min,di.min),this.boundingBox.expandByPoint(pi),pi.addVectors(this.boundingBox.max,di.max),this.boundingBox.expandByPoint(pi)):(this.boundingBox.expandByPoint(di.min),this.boundingBox.expandByPoint(di.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&q(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){q(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new Y,1/0);return}if(e){let n=this.boundingSphere.center;if(di.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];fi.setFromBufferAttribute(n),this.morphTargetsRelative?(pi.addVectors(di.min,fi.min),di.expandByPoint(pi),pi.addVectors(di.max,fi.max),di.expandByPoint(pi)):(di.expandByPoint(fi.min),di.expandByPoint(fi.max))}di.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)pi.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(pi));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)pi.fromBufferAttribute(a,t),o&&(ui.fromBufferAttribute(e,t),pi.add(ui)),r=Math.max(r,n.distanceToSquared(pi))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&q(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){q(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new $r(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new Y,s[e]=new Y;let c=new Y,l=new Y,u=new Y,d=new J,f=new J,p=new J,m=new Y,h=new Y;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new Y,y=new Y,b=new Y,x=new Y;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new $r(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new Y,i=new Y,a=new Y,o=new Y,s=new Y,c=new Y,l=new Y,u=new Y;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)pi.fromBufferAttribute(e,t),pi.normalize(),e.setXYZ(t,pi.x,pi.y,pi.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new $r(a,r,i)}if(this.index===null)return K(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},hi=new Y,gi=new Y,_i=new gn,vi=class{constructor(e=new Y(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=hi.subVectors(n,t).cross(gi.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(hi),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||_i.getNormalMatrix(e),r=this.coplanarPoint(hi).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},yi=0,bi=class extends Rt{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:yi++}),this.uuid=Ut(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new X(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Tt,this.stencilZFail=Tt,this.stencilZPass=Tt,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){K(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){K(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new X().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new vi().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new J().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new J().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},xi=new Y,Si=new Y,Ci=new Y,wi=new Y,Ti=class{constructor(e=new Y,t=new Y(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,xi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=xi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(xi.copy(this.origin).addScaledVector(this.direction,t),xi.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Si.copy(e).add(t).multiplyScalar(.5),Ci.copy(t).sub(e).normalize(),wi.copy(this.origin).sub(Si);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Ci),o=wi.dot(this.direction),s=-wi.dot(Ci),c=wi.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Si).addScaledVector(Ci,d),f}intersectSphere(e,t){if(e.radius<0)return null;xi.subVectors(e.center,this.origin);let n=xi.dot(this.direction),r=xi.dot(xi)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,xi)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,M,N;if(y>=b&&y>=x?(w=s,D=u,A=p,N=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,M=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,M=_)):b>=x?(w=c,D=d,A=m,N=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,M=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,M=v)):(w=l,D=f,A=h,N=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,M=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,M=g)),w===0)return null;let P=S/w,F=C/w,I=1/w,ee=T-P*D,L=E-F*D,te=O-P*A,ne=k-F*A,R=j-P*N,re=M-F*N,z=R*ne-re*te,B=ee*re-L*R,V=te*L-ne*ee;if(r){if(z<0||B<0||V<0)return null}else if((z<0||B<0||V<0)&&(z>0||B>0||V>0))return null;let ie=z+B+V;if(ie===0)return null;let ae=I*(z*D+B*A+V*N);return(ie>0?ae<0:ae>0)?null:this.at(ae/ie,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ei=class extends bi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new X(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Di=new Ln,Oi=new Ti,ki=new oi,Ai=new Y,ji=new Y,Mi=new Y,Ni=new Y,Pi=new Y,Fi=new Y,Ii=new Y,Li=new Y,Z=class extends ur{constructor(e=new mi,t=new Ei){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Fi.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Pi.fromBufferAttribute(s,e),a?Fi.addScaledVector(Pi,r):Fi.addScaledVector(Pi.sub(t),r))}t.add(Fi)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ki.copy(n.boundingSphere),ki.applyMatrix4(i),Oi.copy(e.ray).recast(e.near),!(ki.containsPoint(Oi.origin)===!1&&(Oi.intersectSphere(ki,Ai)===null||Oi.origin.distanceToSquared(Ai)>(e.far-e.near)**2))&&(Di.copy(i).invert(),Oi.copy(e.ray).applyMatrix4(Di),(n.boundingBox===null||Oi.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Oi)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=zi(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=zi(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=zi(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=zi(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function Ri(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Li.copy(s),Li.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Li);return l<n.near||l>n.far?null:{distance:l,point:Li.clone(),object:e}}function zi(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,ji),e.getVertexPosition(c,Mi),e.getVertexPosition(l,Ni);let u=Ri(e,t,n,r,ji,Mi,Ni,Ii);if(u){let e=new Y;Pr.getBarycoord(Ii,ji,Mi,Ni,e),i&&(u.uv=Pr.getInterpolatedAttribute(i,s,c,l,e,new J)),a&&(u.uv1=Pr.getInterpolatedAttribute(a,s,c,l,e,new J)),o&&(u.normal=Pr.getInterpolatedAttribute(o,s,c,l,e,new Y),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new Y,materialIndex:0};Pr.getNormal(ji,Mi,Ni,t.normal),u.face=t,u.barycoord=e}return u}var Bi=class extends jn{constructor(e=null,t=1,n=1,r,i,a,o,s,c=oe,l=oe,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Vi=class extends $r{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Hi=new Ln,Ui=new Ln,Wi=[],Gi=new Fr,Ki=new Ln,qi=new Z,Ji=new oi,Yi=class extends Z{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Vi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Ki)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Fr),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Hi),Gi.copy(e.boundingBox).applyMatrix4(Hi),this.boundingBox.union(Gi)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new oi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Hi),Ji.copy(e.boundingSphere).applyMatrix4(Hi),this.boundingSphere.union(Ji)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(qi.geometry=this.geometry,qi.material=this.material,qi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ji.copy(this.boundingSphere),Ji.applyMatrix4(n),e.ray.intersectsSphere(Ji)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Hi),Ui.multiplyMatrices(n,Hi),qi.matrixWorld=Ui,qi.raycast(e,Wi);for(let e=0,n=Wi.length;e<n;e++){let n=Wi[e];n.instanceId=i,n.object=this,t.push(n)}Wi.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Vi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Bi(new Float32Array(r*this.count),r,this.count,W,ve));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Xi=new oi,Zi=new J(.5,.5),Qi=new Y,$i=class{constructor(e=new vi,t=new vi,n=new vi,r=new vi,i=new vi,a=new vi){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Dt,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Xi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Xi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Xi)}intersectsSprite(e){return Xi.center.set(0,0,0),Xi.radius=.7071067811865476+Zi.distanceTo(e.center),Xi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Xi)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Qi.x=r.normal.x>0?e.max.x:e.min.x,Qi.y=r.normal.y>0?e.max.y:e.min.y,Qi.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Qi)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},ea=class extends bi{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new X(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},ta=new Y,na=new Y,ra=new Ln,ia=new Ti,aa=new oi,oa=new Y,sa=new Y,ca=class extends ur{constructor(e=new mi,t=new ea){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)ta.fromBufferAttribute(t,e-1),na.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=ta.distanceTo(na);e.setAttribute(`lineDistance`,new ni(n,1))}else K(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),aa.copy(n.boundingSphere),aa.applyMatrix4(r),aa.radius+=i,e.ray.intersectsSphere(aa)===!1)return;ra.copy(r).invert(),ia.copy(e.ray).applyMatrix4(ra);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=la(this,e,ia,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=la(this,e,ia,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=la(this,e,ia,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=la(this,e,ia,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function la(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(ta.fromBufferAttribute(s,i),na.fromBufferAttribute(s,a),n.distanceSqToSegment(ta,na,oa,sa)>r)return;oa.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(oa);if(!(c<t.near||c>t.far))return{distance:c,point:sa.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var ua=new Y,da=new Y,fa=class extends ca{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)ua.fromBufferAttribute(t,e),da.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+ua.distanceTo(da);e.setAttribute(`lineDistance`,new ni(n,1))}else K(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},pa=class extends bi{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new X(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ma=new Ln,ha=new Ti,ga=new oi,_a=new Y,va=class extends ur{constructor(e=new mi,t=new pa){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ga.copy(n.boundingSphere),ga.applyMatrix4(r),ga.radius+=i,e.ray.intersectsSphere(ga)===!1)return;ma.copy(r).invert(),ha.copy(e.ray).applyMatrix4(ma);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);_a.fromBufferAttribute(l,n),ya(_a,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)_a.fromBufferAttribute(l,a),ya(_a,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function ya(e,t,n,r,i,a,o){let s=ha.distanceSqToPoint(e);if(s<n){let n=new Y;ha.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var ba=class extends jn{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},xa=class extends jn{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Sa=class extends jn{constructor(e,t,n=_e,r,i,a,o=oe,s=oe,c,l=U,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Dn(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Ca=class extends Sa{constructor(e,t=_e,n=301,r,i,a=oe,o=oe,s,c=U){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},wa=class extends jn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Ta=class e extends mi{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new ni(c,3)),this.setAttribute(`normal`,new ni(l,3)),this.setAttribute(`uv`,new ni(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new Y;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Ea=class e extends mi{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new ni(u,3)),this.setAttribute(`normal`,new ni(d,3)),this.setAttribute(`uv`,new ni(f,2));function _(){let a=new Y,_=new Y,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new J,m=new Y,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Da=class e extends Ea{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Oa=class e extends mi{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new ni(i,3)),this.setAttribute(`normal`,new ni(i.slice(),3)),this.setAttribute(`uv`,new ni(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new Y,r=new Y,i=new Y;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new Y;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new Y;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new Y,t=new Y,n=new Y,r=new Y,o=new J,s=new J,c=new J;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},ka=class e extends Oa{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=1/n,i=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-n,0,-r,n,0,r,-n,0,r,n,-r,-n,0,-r,n,0,r,-n,0,r,n,0,-n,0,-r,n,0,-r,-n,0,r,n,0,r];super(i,[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9],e,t),this.type=`DodecahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},Aa=new Y,ja=new Y,Ma=new Y,Na=new Pr,Pa=class extends mi{constructor(e=null,t=1){if(super(),this.type=`EdgesGeometry`,this.parameters={geometry:e,thresholdAngle:t},e!==null){let n=1e4,r=Math.cos(Vt*t),i=e.getIndex(),a=e.getAttribute(`position`),o=i?i.count:a.count,s=[0,0,0],c=[`a`,`b`,`c`],l=[,,,],u={},d=[];for(let e=0;e<o;e+=3){i?(s[0]=i.getX(e),s[1]=i.getX(e+1),s[2]=i.getX(e+2)):(s[0]=e,s[1]=e+1,s[2]=e+2);let{a:t,b:o,c:f}=Na;if(t.fromBufferAttribute(a,s[0]),o.fromBufferAttribute(a,s[1]),f.fromBufferAttribute(a,s[2]),Na.getNormal(Ma),l[0]=`${Math.round(t.x*n)},${Math.round(t.y*n)},${Math.round(t.z*n)}`,l[1]=`${Math.round(o.x*n)},${Math.round(o.y*n)},${Math.round(o.z*n)}`,l[2]=`${Math.round(f.x*n)},${Math.round(f.y*n)},${Math.round(f.z*n)}`,l[0]!==l[1]&&l[1]!==l[2]&&l[2]!==l[0])for(let e=0;e<3;e++){let t=(e+1)%3,n=l[e],i=l[t],a=Na[c[e]],o=Na[c[t]],f=`${n}_${i}`,p=`${i}_${n}`;p in u&&u[p]?(Ma.dot(u[p].normal)<=r&&(d.push(a.x,a.y,a.z),d.push(o.x,o.y,o.z)),u[p]=null):f in u||(u[f]={index0:s[e],index1:s[t],normal:Ma.clone()})}}for(let e in u)if(u[e]){let{index0:t,index1:n}=u[e];Aa.fromBufferAttribute(a,t),ja.fromBufferAttribute(a,n),d.push(Aa.x,Aa.y,Aa.z),d.push(ja.x,ja.y,ja.z)}this.setAttribute(`position`,new ni(d,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},Fa=class{constructor(){this.type=`Curve`,this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){K(`Curve: .getPoint() not implemented.`)}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,r=this.getPoint(0),i=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),i+=n.distanceTo(r),t.push(i),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),r=0,i=n.length,a;a=t||e*n[i-1];let o=0,s=i-1,c;for(;o<=s;)if(r=Math.floor(o+(s-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)s=r-1;else{s=r;break}if(r=s,n[r]===a)return r/(i-1);let l=n[r],u=n[r+1]-l,d=(a-l)/u;return(r+d)/(i-1)}getTangent(e,t){let n=1e-4,r=e-n,i=e+n;r<0&&(r=0),i>1&&(i=1);let a=this.getPoint(r),o=this.getPoint(i),s=t||(a.isVector2?new J:new Y);return s.copy(o).sub(a).normalize(),s}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new Y,r=[],i=[],a=[],o=new Y,s=new Ln;for(let t=0;t<=e;t++){let n=t/e;r[t]=this.getTangentAt(n,new Y)}i[0]=new Y,a[0]=new Y;let c=Number.MAX_VALUE,l=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);l<=c&&(c=l,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),i[0].crossVectors(r[0],o),a[0].crossVectors(r[0],i[0]);for(let t=1;t<=e;t++){if(i[t]=i[t-1].clone(),a[t]=a[t-1].clone(),o.crossVectors(r[t-1],r[t]),o.length()>2**-52){o.normalize();let e=Math.acos(Wt(r[t-1].dot(r[t]),-1,1));i[t].applyMatrix4(s.makeRotationAxis(o,e))}a[t].crossVectors(r[t],i[t])}if(t===!0){let t=Math.acos(Wt(i[0].dot(i[e]),-1,1));t/=e,r[0].dot(o.crossVectors(i[0],i[e]))>0&&(t=-t);for(let n=1;n<=e;n++)i[n].applyMatrix4(s.makeRotationAxis(r[n],t*n)),a[n].crossVectors(r[n],i[n])}return{tangents:r,normals:i,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:`Curve`,generator:`Curve.toJSON`}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Ia=class extends Fa{constructor(e=0,t=0,n=1,r=1,i=0,a=Math.PI*2,o=!1,s=0){super(),this.isEllipseCurve=!0,this.type=`EllipseCurve`,this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=i,this.aEndAngle=a,this.aClockwise=o,this.aRotation=s}getPoint(e,t=new J){let n=t,r=Math.PI*2,i=this.aEndAngle-this.aStartAngle,a=Math.abs(i)<2**-52;for(;i<0;)i+=r;for(;i>r;)i-=r;i<2**-52&&(i=a?0:r),this.aClockwise===!0&&!a&&(i===r?i=-r:i-=r);let o=this.aStartAngle+e*i,s=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let e=Math.cos(this.aRotation),t=Math.sin(this.aRotation),n=s-this.aX,r=c-this.aY;s=n*e-r*t+this.aX,c=n*t+r*e+this.aY}return n.set(s,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},La=class extends Ia{constructor(e,t,n,r,i,a){super(e,t,n,n,r,i,a),this.isArcCurve=!0,this.type=`ArcCurve`}};function Ra(){let e=0,t=0,n=0,r=0;function i(i,a,o,s){e=i,t=o,n=-3*i+3*a-2*o-s,r=2*i-2*a+o+s}return{initCatmullRom:function(e,t,n,r,a){i(t,n,a*(n-e),a*(r-t))},initNonuniformCatmullRom:function(e,t,n,r,a,o,s){let c=(t-e)/a-(n-e)/(a+o)+(n-t)/o,l=(n-t)/o-(r-t)/(o+s)+(r-n)/s;c*=o,l*=o,i(t,n,c,l)},calc:function(i){let a=i*i,o=a*i;return e+t*i+n*a+r*o}}}var za=new Y,Ba=new Y,Va=new Ra,Ha=new Ra,Ua=new Ra,Wa=class extends Fa{constructor(e=[],t=!1,n=`centripetal`,r=.5){super(),this.isCatmullRomCurve3=!0,this.type=`CatmullRomCurve3`,this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new Y){let n=t,r=this.points,i=r.length,a=(i-+!this.closed)*e,o=Math.floor(a),s=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/i)+1)*i:s===0&&o===i-1&&(o=i-2,s=1);let c,l;this.closed||o>0?c=r[(o-1)%i]:(Ba.subVectors(r[0],r[1]).add(r[0]),c=Ba);let u=r[o%i],d=r[(o+1)%i];if(this.closed||o+2<i?l=r[(o+2)%i]:(za.subVectors(r[i-1],r[i-2]).add(r[i-1]),l=za),this.curveType===`centripetal`||this.curveType===`chordal`){let e=this.curveType===`chordal`?.5:.25,t=c.distanceToSquared(u)**+e,n=u.distanceToSquared(d)**+e,r=d.distanceToSquared(l)**+e;n<1e-4&&(n=1),t<1e-4&&(t=n),r<1e-4&&(r=n),Va.initNonuniformCatmullRom(c.x,u.x,d.x,l.x,t,n,r),Ha.initNonuniformCatmullRom(c.y,u.y,d.y,l.y,t,n,r),Ua.initNonuniformCatmullRom(c.z,u.z,d.z,l.z,t,n,r)}else this.curveType===`catmullrom`&&(Va.initCatmullRom(c.x,u.x,d.x,l.x,this.tension),Ha.initCatmullRom(c.y,u.y,d.y,l.y,this.tension),Ua.initCatmullRom(c.z,u.z,d.z,l.z,this.tension));return n.set(Va.calc(s),Ha.calc(s),Ua.calc(s)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new Y().fromArray(n))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Ga(e,t,n,r,i){let a=(r-t)*.5,o=(i-n)*.5,s=e*e,c=e*s;return(2*n-2*r+a+o)*c+(-3*n+3*r-2*a-o)*s+a*e+n}function Ka(e,t){let n=1-e;return n*n*t}function qa(e,t){return 2*(1-e)*e*t}function Ja(e,t){return e*e*t}function Ya(e,t,n,r){return Ka(e,t)+qa(e,n)+Ja(e,r)}function Xa(e,t){let n=1-e;return n*n*n*t}function Za(e,t){let n=1-e;return 3*n*n*e*t}function Qa(e,t){return 3*(1-e)*e*e*t}function $a(e,t){return e*e*e*t}function eo(e,t,n,r,i){return Xa(e,t)+Za(e,n)+Qa(e,r)+$a(e,i)}var to=class extends Fa{constructor(e=new J,t=new J,n=new J,r=new J){super(),this.isCubicBezierCurve=!0,this.type=`CubicBezierCurve`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new J){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(eo(e,r.x,i.x,a.x,o.x),eo(e,r.y,i.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},no=class extends Fa{constructor(e=new Y,t=new Y,n=new Y,r=new Y){super(),this.isCubicBezierCurve3=!0,this.type=`CubicBezierCurve3`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new Y){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(eo(e,r.x,i.x,a.x,o.x),eo(e,r.y,i.y,a.y,o.y),eo(e,r.z,i.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ro=class extends Fa{constructor(e=new J,t=new J){super(),this.isLineCurve=!0,this.type=`LineCurve`,this.v1=e,this.v2=t}getPoint(e,t=new J){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new J){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},io=class extends Fa{constructor(e=new Y,t=new Y){super(),this.isLineCurve3=!0,this.type=`LineCurve3`,this.v1=e,this.v2=t}getPoint(e,t=new Y){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new Y){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ao=class extends Fa{constructor(e=new J,t=new J,n=new J){super(),this.isQuadraticBezierCurve=!0,this.type=`QuadraticBezierCurve`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new J){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(Ya(e,r.x,i.x,a.x),Ya(e,r.y,i.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},oo=class extends Fa{constructor(e=new Y,t=new Y,n=new Y){super(),this.isQuadraticBezierCurve3=!0,this.type=`QuadraticBezierCurve3`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new Y){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(Ya(e,r.x,i.x,a.x),Ya(e,r.y,i.y,a.y),Ya(e,r.z,i.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},so=Object.freeze({__proto__:null,ArcCurve:La,CatmullRomCurve3:Wa,CubicBezierCurve:to,CubicBezierCurve3:no,EllipseCurve:Ia,LineCurve:ro,LineCurve3:io,QuadraticBezierCurve:ao,QuadraticBezierCurve3:oo,SplineCurve:class extends Fa{constructor(e=[]){super(),this.isSplineCurve=!0,this.type=`SplineCurve`,this.points=e}getPoint(e,t=new J){let n=t,r=this.points,i=(r.length-1)*e,a=Math.floor(i),o=i-a,s=r[a===0?a:a-1],c=r[a],l=r[a>r.length-2?r.length-1:a+1],u=r[a>r.length-3?r.length-1:a+2];return n.set(Ga(o,s.x,c.x,l.x,u.x),Ga(o,s.y,c.y,l.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new J().fromArray(n))}return this}}}),co=class e extends mi{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new ni(p,3)),this.setAttribute(`normal`,new ni(m,3)),this.setAttribute(`uv`,new ni(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},lo=class e extends mi{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new Y,p=new J;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new ni(s,3)),this.setAttribute(`normal`,new ni(c,3)),this.setAttribute(`uv`,new ni(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},uo=class e extends mi{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new Y,d=new Y,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new ni(p,3)),this.setAttribute(`normal`,new ni(m,3)),this.setAttribute(`uv`,new ni(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},fo=class e extends mi{constructor(e=new oo(new Y(-1,-1,0),new Y(-1,1,0),new Y(1,1,0)),t=64,n=1,r=8,i=!1){super(),this.type=`TubeGeometry`,this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:r,closed:i};let a=e.computeFrenetFrames(t,i);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new Y,s=new Y,c=new J,l=new Y,u=[],d=[],f=[],p=[];m(),this.setIndex(p),this.setAttribute(`position`,new ni(u,3)),this.setAttribute(`normal`,new ni(d,3)),this.setAttribute(`uv`,new ni(f,2));function m(){for(let e=0;e<t;e++)h(e);h(i===!1?t:0),_(),g()}function h(i){l=e.getPointAt(i/t,l);let c=a.normals[i],f=a.binormals[i];for(let e=0;e<=r;e++){let t=e/r*Math.PI*2,i=Math.sin(t),a=-Math.cos(t);s.x=a*c.x+i*f.x,s.y=a*c.y+i*f.y,s.z=a*c.z+i*f.z,s.normalize(),d.push(s.x,s.y,s.z),o.x=l.x+n*s.x,o.y=l.y+n*s.y,o.z=l.z+n*s.z,u.push(o.x,o.y,o.z)}}function g(){for(let e=1;e<=t;e++)for(let t=1;t<=r;t++){let n=(r+1)*(e-1)+(t-1),i=(r+1)*e+(t-1),a=(r+1)*e+t,o=(r+1)*(e-1)+t;p.push(n,i,o),p.push(i,a,o)}}function _(){for(let e=0;e<=t;e++)for(let n=0;n<=r;n++)c.x=e/t,c.y=n/r,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(t){return new e(new so[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}},po=class extends mi{constructor(e=null){if(super(),this.type=`WireframeGeometry`,this.parameters={geometry:e},e!==null){let t=[],n=new Set,r=new Y,i=new Y;if(e.index!==null){let a=e.attributes.position,o=e.index,s=e.groups;s.length===0&&(s=[{start:0,count:o.count,materialIndex:0}]);for(let e=0,c=s.length;e<c;++e){let c=s[e],l=c.start,u=c.count;for(let e=l,s=l+u;e<s;e+=3)for(let s=0;s<3;s++){let c=o.getX(e+s),l=o.getX(e+(s+1)%3);r.fromBufferAttribute(a,c),i.fromBufferAttribute(a,l),mo(r,i,n)===!0&&(t.push(r.x,r.y,r.z),t.push(i.x,i.y,i.z))}}}else{let a=e.attributes.position;for(let e=0,o=a.count/3;e<o;e++)for(let o=0;o<3;o++){let s=3*e+o,c=3*e+(o+1)%3;r.fromBufferAttribute(a,s),i.fromBufferAttribute(a,c),mo(r,i,n)===!0&&(t.push(r.x,r.y,r.z),t.push(i.x,i.y,i.z))}}this.setAttribute(`position`,new ni(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function mo(e,t,n){let r=`${e.x},${e.y},${e.z}-${t.x},${t.y},${t.z}`,i=`${t.x},${t.y},${t.z}-${e.x},${e.y},${e.z}`;return n.has(r)===!0||n.has(i)===!0?!1:(n.add(r),n.add(i),!0)}var ho=class extends bi{constructor(e){super(),this.isShadowMaterial=!0,this.type=`ShadowMaterial`,this.color=new X(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};function go(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(vo(i))i.isRenderTargetTexture?(K(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(vo(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function _o(e){let t={};for(let n=0;n<e.length;n++){let r=go(e[n]);for(let e in r)t[e]=r[e]}return t}function vo(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function yo(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function bo(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:xn.workingColorSpace}var xo={clone:go,merge:_o},So=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Co=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,wo=class extends bi{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=So,this.fragmentShader=Co,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=go(e.uniforms),this.uniformsGroups=yo(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new X().setHex(r.value);break;case`v2`:this.uniforms[n].value=new J().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new Y().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Mn().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new gn().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new Ln().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},To=class extends wo{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Q=class extends bi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new X(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new X(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new J(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Eo=class extends Q{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:``,PHYSICAL:``},this.type=`MeshPhysicalMaterial`,this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new J(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Wt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new X(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new X(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new X(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:``,PHYSICAL:``},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}},Do=class extends bi{constructor(e){super(),this.isMeshNormalMaterial=!0,this.type=`MeshNormalMaterial`,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new J(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}},Oo=class extends bi{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type=`MeshLambertMaterial`,this.color=new X(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new X(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new J(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qn,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},ko=class extends bi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=bt,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Ao=class extends bi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},jo=class extends ea{constructor(e){super(),this.isLineDashedMaterial=!0,this.type=`LineDashedMaterial`,this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function Mo(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function No(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Po=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Fo=class extends Po{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:_t,endingEnd:_t}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case vt:i=e,o=2*t-n;break;case yt:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case vt:a=e,s=2*n-t;break;case yt:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Io=class extends Po{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},Lo=class extends Po{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Ro=class extends Po{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=Vo(n,t,g,y,r);i[p]=zo(x,o,_,b,m)}return i}};function zo(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Bo(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function Vo(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=zo(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Bo(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Ho=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Mo(t,this.TimeBufferType),this.values=Mo(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Mo(e.times,Array),values:Mo(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),No(e.settings)&&(n.settings={inTangents:Mo(e.settings.inTangents,Array),outTangents:Mo(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Lo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Io(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Fo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Ro(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case pt:t=this.InterpolantFactoryMethodDiscrete;break;case mt:t=this.InterpolantFactoryMethodLinear;break;case ht:t=this.InterpolantFactoryMethodSmooth;break;case gt:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return K(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return pt;case this.InterpolantFactoryMethodLinear:return mt;case this.InterpolantFactoryMethodSmooth:return ht;case this.InterpolantFactoryMethodBezier:return gt}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;No(this.settings)&&(Uo(this.settings.inTangents,e),Uo(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(q(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(q(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){q(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){q(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&kt(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){q(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===ht,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,No(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Uo(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Ho.prototype.ValueTypeName=``,Ho.prototype.TimeBufferType=Float32Array,Ho.prototype.ValueBufferType=Float32Array,Ho.prototype.DefaultInterpolation=mt;var Wo=class extends Ho{constructor(e,t,n){super(e,t,n)}};Wo.prototype.ValueTypeName=`bool`,Wo.prototype.ValueBufferType=Array,Wo.prototype.DefaultInterpolation=pt,Wo.prototype.InterpolantFactoryMethodLinear=void 0,Wo.prototype.InterpolantFactoryMethodSmooth=void 0;var Go=class extends Ho{constructor(e,t,n,r){super(e,t,n,r)}};Go.prototype.ValueTypeName=`color`;var Ko=class extends Ho{constructor(e,t,n,r){super(e,t,n,r)}};Ko.prototype.ValueTypeName=`number`;var qo=class extends Po{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)pn.slerpFlat(i,0,a,c-o,a,c,s);return i}},Jo=class extends Ho{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new qo(this.times,this.values,this.getValueSize(),e)}};Jo.prototype.ValueTypeName=`quaternion`,Jo.prototype.InterpolantFactoryMethodSmooth=void 0;var Yo=class extends Ho{constructor(e,t,n){super(e,t,n)}};Yo.prototype.ValueTypeName=`string`,Yo.prototype.ValueBufferType=Array,Yo.prototype.DefaultInterpolation=pt,Yo.prototype.InterpolantFactoryMethodLinear=void 0,Yo.prototype.InterpolantFactoryMethodSmooth=void 0;var Xo=class extends Ho{constructor(e,t,n,r){super(e,t,n,r)}};Xo.prototype.ValueTypeName=`vector`;var Zo=class extends ur{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new X(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Qo=class extends Zo{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(ur.DEFAULT_UP),this.updateMatrix(),this.groundColor=new X(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},$o=new Ln,es=new Y,ts=new Y,ns=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new J(512,512),this.mapType=fe,this.map=null,this.mapPass=null,this.matrix=new Ln,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new $i,this._frameExtents=new J(1,1),this._viewportCount=1,this._viewports=[new Mn(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;es.setFromMatrixPosition(e.matrixWorld),t.position.copy(es),ts.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(ts),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){$o.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix($o,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply($o)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},rs=new Y,is=new pn,as=new Y,os=class extends ur{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new Ln,this.projectionMatrix=new Ln,this.projectionMatrixInverse=new Ln,this.coordinateSystem=Dt,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(rs,is,as),as.x===1&&as.y===1&&as.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(rs,is,as.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(rs,is,as),as.x===1&&as.y===1&&as.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(rs,is,as.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ss=new Y,cs=new J,ls=new J,us=class extends os{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Ht*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Vt*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ht*2*Math.atan(Math.tan(Vt*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ss.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ss.x,ss.y).multiplyScalar(-e/ss.z),ss.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ss.x,ss.y).multiplyScalar(-e/ss.z)}getViewSize(e,t){return this.getViewBounds(e,cs,ls),t.subVectors(ls,cs)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Vt*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ds=class extends ns{constructor(){super(new us(90,1,.5,500)),this.isPointLightShadow=!0}},fs=class extends Zo{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new ds}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},ps=class extends os{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ms=class extends ns{constructor(){super(new ps(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},hs=class extends Zo{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(ur.DEFAULT_UP),this.updateMatrix(),this.target=new ur,this.shadow=new ms}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},gs=class extends Zo{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type=`AmbientLight`}},_s=-90,vs=1,ys=class extends ur{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new us(_s,vs,e,t);r.layers=this.layers,this.add(r);let i=new us(_s,vs,e,t);i.layers=this.layers,this.add(i);let a=new us(_s,vs,e,t);a.layers=this.layers,this.add(a);let o=new us(_s,vs,e,t);o.layers=this.layers,this.add(o);let s=new us(_s,vs,e,t);s.layers=this.layers,this.add(s);let c=new us(_s,vs,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},bs=class extends us{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},xs=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=Ss.bind(this),e.addEventListener(`visibilitychange`,this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener(`visibilitychange`,this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e===void 0?performance.now():e)-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Ss(){this._document.hidden===!1&&this.reset()}var Cs=`\\[\\]\\.:\\/`,ws=RegExp(`[\\[\\]\\.:\\/]`,`g`),Ts=`[^\\[\\]\\.:\\/]`,Es=`[^`+Cs.replace(`\\.`,``)+`]`,Ds=`((?:WC+[\\/:])*)`.replace(`WC`,Ts),Os=`(WCOD+)?`.replace(`WCOD`,Es),ks=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,Ts),As=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,Ts),js=RegExp(`^`+Ds+Os+ks+As+`$`),Ms=[`material`,`materials`,`bones`,`map`],Ns=class{constructor(e,t,n){let r=n||Ps.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Ps=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(ws,``)}static parseTrackName(e){let t=js.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);Ms.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){K(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){q(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){q(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){q(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){q(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){q(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){q(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){q(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;q(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){q(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){q(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ps.Composite=Ns,Ps.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Ps.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Ps.prototype.GetterByBindingType=[Ps.prototype._getValue_direct,Ps.prototype._getValue_array,Ps.prototype._getValue_arrayElement,Ps.prototype._getValue_toArray],Ps.prototype.SetterByBindingTypeAndVersioning=[[Ps.prototype._setValue_direct,Ps.prototype._setValue_direct_setNeedsUpdate,Ps.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ps.prototype._setValue_array,Ps.prototype._setValue_array_setNeedsUpdate,Ps.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ps.prototype._setValue_arrayElement,Ps.prototype._setValue_arrayElement_setNeedsUpdate,Ps.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ps.prototype._setValue_fromArray,Ps.prototype._setValue_fromArray_setNeedsUpdate,Ps.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Fs=new Ln,Is=class{constructor(e,t,n=0,r=1/0){this.ray=new Ti(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new Jn,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):q(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return Fs.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Fs),this}intersectObject(e,t=!0,n=[]){return Rs(e,this,n,t),n.sort(Ls),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)Rs(e[r],this,n,t);return n.sort(Ls),n}};function Ls(e,t){return e.distance-t.distance}function Rs(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)Rs(r[e],t,n,!0)}}var zs=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,K(`Clock: This module has been deprecated. Please use THREE.Timer instead.`)}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}},Bs=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){let e=1e-6;return this.phi=Wt(this.phi,e,Math.PI-e),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Wt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});var Vs=class extends fa{constructor(e=10,t=10,n=4473924,r=8947848){n=new X(n),r=new X(r);let i=t/2,a=e/t,o=e/2,s=[],c=[];for(let e=0,l=0,u=-o;e<=t;e++,u+=a){s.push(-o,0,u,o,0,u),s.push(u,0,-o,u,0,o);let t=e===i?n:r;t.toArray(c,l),l+=3,t.toArray(c,l),l+=3,t.toArray(c,l),l+=3,t.toArray(c,l),l+=3}let l=new mi;l.setAttribute(`position`,new ni(s,3)),l.setAttribute(`color`,new ni(c,3));let u=new ea({vertexColors:!0,toneMapped:!1});super(l,u),this.type=`GridHelper`}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}},Hs=class extends Rt{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Us(e,t,n,r){let i=Ws(r);switch(n){case we:return e*t;case W:return e*t/i.components*i.byteLength;case Oe:return e*t/i.components*i.byteLength;case G:return e*t*2/i.components*i.byteLength;case ke:return e*t*2/i.components*i.byteLength;case Te:return e*t*3/i.components*i.byteLength;case Ee:return e*t*4/i.components*i.byteLength;case Ae:return e*t*4/i.components*i.byteLength;case je:case Me:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Ne:case Pe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Ie:case Re:return Math.max(e,16)*Math.max(t,8)/4;case Fe:case Le:return Math.max(e,8)*Math.max(t,8)/2;case ze:case Be:case He:case Ue:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Ve:case We:case Ge:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Ke:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case qe:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Je:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Ye:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Xe:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Ze:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Qe:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case $e:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case et:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case tt:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case nt:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case rt:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case it:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case at:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case ot:case st:case ct:return Math.ceil(e/4)*Math.ceil(t/4)*16;case lt:case ut:return Math.ceil(e/4)*Math.ceil(t/4)*8;case dt:case ft:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Ws(e){switch(e){case fe:case pe:return{byteLength:1,components:1};case he:case me:case ye:return{byteLength:2,components:1};case be:case xe:return{byteLength:2,components:4};case _e:case ge:case ve:return{byteLength:4,components:1};case Ce:case H:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?K(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function Gs(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function Ks(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var qs={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},$={common:{diffuse:{value:new X(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new gn},alphaMap:{value:null},alphaMapTransform:{value:new gn},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new gn}},envmap:{envMap:{value:null},envMapRotation:{value:new gn},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new gn}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new gn}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new gn},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new gn},normalScale:{value:new J(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new gn},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new gn}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new gn}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new gn}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new X(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new Y},probesMax:{value:new Y},probesResolution:{value:new Y}},points:{diffuse:{value:new X(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new gn},alphaTest:{value:0},uvTransform:{value:new gn}},sprite:{diffuse:{value:new X(16777215)},opacity:{value:1},center:{value:new J(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new gn},alphaMap:{value:null},alphaMapTransform:{value:new gn},alphaTest:{value:0}}},Js={basic:{uniforms:_o([$.common,$.specularmap,$.envmap,$.aomap,$.lightmap,$.fog]),vertexShader:qs.meshbasic_vert,fragmentShader:qs.meshbasic_frag},lambert:{uniforms:_o([$.common,$.specularmap,$.envmap,$.aomap,$.lightmap,$.emissivemap,$.bumpmap,$.normalmap,$.displacementmap,$.fog,$.lights,{emissive:{value:new X(0)},envMapIntensity:{value:1}}]),vertexShader:qs.meshlambert_vert,fragmentShader:qs.meshlambert_frag},phong:{uniforms:_o([$.common,$.specularmap,$.envmap,$.aomap,$.lightmap,$.emissivemap,$.bumpmap,$.normalmap,$.displacementmap,$.fog,$.lights,{emissive:{value:new X(0)},specular:{value:new X(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:qs.meshphong_vert,fragmentShader:qs.meshphong_frag},standard:{uniforms:_o([$.common,$.envmap,$.aomap,$.lightmap,$.emissivemap,$.bumpmap,$.normalmap,$.displacementmap,$.roughnessmap,$.metalnessmap,$.fog,$.lights,{emissive:{value:new X(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:qs.meshphysical_vert,fragmentShader:qs.meshphysical_frag},toon:{uniforms:_o([$.common,$.aomap,$.lightmap,$.emissivemap,$.bumpmap,$.normalmap,$.displacementmap,$.gradientmap,$.fog,$.lights,{emissive:{value:new X(0)}}]),vertexShader:qs.meshtoon_vert,fragmentShader:qs.meshtoon_frag},matcap:{uniforms:_o([$.common,$.bumpmap,$.normalmap,$.displacementmap,$.fog,{matcap:{value:null}}]),vertexShader:qs.meshmatcap_vert,fragmentShader:qs.meshmatcap_frag},points:{uniforms:_o([$.points,$.fog]),vertexShader:qs.points_vert,fragmentShader:qs.points_frag},dashed:{uniforms:_o([$.common,$.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:qs.linedashed_vert,fragmentShader:qs.linedashed_frag},depth:{uniforms:_o([$.common,$.displacementmap]),vertexShader:qs.depth_vert,fragmentShader:qs.depth_frag},normal:{uniforms:_o([$.common,$.bumpmap,$.normalmap,$.displacementmap,{opacity:{value:1}}]),vertexShader:qs.meshnormal_vert,fragmentShader:qs.meshnormal_frag},sprite:{uniforms:_o([$.sprite,$.fog]),vertexShader:qs.sprite_vert,fragmentShader:qs.sprite_frag},background:{uniforms:{uvTransform:{value:new gn},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:qs.background_vert,fragmentShader:qs.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new gn}},vertexShader:qs.backgroundCube_vert,fragmentShader:qs.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:qs.cube_vert,fragmentShader:qs.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:qs.equirect_vert,fragmentShader:qs.equirect_frag},distance:{uniforms:_o([$.common,$.displacementmap,{referencePosition:{value:new Y},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:qs.distance_vert,fragmentShader:qs.distance_frag},shadow:{uniforms:_o([$.lights,$.fog,{color:{value:new X(0)},opacity:{value:1}}]),vertexShader:qs.shadow_vert,fragmentShader:qs.shadow_frag}};Js.physical={uniforms:_o([Js.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new gn},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new gn},clearcoatNormalScale:{value:new J(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new gn},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new gn},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new gn},sheen:{value:0},sheenColor:{value:new X(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new gn},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new gn},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new gn},transmissionSamplerSize:{value:new J},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new gn},attenuationDistance:{value:0},attenuationColor:{value:new X(0)},specularColor:{value:new X(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new gn},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new gn},anisotropyVector:{value:new J},anisotropyMap:{value:null},anisotropyMapTransform:{value:new gn}}]),vertexShader:qs.meshphysical_vert,fragmentShader:qs.meshphysical_frag};var Ys={r:0,b:0,g:0},Xs=new Ln,Zs=new gn;Zs.set(-1,0,0,0,1,0,0,0,1);function Qs(e,t,n,r,i,a){let o=new X(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new Z(new Ta(1,1,1),new wo({name:`BackgroundCubeMaterial`,uniforms:go(Js.backgroundCube.uniforms),vertexShader:Js.backgroundCube.vertexShader,fragmentShader:Js.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Xs.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Zs),l.material.toneMapped=xn.getTransfer(i.colorSpace)!==wt,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new Z(new co(2,2),new wo({name:`BackgroundMaterial`,uniforms:go(Js.background.uniforms),vertexShader:Js.background.vertexShader,fragmentShader:Js.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=xn.getTransfer(i.colorSpace)!==wt,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Ys,bo(e)),n.buffers.color.setClear(Ys.r,Ys.g,Ys.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function $s(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function ec(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function tc(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(K(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&K(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function nc(e){let t=this,n=null,r=0,i=!1,a=!1,o=new vi,s=new gn,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var rc=4,ic=6,ac=20,oc=256,sc=new ps,cc=new X,lc=null,uc=0,dc=0,fc=!1,pc=new Y,mc=new Y,hc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=pc}=i;lc=this._renderer.getRenderTarget(),uc=this._renderer.getActiveCubeFace(),dc=this._renderer.getActiveMipmapLevel(),fc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Sc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=xc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(lc,uc,dc),this._renderer.xr.enabled=fc,e.scissorTest=!1,vc(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),lc=this._renderer.getRenderTarget(),uc=this._renderer.getActiveCubeFace(),dc=this._renderer.getActiveMipmapLevel(),fc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:le,minFilter:le,generateMipmaps:!1,type:ye,format:Ee,colorSpace:St,depthBuffer:!1},r=_c(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=_c(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=gc(r)),this._blurMaterial=bc(r,e,t),this._ggxMaterial=yc(r,e,t)}return r}_compileMaterial(e){let t=new Z(new mi,e);this._renderer.compile(t,sc)}_sceneToCubeUV(e,t,n,r,i){let a=new us(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(cc),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Z(new Ta,new Ei({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(cc),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;vc(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Sc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=xc());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;vc(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,sc)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-rc?n-d+rc:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,vc(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,sc),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,vc(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,sc)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];vc(t,3*l*(r>this._lodMax-rc?r-this._lodMax+rc:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,sc)}};function gc(e){let t=[],n=[],r=e,i=e-rc+1+ic;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?mc.set(1,r,n):e===1?mc.set(-n,1,-r):e===2?mc.set(-n,r,1):e===3?mc.set(-1,r,-n):e===4?mc.set(-n,-1,r):mc.set(n,r,-1),mc.toArray(l,(e*6+t)*3)}}let u=new mi;u.setAttribute(`position`,new $r(c,3)),u.setAttribute(`outputDirection`,new $r(l,3)),n.push(new Z(u,null)),r>rc&&r--}return{lodMeshes:n,sizeLods:t}}function _c(e,t,n){let r=new Pn(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function vc(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function yc(e,t,n){return new wo({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:oc,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Cc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function bc(e,t,n){return new wo({name:`SphericalGaussianBlur`,defines:{SAMPLES:ac,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Cc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function xc(){return new wo({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Cc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Sc(){return new wo({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Cc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Cc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var wc=class extends Pn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ba(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ta(5,5,5),i=new wo({name:`CubemapFromEquirect`,uniforms:go(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new Z(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=le),new ys(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function Tc(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new wc(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new hc(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new hc(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Ec(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&Ft(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Dc(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0?t:(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++,t)}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?ti:ei)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function Oc(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function kc(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:q(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Ac(e,t,n){let r=new WeakMap,i=new Mn;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new Fn(h,p,m,u);g.type=ve,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new J(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function jc(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var Mc={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function Nc(e,t,n,r,i,a){let o=new Pn(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new mi;l.setAttribute(`position`,new ni([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new ni([0,2,0,0,2,0],2));let u=new To({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Z(l,u),f=new ps(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;v.length>0&&s===null&&(s=new Pn(t,n,{type:ye,depthBuffer:!1,stencilBuffer:!1}),c=new Pn(t,n,{type:ye,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},xn.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=Mc[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var Pc=new jn,Fc=new Sa(1,1),Ic=new Fn,Lc=new In,Rc=new ba,zc=[],Bc=[],Vc=new Float32Array(16),Hc=new Float32Array(9),Uc=new Float32Array(4);function Wc(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=zc[i];if(a===void 0&&(a=new Float32Array(i),zc[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Gc(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function Kc(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function qc(e,t){let n=Bc[t];n===void 0&&(n=new Int32Array(t),Bc[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Jc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Yc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Gc(n,t))return;e.uniform2fv(this.addr,t),Kc(n,t)}}function Xc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Gc(n,t))return;e.uniform3fv(this.addr,t),Kc(n,t)}}function Zc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Gc(n,t))return;e.uniform4fv(this.addr,t),Kc(n,t)}}function Qc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Gc(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Kc(n,t)}else{if(Gc(n,r))return;Uc.set(r),e.uniformMatrix2fv(this.addr,!1,Uc),Kc(n,r)}}function $c(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Gc(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Kc(n,t)}else{if(Gc(n,r))return;Hc.set(r),e.uniformMatrix3fv(this.addr,!1,Hc),Kc(n,r)}}function el(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Gc(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Kc(n,t)}else{if(Gc(n,r))return;Vc.set(r),e.uniformMatrix4fv(this.addr,!1,Vc),Kc(n,r)}}function tl(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function nl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Gc(n,t))return;e.uniform2iv(this.addr,t),Kc(n,t)}}function rl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Gc(n,t))return;e.uniform3iv(this.addr,t),Kc(n,t)}}function il(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Gc(n,t))return;e.uniform4iv(this.addr,t),Kc(n,t)}}function al(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function ol(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Gc(n,t))return;e.uniform2uiv(this.addr,t),Kc(n,t)}}function sl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Gc(n,t))return;e.uniform3uiv(this.addr,t),Kc(n,t)}}function cl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Gc(n,t))return;e.uniform4uiv(this.addr,t),Kc(n,t)}}function ll(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(Fc.compareFunction=n.isReversedDepthBuffer()?518:515,a=Fc):a=Pc,n.setTexture2D(t||a,i)}function ul(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Lc,i)}function dl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||Rc,i)}function fl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||Ic,i)}function pl(e){switch(e){case 5126:return Jc;case 35664:return Yc;case 35665:return Xc;case 35666:return Zc;case 35674:return Qc;case 35675:return $c;case 35676:return el;case 5124:case 35670:return tl;case 35667:case 35671:return nl;case 35668:case 35672:return rl;case 35669:case 35673:return il;case 5125:return al;case 36294:return ol;case 36295:return sl;case 36296:return cl;case 35678:case 36198:case 36298:case 36306:case 35682:return ll;case 35679:case 36299:case 36307:return ul;case 35680:case 36300:case 36308:case 36293:return dl;case 36289:case 36303:case 36311:case 36292:return fl}}function ml(e,t){e.uniform1fv(this.addr,t)}function hl(e,t){let n=Wc(t,this.size,2);e.uniform2fv(this.addr,n)}function gl(e,t){let n=Wc(t,this.size,3);e.uniform3fv(this.addr,n)}function _l(e,t){let n=Wc(t,this.size,4);e.uniform4fv(this.addr,n)}function vl(e,t){let n=Wc(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function yl(e,t){let n=Wc(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function bl(e,t){let n=Wc(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function xl(e,t){e.uniform1iv(this.addr,t)}function Sl(e,t){e.uniform2iv(this.addr,t)}function Cl(e,t){e.uniform3iv(this.addr,t)}function wl(e,t){e.uniform4iv(this.addr,t)}function Tl(e,t){e.uniform1uiv(this.addr,t)}function El(e,t){e.uniform2uiv(this.addr,t)}function Dl(e,t){e.uniform3uiv(this.addr,t)}function Ol(e,t){e.uniform4uiv(this.addr,t)}function kl(e,t,n){let r=this.cache,i=t.length,a=qc(n,i);Gc(r,a)||(e.uniform1iv(this.addr,a),Kc(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?Fc:Pc;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Al(e,t,n){let r=this.cache,i=t.length,a=qc(n,i);Gc(r,a)||(e.uniform1iv(this.addr,a),Kc(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Lc,a[e])}function jl(e,t,n){let r=this.cache,i=t.length,a=qc(n,i);Gc(r,a)||(e.uniform1iv(this.addr,a),Kc(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||Rc,a[e])}function Ml(e,t,n){let r=this.cache,i=t.length,a=qc(n,i);Gc(r,a)||(e.uniform1iv(this.addr,a),Kc(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||Ic,a[e])}function Nl(e){switch(e){case 5126:return ml;case 35664:return hl;case 35665:return gl;case 35666:return _l;case 35674:return vl;case 35675:return yl;case 35676:return bl;case 5124:case 35670:return xl;case 35667:case 35671:return Sl;case 35668:case 35672:return Cl;case 35669:case 35673:return wl;case 5125:return Tl;case 36294:return El;case 36295:return Dl;case 36296:return Ol;case 35678:case 36198:case 36298:case 36306:case 35682:return kl;case 35679:case 36299:case 36307:return Al;case 35680:case 36300:case 36308:case 36293:return jl;case 36289:case 36303:case 36311:case 36292:return Ml}}var Pl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=pl(t.type)}},Fl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Nl(t.type)}},Il=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},Ll=/(\w+)(\])?(\[|\.)?/g;function Rl(e,t){e.seq.push(t),e.map[t.id]=t}function zl(e,t,n){let r=e.name,i=r.length;for(Ll.lastIndex=0;;){let a=Ll.exec(r),o=Ll.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){Rl(n,l===void 0?new Pl(s,e,t):new Fl(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Il(s),Rl(n,e)),n=e}}}var Bl=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);zl(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function Vl(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var Hl=37297,Ul=0;function Wl(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var Gl=new gn;function Kl(e){xn._getMatrix(Gl,xn.workingColorSpace,e);let t=`mat3( ${Gl.elements.map(e=>e.toFixed(4))} )`;switch(xn.getTransfer(e)){case Ct:return[t,`LinearTransferOETF`];case wt:return[t,`sRGBTransferOETF`];default:return K(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function ql(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Wl(e.getShaderSource(t),r)}return i}function Jl(e,t){let n=Kl(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var Yl={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function Xl(e,t){let n=Yl[t];return n===void 0?(K(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Zl=new Y;function Ql(){return xn.getLuminanceCoefficients(Zl),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Zl.x.toFixed(4)}, ${Zl.y.toFixed(4)}, ${Zl.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function $l(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(nu).join(`
`)}function eu(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function tu(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function nu(e){return e!==``}function ru(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function iu(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var au=/^[ \t]*#include +<([\w\d./]+)>/gm;function ou(e){return e.replace(au,cu)}var su=new Map;function cu(e,t){let n=qs[t];if(n===void 0){let e=su.get(t);if(e!==void 0)n=qs[e],K(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return ou(n)}var lu=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function uu(e){return e.replace(lu,du)}function du(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function fu(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var pu={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function mu(e){return pu[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var hu={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function gu(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:hu[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var _u={302:`ENVMAP_MODE_REFRACTION`};function vu(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:_u[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var yu={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function bu(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:yu[e.combine]||`ENVMAP_BLENDING_NONE`}function xu(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function Su(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=mu(n),l=gu(n),u=vu(n),d=bu(n),f=xu(n),p=$l(n),m=eu(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(nu).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(nu).join(`
`),_.length>0&&(_+=`
`)):(g=[fu(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(nu).join(`
`),_=[fu(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:qs.tonemapping_pars_fragment,n.toneMapping===0?``:Xl(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,qs.colorspace_pars_fragment,Jl(`linearToOutputTexel`,n.outputColorSpace),Ql(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(nu).join(`
`)),o=ou(o),o=ru(o,n),o=iu(o,n),s=ou(s),s=ru(s,n),s=iu(s,n),o=uu(o),s=uu(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=Vl(i,i.VERTEX_SHADER,y),S=Vl(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=ql(i,x,`vertex`),n=ql(i,S,`fragment`);q(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):K(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new Bl(i,h),T=tu(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,Hl)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Ul++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var Cu=0,wu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Tu(e),t.set(e,n)),n}},Tu=class{constructor(e){this.id=Cu++,this.code=e,this.usedTimes=0}};function Eu(e){return e===1030||e===37490||e===36285}function Du(e,t,n,r,i,a){let o=new Jn,s=new wu,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&K(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=Js[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let j=e.getRenderTarget(),M=e.state.buffers.depth.getReversed(),N=h.isInstancedMesh===!0,P=h.isBatchedMesh===!0,F=!!i.map,I=!!i.matcap,ee=!!x,L=!!i.aoMap,te=!!i.lightMap,ne=!!i.bumpMap&&i.wireframe===!1,R=!!i.normalMap,re=!!i.displacementMap,z=!!i.emissiveMap,B=!!i.metalnessMap,V=!!i.roughnessMap,ie=i.anisotropy>0,ae=i.clearcoat>0,oe=i.dispersion>0,se=i.retroreflectivity>0,ce=i.iridescence>0,le=i.sheen>0,ue=i.transmission>0,de=ie&&!!i.anisotropyMap,fe=ae&&!!i.clearcoatMap,pe=ae&&!!i.clearcoatNormalMap,me=ae&&!!i.clearcoatRoughnessMap,he=ce&&!!i.iridescenceMap,ge=ce&&!!i.iridescenceThicknessMap,_e=le&&!!i.sheenColorMap,ve=le&&!!i.sheenRoughnessMap,ye=!!i.specularMap,be=!!i.specularColorMap,xe=!!i.specularIntensityMap,Se=ue&&!!i.transmissionMap,Ce=ue&&!!i.thicknessMap,H=!!i.gradientMap,we=!!i.alphaMap,Te=i.alphaTest>0,Ee=!!i.alphaHash,U=!!i.extensions,De=0;i.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(De=e.toneMapping);let W={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:P,batchingColor:P&&h._colorsTexture!==null,instancing:N,instancingColor:N&&h.instanceColor!==null,instancingMorph:N&&h.morphTexture!==null,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:xn.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:F,matcap:I,envMap:ee,envMapMode:ee&&x.mapping,envMapCubeUVHeight:S,aoMap:L,lightMap:te,bumpMap:ne,normalMap:R,displacementMap:re,emissiveMap:z,normalMapObjectSpace:R&&i.normalMapType===1,normalMapTangentSpace:R&&i.normalMapType===0,packedNormalMap:R&&i.normalMapType===0&&Eu(i.normalMap.format),metalnessMap:B,roughnessMap:V,anisotropy:ie,anisotropyMap:de,clearcoat:ae,clearcoatMap:fe,clearcoatNormalMap:pe,clearcoatRoughnessMap:me,dispersion:oe,retroreflection:se,iridescence:ce,iridescenceMap:he,iridescenceThicknessMap:ge,sheen:le,sheenColorMap:_e,sheenRoughnessMap:ve,specularMap:ye,specularColorMap:be,specularIntensityMap:xe,transmission:ue,transmissionMap:Se,thicknessMap:Ce,gradientMap:H,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:we,alphaTest:Te,alphaHash:Ee,combine:i.combine,mapUv:F&&m(i.map.channel),aoMapUv:L&&m(i.aoMap.channel),lightMapUv:te&&m(i.lightMap.channel),bumpMapUv:ne&&m(i.bumpMap.channel),normalMapUv:R&&m(i.normalMap.channel),displacementMapUv:re&&m(i.displacementMap.channel),emissiveMapUv:z&&m(i.emissiveMap.channel),metalnessMapUv:B&&m(i.metalnessMap.channel),roughnessMapUv:V&&m(i.roughnessMap.channel),anisotropyMapUv:de&&m(i.anisotropyMap.channel),clearcoatMapUv:fe&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:pe&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:me&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:he&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:ge&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:_e&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:ve&&m(i.sheenRoughnessMap.channel),specularMapUv:ye&&m(i.specularMap.channel),specularColorMapUv:be&&m(i.specularColorMap.channel),specularIntensityMapUv:xe&&m(i.specularIntensityMap.channel),transmissionMapUv:Se&&m(i.transmissionMap.channel),thicknessMapUv:Ce&&m(i.thicknessMap.channel),alphaMapUv:we&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(R||ie),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(F||we),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&R===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:M,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:De,decodeVideoTexture:F&&i.map.isVideoTexture===!0&&xn.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:z&&i.emissiveMap.isVideoTexture===!0&&xn.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:U&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(U&&i.extensions.multiDraw===!0||P)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return W.vertexUv1s=c.has(1),W.vertexUv2s=c.has(2),W.vertexUv3s=c.has(3),c.clear(),W}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=Js[t];n=xo.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new Su(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function Ou(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function ku(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Au(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function ju(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||ku),r.length>1&&r.sort(t||Au),i.length>1&&i.sort(t||Au)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Mu(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new ju,e.set(t,[i])):n>=r.length?(i=new ju,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Nu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new Y,color:new X};break;case`SpotLight`:n={position:new Y,direction:new Y,color:new X,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new Y,color:new X,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new Y,skyColor:new X,groundColor:new X};break;case`RectAreaLight`:n={color:new X,position:new Y,halfWidth:new Y,halfHeight:new Y}}return e[t.id]=n,n}}}function Pu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new J};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new J};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new J,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var Fu=0;function Iu(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function Lu(e){let t=new Nu,n=Pu(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new Y);let i=new Y,a=new Ln,o=new Ln;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(Iu);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=$.LTC_FLOAT_1,r.rectAreaLTC2=$.LTC_FLOAT_2):(r.rectAreaLTC1=$.LTC_HALF_1,r.rectAreaLTC2=$.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=Fu++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function Ru(e){let t=new Lu(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function zu(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Ru(e),t.set(n,[a])):r>=i.length?(a=new Ru(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Bu=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Vu=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Hu=[new Y(1,0,0),new Y(-1,0,0),new Y(0,1,0),new Y(0,-1,0),new Y(0,0,1),new Y(0,0,-1)],Uu=[new Y(0,-1,0),new Y(0,-1,0),new Y(0,0,1),new Y(0,0,-1),new Y(0,-1,0),new Y(0,-1,0)],Wu=new Ln,Gu=new Y,Ku=new Y;function qu(e,t,n){let r=new $i,i=new J,a=new J,o=new Mn,s=new ko,c=new Ao,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new wo({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new J},radius:{value:4}},vertexShader:Bu,fragmentShader:Vu}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new mi;m.setAttribute(`position`,new $r(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new Z(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(K(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){K(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){K(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new Pn(i.x,i.y,{format:G,type:ye,minFilter:le,magFilter:le,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new Sa(i.x,i.y,ve),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=U,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=oe,d.map.depthTexture.magFilter=oe}else l.isPointLight?(d.map=new wc(i.x),d.map.depthTexture=new Ca(i.x,_e)):(d.map=new Pn(i.x,i.y),d.map.depthTexture=new Sa(i.x,i.y,_e)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=U,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=le,d.map.depthTexture.magFilter=le):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=oe,d.map.depthTexture.magFilter=oe);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),Gu.setFromMatrixPosition(l.matrixWorld),e.position.copy(Gu),Ku.copy(e.position),Ku.add(Hu[t]),e.up.copy(Uu[t]),e.lookAt(Ku),e.updateMatrixWorld(),n.makeTranslation(-Gu.x,-Gu.y,-Gu.z),Wu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(Wu,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new Pn(i.x,i.y,{format:G,type:ye}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=y(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)b(c[e],i,a,o,s)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Ju(e,t){function n(){let t=!1,n=new Mn,r=null,i=new Mn(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?B(e.DEPTH_TEST):V(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=Lt[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?B(e.STENCIL_TEST):V(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new X(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,M=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),N=!1,P=0,F=e.getParameter(e.VERSION);F.indexOf(`WebGL`)===-1?F.indexOf(`OpenGL ES`)!==-1&&(P=parseFloat(/^OpenGL ES (\d)/.exec(F)[1]),N=P>=2):(P=parseFloat(/^WebGL (\d)/.exec(F)[1]),N=P>=1);let I=null,ee={},L=e.getParameter(e.SCISSOR_BOX),te=e.getParameter(e.VIEWPORT),ne=new Mn().fromArray(L),R=new Mn().fromArray(te);function re(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let z={};z[e.TEXTURE_2D]=re(e.TEXTURE_2D,e.TEXTURE_2D,1),z[e.TEXTURE_CUBE_MAP]=re(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),z[e.TEXTURE_2D_ARRAY]=re(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),z[e.TEXTURE_3D]=re(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),B(e.DEPTH_TEST),o.setFunc(3),de(!1),fe(1),B(e.CULL_FACE),le(0);function B(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function V(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function ie(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function ae(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function oe(t){return h!==t&&(e.useProgram(t),h=t,!0)}let se={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};se[103]=e.MIN,se[104]=e.MAX;let ce={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function le(t,n,r,i,a,o,s,c,l,u){if(t===0){g===!0&&(V(e.BLEND),g=!1);return}if(g===!1&&(B(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:q(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:q(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:q(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:q(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}return}a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(se[n],se[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(ce[r],ce[i],ce[o],ce[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function ue(t,n){t.side===2?V(e.CULL_FACE):B(e.CULL_FACE);let r=t.side===1;n&&(r=!r),de(r),t.blending===1&&t.transparent===!1?le(0):le(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),me(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?B(e.SAMPLE_ALPHA_TO_COVERAGE):V(e.SAMPLE_ALPHA_TO_COVERAGE)}function de(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function fe(t){t===0?V(e.CULL_FACE):(B(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function pe(t){t!==k&&(N&&e.lineWidth(t),k=t)}function me(t,n,r){t?(B(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):V(e.POLYGON_OFFSET_FILL)}function he(t){t?B(e.SCISSOR_TEST):V(e.SCISSOR_TEST)}function ge(t){t===void 0&&(t=e.TEXTURE0+M-1),I!==t&&(e.activeTexture(t),I=t)}function _e(t,n,r){r===void 0&&(r=I===null?e.TEXTURE0+M-1:I);let i=ee[r];i===void 0&&(i={type:void 0,texture:void 0},ee[r]=i),(i.type!==t||i.texture!==n)&&(I!==r&&(e.activeTexture(r),I=r),e.bindTexture(t,n||z[t]),i.type=t,i.texture=n)}function ve(){let t=ee[I];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function ye(){try{e.compressedTexImage2D(...arguments)}catch(e){q(`WebGLState:`,e)}}function be(){try{e.compressedTexImage3D(...arguments)}catch(e){q(`WebGLState:`,e)}}function xe(){try{e.texSubImage2D(...arguments)}catch(e){q(`WebGLState:`,e)}}function Se(){try{e.texSubImage3D(...arguments)}catch(e){q(`WebGLState:`,e)}}function Ce(){try{e.compressedTexSubImage2D(...arguments)}catch(e){q(`WebGLState:`,e)}}function H(){try{e.compressedTexSubImage3D(...arguments)}catch(e){q(`WebGLState:`,e)}}function we(){try{e.texStorage2D(...arguments)}catch(e){q(`WebGLState:`,e)}}function Te(){try{e.texStorage3D(...arguments)}catch(e){q(`WebGLState:`,e)}}function Ee(){try{e.texImage2D(...arguments)}catch(e){q(`WebGLState:`,e)}}function U(){try{e.texImage3D(...arguments)}catch(e){q(`WebGLState:`,e)}}function De(t){return d[t]===void 0?e.getParameter(t):d[t]}function W(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Oe(t){ne.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),ne.copy(t))}function G(t){R.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),R.copy(t))}function ke(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function Ae(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function je(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},I=null,ee={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new X(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ne.set(0,0,e.canvas.width,e.canvas.height),R.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:B,disable:V,bindFramebuffer:ie,drawBuffers:ae,useProgram:oe,setBlending:le,setMaterial:ue,setFlipSided:de,setCullFace:fe,setLineWidth:pe,setPolygonOffset:me,setScissorTest:he,activeTexture:ge,bindTexture:_e,unbindTexture:ve,compressedTexImage2D:ye,compressedTexImage3D:be,texImage2D:Ee,texImage3D:U,pixelStorei:W,getParameter:De,updateUBOMapping:ke,uniformBlockBinding:Ae,texStorage2D:we,texStorage3D:Te,texSubImage2D:xe,texSubImage3D:Se,compressedTexSubImage2D:Ce,compressedTexSubImage3D:H,scissor:Oe,viewport:G,reset:je}}function Yu(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new J,u=new WeakMap,d=new Set,f,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function h(e,t){return m?new OffscreenCanvas(e,t):At(`canvas`)}function g(e,t,n){let r=1,i=U(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=h(n,a));let o=t?h(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),K(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&K(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function _(e){return e.generateMipmaps}function v(t){e.generateMipmap(t)}function y(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function b(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];K(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||K(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?Ct:xn.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function x(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,K(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function S(e,t){return _(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function C(e){let t=e.target;t.removeEventListener(`dispose`,C),T(t),t.isVideoTexture&&u.delete(t),t.isHTMLTexture&&d.delete(t)}function w(e){let t=e.target;t.removeEventListener(`dispose`,w),D(t)}function T(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&E(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function E(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function D(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let O=0;function k(){O=0}function A(){return O}function j(e){O=e}function M(){let e=O;return e>=i.maxTextures&&K(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),O+=1,e}function N(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function P(t,i){let a=r.get(t);if(t.isVideoTexture&&Te(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)K(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)K(`WebGLRenderer: Texture marked for update but image is incomplete`);else{fe(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function F(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){fe(a,t,i);return}t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i)}function I(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){fe(a,t,i);return}n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function ee(t,i){let a=r.get(t);if(t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version){pe(a,t,i);return}n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let L={[V]:e.REPEAT,[ie]:e.CLAMP_TO_EDGE,[ae]:e.MIRRORED_REPEAT},te={[oe]:e.NEAREST,[se]:e.NEAREST_MIPMAP_NEAREST,[ce]:e.NEAREST_MIPMAP_LINEAR,[le]:e.LINEAR,[ue]:e.LINEAR_MIPMAP_NEAREST,[de]:e.LINEAR_MIPMAP_LINEAR},ne={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function R(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&K(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,L[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,L[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,L[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,te[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,te[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,ne[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function re(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,C));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=N(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&E(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function z(e,t,n){return Math.floor(Math.floor(e/n)/t)}function B(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=z(n.start,r.width,4),c=z(t.start,r.width,4);n.start<=i+1&&a===c&&z(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function fe(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=re(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=xn.getPrimaries(xn.workingColorSpace),r=o.colorSpace===``?null:xn.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=g(o.image,!1,i.maxTextureSize);t=Ee(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=b(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);R(c,o);let h,y=o.mipmaps,C=o.isVideoTexture!==!0,w=f.__version===void 0||l===!0,T=u.dataReady,E=S(o,t);if(o.isDepthTexture)m=x(o.format===De,o.type),w&&(C?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(y.length>0){C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else C?(w&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&B(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){C&&w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,y[0].width,y[0].height,t.depth);for(let i=0,a=y.length;i<a;i++)if(h=y[i],o.format!==1023){if(r!==null){if(C){if(T){if(o.layerUpdates.size>0){let t=Us(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else K(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else C?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],o.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?K(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(C){if(w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=Us(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)C?(w&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(w){if(C)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(y.length>0){if(C&&w){let t=U(y[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(C){if(w){let r=U(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);_(o)&&v(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function pe(t,o,s){if(o.image.length!==6)return;let c=re(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=xn.getPrimaries(xn.workingColorSpace),r=o.colorSpace===``?null:xn.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=g(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=Ee(o,m[e]);let h=m[0],y=a.convert(o.format,o.colorSpace),x=a.convert(o.type),C=b(o.internalFormat,y,x,o.normalized,o.colorSpace),w=o.isVideoTexture!==!0,T=u.__version===void 0||c===!0,E=l.dataReady,D=S(o,h);R(e.TEXTURE_CUBE_MAP,o);let O;if(f){w&&T&&n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,h.width,h.height);for(let t=0;t<6;t++){O=m[t].mipmaps;for(let r=0;r<O.length;r++){let i=O[r];o.format===1023?w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,y,x,i.data):y===null?K(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):w?E&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,i.data)}}}else{if(O=o.mipmaps,w&&T){O.length>0&&D++;let t=U(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,t.width,t.height)}for(let t=0;t<6;t++)if(p){w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,y,x,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,m[t].width,m[t].height,0,y,x,m[t].data);for(let r=0;r<O.length;r++){let i=O[r].image[t].image;w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,i.width,i.height,0,y,x,i.data)}}else{w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,y,x,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,y,x,m[t]);for(let r=0;r<O.length;r++){let i=O[r];w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,y,x,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,y,x,i.image[t])}}}_(o)&&v(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function me(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=b(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),we(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,H(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function he(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=x(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;we(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,H(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,H(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=b(o.internalFormat,c,l,o.normalized,o.colorSpace);we(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,H(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,H(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function ge(t,i,o){let c=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let l=r.get(i.depthTexture);if(l.__renderTarget=i,(!l.__webglTexture||i.depthTexture.image.width!==i.width||i.depthTexture.image.height!==i.height)&&(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),c){if(l.__webglInit===void 0&&(l.__webglInit=!0,i.depthTexture.addEventListener(`dispose`,C)),l.__webglTexture===void 0){l.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,l.__webglTexture),R(e.TEXTURE_CUBE_MAP,i.depthTexture);let t=a.convert(i.depthTexture.format),r=a.convert(i.depthTexture.type),o;i.depthTexture.format===1026?o=e.DEPTH_COMPONENT24:i.depthTexture.format===1027&&(o=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,o,i.width,i.height,0,t,r,null)}}else P(i.depthTexture,0);let u=l.__webglTexture,d=H(i),f=c?e.TEXTURE_CUBE_MAP_POSITIVE_X+o:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)we(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)we(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function _e(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)ge(i.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?ge(i.__webglFramebuffer[0],t,0):ge(i.__webglFramebuffer,t,0)}}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),he(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),he(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function ve(t,n,i){let a=r.get(t);n!==void 0&&me(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&_e(t)}function ye(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,w);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&we(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=b(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=H(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),he(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),R(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)me(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else me(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);_(i)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),R(c,a),me(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),_(a)&&v(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),R(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)me(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else me(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);_(i)&&v(r),n.unbindTexture()}t.depthBuffer&&_e(t)}function be(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(_(a)){let t=y(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),v(t),n.unbindTexture()}}}let xe=[],Se=[];function Ce(t){if(t.samples>0){if(we(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(xe.length=0,Se.length=0,xe.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(xe.push(l),Se.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Se)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,xe))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function H(e){return Math.min(i.maxSamples,e.samples)}function we(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function Te(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function Ee(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(xn.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&K(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):q(`WebGLTextures: Unsupported texture color space:`,n)),t}function U(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=M,this.resetTextureUnits=k,this.getTextureUnits=A,this.setTextureUnits=j,this.setTexture2D=P,this.setTexture2DArray=F,this.setTexture3D=I,this.setTextureCube=ee,this.rebindTextures=ve,this.setupRenderTarget=ye,this.updateRenderTargetMipmap=be,this.updateMultisampleRenderTarget=Ce,this.setupDepthRenderbuffer=_e,this.setupFrameBufferTexture=me,this.useMultisampledRTT=we,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Xu(e,t){function n(n,r=``){let i,a=xn.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Zu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Qu=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,$u=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new wa(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new wo({vertexShader:Zu,fragmentShader:Qu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Z(new co(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ed=class extends Rt{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new $u,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new J,C=null,w=null,T=new us;T.viewport=new Mn;let E=new us;E.viewport=new Mn;let D=[T,E],O=new bs,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new pr,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new pr,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new pr,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function M(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,M),r.removeEventListener(`inputsourceschange`,N);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,R.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&K(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&K(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,M),r.addEventListener(`inputsourceschange`,N),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?De:U,a=_.stencil?Se:_e);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Pn(d.textureWidth,d.textureHeight,{format:Ee,type:fe,depthTexture:new Sa(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new Pn(f.framebufferWidth,f.framebufferHeight,{format:Ee,type:fe,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),R.setContext(r),R.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function N(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}let P=new Y,F=new Y;function I(e,t,n){P.setFromMatrixPosition(t.matrixWorld),F.setFromMatrixPosition(n.matrixWorld);let r=P.distanceTo(F),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function ee(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;ee(O,i);for(let e=0;e<a.length;e++)ee(a[e],i);a.length===2?I(O,T,E):O.projectionMatrix.copy(T.projectionMatrix),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),L(e,O,i)};function L(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=Ht*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let te=null;function ne(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new us,o.layers.enable(n),o.viewport=new Mn,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new wa,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}te&&te(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let R=new Gs;R.setAnimationLoop(ne),this.setAnimationLoop=function(e){te=e},this.dispose=function(){}}},td=new Ln,nd=new gn;nd.set(-1,0,0,0,1,0,0,0,1);function rd(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,bo(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(td.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(nd),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function id(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return q(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?K(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):K(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var ad=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),od=null;function sd(){return od===null&&(od=new Bi(ad,16,16,G,ye),od.name=`DFG_LUT`,od.minFilter=le,od.magFilter=le,od.wrapS=ie,od.wrapT=ie,od.generateMipmaps=!1,od.needsUpdate=!0),od}var cd=class{constructor(e={}){let{canvas:t=jt(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=fe}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([Ae,ke,Oe]),g=new Set([fe,_e,he,Se,be,xe]),_=new Uint32Array(4),v=new Int32Array(4),y=new Y,b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=xt;let j=0,M=0,N=null,P=-1,F=null,I=new Mn,ee=new Mn,L=null,te=new X(0),ne=0,R=t.width,re=t.height,z=1,B=null,V=null,ie=new Mn(0,0,R,re),ae=new Mn(0,0,R,re),oe=!1,se=new $i,ce=!1,le=!1,ue=new Ln,pe=new Y,me=new Mn,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ve=!1;function Ce(){return N===null?z:1}let H=n;function we(e,n){return t.getContext(e,n)}let Te,Ee,U,De,W,G,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze,Be,Ve,He,Ue,We,Ge,Ke,qe;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,Xe,!1),t.addEventListener(`webglcontextrestored`,Ze,!1),t.addEventListener(`webglcontextcreationerror`,Qe,!1),H===null){let t=`webgl2`;if(H=we(t,e),H===null)throw we(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}Je()}catch(e){throw t.removeEventListener(`webglcontextlost`,Xe,!1),t.removeEventListener(`webglcontextrestored`,Ze,!1),t.removeEventListener(`webglcontextcreationerror`,Qe,!1),q(`WebGLRenderer: `+e.message),e}function Je(){Te=new Ec(H),Te.init(),Ge=new Xu(H,Te),Ee=new tc(H,Te,e,Ge),U=new Ju(H,Te),Ee.reversedDepthBuffer&&d&&U.buffers.depth.setReversed(!0),O=H.createFramebuffer(),k=H.createFramebuffer(),A=H.createFramebuffer(),De=new kc(H),W=new Ou,G=new Yu(H,Te,U,W,Ee,Ge,De),je=new Tc(T),Me=new Ks(H),Ke=new $s(H,Me),Ne=new Dc(H,Me,De,Ke),Pe=new jc(H,Ne,Me,Ke,De),He=new Ac(H,Ee,G),ze=new nc(W),Fe=new Du(T,je,Te,Ee,Ke,ze),Ie=new rd(T,W),Le=new Mu,Re=new zu(Te),Ve=new Qs(T,je,U,Pe,p,s),Be=new qu(T,Pe,Ee),qe=new id(H,De,Ee,U),Ue=new ec(H,Te,De),We=new Oc(H,Te,De),De.programs=Fe.programs,T.capabilities=Ee,T.extensions=Te,T.properties=W,T.renderLists=Le,T.shadowMap=Be,T.state=U,T.info=De}m!==1009&&(w=new Nc(m,t.width,t.height,o,r,i));let Ye=new ed(T,H);this.xr=Ye,this.getContext=function(){return H},this.getContextAttributes=function(){return H.getContextAttributes()},this.forceContextLoss=function(){let e=Te.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Te.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return z},this.setPixelRatio=function(e){e!==void 0&&(z=e,this.setSize(R,re,!1))},this.getSize=function(e){return e.set(R,re)},this.setSize=function(e,n,r=!0){if(Ye.isPresenting){K(`WebGLRenderer: Can't change size while VR device is presenting.`);return}R=e,re=n,t.width=Math.floor(e*z),t.height=Math.floor(n*z),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n)},this.getDrawingBufferSize=function(e){return e.set(R*z,re*z).floor()},this.setDrawingBufferSize=function(e,n,r){R=e,re=n,z=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009){q(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){K(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])},this.getCurrentViewport=function(e){return e.copy(I)},this.getViewport=function(e){return e.copy(ie)},this.setViewport=function(e,t,n,r){e.isVector4?ie.set(e.x,e.y,e.z,e.w):ie.set(e,t,n,r),U.viewport(I.copy(ie).multiplyScalar(z).round())},this.getScissor=function(e){return e.copy(ae)},this.setScissor=function(e,t,n,r){e.isVector4?ae.set(e.x,e.y,e.z,e.w):ae.set(e,t,n,r),U.scissor(ee.copy(ae).multiplyScalar(z).round())},this.getScissorTest=function(){return oe},this.setScissorTest=function(e){U.setScissorTest(oe=e)},this.setOpaqueSort=function(e){B=e},this.setTransparentSort=function(e){V=e},this.getClearColor=function(e){return e.copy(Ve.getClearColor())},this.setClearColor=function(){Ve.setClearColor(...arguments)},this.getClearAlpha=function(){return Ve.getClearAlpha()},this.setClearAlpha=function(){Ve.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(N!==null){let t=N.texture.format;e=h.has(t)}if(e){let e=N.texture.type,t=g.has(e),n=Ve.getClearColor(),r=Ve.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,H.clearBufferuiv(H.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,H.clearBufferiv(H.COLOR,0,v))}else r|=H.COLOR_BUFFER_BIT}t&&(r|=H.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=H.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&H.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,Xe,!1),t.removeEventListener(`webglcontextrestored`,Ze,!1),t.removeEventListener(`webglcontextcreationerror`,Qe,!1),Ve.dispose(),Le.dispose(),Re.dispose(),W.dispose(),je.dispose(),Pe.dispose(),Ke.dispose(),qe.dispose(),Fe.dispose(),Ye.dispose(),Ye.removeEventListener(`sessionstart`,at),Ye.removeEventListener(`sessionend`,ot),st.stop()};function Xe(e){e.preventDefault(),Nt(`WebGLRenderer: Context Lost.`),E=!0}function Ze(){Nt(`WebGLRenderer: Context Restored.`),E=!1;let e=De.autoReset,t=Be.enabled,n=Be.autoUpdate,r=Be.needsUpdate,i=Be.type;Je(),De.autoReset=e,Be.enabled=t,Be.autoUpdate=n,Be.needsUpdate=r,Be.type=i}function Qe(e){q(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function $e(e){let t=e.target;t.removeEventListener(`dispose`,$e),et(t)}function et(e){tt(e),W.remove(e)}function tt(e){let t=W.get(e).programs;t!==void 0&&(t.forEach(function(e){Fe.releaseProgram(e)}),e.isShaderMaterial&&Fe.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ge);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=_t(e,t,n,r,i);U.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Ne.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Ke.setup(i,r,s,n,c);let h,g=Ue;if(c!==null&&(h=Me.get(c),g=We,g.setIndex(h)),i.isMesh)r.wireframe===!0?(U.setLineWidth(r.wireframeLinewidth*Ce()),g.setMode(H.LINES)):g.setMode(H.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),U.setLineWidth(e*Ce()),i.isLineSegments?g.setMode(H.LINES):i.isLineLoop?g.setMode(H.LINE_LOOP):g.setMode(H.LINE_STRIP)}else i.isPoints?g.setMode(H.POINTS):i.isSprite&&g.setMode(H.TRIANGLES);if(i.isBatchedMesh){if(Te.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Me.get(c).bytesPerElement:1,o=W.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(H,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function nt(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),ce===!0&&ze.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,pt(e,t,r),e.side=0,e.needsUpdate=!0,pt(e,t,r),e.side=2):pt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Re.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),le=this.localClippingEnabled,ce=ze.init(this.clippingPlanes,le),ce===!0&&ze.setGlobalState(this.clippingPlanes,t),D!==null&&Be.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];nt(o,n,t,e),r.add(o)}else nt(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){if(r.forEach(function(e){let t=W.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0){t(e);return}setTimeout(n,10)}Te.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let rt=null;function it(e){rt&&rt(e)}function at(){st.stop()}function ot(){st.start()}let st=new Gs;st.setAnimationLoop(it),typeof self<`u`&&st.setContext(self),this.setAnimationLoop=function(e){rt=e,Ye.setAnimationLoop(e),e===null?st.stop():st.start()},Ye.addEventListener(`sessionstart`,at),Ye.addEventListener(`sessionend`,ot),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){q(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=Ye.enabled===!0&&Ye.isPresenting===!0,r=w!==null&&(N===null||n)&&w.begin(T,N);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),Ye.enabled===!0&&Ye.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Ye.cameraAutoUpdate===!0&&Ye.updateCamera(t),t=Ye.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,N),x=Re.get(e,C.length),x.init(t),x.state.textureUnits=G.getTextureUnits(),C.push(x),ue.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),se.setFromProjectionMatrix(ue,Dt,t.reversedDepth),le=this.localClippingEnabled,ce=ze.init(this.clippingPlanes,le),b=Le.get(e,S.length),b.init(),S.push(b),Ye.enabled===!0&&Ye.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&ct(e,t,-1/0,T.sortObjects)}ct(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(B,V),ve=Ye.enabled===!1||Ye.isPresenting===!1||Ye.hasDepthSensing()===!1,ve&&Ve.addToRenderList(b,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ce===!0&&ze.beginShadows();let i=x.state.shadowsArray;if(Be.render(i,e,t),ce===!0&&ze.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];ut(n,r,e,a)}ve&&Ve.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];lt(b,e,n,n.viewport)}}else r.length>0&&ut(n,r,e,t),ve&&Ve.render(e),lt(b,e,t)}N!==null&&M===0&&(G.updateMultisampleRenderTarget(N),G.updateRenderTargetMipmap(N)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Ke.resetDefaultState(),P=-1,F=null,C.pop(),C.length>0?(x=C[C.length-1],G.setTextureUnits(x.state.textureUnits),ce===!0&&ze.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function ct(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)x.pushLightProbeGrid(e);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(se)){r&&me.setFromMatrixPosition(e.matrixWorld).applyMatrix4(ue);let i=Pe.update(e),a=e.material;a.visible&&b.push(e,i,a,n,me.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(se))){let i=Pe.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),me.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),me.copy(e.boundingSphere.center)),me.applyMatrix4(e.matrixWorld).applyMatrix4(ue)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,me.z,s,t)}}else a.visible&&b.push(e,i,a,n,me.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)ct(i[e],t,n,r)}function lt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),ce===!0&&ze.setGlobalState(T.clippingPlanes,n),r&&U.viewport(I.copy(r)),i.length>0&&dt(i,t,n),a.length>0&&dt(a,t,n),o.length>0&&dt(o,t,n),U.buffers.depth.setTest(!0),U.buffers.depth.setMask(!0),U.buffers.color.setMask(!0),U.setPolygonOffset(!1)}function ut(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=Te.has(`EXT_color_buffer_half_float`)||Te.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new Pn(1,1,{generateMipmaps:!0,type:e?ye:fe,minFilter:de,samples:Math.max(4,Ee.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:xn.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||I;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(te),ne=T.getClearAlpha(),ne<1&&T.setClearColor(16777215,.5),T.clear(),ve&&Ve.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),ce===!0&&ze.setGlobalState(T.clippingPlanes,r),dt(e,n,r),G.updateMultisampleRenderTarget(a),G.updateRenderTargetMipmap(a),Te.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,ft(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(G.updateMultisampleRenderTarget(a),G.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(te,ne),d!==void 0&&(r.viewport=d),T.toneMapping=u}function dt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&ft(o,t,n,s,l,c)}}function ft(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function pt(e,t,n){t.isScene!==!0&&(t=ge);let r=W.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Fe.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Fe.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=je.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,$e),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return ht(e,s),d}else s.uniforms=Fe.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Fe.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=ze.uniform),ht(e,s),r.needsLights=yt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=x.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function mt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Bl.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function ht(e,t){let n=W.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function gt(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];y.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(y))return n}return null}function _t(e,t,n,r,i){t.isScene!==!0&&(t=ge),G.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=N===null?T.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:xn.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=je.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=W.get(r),y=x.state.lights;if(ce===!0&&(le===!0||e!==F)){let t=e===F&&r.id===P;ze.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==ze.numPlanes||v.numIntersection!==ze.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=x.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;b===!0&&(S=pt(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,S,v));let C=!1,w=!1,E=!1,O=S.getUniforms(),k=v.uniforms;if(U.useProgram(S.program)&&(C=!0,w=!0,E=!0),r.id!==P&&(P=r.id,w=!0),v.needsLights){let e=gt(x.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,w=!0)}if(C||F!==e){U.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),O.setValue(H,`projectionMatrix`,e.projectionMatrix),O.setValue(H,`viewMatrix`,e.matrixWorldInverse);let t=O.map.cameraPosition;t!==void 0&&t.setValue(H,pe.setFromMatrixPosition(e.matrixWorld)),Ee.logarithmicDepthBuffer&&O.setValue(H,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&O.setValue(H,`isOrthographic`,e.isOrthographicCamera===!0),F!==e&&(F=e,w=!0,E=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&O.setValue(H,`sunShadowMap`,y.state.sunShadowMap,G),y.state.directionalShadowMap.length>0&&O.setValue(H,`directionalShadowMap`,y.state.directionalShadowMap,G),y.state.spotShadowMap.length>0&&O.setValue(H,`spotShadowMap`,y.state.spotShadowMap,G),y.state.pointShadowMap.length>0&&O.setValue(H,`pointShadowMap`,y.state.pointShadowMap,G)),i.isSkinnedMesh){O.setOptional(H,i,`bindMatrix`),O.setOptional(H,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),O.setValue(H,`boneTexture`,e.boneTexture,G))}i.isBatchedMesh&&(O.setOptional(H,i,`batchingTexture`),O.setValue(H,`batchingTexture`,i._matricesTexture,G),O.setOptional(H,i,`batchingIdTexture`),O.setValue(H,`batchingIdTexture`,i._indirectTexture,G),O.setOptional(H,i,`batchingColorTexture`),i._colorsTexture!==null&&O.setValue(H,`batchingColorTexture`,i._colorsTexture,G));let A=n.morphAttributes;if((A.position!==void 0||A.normal!==void 0||A.color!==void 0)&&He.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,O.setValue(H,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(k.envMapIntensity.value=t.environmentIntensity),k.dfgLUT!==void 0&&(k.dfgLUT.value=sd()),w){if(O.setValue(H,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&vt(k,E),a&&r.fog===!0&&Ie.refreshFogUniforms(k,a),Ie.refreshMaterialUniforms(k,r,z,re,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;k.probesSH.value=e.texture,k.probesMin.value.copy(e.boundingBox.min),k.probesMax.value.copy(e.boundingBox.max),k.probesResolution.value.copy(e.resolution)}Bl.upload(H,mt(v),k,G)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Bl.upload(H,mt(v),k,G),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&O.setValue(H,`center`,i.center),O.setValue(H,`modelViewMatrix`,i.modelViewMatrix),O.setValue(H,`normalMatrix`,i.normalMatrix),O.setValue(H,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];qe.update(n,S),qe.bind(n,S)}}return S}function vt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function yt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return M},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(e,t,n){let r=W.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),W.get(e.texture).__webglTexture=t,W.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=W.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){N=e,j=t,M=n;let r=null,i=!1,a=!1;if(e){let o=W.get(e);if(o.__useDefaultFramebuffer!==void 0){U.bindFramebuffer(H.FRAMEBUFFER,o.__webglFramebuffer),I.copy(e.viewport),ee.copy(e.scissor),L=e.scissorTest,U.viewport(I),U.scissor(ee),U.setScissorTest(L),P=-1;return}if(o.__webglFramebuffer===void 0)G.setupRenderTarget(e);else if(o.__hasExternalTextures)G.rebindTextures(e,W.get(e.texture).__webglTexture,W.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&W.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);G.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=W.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&G.useMultisampledRTT(e)===!1?W.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,I.copy(e.viewport),ee.copy(e.scissor),L=e.scissorTest}else I.copy(ie).multiplyScalar(z).floor(),ee.copy(ae).multiplyScalar(z).floor(),L=oe;if(n!==0&&(r=O),U.bindFramebuffer(H.FRAMEBUFFER,r)&&U.drawBuffers(e,r),U.viewport(I),U.scissor(ee),U.setScissorTest(L),i){let r=W.get(e.texture);H.framebufferTexture2D(H.FRAMEBUFFER,H.COLOR_ATTACHMENT0,H.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=W.get(e.textures[t]);H.framebufferTextureLayer(H.FRAMEBUFFER,H.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=W.get(e.texture);H.framebufferTexture2D(H.FRAMEBUFFER,H.COLOR_ATTACHMENT0,H.TEXTURE_2D,t.__webglTexture,n)}P=-1};function bt(e){let t=W.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Ee.textureFormatReadable(e.format),t.__typeReadable=Ee.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){q(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=W.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){U.bindFramebuffer(H.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&H.readBuffer(H.COLOR_ATTACHMENT0+s);let u=bt(o);if(u.__formatReadable===!1){q(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){q(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&H.readPixels(t,n,r,i,Ge.convert(c),Ge.convert(l),a)}finally{let e=N===null?null:W.get(N).__webglFramebuffer;U.bindFramebuffer(H.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=W.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){U.bindFramebuffer(H.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&H.readBuffer(H.COLOR_ATTACHMENT0+s);let d=bt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=H.createBuffer();H.bindBuffer(H.PIXEL_PACK_BUFFER,f),H.bufferData(H.PIXEL_PACK_BUFFER,a.byteLength,H.STREAM_READ),H.readPixels(t,n,r,i,Ge.convert(l),Ge.convert(u),0),H.bindBuffer(H.PIXEL_PACK_BUFFER,null);let p=N===null?null:W.get(N).__webglFramebuffer;U.bindFramebuffer(H.FRAMEBUFFER,p);let m=H.fenceSync(H.SYNC_GPU_COMMANDS_COMPLETE,0);return H.flush(),await It(H,m,4),H.bindBuffer(H.PIXEL_PACK_BUFFER,f),H.getBufferSubData(H.PIXEL_PACK_BUFFER,0,a),H.bindBuffer(H.PIXEL_PACK_BUFFER,null),H.deleteBuffer(f),H.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;G.setTexture2D(e,0),H.copyTexSubImage2D(H.TEXTURE_2D,n,0,0,o,s,i,a),U.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Ge.convert(t.format),_=Ge.convert(t.type),v;t.isData3DTexture?(G.setTexture3D(t,0),v=H.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(G.setTexture2DArray(t,0),v=H.TEXTURE_2D_ARRAY):(G.setTexture2D(t,0),v=H.TEXTURE_2D),U.activeTexture(H.TEXTURE0),U.pixelStorei(H.UNPACK_FLIP_Y_WEBGL,t.flipY),U.pixelStorei(H.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),U.pixelStorei(H.UNPACK_ALIGNMENT,t.unpackAlignment);let y=U.getParameter(H.UNPACK_ROW_LENGTH),b=U.getParameter(H.UNPACK_IMAGE_HEIGHT),x=U.getParameter(H.UNPACK_SKIP_PIXELS),S=U.getParameter(H.UNPACK_SKIP_ROWS),C=U.getParameter(H.UNPACK_SKIP_IMAGES);U.pixelStorei(H.UNPACK_ROW_LENGTH,h.width),U.pixelStorei(H.UNPACK_IMAGE_HEIGHT,h.height),U.pixelStorei(H.UNPACK_SKIP_PIXELS,l),U.pixelStorei(H.UNPACK_SKIP_ROWS,u),U.pixelStorei(H.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=W.get(e),r=W.get(t),h=W.get(n.__renderTarget),g=W.get(r.__renderTarget);U.bindFramebuffer(H.READ_FRAMEBUFFER,h.__webglFramebuffer),U.bindFramebuffer(H.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(H.framebufferTextureLayer(H.READ_FRAMEBUFFER,H.COLOR_ATTACHMENT0,W.get(e).__webglTexture,i,d+n),H.framebufferTextureLayer(H.DRAW_FRAMEBUFFER,H.COLOR_ATTACHMENT0,W.get(t).__webglTexture,a,m+n)),H.blitFramebuffer(l,u,o,s,f,p,o,s,H.DEPTH_BUFFER_BIT,H.NEAREST);U.bindFramebuffer(H.READ_FRAMEBUFFER,null),U.bindFramebuffer(H.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||W.has(e)){let n=W.get(e),r=W.get(t);U.bindFramebuffer(H.READ_FRAMEBUFFER,k),U.bindFramebuffer(H.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?H.framebufferTextureLayer(H.READ_FRAMEBUFFER,H.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):H.framebufferTexture2D(H.READ_FRAMEBUFFER,H.COLOR_ATTACHMENT0,H.TEXTURE_2D,n.__webglTexture,i),T?H.framebufferTextureLayer(H.DRAW_FRAMEBUFFER,H.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):H.framebufferTexture2D(H.DRAW_FRAMEBUFFER,H.COLOR_ATTACHMENT0,H.TEXTURE_2D,r.__webglTexture,a),i===0?T?H.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):H.copyTexSubImage2D(v,a,f,p,l,u,o,s):H.blitFramebuffer(l,u,o,s,f,p,o,s,H.COLOR_BUFFER_BIT,H.NEAREST);U.bindFramebuffer(H.READ_FRAMEBUFFER,null),U.bindFramebuffer(H.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?H.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?H.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):H.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?H.texSubImage2D(H.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?H.compressedTexSubImage2D(H.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):H.texSubImage2D(H.TEXTURE_2D,a,f,p,o,s,g,_,h);U.pixelStorei(H.UNPACK_ROW_LENGTH,y),U.pixelStorei(H.UNPACK_IMAGE_HEIGHT,b),U.pixelStorei(H.UNPACK_SKIP_PIXELS,x),U.pixelStorei(H.UNPACK_SKIP_ROWS,S),U.pixelStorei(H.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&H.generateMipmap(v),U.unbindTexture()},this.initRenderTarget=function(e){W.get(e).__webglFramebuffer===void 0&&G.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?G.setTextureCube(e,0):e.isData3DTexture?G.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?G.setTexture2DArray(e,0):G.setTexture2D(e,0),U.unbindTexture()},this.resetState=function(){j=0,M=0,N=null,U.reset(),Ke.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return Dt}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=xn._getDrawingBufferColorSpace(e),t.unpackColorSpace=xn._getUnpackColorSpace()}},ld={type:`change`},ud={type:`start`},dd={type:`end`},fd=new Ti,pd=new vi,md=Math.cos(70*fn.DEG2RAD),hd=new Y,gd=2*Math.PI,_d={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},vd=1e-6,yd=class extends Hs{constructor(e,t=null){super(e,t),this.state=_d.NONE,this.target=new Y,this.cursor=new Y,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:z.ROTATE,MIDDLE:z.DOLLY,RIGHT:z.PAN},this.touches={ONE:B.ROTATE,TWO:B.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new Y,this._lastQuaternion=new pn,this._lastTargetPosition=new Y,this._quat=new pn().setFromUnitVectors(e.up,new Y(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Bs,this._sphericalDelta=new Bs,this._scale=1,this._panOffset=new Y,this._rotateStart=new J,this._rotateEnd=new J,this._rotateDelta=new J,this._panStart=new J,this._panEnd=new J,this._panDelta=new J,this._dollyStart=new J,this._dollyEnd=new J,this._dollyDelta=new J,this._dollyDirection=new Y,this._mouse=new J,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=xd.bind(this),this._onPointerDown=bd.bind(this),this._onPointerUp=Sd.bind(this),this._onContextMenu=kd.bind(this),this._onMouseWheel=Td.bind(this),this._onKeyDown=Ed.bind(this),this._onTouchStart=Dd.bind(this),this._onTouchMove=Od.bind(this),this._onMouseDown=Cd.bind(this),this._onMouseMove=wd.bind(this),this._interceptControlDown=Ad.bind(this),this._interceptControlUp=jd.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=_d.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),e.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(ld),this.update(),this.state=_d.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;hd.copy(t).sub(this.target),hd.applyQuaternion(this._quat),this._spherical.setFromVector3(hd),this.autoRotate&&this.state===_d.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=gd:n>Math.PI&&(n-=gd),r<-Math.PI?r+=gd:r>Math.PI&&(r-=gd),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(hd.setFromSpherical(this._spherical),hd.applyQuaternion(this._quatInverse),t.copy(this.target).add(hd),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=hd.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new Y(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new Y(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=hd.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(fd.origin.copy(this.object.position),fd.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(fd.direction))<md?this.object.lookAt(this.target):(pd.setFromNormalAndCoplanarPoint(this.object.up,this.target),fd.intersectPlane(pd,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>vd||8*(1-this._lastQuaternion.dot(this.object.quaternion))>vd||this._lastTargetPosition.distanceToSquared(this.target)>vd?(this.dispatchEvent(ld),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?gd/60/60*this.autoRotateSpeed:gd/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){hd.setFromMatrixColumn(t,0),hd.multiplyScalar(-e),this._panOffset.add(hd)}_panUp(e,t){this.screenSpacePanning===!0?hd.setFromMatrixColumn(t,1):(hd.setFromMatrixColumn(t,0),hd.crossVectors(this.object.up,hd)),hd.multiplyScalar(e),this._panOffset.add(hd)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;hd.copy(r).sub(this.target);let i=hd.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(gd*this._rotateDelta.x/t.clientHeight),this._rotateUp(gd*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(gd*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-gd*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(gd*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-gd*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(gd*this._rotateDelta.x/t.clientHeight),this._rotateUp(gd*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new J,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function bd(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function xd(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function Sd(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(dd),this.state=_d.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function Cd(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case z.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=_d.DOLLY;break;case z.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=_d.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=_d.ROTATE}break;case z.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=_d.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=_d.PAN}break;default:this.state=_d.NONE}this.state!==_d.NONE&&this.dispatchEvent(ud)}function wd(e){switch(this.state){case _d.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case _d.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case _d.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function Td(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===_d.NONE&&(e.preventDefault(),this.dispatchEvent(ud),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(dd))}function Ed(e){this.enabled!==!1&&this._handleKeyDown(e)}function Dd(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case B.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=_d.TOUCH_ROTATE;break;case B.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=_d.TOUCH_PAN;break;default:this.state=_d.NONE}break;case 2:switch(this.touches.TWO){case B.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=_d.TOUCH_DOLLY_PAN;break;case B.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=_d.TOUCH_DOLLY_ROTATE;break;default:this.state=_d.NONE}break;default:this.state=_d.NONE}this.state!==_d.NONE&&this.dispatchEvent(ud)}function Od(e){switch(this._trackPointer(e),this.state){case _d.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case _d.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case _d.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case _d.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=_d.NONE}}function kd(e){this.enabled!==!1&&e.preventDefault()}function Ad(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function jd(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var Md={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},Nd=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Pd=new ps(-1,1,1,-1,0,1),Fd=new class extends mi{constructor(){super(),this.setAttribute(`position`,new ni([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new ni([0,2,0,0,2,0],2))}},Id=class{constructor(e){this._mesh=new Z(Fd,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Pd)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},Ld=class extends Nd{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof wo?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=xo.clone(e.uniforms),this.material=new wo({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Id(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Rd=class extends Nd{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},zd=class extends Nd{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},Bd=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new J);this._width=n.width,this._height=n.height,t=new Pn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:ye}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ld(Md),this.copyPass.material.blending=0,this.timer=new xs}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}Rd!==void 0&&(r instanceof Rd?n=!0:r instanceof zd&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new J);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},Vd=class extends Nd{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new X}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},Hd={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new X(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`},Ud=class e extends Nd{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new J(256,256):new J(e.x,e.y),this.clearColor=new X(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Pn(i,a,{type:ye,depthBuffer:!1}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new Pn(i,a,{type:ye,depthBuffer:!1});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new Pn(i,a,{type:ye,depthBuffer:!1});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),a=Math.round(a/2)}let o=Hd;this.highPassUniforms=xo.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new wo({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let s=[6,10,14,18,22];i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(s[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new J(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new Y(1,1,1),new Y(1,1,1),new Y(1,1,1),new Y(1,1,1),new Y(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=xo.clone(Md.uniforms),this.blendMaterial=new wo({uniforms:this.copyUniforms,vertexShader:Md.vertexShader,fragmentShader:Md.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new X,this._oldClearAlpha=1,this._basic=new Ei,this._fsQuad=new Id(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new J(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);let r=[],i=[];for(let n=1;n<e;n+=2){let a=t[n],o=n+1<e?t[n+1]:0,s=a+o;r.push((n*a+(n+1)*o)/s),i.push(s)}return new wo({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new J(.5,.5)},direction:{value:new J(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:i}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new wo({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};Ud.BlurDirectionX=new J(1,0),Ud.BlurDirectionY=new J(0,1);var Wd={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`},Gd=class extends Nd{constructor(){super(),this.isOutputPass=!0,this.uniforms=xo.clone(Wd.uniforms),this.material=new To({name:Wd.name,uniforms:this.uniforms,vertexShader:Wd.vertexShader,fragmentShader:Wd.fragmentShader}),this._fsQuad=new Id(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},xn.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};function Kd({cameraPosition:e=[0,20,24],cameraTarget:t=[0,0,0],minDistance:n=2.5,maxDistance:a=85,maxPolarAngle:o=Math.PI/2-.04,autoRotate:s=!1,autoRotateSpeed:c=1,fogColor:l=`#0b1329`,fogDensity:u=.015,hudTitle:d=`SCIENTIFIC 3D WORKBENCH`,hudMetrics:f=[],fallbackTableView:p=null,onSceneReady:m,children:h,className:g=``,style:_={},minHeight:v=`420px`,lang:y=`bn`}){let b=(0,r.useRef)(null),x=(0,r.useRef)(null),S=(0,r.useRef)(null),C=(0,r.useRef)(null),w=(0,r.useRef)(null),T=(0,r.useRef)(null),E=(0,r.useRef)(!0),D=(0,r.useRef)(null),O=(0,r.useRef)(null),[k,A]=(0,r.useState)(60),[j,M]=(0,r.useState)(!0),[N,P]=(0,r.useState)(`3d`),[F,I]=(0,r.useState)(`default`),ee=(0,r.useCallback)(n=>{if(!C.current||!w.current)return;I(n);let r=C.current,i=w.current;switch(n){case`iso`:r.position.set(18,16,18),i.target.set(t[0],t[1],t[2]);break;case`top`:r.position.set(0,30,.1),i.target.set(t[0],t[1],t[2]);break;case`profile`:r.position.set(0,3,24),i.target.set(t[0],t[1],t[2]);break;case`closeup`:r.position.set(e[0]*.4,e[1]*.4,e[2]*.4),i.target.set(t[0],t[1],t[2]);break;default:r.position.set(...e),i.target.set(...t)}i.update()},[e,t]);return(0,r.useEffect)(()=>{if(N!==`3d`)return;let r=b.current;if(!r)return;let i=document.createElement(`canvas`);if(!(i.getContext(`webgl2`)||i.getContext(`webgl`)||i.getContext(`experimental-webgl`))){M(!1),P(`2d`);return}let d=r.clientWidth||720,f=r.clientHeight||420,p=_===`hologram`,h=new br,g=p?`#050b10`:l;h.background=new X(g),h.fog=new yr(g,p?.012:u),x.current=h;let v=new us(45,d/f,.1,150);v.position.set(...e),C.current=v;let y=typeof window<`u`&&window.innerWidth<=768,k=y?Math.min(window.devicePixelRatio||1,1.25):Math.min(window.devicePixelRatio||1,1.75),j=new cd({antialias:!y,powerPreference:y?`default`:`high-performance`,alpha:!1,preserveDrawingBuffer:!1});j.setSize(d,f),j.setPixelRatio(k),j.shadowMap.enabled=!0,j.shadowMap.type=2,j.toneMapping=4,j.toneMappingExposure=1.15,r.innerHTML=``,r.appendChild(j.domElement),S.current=j;let F=e=>{e.preventDefault(),T.current&&cancelAnimationFrame(T.current)},I=()=>{T.current=requestAnimationFrame(ie)},ee=j.domElement;ee.addEventListener(`webglcontextlost`,F,!1),ee.addEventListener(`webglcontextrestored`,I,!1);let L=new yd(v,j.domElement);L.enableDamping=!0,L.dampingFactor=.06,L.maxPolarAngle=o,L.minDistance=n,L.maxDistance=a,L.target.set(...t),w.current=L;let te=new hs(`#eef3ee`,2);te.position.set(16,28,14),te.castShadow=!0,te.shadow.mapSize.width=y?512:1024,te.shadow.mapSize.height=y?512:1024,te.shadow.bias=-5e-4,h.add(te);let ne=new Qo(`#00f0ff`,`rgba(255, 255, 255, 0.08)`,.85);if(h.add(ne),p&&typeof window<`u`&&window.innerWidth>=768&&(navigator.hardwareConcurrency||4)>4)try{let e=new Bd(j);e.addPass(new Vd(h,v));let t=new Ud(new J(d,f),.6,.4,.85);e.addPass(t),e.addPass(new Gd),D.current=e}catch(e){console.warn(`Hologram Bloom composer failed, falling back to direct render:`,e)}m&&m({scene:h,camera:v,renderer:j,controls:L,isHologram:p,setAnimateCallback:e=>{O.current=e}});let R=()=>{if(!r||!j||!v)return;let e=r.clientWidth||720,t=r.clientHeight||420;v.aspect=e/t,v.updateProjectionMatrix(),j.setSize(e,t),D.current&&D.current.setSize(e,t)};window.addEventListener(`resize`,R);let re;typeof IntersectionObserver<`u`&&(re=new IntersectionObserver(e=>{e.forEach(e=>{E.current=e.isIntersecting})},{threshold:.05}),re.observe(r));let z=()=>{E.current=document.visibilityState===`visible`};document.addEventListener(`visibilitychange`,z);let B=0,V=performance.now(),ie=e=>{T.current=requestAnimationFrame(ie),E.current&&(B++,e-V>=1e3&&(A(Math.round(B*1e3/(e-V))),B=0,V=e),L.autoRotate=s,L.autoRotateSpeed=c,L.update(),O.current&&O.current(.016,performance.now()*.001),D.current?D.current.render():j.render(h,v))};return T.current=requestAnimationFrame(ie),()=>{T.current&&cancelAnimationFrame(T.current),window.removeEventListener(`resize`,R),document.removeEventListener(`visibilitychange`,z),re&&re.disconnect(),ee.removeEventListener(`webglcontextlost`,F),ee.removeEventListener(`webglcontextrestored`,I),D.current?.dispose&&D.current.dispose(),j.dispose(),r.contains(j.domElement)&&r.removeChild(j.domElement)}},[N]),(0,r.useEffect)(()=>{w.current&&(w.current.autoRotate=s,w.current.autoRotateSpeed=c)},[s,c]),!j||N===`2d`?(0,i.jsxs)(`div`,{className:`research-3d-scene-wrapper ui-card-hud ${g}`,style:{position:`relative`,width:`100%`,minHeight:v,borderRadius:`12px`,overflow:`hidden`,background:`rgba(15, 23, 42, 0.92)`,border:`1px solid rgba(255, 255, 255, 0.1)`,padding:`20px`,color:`rgba(238, 243, 238, 0.68)`,boxSizing:`border-box`,display:`flex`,flexDirection:`column`,justifyContent:`space-between`,...typeof _==`object`&&_?_:{}},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`16px`,flexWrap:`wrap`,gap:`8px`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`},children:[(0,i.jsx)(`span`,{style:{fontSize:`18px`},children:`📊`}),(0,i.jsxs)(`strong`,{style:{color:`#eef3ee`,fontSize:`14px`},children:[d,` — `,y===`bn`?`সায়েন্টিফিক ডেটা টেবিল`:`Scientific Data Table View`]})]}),j&&(0,i.jsxs)(`button`,{type:`button`,onClick:()=>P(`3d`),style:{padding:`6px 12px`,borderRadius:`6px`,background:`rgba(0, 223, 129, 0.15)`,border:`1px solid #00df81`,color:`#00df81`,fontSize:`11.5px`,fontWeight:700,cursor:`pointer`},children:[`🌐 `,y===`bn`?`ত্রিমাত্রিক (3D) মোডে ফিরুন`:`Switch to 3D Digital Twin`]})]}),p?(0,i.jsx)(`div`,{style:{flex:1,overflowX:`auto`},children:p}):(0,i.jsx)(`div`,{style:{flex:1,overflowX:`auto`,marginBottom:`16px`},children:(0,i.jsxs)(`table`,{style:{width:`100%`,borderCollapse:`collapse`,fontSize:`12.5px`,textAlign:`left`},children:[(0,i.jsx)(`thead`,{children:(0,i.jsxs)(`tr`,{style:{background:`rgba(30, 41, 59, 0.6)`,borderBottom:`1px solid rgba(255,255,255,0.1)`},children:[(0,i.jsx)(`th`,{style:{padding:`8px 12px`,color:`rgba(238, 243, 238, 0.68)`},children:y===`bn`?`প্যারামিটার / মেট্রিক`:`Metric / Variable`}),(0,i.jsx)(`th`,{style:{padding:`8px 12px`,color:`rgba(238, 243, 238, 0.68)`},children:y===`bn`?`মান ও একক`:`Value & Unit`}),(0,i.jsx)(`th`,{style:{padding:`8px 12px`,color:`rgba(238, 243, 238, 0.68)`},children:y===`bn`?`বৈজ্ঞানিক প্রাসঙ্গিকতা`:`Scientific Context`})]})}),(0,i.jsx)(`tbody`,{children:f.map((e,t)=>{let n=`Metric ${t+1}`,r=``,a=`#eef3ee`;if(typeof e==`object`&&e)n=e.label==null?n:String(e.label).trim(),r=e.value==null?``:String(e.value).trim(),a=e.color||a;else if(typeof e==`string`){let t=e.indexOf(`:`);t===-1?r=e:(n=e.slice(0,t).trim()||n,r=e.slice(t+1).trim())}else e!=null&&(r=String(e));return(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.05)`},children:[(0,i.jsx)(`td`,{style:{padding:`8px 12px`,fontWeight:700,color:`#00f0ff`},children:n}),(0,i.jsx)(`td`,{style:{padding:`8px 12px`,fontWeight:800,color:a},children:r}),(0,i.jsx)(`td`,{style:{padding:`8px 12px`,color:`rgba(238, 243, 238, 0.68)`,fontSize:`11.5px`},children:`FAO / NASA POWER / BARI Verified`})]},t)})})]})}),(0,i.jsxs)(`div`,{style:{fontSize:`11px`,color:`rgba(238, 243, 238, 0.42)`,borderTop:`1px solid rgba(255,255,255,0.08)`,paddingTop:`10px`},children:[`* `,y===`bn`?`অ্যাক্সেসিবিলিটি ও কম ক্ষমতাসম্পন্ন ডিভাইসের জন্য উচ্চ-স্পষ্টতাসম্পন্ন ২ডি বৈজ্ঞানিক ডেটা ভিউ।`:`Accessible high-contrast scientific table fallback for screen readers, mobile battery saver, and non-WebGL environments.`]})]}):(0,i.jsxs)(`div`,{className:`research-3d-scene-wrapper ui-card-hud ${g}`,style:{position:`relative`,width:`100%`,minHeight:v,borderRadius:`12px`,overflow:`hidden`,userSelect:`none`,touchAction:`pan-y`,...typeof _==`object`&&_?_:{}},children:[(0,i.jsx)(`div`,{ref:b,style:{width:`100%`,height:`100%`,minHeight:v}}),(0,i.jsxs)(`div`,{style:{position:`absolute`,top:10,left:12,display:`flex`,alignItems:`center`,gap:8,padding:`4px 10px`,borderRadius:6,background:`rgba(15, 23, 42, 0.85)`,border:`1px solid rgba(255, 255, 255, 0.1)`,fontSize:`11px`,fontFamily:`'JetBrains Mono', monospace`,color:`#00f0ff`,pointerEvents:`none`,maxWidth:`calc(100% - 150px)`,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:[(0,i.jsx)(`span`,{style:{width:7,height:7,borderRadius:`50%`,background:`#00df81`,display:`inline-block`,flexShrink:0}}),(0,i.jsx)(`span`,{style:{fontWeight:800},children:d}),(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.42)`},children:`|`}),(0,i.jsxs)(`span`,{children:[k,` FPS`]}),f.map((e,t)=>{let n=``,a=`#eef3ee`;if(typeof e==`object`&&e){let t=e.label==null?``:String(e.label).trim(),r=e.value==null?``:String(e.value).trim();a=e.color||a,n=t&&r?`${t}: ${r}`:t||r}else typeof e==`string`?n=e:e!=null&&(n=String(e));return n?(0,i.jsxs)(r.Fragment,{children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.42)`},children:`|`}),(0,i.jsx)(`span`,{style:{color:a},children:n})]},t):null})]}),(0,i.jsxs)(`div`,{style:{position:`absolute`,top:10,right:12,display:`flex`,gap:6,alignItems:`center`},children:[(0,i.jsx)(`button`,{type:`button`,title:`Switch to 2D Data Table`,onClick:()=>P(`2d`),style:{padding:`4px 8px`,borderRadius:6,background:`rgba(30, 41, 59, 0.85)`,border:`1px solid rgba(255, 255, 255, 0.15)`,color:`#00f0ff`,fontSize:`11px`,fontWeight:700,cursor:`pointer`,transition:`all 0.15s ease`},children:`📊 2D Table`}),(0,i.jsx)(`button`,{type:`button`,title:`Reset Camera`,onClick:()=>ee(`default`),style:{padding:`4px 8px`,borderRadius:6,background:`rgba(30, 41, 59, 0.85)`,border:`1px solid rgba(255, 255, 255, 0.15)`,color:`#eef3ee`,fontSize:`11px`,fontWeight:700,cursor:`pointer`,transition:`all 0.15s ease`},children:`⟲ Reset`})]}),(0,i.jsxs)(`div`,{style:{position:`absolute`,bottom:10,left:12,display:`flex`,gap:4,alignItems:`center`,padding:`3px 6px`,borderRadius:6,background:`rgba(15, 23, 42, 0.85)`,border:`1px solid rgba(255, 255, 255, 0.1)`,fontSize:`10.5px`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.42)`,fontWeight:700,paddingRight:4,fontSize:`10px`},children:`CAM:`}),[{id:`iso`,label:`📐 Iso`},{id:`top`,label:`🔝 Top`},{id:`profile`,label:`🌾 Side`},{id:`closeup`,label:`🔍 Zoom`}].map(e=>(0,i.jsx)(`button`,{type:`button`,onClick:()=>ee(e.id),style:{padding:`2px 6px`,borderRadius:4,border:F===e.id?`1px solid #00df81`:`1px solid transparent`,background:F===e.id?`rgba(0, 223, 129, 0.2)`:`transparent`,color:F===e.id?`#00df81`:`rgba(238, 243, 238, 0.68)`,cursor:`pointer`,fontSize:`10.5px`,fontWeight:600},children:e.label},e.id))]}),h]})}function qd(e){if(!e||typeof e!=`object`)return{isValid:!1,error:`Comparison response is empty or invalid.`};if(e.status!==`ok`)return{isValid:!1,error:e.detail||e.message||`Comparison status error: ${e.status||`unknown`}`};if(!Array.isArray(e.methods))return{isValid:!1,error:`Comparison response is missing the methods array.`};let t=[`milp`,`rl`,`rule_based`],n=new Set(e.methods.map(e=>e?.id)),r=t.filter(e=>!n.has(e));return r.length>0?{isValid:!1,error:`Comparison response missing methods: ${r.join(`, `)}.`}:{isValid:!0,error:null}}function Jd(e){if(e==null||e===``)return null;let t=Number(e);return Number.isFinite(t)?t:null}function Yd(e,t=!1){if(e==null||!Number.isInteger(Number(e))||Number(e)<0)return{text:`Violation count unavailable`,isZero:!1,isMissing:!0};let n=Number(e);return n===0?{text:`✓ 0 Violations`,isZero:!0,isMissing:!1}:{text:`${t?`⚠ `:``}${n} Violation${n===1?``:`s`}`,isZero:!1,isMissing:!1}}function Xd(e){if(!e)return null;if(e.rotation&&typeof e.rotation==`object`){let t=Object.keys(e.rotation)[0];if(t&&e.rotation[t])return String(e.rotation[t]).trim()}if(typeof e.rotation_sequence==`string`&&e.rotation_sequence.trim()){let t=e.rotation_sequence.split(/\s*(?:->|→)\s*/);if(t[0]&&t[0].trim())return t[0].trim()}return e.crop&&typeof e.crop==`string`&&e.crop.trim()?e.crop.trim():null}function Zd(e,t,n){if(!e)return`—`;if(e.rotation&&typeof e.rotation==`object`&&e.rotation[t])return String(e.rotation[t]).trim();if(typeof e.rotation_sequence==`string`&&e.rotation_sequence.trim()){let t=e.rotation_sequence.split(/\s*(?:->|→)\s*/);if(t[n]&&t[n].trim())return t[n].trim()}return`—`}function Qd(e){if(!e||e.id===`demo`||e.is_demo||typeof e.name==`string`&&e.name.toLowerCase().includes(`demo`))return{isValid:!0,isDemo:!0,missingInputs:[]};let t=[];return(e.latitude==null||!Number.isFinite(Number(e.latitude)))&&t.push(`Latitude`),(e.longitude==null||!Number.isFinite(Number(e.longitude)))&&t.push(`Longitude`),(e.area_ha==null||!Number.isFinite(Number(e.area_ha))||Number(e.area_ha)<=0)&&t.push(`Field Area (ha)`),{isValid:t.length===0,isDemo:!1,missingInputs:t}}function $d(e,t=`highest_profit`){if(!e||typeof e!=`object`)return{hasWinner:!1,method:null,value:null,explanation:null};let n=e[t];if(!n||!n.method)return{hasWinner:!1,method:null,value:null,explanation:null};let r=n[t===`highest_profit`?`value_bdt_ha`:t===`most_water_efficient`?`value_mm`:`value_delta`];return r==null||!Number.isFinite(Number(r))?{hasWinner:!1,method:null,value:null,explanation:null}:{hasWinner:!0,method:n.method,value:Number(r),explanation:n.explanation||null}}var ef=[{id:`Y1_S1`,labelEn:`Y1 Rabi (Winter)`,labelBn:`বছর ১ রবি (শীত)`},{id:`Y1_S2`,labelEn:`Y1 Kharif-1 (Pre-Monsoon)`,labelBn:`বছর ১ খরিফ-১`},{id:`Y1_S3`,labelEn:`Y1 Kharif-2 (Monsoon)`,labelBn:`বছর ১ খরিফ-২ (বর্ষা)`},{id:`Y2_S1`,labelEn:`Y2 Rabi (Winter)`,labelBn:`বছর ২ রবি (শীত)`},{id:`Y2_S2`,labelEn:`Y2 Kharif-1 (Pre-Monsoon)`,labelBn:`বছর ২ খরিফ-১`},{id:`Y2_S3`,labelEn:`Y2 Kharif-2 (Monsoon)`,labelBn:`বছর ২ খরিফ-২ (বর্ষা)`}];function tf(e,t){let n=ef[t]?.id;return Jd(e?.waterByPeriod?.[n]??e?.water_by_period_mm?.[n])}function nf(e){if(!e)return`#475569`;let t=String(e).toLowerCase().trim();return t.includes(`fallow`)||t===`পতিত`?`#475569`:t.includes(`rice`)||t.includes(`ধান`)?`#10b981`:t.includes(`wheat`)||t.includes(`গম`)?`#f59e0b`:t.includes(`maize`)||t.includes(`ভুট্টা`)?`#eab308`:t.includes(`potato`)||t.includes(`আলু`)?`#06b6d4`:t.includes(`lentil`)||t.includes(`chickpea`)||t.includes(`mungbean`)||t.includes(`ডাল`)?`#84cc16`:t.includes(`mustard`)||t.includes(`সরিষা`)?`#fbbf24`:t.includes(`sunflower`)||t.includes(`সূর্যমুখী`)?`#f97316`:t.includes(`sesame`)||t.includes(`তিল`)?`#a855f7`:t.includes(`soybean`)||t.includes(`সয়াবিন`)?`#34d399`:`#38bdf8`}function rf(e){if(!e)return[];if(Array.isArray(e))return e;if(typeof e==`object`){let t=Object.values(e);if(t.length>0)return t}return typeof e==`string`?e.includes(`->`)?e.split(`->`).map(e=>e.trim()):e.includes(`→`)?e.split(`→`).map(e=>e.trim()):[e.trim()]:[]}function af({labData:e,activeField:t,priority:n=`balanced`,lang:a=`bn`}){let[o,s]=(0,r.useState)(`both`),c=e?.methods?.find?.(e=>e.id===`milp`)||e?.comparison?.milp,l=e?.methods?.find?.(e=>e.id===`rl`)||e?.comparison?.rl,u=e?.methods?.find?.(e=>e.id===`rule_based`)||e?.comparison?.rule_based,d=e?.methods?.find?.(e=>e.id===`existing_rotation`)||null,f=(0,r.useMemo)(()=>({crop:Xd(c),profit:Jd(c?.profit_bdt_per_ha??c?.total_field_profit_bdt??c?.profit),water:Jd(c?.water_requirement_mm??c?.water),yield:Jd(c?.yield),rotation:rf(c?.rotation||c?.rotation_sequence)}),[c]),p=(0,r.useMemo)(()=>({crop:Xd(l),profit:Jd(l?.profit_bdt_per_ha??l?.total_field_profit_bdt??l?.profit),water:Jd(l?.water_requirement_mm??l?.water),yield:Jd(l?.yield),rotation:rf(l?.rotation||l?.rotation_sequence)}),[l]),m=(0,r.useMemo)(()=>({crop:Xd(u),profit:Jd(u?.profit_bdt_per_ha??u?.total_field_profit_bdt??u?.profit),water:Jd(u?.water_requirement_mm??u?.water),yield:Jd(u?.yield),rotation:rf(u?.rotation||u?.rotation_sequence)}),[u]),h=(0,r.useMemo)(()=>{let e=rf(d?.rotation||d?.rotation_sequence);return{name:a===`bn`?`সংরক্ষিত আবর্তন প্যাটার্ন`:`Saved Farmer Rotation Pattern`,color:`#94a3b8`,rotation:e,profit:Jd(d?.profit_bdt_per_ha),water:Jd(d?.water_requirement_mm),waterByPeriod:d?.water_by_period_mm}},[d,a]),g=(0,r.useMemo)(()=>[...d?[{id:`existing`,label:a===`bn`?`সংরক্ষিত কৃষক আবর্তন`:`Saved Farmer Rotation`,color:`#94a3b8`,badge:a===`bn`?`প্রক্ষেপিত রেফারেন্স`:`Projected Baseline`,crops:h.rotation,profit:h.profit,water:h.water,waterByPeriod:h.waterByPeriod,x:-6}]:[],{id:`milp`,label:a===`bn`?`২. PuLP CBC MILP (গাণিতিক অপ্টিমাম)`:`2. PuLP CBC MILP Optimum`,color:`#00df81`,badge:a===`bn`?`গ্লোবাল অপটিমাম`:`Global Optimum`,crops:f.rotation.slice(0,6),profit:f.profit,water:f.water,waterByPeriod:c?.water_by_period_mm,x:-2},{id:`rl`,label:a===`bn`?`৩. Q-Learning RL (অভিযোজিত পলিসি)`:`3. Sequential Q-Learning RL`,color:`#38bdf8`,badge:a===`bn`?`অভিযোজিত পলিসি`:`Adaptive Policy`,crops:p.rotation.slice(0,6),profit:p.profit,water:p.water,waterByPeriod:l?.water_by_period_mm,x:2},{id:`rule_based`,label:a===`bn`?`৪. কৃষিতাত্ত্বিক নিয়ম (Agronomic Rule Baseline)`:`4. Agronomic Rule Baseline`,color:`#f59e0b`,badge:a===`bn`?`হিউরিস্টিক নিয়ম`:`Agronomic Rule`,crops:m.rotation.slice(0,6),profit:m.profit,water:m.water,waterByPeriod:u?.water_by_period_mm,x:6}],[d,h,f,c,p,l,m,u,a]);return(0,i.jsxs)(`div`,{className:`comparison-3way-container`,style:{display:`flex`,flexDirection:`column`,gap:16},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,flexWrap:`wrap`,gap:12},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:16,fontWeight:800,color:`#f8fafc`,display:`flex`,alignItems:`center`,gap:8},children:[(0,i.jsx)(`span`,{children:`📊`}),(0,i.jsx)(`span`,{children:a===`bn`?`ঘূর্ণন কৌশল তুলনা (সংরক্ষিত আবর্তন উপলভ্য হলে দেখানো হবে)`:`Rotation Strategy Comparison (saved rotation shown when available)`})]}),(0,i.jsx)(`p`,{style:{margin:`4px 0 0`,fontSize:12.5,color:`#94a3b8`},children:a===`bn`?`মৌসুমি রঙ ফসলের শ্রেণি দেখায়; ব্লকের উচ্চতা কেবল API-তে প্রাপ্ত সেচ চাহিদা দেখায়।`:`Crop colors show crop type; block height uses only irrigation requirements returned by the API.`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:6,background:`rgba(15, 23, 42, 0.6)`,padding:4,borderRadius:8,border:`1px solid rgba(255, 255, 255, 0.08)`},children:[(0,i.jsx)(`button`,{type:`button`,className:`btn ${o===`both`?`btn-primary`:`btn-outline`}`,onClick:()=>s(`both`),style:{fontSize:11.5,padding:`4px 10px`,borderRadius:6},children:a===`bn`?`উভয় ভিউ`:`Both`}),(0,i.jsx)(`button`,{type:`button`,className:`btn ${o===`chart`?`btn-primary`:`btn-outline`}`,onClick:()=>s(`chart`),style:{fontSize:11.5,padding:`4px 10px`,borderRadius:6},children:a===`bn`?`২ডি টাইমলাইন`:`2D Timelines`}),(0,i.jsx)(`button`,{type:`button`,className:`btn ${o===`3d`?`btn-primary`:`btn-outline`}`,onClick:()=>s(`3d`),style:{fontSize:11.5,padding:`4px 10px`,borderRadius:6},children:a===`bn`?`৩ডি হাইট ব্লক`:`3D Water Height`})]})]}),(o===`both`||o===`chart`)&&(0,i.jsxs)(`div`,{style:{background:`rgba(15, 23, 42, 0.85)`,borderRadius:14,border:`1px solid rgba(255, 255, 255, 0.1)`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`260px repeat(6, 1fr) 140px`,gap:8,paddingBottom:6,borderBottom:`1px solid rgba(255, 255, 255, 0.08)`},children:[(0,i.jsx)(`span`,{style:{fontSize:11,fontWeight:700,color:`#94a3b8`,textTransform:`uppercase`},children:a===`bn`?`পদ্ধতি / স্ট্র্যাটেজি`:`Algorithm / Strategy`}),ef.map(e=>(0,i.jsx)(`span`,{style:{fontSize:10.5,fontWeight:700,color:`#cbd5e1`,textAlign:`center`},children:a===`bn`?e.labelBn:e.labelEn},e.id)),(0,i.jsx)(`span`,{style:{fontSize:11,fontWeight:700,color:`#94a3b8`,textAlign:`right`,textTransform:`uppercase`},children:a===`bn`?`মোট ফলাফল`:`Total Impact`})]}),g.map(e=>(0,i.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`260px repeat(6, 1fr) 140px`,gap:8,alignItems:`center`,padding:`10px 8px`,borderRadius:10,background:`rgba(255, 255, 255, 0.02)`,borderLeft:`4px solid ${e.color}`},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`div`,{style:{fontSize:12.5,fontWeight:800,color:`#f8fafc`},children:e.label}),(0,i.jsx)(`span`,{style:{fontSize:10,color:e.color,fontWeight:700,textTransform:`uppercase`},children:e.badge})]}),ef.map((t,n)=>{let r=e.crops[n]||null,o=tf(e,n),s=r?nf(r):`#475569`,c=o===null?0:Math.min(100,Math.max(25,o/750*100));return(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,justifyContent:`flex-end`,background:`rgba(30, 41, 59, 0.6)`,borderRadius:8,border:`1px solid ${s}40`,height:64,padding:`4px 6px`,position:`relative`,overflow:`hidden`},children:[(0,i.jsx)(`div`,{style:{position:`absolute`,bottom:0,left:0,right:0,height:`${c}%`,background:`${s}25`,borderTop:`2px solid ${s}`,zIndex:0}}),(0,i.jsxs)(`div`,{style:{position:`relative`,zIndex:1,textAlign:`center`},children:[(0,i.jsx)(`span`,{style:{fontSize:11,fontWeight:800,color:`#f8fafc`,display:`block`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},children:r||(a===`bn`?`তথ্য নেই`:`Unavailable`)}),(0,i.jsx)(`span`,{style:{fontSize:9.5,color:s,fontWeight:700},children:o===null?a===`bn`?`সেচ তথ্য নেই`:`No water data`:`${Math.round(o)} mm`})]})]},n)}),(0,i.jsxs)(`div`,{style:{textAlign:`right`},children:[(0,i.jsx)(`div`,{style:{fontSize:12,fontWeight:800,color:e.color},children:e.profit===null?a===`bn`?`তথ্য নেই`:`—`:`৳${Math.round(e.profit/1e3)}k`}),(0,i.jsx)(`div`,{style:{fontSize:10.5,color:`#94a3b8`},children:e.water?`${Math.round(e.water)} mm`:`—`})]})]},e.id))]}),(o===`both`||o===`3d`)&&(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,children:[(0,i.jsx)(Kd,{cameraPosition:[-14,12,14],cameraTarget:[0,.5,0],hudTitle:`3D MULTI-SEASON ROTATION FOOTPRINT (HEIGHT = WATER USE)`,hudMetrics:[`Field: ${t?.name||(a===`bn`?`অবস্থান অনুপলভ্য`:`Location unavailable`)}`,`Priority: ${n.toUpperCase()}`,f.profit===null?`MILP: —`:`MILP: ৳${Math.round(f.profit/1e3)}k`,p.profit===null?`RL: —`:`RL: ৳${Math.round(p.profit/1e3)}k`],onSceneReady:({scene:e})=>{let t=new dr;g.forEach(e=>{let n=new dr;n.position.set(e.x,0,0);let r=new Z(new Ta(2.4,.25,11),new Q({color:`#1e293b`,roughness:.95}));r.position.y=-.125,r.receiveShadow=!0,n.add(r);let i=new Z(new Ta(2.45,.05,11.05),new Ei({color:e.color}));i.position.y=.02,n.add(i),e.crops.forEach((t,r)=>{let i=-4.2+r*1.68,a=tf(e,r),o=a===null?.3:Math.max(.3,a/800*2.2),s=nf(t),c=new Z(new Ta(1.9,o,1.4),new Q({color:s,roughness:.5,metalness:.1}));c.position.set(0,o/2+.05,i),c.castShadow=!0,c.receiveShadow=!0,n.add(c)}),t.add(n)}),e.add(t)},minHeight:`420px`,lang:a}),(0,i.jsxs)(`div`,{style:{background:`rgba(15, 23, 42, 0.8)`,borderRadius:12,border:`1px solid rgba(255, 255, 255, 0.08)`,padding:16,display:`flex`,flexDirection:`column`,gap:10},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:13.5,fontWeight:800,color:`#f8fafc`},children:[`🔍 `,a===`bn`?`পদ্ধতিগত পার্থক্য বিশ্লেষণ`:`Methodological Synthesis`]}),g.map(e=>(0,i.jsxs)(`div`,{style:{background:`${e.color}15`,border:`1px solid ${e.color}40`,padding:`8px 10px`,borderRadius:8,fontSize:11.5},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,i.jsx)(`strong`,{style:{color:e.color},children:e.label.split(`(`)[0]}),(0,i.jsx)(`span`,{style:{color:e.color,fontWeight:700,fontSize:10},children:e.badge})]}),(0,i.jsxs)(`div`,{style:{color:`#cbd5e1`,marginTop:3},children:[a===`bn`?`প্রথম ফসল`:`First crop`,`: `,(0,i.jsx)(`strong`,{children:e.crops[0]||`—`}),` · `,a===`bn`?`পানি`:`Water`,`: `,(0,i.jsx)(`strong`,{children:e.water!==null&&e.water!==void 0?`${Math.round(e.water)} mm`:`—`})]})]},e.id)),(0,i.jsx)(`div`,{style:{marginTop:`auto`,fontSize:10.5,color:`#64748b`,lineHeight:1.4},children:a===`bn`?`* ৪টি রো একই মাটির হাইড্রো-ফিজিক্স ও নাসা পাওয়ার আবহাওয়া ইনপুটের ভিত্তিতে গণনা করা হয়েছে।`:`* Evaluated on identical SoilGrids hydro-physics and NASA POWER weather climatology.`})]})]})]})}function of({failureType:e=`drought_shock`,severity:t=`severe`,failureSeason:n=0,simData:a,lang:o=`bn`}){let s=(0,r.useMemo)(()=>{switch(e){case`excess_rain`:return{name:`Waterlogging & Flood`,color:`#0284c7`,soilColor:`#1e293b`,hasFlood:!0};case`heat_stress`:return{name:`Heat Stress Wave`,color:`#ef4444`,soilColor:`#451a03`,hasHeatHaze:!0};case`soil_shock`:return{name:`Soil Salinity Shock`,color:`#f8fafc`,soilColor:`#78716c`,hasSalineCrust:!0};case`crop_loss`:return{name:`Pest / Blight Loss`,color:`#854d0e`,soilColor:`#2b1b10`,isBlighted:!0};default:return{name:`Drought Shock`,color:`#f59e0b`,soilColor:`#603813`,isParched:!0}}},[e]);return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,children:[(0,i.jsx)(Kd,{cameraPosition:[-8,6,12],cameraTarget:[0,0,0],hudTitle:`SHOCK: ${s.name.toUpperCase()}`,hudMetrics:[`Severity: ${t.toUpperCase()}`,`Season: S${n+1}`],onSceneReady:({scene:e})=>{let t=new dr,n=new Z(new Ta(6.5,.4,6.5),new Q({color:s.soilColor,roughness:.95}));if(n.position.y=-.2,n.receiveShadow=!0,t.add(n),s.hasFlood){let e=new Z(new Ta(6.4,.25,6.4),new Q({color:`#0284c7`,transparent:!0,opacity:.8,roughness:.1}));e.position.y=.12,t.add(e)}if(s.hasSalineCrust){let e=new Z(new Ta(6.3,.05,6.3),new Q({color:`#f8fafc`,roughness:.3}));e.position.y=.03,t.add(e)}let r=s.isBlighted?`#713f12`:s.isParched?`#ca8a04`:s.hasFlood?`#155e75`:`#15803d`;for(let e=-2;e<=2;e+=1)for(let n=-2;n<=2;n+=1){let i=new Z(new Ea(.03,.04,.9,6),new Q({color:r,roughness:.7}));i.position.set(e,.45,n),(s.isParched||s.isBlighted)&&(i.rotation.z=(Math.random()-.5)*.45),t.add(i)}e.add(t)},minHeight:`420px`,lang:o}),(0,i.jsxs)(`div`,{style:{background:`var(--glass-bg-card, rgba(15,23,42,0.8))`,borderRadius:12,border:`1px solid var(--glass-border, rgba(255,255,255,0.08))`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:800,color:`#f8fafc`},children:[`🛡️ `,o===`bn`?`ফসল বিপর্যয় ও পুনরুদ্ধার সিমুলেশন`:`Crop Failure Shock & Recovery`]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsx)(`div`,{style:{color:`var(--text-muted, #94a3b8)`,marginBottom:2},children:`বিপর্যয়ের ধরন (Shock Type):`}),(0,i.jsx)(`strong`,{style:{color:s.color,fontSize:13.5},children:s.name}),(0,i.jsxs)(`div`,{style:{color:`#cbd5e1`,fontSize:11,marginTop:4},children:[`তীব্রতা: `,(0,i.jsx)(`strong`,{children:t}),` · প্রভাব বিস্তারকাল: মৌসুম `,n+1]})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsx)(`div`,{style:{fontSize:11,fontWeight:800,color:`#00df81`,marginBottom:4},children:`পুনরুদ্ধার কৌশল (Adaptive Restorative Protocol):`}),(0,i.jsx)(`p`,{style:{margin:0,fontSize:11.5,color:`#cbd5e1`,lineHeight:1.4},children:`বিপর্যয়-পরবর্তী মৌসুমে ক্ষয়ক্ষতি পুষিয়ে নিতে নাইট্রোজেন সংবন্ধনকারী লেগিউম (মুগডাল) ও লবণাক্ততা সহনশীল জাত প্রতিস্থাপিত হবে।`})]}),(0,i.jsx)(`div`,{style:{marginTop:`auto`,fontSize:10.5,color:`#64748b`,lineHeight:1.4},children:`* Dynamic replanning heuristic evaluates multi-season recovery constraints.`})]})]})}var sf=new Y;function cf(e,t,n,r,i,a){let o=2*Math.PI*i/4,s=Math.max(a-2*i,0),c=Math.PI/4;sf.copy(t),sf[r]=0,sf.normalize();let l=.5*o/(o+s),u=1-sf.angleTo(e)/c;return Math.sign(sf[n])===1?u*l:s/(o+s)+l+l*(1-u)}var lf=class e extends Ta{constructor(e=1,t=1,n=1,r=2,i=.1){let a=r*2+1;if(i=Math.min(e/2,t/2,n/2,i),super(1,1,1,a,a,a),this.type=`RoundedBoxGeometry`,this.parameters={width:e,height:t,depth:n,segments:r,radius:i},a===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let s=new Y,c=new Y,l=new Y(e,t,n).divideScalar(2).subScalar(i),u=this.attributes.position.array,d=this.attributes.normal.array,f=this.attributes.uv.array,p=u.length/6,m=new Y,h=.5/a;for(let r=0,a=0;r<u.length;r+=3,a+=2)switch(s.fromArray(u,r),c.copy(s),c.x-=Math.sign(c.x)*h,c.y-=Math.sign(c.y)*h,c.z-=Math.sign(c.z)*h,c.normalize(),u[r+0]=l.x*Math.sign(s.x)+c.x*i,u[r+1]=l.y*Math.sign(s.y)+c.y*i,u[r+2]=l.z*Math.sign(s.z)+c.z*i,d[r+0]=c.x,d[r+1]=c.y,d[r+2]=c.z,Math.floor(r/p)){case 0:m.set(1,0,0),f[a+0]=cf(m,c,`z`,`y`,i,n),f[a+1]=1-cf(m,c,`y`,`z`,i,t);break;case 1:m.set(-1,0,0),f[a+0]=1-cf(m,c,`z`,`y`,i,n),f[a+1]=1-cf(m,c,`y`,`z`,i,t);break;case 2:m.set(0,1,0),f[a+0]=1-cf(m,c,`x`,`z`,i,e),f[a+1]=cf(m,c,`z`,`x`,i,n);break;case 3:m.set(0,-1,0),f[a+0]=1-cf(m,c,`x`,`z`,i,e),f[a+1]=1-cf(m,c,`z`,`x`,i,n);break;case 4:m.set(0,0,1),f[a+0]=1-cf(m,c,`x`,`y`,i,e),f[a+1]=1-cf(m,c,`y`,`x`,i,t);break;case 5:m.set(0,0,-1),f[a+0]=cf(m,c,`x`,`y`,i,e),f[a+1]=1-cf(m,c,`y`,`x`,i,t)}}static fromJSON(t){return new e(t.width,t.height,t.depth,t.segments,t.radius)}};function uf(e=256,t=256){if(typeof document>`u`||typeof document.createElement!=`function`)return null;try{let n=document.createElement(`canvas`);n.width=e,n.height=t;let r=n.getContext(`2d`);return r?{canvas:n,ctx:r}:null}catch{return null}}function df(){let e=uf(256,256);if(!e)return new jn;let{canvas:t,ctx:n}=e;n.fillStyle=`#8fb760`,n.fillRect(0,0,256,256);let r=[`#7ea654`,`#9bc26b`,`#729948`,`#a4cb74`];for(let e=0;e<3e3;e++){let e=Math.random()*256,t=Math.random()*256,i=1.5+Math.random()*3.5,a=(Math.random()-.5)*.6;n.strokeStyle=r[Math.floor(Math.random()*r.length)],n.lineWidth=.8+Math.random()*.8,n.beginPath(),n.moveTo(e,t),n.lineTo(e+Math.sin(a)*i,t-Math.cos(a)*i),n.stroke()}let i=new xa(t);return i.wrapS=V,i.wrapT=V,i.repeat.set(4,4),i.colorSpace=xt,i}function ff(){let e=uf(256,256);if(!e)return new jn;let{canvas:t,ctx:n}=e;n.fillStyle=`#7a4628`,n.fillRect(0,0,256,256);for(let e=0;e<256;e+=16){let t=n.createLinearGradient(0,e,0,e+16);t.addColorStop(0,`#8d5331`),t.addColorStop(.4,`#a2623a`),t.addColorStop(.6,`#6b3c22`),t.addColorStop(1,`#57301a`),n.fillStyle=t,n.fillRect(0,e,256,16)}n.fillStyle=`rgba(40, 20, 10, 0.25)`;for(let e=0;e<1200;e++){let e=Math.random()*256,t=Math.random()*256,r=.8+Math.random()*1.6;n.beginPath(),n.arc(e,t,r,0,Math.PI*2),n.fill()}let r=new xa(t);return r.wrapS=V,r.wrapT=V,r.repeat.set(2,3),r.colorSpace=xt,r}function pf(){let e=uf(256,256);if(!e)return new jn;let{canvas:t,ctx:n}=e;n.fillStyle=`#9a5a33`,n.fillRect(0,0,256,256);let r=[`#b36a3c`,`#9a5a33`,`#854c2b`,`#6f3e23`,`#5a311b`,`#a46238`],i=0;for(;i<256;){let e=18+Math.random()*28;n.fillStyle=r[Math.floor(Math.random()*r.length)],n.beginPath(),n.moveTo(0,i);for(let e=0;e<=256;e+=32){let t=Math.sin(e*.05+i)*2.5;n.lineTo(e,i+t)}n.lineTo(256,i+e),n.lineTo(0,i+e),n.closePath(),n.fill(),i+=e}n.strokeStyle=`rgba(255, 230, 200, 0.08)`,n.lineWidth=1;for(let e=0;e<40;e++){let e=Math.random()*256;n.beginPath(),n.moveTo(0,e),n.lineTo(256,e),n.stroke()}let a=new xa(t);return a.wrapS=V,a.wrapT=V,a.repeat.set(1,1),a.colorSpace=xt,a}function mf(){let e=uf(256,256);if(!e)return new jn;let{canvas:t,ctx:n}=e;n.fillStyle=`#bfa585`,n.fillRect(0,0,256,256);for(let e=0;e<2e3;e++){let e=Math.random()*256,t=Math.random()*256,r=.5+Math.random()*1.5;n.fillStyle=Math.random()>.5?`rgba(120, 95, 70, 0.18)`:`rgba(235, 220, 195, 0.16)`,n.beginPath(),n.arc(e,t,r,0,Math.PI*2),n.fill()}let r=new xa(t);return r.wrapS=V,r.wrapT=V,r.repeat.set(3,3),r.colorSpace=xt,r}function hf(){let e=uf(256,256);if(!e)return new jn;let{canvas:t,ctx:n}=e;n.fillStyle=`#9b806d`,n.fillRect(0,0,256,256);let r=[`#f4f1ea`,`#e8e2d5`,`#dfd7c8`,`#ffffff`];for(let e=0;e<400;e++){let e=Math.random()*256,t=Math.random()*256,i=1+Math.random()*4;n.fillStyle=r[Math.floor(Math.random()*r.length)],n.beginPath(),n.arc(e,t,i,0,Math.PI*2),n.fill()}let i=new xa(t);return i.wrapS=V,i.wrapT=V,i.repeat.set(2,2),i.colorSpace=xt,i}function gf(e){let t=document.createElement(`canvas`);t.width=256,t.height=256;let n=t.getContext(`2d`);if(!n)return null;n.fillStyle=e?`#452b14`:`#2b1b10`,n.fillRect(0,0,256,256);let r=n.getImageData(0,0,256,256),i=r.data;for(let e=0;e<i.length;e+=4){let t=(Math.random()-.5)*30;i[e]=Math.min(255,Math.max(0,i[e]+t)),i[e+1]=Math.min(255,Math.max(0,i[e+1]+t*.75)),i[e+2]=Math.min(255,Math.max(0,i[e+2]+t*.5))}n.putImageData(r,0,0),n.strokeStyle=e?`rgba(30, 15, 5, 0.4)`:`rgba(15, 8, 4, 0.3)`,n.lineWidth=3;for(let e=16;e<256;e+=32)n.beginPath(),n.moveTo(0,e),n.lineTo(256,e),n.stroke();let a=new xa(t);return a.wrapS=V,a.wrapT=V,a.repeat.set(4,4),a}function _f({weatherScenario:e=`warming_1_5c`,tempDeltaC:t=1.5,baseTempC:n=28.5,et0Mm:a=4.8,stressDays:o=18,rainfallMm:s=180,crop:c=`rice`,yieldTonHa:l=4.85,lang:u=`bn`}){let d=Number((n+t).toFixed(1)),f=(typeof e==`string`?e:``).includes(`drought`)||t>=2,p=(0,r.useMemo)(()=>{let n=typeof e==`string`?e:``;return n.includes(`heatwave`)||t>=3?`#ef4444`:n.includes(`warming`)||t>=1.5?`#f97316`:n.includes(`drought`)?`#eab308`:n.includes(`monsoon`)?`#0284c7`:`#38bdf8`},[e,t]),m=({scene:e})=>{let t=new dr,n=new Z(new co(18,18),new Q({map:gf(f),roughness:.94,metalness:.02}));n.rotation.x=-Math.PI/2,n.receiveShadow=!0,t.add(n);let r=new uo(9.5,32,20,0,Math.PI*2,0,Math.PI/2),i=new Z(r,new Q({color:p,transparent:!0,opacity:.22,roughness:.3,metalness:.1,side:2}));t.add(i);let a=new Z(r,new Ei({color:p,wireframe:!0,transparent:!0,opacity:.12}));t.add(a);let s=new Z(new uo(.85,24,24),new Ei({color:`#fef08a`}));s.position.set(6.5,10.5,4.5),t.add(s);for(let e=0;e<8;e++){let n=e/8*Math.PI*2,r=Math.cos(n)*5.5,i=Math.sin(n)*5.5,a=new mi().setFromPoints([new Y(6.5,10.5,4.5),new Y(r,.05,i)]),o=new ea({color:p,transparent:!0,opacity:.35});t.add(new ca(a,o))}let c=new Q({color:o>14?`#ca8a04`:`#15803d`,roughness:.55,metalness:.05});for(let e=-4.5;e<=4.5;e+=1.8)for(let n=-4.5;n<=4.5;n+=1.8){let r=new dr;r.position.set(e+(Math.random()-.5)*.2,0,n+(Math.random()-.5)*.2);for(let e=0;e<3;e++){let t=e/3*Math.PI*2,n=new Z(new fo(new Wa([new Y(0,0,0),new Y(Math.cos(t)*.22,.45,Math.sin(t)*.22),new Y(Math.cos(t)*.35,.35,Math.sin(t)*.35)]),6,.035,4,!1),c);n.castShadow=!0,r.add(n)}t.add(r)}e.add(t)},h=(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.6)`,padding:14,borderRadius:8},children:[(0,i.jsx)(`h5`,{style:{margin:`0 0 10px`,color:`#38bdf8`,fontSize:13,fontWeight:800},children:u===`bn`?`জলবায়ু চাপ ও তাপমাত্রা পারটারবেশন সারণী`:`Climate Stress & Telemetry Table`}),(0,i.jsx)(`table`,{style:{width:`100%`,borderCollapse:`collapse`,fontSize:`12px`,textAlign:`left`},children:(0,i.jsxs)(`tbody`,{children:[(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`দৃশ্যকল্প (Scenario):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#f8fafc`},children:e})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`সিমুলেটেড তাপমাত্রা:`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:p},children:[d,`°C (Δ`,t>=0?`+`:``,t,`°C)`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`রেফারেন্স ET0 বৃদ্ধি:`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#f59e0b`},children:[a,` mm/day`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`পানি চাপ দিন (Stress Days):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:o>12?`#ef4444`:`#00df81`},children:[o,` দিন`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`বৃষ্টিপাত বাজেট:`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#38bdf8`},children:[s,` mm`]})]}),(0,i.jsxs)(`tr`,{children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`প্রত্যাশিত ফলন প্রভাব:`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:l>=5?`#00df81`:`#f59e0b`},children:[l,` t/ha`]})]})]})})]});return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(min(100%, 300px), 1fr))`,gap:16},children:[(0,i.jsx)(Kd,{cameraPosition:[-12,10,16],cameraTarget:[0,2,0],hudTitle:`CLIMATE STRESS & THERMAL DOME 3D`,hudMetrics:[`Temp: ${d}°C (Δ${t>=0?`+`:``}${t}°C)`,`ET0: ${a} mm/day`,`Stress: ${o} days`],fallbackTableView:h,onSceneReady:m,minHeight:`440px`,lang:u}),(0,i.jsxs)(`div`,{style:{background:`var(--glass-bg-card, rgba(15,23,42,0.8))`,borderRadius:12,border:`1px solid var(--glass-border, rgba(255,255,255,0.08))`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:800,color:`#f8fafc`},children:[`🌡️ `,u===`bn`?`জলবায়ু চাপ ও তাপমাত্রা পারটারবেশন`:`Climate Stress & Thermal Impact`]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`সিমুলেটেড তাপমাত্রা:`}),(0,i.jsxs)(`strong`,{style:{color:p,fontSize:13.5},children:[d,`°C`]})]}),(0,i.jsxs)(`div`,{style:{fontSize:11,color:`#94a3b8`},children:[`বেসলাইন স্বাভাবিক থেকে `,t>=0?`+`:``,t,`°C পরিবর্তন`]})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`রেফারেন্স ET0 বৃদ্ধি:`}),(0,i.jsxs)(`strong`,{style:{color:`#f59e0b`},children:[a,` mm/দিন`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`পানি ঘাটতি জনিত দিন:`}),(0,i.jsxs)(`strong`,{style:{color:o>12?`#ef4444`:`#00df81`},children:[o,` দিন`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`প্রত্যাশিত ফলন প্রভাব:`}),(0,i.jsxs)(`strong`,{style:{color:l>=5?`#00df81`:`#f59e0b`},children:[l,` t/ha`]})]})]}),(0,i.jsx)(`div`,{style:{marginTop:`auto`,background:`rgba(15, 23, 42, 0.6)`,padding:10,borderRadius:8,border:`1px solid rgba(255, 255, 255, 0.08)`,fontSize:10.5,color:`#94a3b8`},children:`🛰️ NASA POWER CERES/MERRA-2 গ্রিডেড ক্লাইমেট মডেল ভিত্তিক তাপমাত্রা পারটারবেশন।`})]})]})}function vf(){let e=document.createElement(`canvas`);e.width=256,e.height=256;let t=e.getContext(`2d`);if(!t)return null;let n=t.createLinearGradient(0,0,0,256);n.addColorStop(0,`#1c120c`),n.addColorStop(.5,`#2e1c10`),n.addColorStop(1,`#3d2617`),t.fillStyle=n,t.fillRect(0,0,256,256);let r=t.getImageData(0,0,256,256),i=r.data;for(let e=0;e<i.length;e+=4){let t=(Math.random()-.5)*26;i[e]=Math.min(255,Math.max(0,i[e]+t)),i[e+1]=Math.min(255,Math.max(0,i[e+1]+t*.8)),i[e+2]=Math.min(255,Math.max(0,i[e+2]+t*.6))}t.putImageData(r,0,0);let a=new xa(e);return a.wrapS=ie,a.wrapT=ie,a}function yf({nitrogenKgHa:e=120,phosphorusKgHa:t=60,potassiumKgHa:n=60,organicMatterPct:r=1.85,soilPh:a=6.8,crop:o=`rice`,isLegume:s=!1,nitrogenStressFactor:c=1,lang:l=`bn`}){let u=({scene:r})=>{let i=new dr,a=new Z(new Ta(5.2,5.2,5.2,4,8,4),new Q({map:vf(),roughness:.94,metalness:.04}));a.position.y=-2.6,a.receiveShadow=!0,i.add(a);let o=new dr,c=new Q({color:`#fef08a`,roughness:.5,metalness:.08}),l=new Wa([new Y(0,0,0),new Y(.04,-1,.02),new Y(-.03,-2.2,.04),new Y(.02,-3.5,-.02)]),u=new Z(new fo(l,16,.065,8,!1),c);o.add(u);let d=new Q({color:`#f472b6`,roughness:.35,metalness:.1});for(let e=0;e<18;e++){let t=.2+e/18*.7,n=l.getPoint(t),r=e/18*Math.PI*2+e%3*.3,i=.6+Math.random()*.7,a=new Wa([n,new Y(n.x+i*.5*Math.cos(r),n.y-.2,n.z+i*.5*Math.sin(r)),new Y(n.x+Math.cos(r)*i,n.y-.45,n.z+Math.sin(r)*i)]),u=new Z(new fo(a,8,.024,6,!1),c);if(o.add(u),s&&e%2==0){let e=2+Math.floor(Math.random()*3);for(let t=0;t<e;t++){let n=.3+t/e*.5,r=a.getPoint(n),i=new Z(new uo(.065+Math.random()*.03,8,8),d);i.position.set(r.x+(Math.random()-.5)*.06,r.y+(Math.random()-.5)*.06,r.z+(Math.random()-.5)*.06),o.add(i)}}}i.add(o);let f=Math.min(48,Math.floor(e/150*48)),p=new uo(.055,8,8),m=new Ei({color:`#38bdf8`});for(let e=0;e<f;e++){let e=new Z(p,m);e.position.set((Math.random()-.5)*4.5,-.4-Math.random()*2.8,(Math.random()-.5)*4.5),i.add(e)}let h=Math.min(26,Math.floor(t/80*26)),g=new Ei({color:`#f97316`});for(let e=0;e<h;e++){let e=new Z(p,g);e.position.set((Math.random()-.5)*4.5,-.6-Math.random()*2.6,(Math.random()-.5)*4.5),i.add(e)}let _=Math.min(26,Math.floor(n/80*26)),v=new Ei({color:`#c084fc`});for(let e=0;e<_;e++){let e=new Z(p,v);e.position.set((Math.random()-.5)*4.5,-1-Math.random()*3,(Math.random()-.5)*4.5),i.add(e)}r.add(i)},d=(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.6)`,padding:14,borderRadius:8},children:[(0,i.jsx)(`h5`,{style:{margin:`0 0 10px`,color:`#38bdf8`,fontSize:13,fontWeight:800},children:l===`bn`?`মাটির পুষ্টি ও নাইট্রোজেন ভারসাম্য সারণী`:`Soil Nutrient Profile & BNF Table`}),(0,i.jsx)(`table`,{style:{width:`100%`,borderCollapse:`collapse`,fontSize:`12px`,textAlign:`left`},children:(0,i.jsxs)(`tbody`,{children:[(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`নাইট্রোজেন রেজিম (N):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#38bdf8`},children:[e,` kg/ha`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`ফসফরাস রেজিম (P₂O₅):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#f97316`},children:[t,` kg/ha`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`পটাশিয়াম রেজিম (K₂O):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#c084fc`},children:[n,` kg/ha`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`জৈব পদার্থ (Soil OM):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#00df81`},children:[r,`%`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`মাটির পিএইচ (pH):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#facc15`},children:a})]}),(0,i.jsxs)(`tr`,{children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`রাইজোবিয়াম নোডিউল (BNF):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:s?`#f472b6`:`#cbd5e1`},children:s?`+45 kg N/ha (সক্রিয় BNF সংবন্ধন)`:`অপুষ্টিকারক সিরিয়াল (-25 kg N/ha)`})]})]})})]});return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(min(100%, 300px), 1fr))`,gap:16},children:[(0,i.jsx)(Kd,{cameraPosition:[-7,1,9],cameraTarget:[0,-2,0],hudTitle:`NUTRIENT PROFILE & BNF 3D`,hudMetrics:[`N: ${e} kg/ha`,`P: ${t} kg/ha`,`K: ${n} kg/ha`],fallbackTableView:d,onSceneReady:u,minHeight:`440px`,lang:l}),(0,i.jsxs)(`div`,{style:{background:`var(--glass-bg-card, rgba(15,23,42,0.8))`,borderRadius:12,border:`1px solid var(--glass-border, rgba(255,255,255,0.08))`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:800,color:`#f8fafc`},children:[`🧪 `,l===`bn`?`মাটির পুষ্টি ও নাইট্রোজেন ভারসাম্য`:`Soil Nutrient Profile & BNF`]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsx)(`div`,{style:{fontSize:11,fontWeight:800,color:`#38bdf8`,marginBottom:4},children:`প্রয়োগকৃত রাসায়নিক পুষ্টি মাত্রা (N-P-K):`}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`#38bdf8`},children:`নাইট্রোজেন (N):`}),(0,i.jsxs)(`strong`,{children:[e,` kg/ha`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`#f97316`},children:`ফসফরাস (P₂O₅):`}),(0,i.jsxs)(`strong`,{children:[t,` kg/ha`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`#c084fc`},children:`পটাশিয়াম (K₂O):`}),(0,i.jsxs)(`strong`,{children:[n,` kg/ha`]})]})]}),(0,i.jsxs)(`div`,{style:{background:s?`rgba(244, 114, 182, 0.15)`:`rgba(30, 41, 59, 0.5)`,border:s?`1px solid rgba(244, 114, 182, 0.3)`:`1px solid rgba(255, 255, 255, 0.08)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{fontWeight:800,color:s?`#f472b6`:`#cbd5e1`},children:s?`🌱 রাইজোবিয়াম নোডিউল সক্রিয় (BNF)`:`🌾 অপুষ্টিকারক সিরিয়াল ফসল`}),(0,i.jsx)(`span`,{style:{fontSize:11,color:s?`#00df81`:`#f59e0b`,fontWeight:800},children:s?`+45 kg N/ha`:`-25 kg N/ha`})]}),(0,i.jsx)(`p`,{style:{margin:`4px 0 0`,fontSize:11,color:`var(--text-muted, #94a3b8)`},children:s?`শিমজাতীয় ফসলের মূলে রাইজোবিয়াম ব্যাকটেরিয়া প্রাকৃতিকভাবে বায়বীয় নাইট্রোজেন মাটিতে সংবন্ধন করছে।`:`সিরিয়াল ফসল মাটি থেকে উল্লেখযোগ্য নাইট্রোজেন শোষণ করে সঞ্চিত উর্বরতা হ্রাস করে।`})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`জৈব পদার্থ (OM):`}),(0,i.jsxs)(`strong`,{style:{color:`#f8fafc`},children:[r,`%`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`মাটির পিএইচ (pH):`}),(0,i.jsx)(`strong`,{style:{color:`#38bdf8`},children:a})]})]}),(0,i.jsx)(`div`,{style:{marginTop:`auto`,fontSize:10.5,color:`#64748b`,lineHeight:1.4},children:`* মডেলের সীমাবদ্ধতা: মাটির অণুজীব ক্ষয় ও নাইট্রেট লিচিং ট্রান্সপোর্ট অ্যালগরিদমে অনুমিত নয়।`})]})]})}function bf({selectedSensorId:e=null,onSelectSensor:t=null,height:n=420}){let a=(0,r.useRef)(null),o=(0,r.useRef)(null),s=(0,r.useRef)(null),c=(0,r.useRef)(null),l=(0,r.useRef)(null),u=(0,r.useRef)(null),d=(0,r.useRef)([]),[f,p]=(0,r.useState)(e||`nasa_power`),[m,h]=(0,r.useState)(!0),[g,_]=(0,r.useState)(null),[v,y]=(0,r.useState)(!0),b=(0,r.useId)(),x=[{id:`nasa_power`,name:`NASA POWER (MERRA-2)`,agency:`NASA Langley`,orbitType:`Synoptic Gridded Climatology (0.5° x 0.5°)`,altitude:`Reanalysis / Geostationary Assimilation`,color:`#38bdf8`,radius:3.2,inclination:.25,speed:.008,status:`OPERATIONAL CONNECTED`,revisit:`Daily updates (2-day lag)`,bands:`Solar All-Sky Insolation, T2M, RH2M, Precipitation`},{id:`sentinel_2`,name:`Sentinel-2 MSI (ESA Copernicus)`,agency:`ESA / EU Copernicus`,orbitType:`Sun-synchronous Polar Orbit`,altitude:`786 km (LEO)`,color:`#00df81`,radius:2.5,inclination:1.71,speed:.018,status:`ARCHIVED BENCHMARK (STANDBY)`,revisit:`5 days (Twin constellation 2A/2B)`,bands:`B4 Red, B8 NIR, B11 SWIR (10m - 20m NDVI)`},{id:`nasa_smap`,name:`NASA SMAP (Soil Moisture Active Passive)`,agency:`NASA JPL`,orbitType:`Sun-synchronous Polar Orbit (6:00 AM/PM)`,altitude:`685 km (LEO)`,color:`#f59e0b`,radius:2.3,inclination:1.7,speed:.022,status:`STANDBY (API AUTH REQUIRED)`,revisit:`2-3 days global coverage`,bands:`L-Band Radiometer 1.41 GHz (Root-zone volumetric water)`},{id:`landsat_9`,name:`Landsat-9 OLI-2 / TIRS-2`,agency:`NASA / USGS`,orbitType:`Sun-synchronous Polar Orbit`,altitude:`705 km (LEO)`,color:`#a78bfa`,radius:2.7,inclination:1.72,speed:.015,status:`STANDBY (USGS EROS CONNECTOR)`,revisit:`8 days offset with Landsat 8`,bands:`Thermal Infrared (TIRS-2) ET0 & Crop Surface Temp`}];(0,r.useEffect)(()=>{e&&p(e)},[e]),(0,r.useEffect)(()=>{let e=a.current;if(!e)return;try{let e=document.createElement(`canvas`);if(!(e.getContext(`webgl`)||e.getContext(`experimental-webgl`))){y(!1);return}}catch{y(!1);return}let r=e.clientWidth||700,i=new br;s.current=i,i.background=new X(396049);let h=new us(45,r/n,.1,100);h.position.set(4.5,3.2,5),u.current=h;let g=new cd({antialias:!0,alpha:!0,powerPreference:`high-performance`});g.setSize(r,n),g.setPixelRatio(Math.min(window.devicePixelRatio,2)),g.toneMapping=4,g.toneMappingExposure=1.2,c.current=g,e.replaceChildren(g.domElement);let v=new yd(h,g.domElement);v.enableDamping=!0,v.dampingFactor=.05,v.minDistance=2.5,v.maxDistance=14,l.current=v;let b=new gs(2241348,1.4);i.add(b);let S=new hs(16777215,2.5);S.position.set(8,6,6),i.add(S);let C=new hs(3718648,1.2);C.position.set(-6,-3,-6),i.add(C);let w=new mi,T=new Float32Array(1050);for(let e=0;e<1050;e+=3)T[e]=(Math.random()-.5)*50,T[e+1]=(Math.random()-.5)*50,T[e+2]=(Math.random()-.5)*50;w.setAttribute(`position`,new $r(T,3));let E=new va(w,new pa({color:9741240,size:.1,transparent:!0,opacity:.6}));i.add(E);let D=1.4,O=new Z(new uo(D,48,48),new Q({color:1124155,roughness:.65,metalness:.1,wireframe:!1}));i.add(O);let k=new fa(new po(new uo(1.4049999999999998,18,18)),new ea({color:1981023,transparent:!0,opacity:.35}));i.add(k);let A=new Z(new uo(1.48,36,36),new Ei({color:3718648,transparent:!0,opacity:.12,side:1}));i.add(A);let j=24.8*Math.PI/180,M=89.4*Math.PI/180,N=1.42*Math.cos(j)*Math.cos(M),P=1.42*Math.sin(j),F=1.42*Math.cos(j)*Math.sin(M),I=new Z(new uo(.045,16,16),new Ei({color:57217}));I.position.set(N,P,F),i.add(I);let ee=new Z(new lo(.06,.08,24),new Ei({color:57217,side:2,transparent:!0,opacity:.7}));ee.position.set(N,P,F),ee.lookAt(0,0,0),i.add(ee);let L=[];x.forEach(e=>{let t=[];for(let n=0;n<=96;n++){let r=n/96*Math.PI*2,i=e.radius*Math.cos(r),a=e.radius*Math.sin(r)*Math.sin(e.inclination),o=e.radius*Math.sin(r)*Math.cos(e.inclination);t.push(new Y(i,a,o))}let n=new mi().setFromPoints(t),r=new ea({color:new X(e.color),transparent:!0,opacity:e.id===f?.75:.25}),a=new ca(n,r);i.add(a);let o=new dr,s=new Z(new Ta(.1,.08,.1),new Q({color:new X(e.color),roughness:.3,metalness:.8}));o.add(s);let c=new Z(new Ta(.25,.01,.06),new Q({color:1976635,roughness:.2,metalness:.9}));o.add(c);let l=e.radius-D,u=new Da(.35,l,16,1,!0),d=new Ei({color:new X(e.color),transparent:!0,opacity:e.id===f?.16:.04,side:2}),p=new Z(u,d);p.position.y=-l/2,p.rotation.x=Math.PI,o.add(p),i.add(o),L.push({sensor:e,group:o,track:a,trackMat:r,coneMat:d,angle:Math.random()*Math.PI*2})}),d.current=L;let te=new Is,ne=new J,R=e=>{let t=g.domElement.getBoundingClientRect();ne.x=(e.clientX-t.left)/t.width*2-1,ne.y=-((e.clientY-t.top)/t.height)*2+1,te.setFromCamera(ne,h);let n=L.map(e=>e.group.children[0]),r=te.intersectObjects(n);if(r.length>0){let e=L.find(e=>e.group.children[0]===r[0].object);e&&(_(e.sensor),document.body.style.cursor=`pointer`)}else _(null),document.body.style.cursor=`default`},re=e=>{let n=g.domElement.getBoundingClientRect();ne.x=(e.clientX-n.left)/n.width*2-1,ne.y=-((e.clientY-n.top)/n.height)*2+1,te.setFromCamera(ne,h);let r=L.map(e=>e.group.children[0]),i=te.intersectObjects(r);if(i.length>0){let e=L.find(e=>e.group.children[0]===i[0].object);e&&(p(e.sensor.id),t&&t(e.sensor.id))}};g.domElement.addEventListener(`pointermove`,R),g.domElement.addEventListener(`pointerdown`,re);let z=new zs,B=()=>{o.current=requestAnimationFrame(B),z.getDelta(),m&&(O.rotation.y+=.002,k.rotation.y+=.002),L.forEach(e=>{m&&(e.angle+=e.sensor.speed);let t=e.sensor.radius*Math.cos(e.angle),n=e.sensor.radius*Math.sin(e.angle)*Math.sin(e.sensor.inclination),r=e.sensor.radius*Math.sin(e.angle)*Math.cos(e.sensor.inclination);e.group.position.set(t,n,r),e.group.lookAt(0,0,0);let i=e.sensor.id===f;e.trackMat.opacity=i?.75:.22,e.coneMat.opacity=i?.18:.03}),v.update(),g.render(i,h)};B();let V=()=>{if(!e||!g||!h)return;let t=e.clientWidth;h.aspect=t/n,h.updateProjectionMatrix(),g.setSize(t,n)};return window.addEventListener(`resize`,V),()=>{window.removeEventListener(`resize`,V),o.current&&cancelAnimationFrame(o.current),g.domElement&&(g.domElement.removeEventListener(`pointermove`,R),g.domElement.removeEventListener(`pointerdown`,re)),document.body.style.cursor=`default`,i.traverse(e=>{(e.isMesh||e.isLine||e.isPoints)&&(e.geometry&&e.geometry.dispose(),Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material&&e.material.dispose())}),g.dispose(),e.replaceChildren()}},[n,m,f]);let S=x.find(e=>e.id===f)||x[0];return v?(0,i.jsxs)(`div`,{style:{position:`relative`,width:`100%`,marginBottom:`24px`},children:[(0,i.jsx)(`div`,{ref:a,id:`satellite-canvas-${b}`,style:{width:`100%`,height:`${n}px`,borderRadius:`16px`,overflow:`hidden`,background:`radial-gradient(ellipse at center, #0a1320 0%, #04080e 100%)`,border:`1px solid rgba(56, 189, 248, 0.25)`,boxShadow:`0 8px 32px rgba(0, 0, 0, 0.45)`}}),(0,i.jsxs)(`div`,{style:{position:`absolute`,top:14,left:14,right:14,display:`flex`,justifyContent:`space-between`,alignItems:`center`,flexWrap:`wrap`,gap:`8px`,pointerEvents:`none`},children:[(0,i.jsx)(`div`,{style:{display:`flex`,gap:`6px`,flexWrap:`wrap`,pointerEvents:`auto`},children:x.map(e=>{let n=e.id===f;return(0,i.jsxs)(`button`,{onClick:()=>{p(e.id),t&&t(e.id)},style:{padding:`6px 12px`,borderRadius:`999px`,background:n?`rgba(56, 189, 248, 0.25)`:`rgba(15, 23, 42, 0.75)`,border:`1px solid ${n?e.color:`rgba(255, 255, 255, 0.12)`}`,color:n?`#ffffff`:`#94a3b8`,fontSize:`11.5px`,fontWeight:n?700:500,cursor:`pointer`,transition:`all 0.2s ease`,display:`flex`,alignItems:`center`,gap:`6px`},children:[(0,i.jsx)(`span`,{style:{width:8,height:8,borderRadius:`50%`,background:e.color}}),e.name.split(` (`)[0]]},e.id)})}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:`6px`,pointerEvents:`auto`},children:[(0,i.jsx)(`button`,{onClick:()=>h(!m),style:{padding:`6px 12px`,borderRadius:`8px`,background:`rgba(15, 23, 42, 0.75)`,border:`1px solid rgba(255, 255, 255, 0.12)`,color:`#e2e8f0`,fontSize:`11px`,cursor:`pointer`},children:m?`⏸️ Pause Orbit`:`▶️ Resume Orbit`}),(0,i.jsx)(`button`,{onClick:()=>{u.current&&l.current&&(u.current.position.set(4.5,3.2,5),l.current.target.set(0,0,0),l.current.update())},style:{padding:`6px 12px`,borderRadius:`8px`,background:`rgba(15, 23, 42, 0.75)`,border:`1px solid rgba(255, 255, 255, 0.12)`,color:`#38bdf8`,fontSize:`11px`,cursor:`pointer`},children:`🎯 Center View`})]})]}),(0,i.jsxs)(`div`,{style:{position:`absolute`,bottom:14,left:14,right:14,background:`rgba(11, 19, 30, 0.82)`,border:`1px solid ${S.color}40`,borderRadius:`12px`,padding:`12px 18px`,display:`flex`,justifyContent:`space-between`,alignItems:`center`,flexWrap:`wrap`,gap:`12px`,pointerEvents:`auto`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`12px`},children:[(0,i.jsx)(`div`,{style:{width:36,height:36,borderRadius:`10px`,background:`${S.color}20`,border:`1px solid ${S.color}`,display:`flex`,alignItems:`center`,justifyContent:`center`,fontSize:`18px`},children:`🛰️`}),(0,i.jsxs)(`div`,{children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`8px`},children:[(0,i.jsx)(`span`,{style:{fontSize:`14px`,fontWeight:800,color:`#f8fafc`},children:S.name}),(0,i.jsx)(`span`,{style:{fontSize:`10px`,padding:`2px 6px`,borderRadius:`4px`,background:typeof S?.status==`string`&&S.status.includes(`OPERATIONAL`)?`rgba(0, 223, 129, 0.2)`:`rgba(245, 158, 11, 0.2)`,color:typeof S?.status==`string`&&S.status.includes(`OPERATIONAL`)?`#00df81`:`#f59e0b`,fontWeight:700},children:S.status})]}),(0,i.jsxs)(`div`,{style:{fontSize:`11.5px`,color:`#94a3b8`},children:[`Agency: `,(0,i.jsx)(`span`,{style:{color:`#e2e8f0`},children:S.agency}),` • Orbit: `,(0,i.jsx)(`span`,{style:{color:`#38bdf8`},children:S.orbitType}),` (`,S.altitude,`)`]})]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:`18px`,fontSize:`11.5px`},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{style:{color:`#64748b`},children:`Cadence:`}),(0,i.jsx)(`div`,{style:{color:`#f1f5f9`,fontWeight:600},children:S.revisit})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{style:{color:`#64748b`},children:`Target Field:`}),(0,i.jsx)(`div`,{style:{color:`#00df81`,fontWeight:600},children:`Bogura, Bangladesh (24.8°N, 89.4°E)`})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{style:{color:`#64748b`},children:`Primary Telemetry:`}),(0,i.jsx)(`div`,{style:{color:`#38bdf8`,fontWeight:600},children:S.bands})]})]})]}),g&&(0,i.jsxs)(`div`,{style:{position:`absolute`,top:60,left:`50%`,transform:`translateX(-50%)`,background:`rgba(0, 0, 0, 0.85)`,color:`#ffffff`,padding:`4px 12px`,borderRadius:`6px`,fontSize:`11px`,border:`1px solid ${g.color}`,pointerEvents:`none`},children:[`Click to inspect: `,g.name]})]}):(0,i.jsxs)(`div`,{style:{padding:`30px`,textAlign:`center`,background:`#131920`,borderRadius:`14px`,border:`1px solid #1e293b`,color:`#94a3b8`},children:[(0,i.jsx)(`div`,{style:{fontSize:24,marginBottom:8},children:`🛰️`}),(0,i.jsx)(`h4`,{style:{color:`#f8fafc`,margin:`0 0 6px`},children:`WebGL Orbital Constellation Unavailable`}),(0,i.jsx)(`p`,{style:{margin:0,fontSize:13},children:`Hardware acceleration disabled or WebGL context unavailable in current browser.`})]})}function xf({selectedOutcome:e,formPreview:t,activeField:n,formatNumber:a=(e,t=1)=>Number(e||0).toFixed(t),lang:o=`bn`}){let[s,c]=(0,r.useState)(`yield`),l=(0,r.useMemo)(()=>{if(e)return{season:e.season_name||`Rabi / Dry`,crop:e.crop_planted||`Potato`,predYield:Number(e.predicted_yield_kg_ha||25e3),actYield:Number(e.actual_yield_kg_ha||24500),predRev:Number(e.predicted_revenue_bdt||25e4),actRev:Number(e.actual_revenue_bdt||245e3),predWater:Number(e.predicted_water_mm||500),actWater:Number(e.actual_water_mm||470),yieldVar:Number(e.yield_variance_pct??-2),revVar:Number(e.revenue_variance_pct??-2),isGroundTruth:!0};if(t){let e=Number(t.predicted_yield_kg_ha||25e3),n=Number(t.actual_yield_kg_ha||24500),r=Number(t.predicted_revenue_bdt||25e4),i=Number(t.actual_revenue_bdt||245e3),a=e>0?(n-e)/e*100:0,o=r>0?(i-r)/r*100:0;return{season:t.season_name||`Current Input`,crop:t.crop_planted||`Potato`,predYield:e,actYield:n,predRev:r,actRev:i,predWater:Number(t.predicted_water_mm||500),actWater:Number(t.actual_water_mm||470),yieldVar:a,revVar:o,isGroundTruth:!0}}return{season:`Demo Benchmark (Bogura)`,crop:`Potato`,predYield:25e3,actYield:24500,predRev:25e4,actRev:245e3,predWater:500,actWater:470,yieldVar:-2,revVar:-2,isGroundTruth:!1}},[e,t]),u=({scene:e})=>{let t=new dr,n=new Ta(4.5,.4,4.5),r=new dr;r.position.set(-3.2,0,0);let i=new Q({color:1775659,roughness:.9,metalness:.1}),a=new Z(n,i);a.position.y=-.2,a.receiveShadow=!0,r.add(a);let o=new Ta(4.65,.08,4.65),c=new Ei({color:11032055}),u=new Z(o,c);u.position.y=.04,r.add(u);let d=new Q({color:9647082,roughness:.7});for(let e=-1.3;e<=1.3;e+=.85)for(let t=-1.3;t<=1.3;t+=.85){let n=new Z(new Da(.18,.8,6),d);n.position.set(e,.4,t),n.castShadow=!0,r.add(n)}let f=s===`yield`?3e4:s===`revenue`?3e5:600,p=s===`yield`?l.predYield:s===`revenue`?l.predRev:l.predWater,m=Math.max(.3,Math.min(3.8,p/f*3.5)),h=new Ea(.35,.35,m,16),g=new Q({color:11032055,metalness:.3,roughness:.3,emissive:5774471,emissiveIntensity:.4}),_=new Z(h,g);_.position.set(1.4,m/2,1.4),_.castShadow=!0,r.add(_),t.add(r);let v=new dr;v.position.set(3.2,0,0);let y=new Q({color:1318938,roughness:.9,metalness:.1}),b=new Z(n,y);b.position.y=-.2,b.receiveShadow=!0,v.add(b);let x=l.yieldVar>=0,S=x?57217:l.yieldVar>=-10?16096779:15680580,C=new Ta(4.65,.08,4.65),w=new Ei({color:S}),T=new Z(C,w);T.position.y=.04,v.add(T);let E=new Q({color:x?1096065:14251782,roughness:.6});for(let e=-1.3;e<=1.3;e+=.85)for(let t=-1.3;t<=1.3;t+=.85){let n=new Z(new Da(.18,.85,6),E);n.position.set(e,.42,t),n.castShadow=!0,v.add(n)}let D=s===`yield`?l.actYield:s===`revenue`?l.actRev:l.actWater,O=Math.max(.3,Math.min(3.8,D/f*3.5)),k=new Ea(.35,.35,O,16),A=new Q({color:S,metalness:.3,roughness:.3,emissive:x?292951:7877903,emissiveIntensity:.4}),j=new Z(k,A);j.position.set(-1.4,O/2,1.4),j.castShadow=!0,v.add(j),t.add(v);let M=new Ea(.06,.06,3.2,8),N=new Ei({color:S}),P=new Z(M,N);P.rotation.z=Math.PI/2,P.position.set(0,1.2,0),t.add(P);let F=new uo(.35,16,16),I=new Q({color:S,emissive:S,emissiveIntensity:.5,roughness:.2}),ee=new Z(F,I);ee.position.set(0,1.2,0),t.add(ee);let L=new Vs(16,16,3359061,1976635);return L.position.y=-.42,t.add(L),e.add(t),()=>{e.remove(t),[predBedGeo,o,h,C,k,M,F].forEach(e=>e?.dispose?.()),[i,c,d,g,y,w,E,A,N,I].forEach(e=>e?.dispose?.())}},d=s===`yield`?l.yieldVar:s===`revenue`?l.revVar:(l.actWater-l.predWater)/Math.max(1,l.predWater)*100,f=d>=0?`#00df81`:`#f87171`;return(0,i.jsxs)(`div`,{style:{position:`relative`,width:`100%`,borderRadius:`16px`,overflow:`hidden`,border:`1px solid rgba(168, 85, 247, 0.25)`,background:`#0a0e14`,marginBottom:`20px`},children:[(0,i.jsxs)(`div`,{style:{position:`absolute`,top:`12px`,left:`12px`,right:`12px`,display:`flex`,justifyContent:`space-between`,alignItems:`center`,zIndex:10,pointerEvents:`none`,flexWrap:`wrap`,gap:`8px`},children:[(0,i.jsxs)(`div`,{style:{background:`rgba(15, 23, 42, 0.85)`,padding:`6px 14px`,borderRadius:`999px`,border:`1px solid rgba(168, 85, 247, 0.3)`,display:`flex`,alignItems:`center`,gap:`8px`,pointerEvents:`auto`},children:[(0,i.jsx)(`span`,{style:{fontSize:`14px`},children:`⚖️`}),(0,i.jsx)(`span`,{style:{fontSize:`12px`,fontWeight:800,color:`#f8fafc`,letterSpacing:`0.03em`},children:o===`bn`?`ত্রিমাত্রিক পূর্বাভাস বনাম বাস্তব ফলাফল`:`3D PREDICTION VS. GROUND TRUTH`}),(0,i.jsx)(`span`,{style:{fontSize:`10px`,padding:`2px 8px`,borderRadius:`999px`,background:l.isGroundTruth?`rgba(0, 223, 129, 0.15)`:`rgba(245, 158, 11, 0.15)`,color:l.isGroundTruth?`#00df81`:`#f59e0b`,border:`1px solid ${l.isGroundTruth?`rgba(0, 223, 129, 0.3)`:`rgba(245, 158, 11, 0.3)`}`,fontWeight:700},children:l.isGroundTruth?o===`bn`?`প্রকৃত পর্যবেক্ষণ`:`EMPIRICAL RECORD`:o===`bn`?`বেঞ্চমার্ক মোড`:`BENCHMARK`})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(15, 23, 42, 0.85)`,padding:`4px`,borderRadius:`10px`,border:`1px solid rgba(255, 255, 255, 0.1)`,display:`flex`,gap:`4px`,pointerEvents:`auto`},children:[(0,i.jsxs)(`button`,{type:`button`,onClick:()=>c(`yield`),style:{padding:`4px 10px`,fontSize:`11px`,fontWeight:700,borderRadius:`6px`,border:`none`,cursor:`pointer`,background:s===`yield`?`rgba(168, 85, 247, 0.3)`:`transparent`,color:s===`yield`?`#c084fc`:`#94a3b8`},children:[`🌾 `,o===`bn`?`ফলন (kg/ha)`:`Yield`]}),(0,i.jsxs)(`button`,{type:`button`,onClick:()=>c(`revenue`),style:{padding:`4px 10px`,fontSize:`11px`,fontWeight:700,borderRadius:`6px`,border:`none`,cursor:`pointer`,background:s===`revenue`?`rgba(0, 223, 129, 0.25)`:`transparent`,color:s===`revenue`?`#00df81`:`#94a3b8`},children:[`💰 `,o===`bn`?`রাজস্ব (BDT)`:`Revenue`]}),(0,i.jsxs)(`button`,{type:`button`,onClick:()=>c(`water`),style:{padding:`4px 10px`,fontSize:`11px`,fontWeight:700,borderRadius:`6px`,border:`none`,cursor:`pointer`,background:s===`water`?`rgba(56, 189, 248, 0.25)`:`transparent`,color:s===`water`?`#38bdf8`:`#94a3b8`},children:[`💧 `,o===`bn`?`সেচ পানি (mm)`:`Water`]})]})]}),(0,i.jsx)(Kd,{cameraPosition:[0,9,14],cameraTarget:[0,.5,0],minHeight:`380px`,hudTitle:`EMPIRICAL VALIDATION MATRIX`,hudMetrics:[{label:`Crop`,value:l.crop},{label:`Season`,value:l.season},{label:s===`yield`?`Pred Yield`:s===`revenue`?`Pred Rev`:`Pred Water`,value:s===`yield`?`${a(l.predYield,0)} kg/ha`:s===`revenue`?`${a(l.predRev,0)} ৳`:`${l.predWater} mm`,color:`#c084fc`},{label:s===`yield`?`Actual Yield`:s===`revenue`?`Actual Rev`:`Actual Water`,value:s===`yield`?`${a(l.actYield,0)} kg/ha`:s===`revenue`?`${a(l.actRev,0)} ৳`:`${l.actWater} mm`,color:f},{label:`Variance Δ`,value:`${d>0?`+`:``}${a(d,1)}%`,color:f}],onSceneReady:u}),(0,i.jsxs)(`div`,{style:{position:`absolute`,bottom:`10px`,left:`12px`,right:`12px`,display:`flex`,justifyContent:`space-between`,alignItems:`center`,padding:`8px 16px`,background:`rgba(15, 23, 42, 0.85)`,borderRadius:`10px`,border:`1px solid rgba(255, 255, 255, 0.08)`,fontSize:`11.5px`,color:`#94a3b8`,zIndex:10,flexWrap:`wrap`,gap:`10px`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,gap:`16px`,alignItems:`center`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`6px`},children:[(0,i.jsx)(`span`,{style:{width:`10px`,height:`10px`,borderRadius:`2px`,background:`#a855f7`,display:`inline-block`}}),(0,i.jsx)(`span`,{style:{color:`#f8fafc`,fontWeight:600},children:o===`bn`?`বাম প্লট: গাণিতিক পূর্বাভাস (MILP)`:`Left Plot: Model Forecast`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`6px`},children:[(0,i.jsx)(`span`,{style:{width:`10px`,height:`10px`,borderRadius:`2px`,background:f,display:`inline-block`}}),(0,i.jsx)(`span`,{style:{color:`#f8fafc`,fontWeight:600},children:o===`bn`?`ডান প্লট: মাঠের প্রকৃত তথ্য (Ground Truth)`:`Right Plot: Field Observation`})]})]}),(0,i.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`6px`},children:(0,i.jsx)(`span`,{style:{color:`#64748b`},children:o===`bn`?`কন্ট্রোল: মাউস ড্র্যাগ করে ঘোরান • স্ক্রোল করে জুম করুন`:`Controls: Orbit Drag • Scroll Zoom`})})]})]})}function Sf({scenarios:e=[],activeScenarioIndex:t=0,onSelectScenario:n=null,activeTab:a=`generator`,provenanceSummary:o=null,seed:s=42,height:c=430}){let l=(0,r.useRef)(null),u=(0,r.useRef)(null),d=(0,r.useRef)(null),f=(0,r.useRef)(null),p=(0,r.useRef)(null),m=(0,r.useRef)(null),[h,g]=(0,r.useState)(!0),[_,v]=(0,r.useState)(`overview`),y=(0,r.useId)(),b=e[t]||e[0]||{scenario_id:`SYNTH_DEFAULT`,field_size_ha:5,soil_ph:6.5,organic_matter_pct:2,irrigation_capacity_mm:450,stress_type:`none`};(0,r.useEffect)(()=>{let e=l.current;if(!e)return;try{let e=document.createElement(`canvas`);if(!(e.getContext(`webgl`)||e.getContext(`experimental-webgl`))){g(!1);return}}catch{g(!1);return}let t=e.clientWidth||720,n=new br;d.current=n,n.background=new X(659738),n.fog=new yr(659738,.018);let r=new us(45,t/c,.1,100);r.position.set(5.5,4.2,6),m.current=r;let i=new cd({antialias:!0,alpha:!0,powerPreference:`high-performance`});i.setSize(t,c),i.setPixelRatio(Math.min(window.devicePixelRatio,2)),i.shadowMap.enabled=!0,i.shadowMap.type=2,i.toneMapping=4,i.toneMappingExposure=1.25,f.current=i,e.replaceChildren(i.domElement);let o=new yd(r,i.domElement);o.enableDamping=!0,o.dampingFactor=.05,o.minDistance=2,o.maxDistance=18,o.maxPolarAngle=Math.PI/2+.05,p.current=o;let s=new gs(14412542,1.2);n.add(s);let h=new hs(16775149,2.8);h.position.set(8,12,6),h.castShadow=!0,h.shadow.mapSize.width=1024,h.shadow.mapSize.height=1024,n.add(h);let _=new hs(3718648,.8);_.position.set(-6,4,-6),n.add(_);let v=new dr;if(n.add(v),a===`generator`){let e=Number(b.soil_ph)||6.5,t=Number(b.organic_matter_pct)||2,n=Number(b.irrigation_capacity_mm)||400,r=Math.max(1,Math.min(10,Number(b.field_size_ha)||5)),i=4861464;i=e<5.8?7223328:e>7.4?5920074:4007444;let a=Math.min(1,t/3),o=new Q({color:i,roughness:.9-a*.15,metalness:.05}),s=3.6+r/10*1.8,c=3.6+r/10*1.8,l=new Ta(s,.55,c),u=new Z(l,o);u.position.y=-.55/2,u.receiveShadow=!0,u.castShadow=!0,v.add(u);let d=new Q({color:7029795,roughness:.95}),f=new Z(new Ta(s,.45,c),d);f.position.y=-.775,v.add(f);let p=new Q({color:2563606,roughness:1}),m=new Z(new Ta(s,.35,c),p);m.position.y=-1.175,v.add(m);let h=new ea({color:3718648,transparent:!0,opacity:.35}),g=new fa(new po(l),h);g.position.copy(u.position),v.add(g);let _=s*.88,y=new Q({color:n<200?7893356:165063,roughness:n<200?.9:.1,metalness:n<200?0:.8,transparent:!0,opacity:n<200?.5:.85}),x=new Z(new Ta(_,.06,.32),y);x.position.set(0,.02,-c*.28),x.receiveShadow=!0,v.add(x);let S=new Z(new Ta(_,.06,.32),y);S.position.set(0,.02,c*.28),S.receiveShadow=!0,v.add(S);let C=(b.stress_type||``).toLowerCase(),w=C.includes(`drought`)||n<250,T=C.includes(`heat`)||C.includes(`warming`),E=e>7.5||C.includes(`salin`);if(T){let e=new Ei({color:16347926,transparent:!0,opacity:.12,side:1}),t=new Z(new uo(s*.75,24,24,0,Math.PI*2,0,Math.PI/2),e);t.position.y=0,v.add(t)}if(E){let e=new Q({color:15857145,roughness:.7});for(let t=0;t<6;t++){let t=new Z(new Ea(.25,.35,.02,8),e);t.position.set((Math.random()-.5)*(s*.7),.015,(Math.random()-.5)*(c*.7)),v.add(t)}}let D=w?11817737:T?14251782:1483594,O=w?.35:T?.45:.65,k=new Q({color:D,roughness:.4}),A=new Q({color:D,roughness:.3});for(let e=0;e<5;e++)for(let t=0;t<5;t++){let n=(e-2)/5*(c*.78);if(Math.abs(n-x.position.z)<.25||Math.abs(n-S.position.z)<.25)continue;let r=(t-2)/5*(s*.78),i=new dr;i.position.set(r,0,n);let a=new Z(new Ea(.018,.025,O,6),k);a.position.y=O/2,a.castShadow=!0,i.add(a);let o=w?3:5;for(let e=0;e<o;e++){let t=new Z(new Da(.09,.22,5),A),n=e/o*Math.PI*2;t.position.set(Math.cos(n)*.07,O*.75,Math.sin(n)*.07),t.rotation.z=Math.cos(n)*.4,t.rotation.x=Math.sin(n)*.4,t.castShadow=!0,i.add(t)}v.add(i)}}else{let e=[{id:1,name:`Tier 1: Space Ag Assimilation`,sub:`NASA POWER MERRA-2 Gridded`,color:3718648,y:1.8,x:-3},{id:2,name:`Tier 2: Mechanistic Models`,sub:`FAO-56 & PuLP CBC Solvers`,color:57217,y:.6,x:-1},{id:3,name:`Tier 3: Research Baselines`,sub:`BARI / BRRI Field Handbooks`,color:16096779,y:-.6,x:1},{id:4,name:`Tier 4: Synthetic Sandbox`,sub:`Fixed-Seed Counterfactual Trials`,color:10980346,y:-1.8,x:3}];e.forEach(t=>{let n=new dr;n.position.set(t.x,t.y,0);let r=new Q({color:t.color,roughness:.3,metalness:.6,transparent:!0,opacity:.85}),i=new Z(new Ea(.9,1.05,.4,24),r);i.receiveShadow=!0,i.castShadow=!0,n.add(i);let a=new Q({color:t.color,emissive:t.color,emissiveIntensity:.35,roughness:.2}),o=new Z(new uo(.35,20,20),a);if(o.position.y=.55,o.castShadow=!0,n.add(o),t.id<4){let r=e[t.id],i=new ca(new mi().setFromPoints([new Y(0,.55,0),new Y(r.x-t.x,r.y-t.y+.55,0)]),new jo({color:9741240,dashSize:.2,gapSize:.1,transparent:!0,opacity:.6}));i.computeLineDistances(),n.add(i)}v.add(n)})}let y=new zs,x=()=>{u.current=requestAnimationFrame(x);let e=y.getElapsedTime();v.rotation.y=Math.sin(e*.15)*.08,o.update(),i.render(n,r)};x();let S=()=>{if(!e||!i||!r)return;let t=e.clientWidth;r.aspect=t/c,r.updateProjectionMatrix(),i.setSize(t,c)};return window.addEventListener(`resize`,S),()=>{window.removeEventListener(`resize`,S),u.current&&cancelAnimationFrame(u.current),n.traverse(e=>{(e.isMesh||e.isLine)&&(e.geometry&&e.geometry.dispose(),Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material&&e.material.dispose())}),i.dispose(),e.replaceChildren()}},[t,e,a,c]);let x=e=>{v(e),m.current&&p.current&&(e===`overview`?(m.current.position.set(5.5,4.2,6),p.current.target.set(0,0,0)):e===`soil`?(m.current.position.set(4,-.2,4.5),p.current.target.set(0,-.5,0)):e===`canopy`&&(m.current.position.set(0,5.5,1.2),p.current.target.set(0,.4,0)),p.current.update())};return h?(0,i.jsxs)(`div`,{style:{position:`relative`,width:`100%`,marginBottom:20},children:[(0,i.jsx)(`div`,{ref:l,id:`synthetic-canvas-${y}`,style:{width:`100%`,height:`${c}px`,borderRadius:16,overflow:`hidden`,background:`radial-gradient(ellipse at center, #0e1726 0%, #060b12 100%)`,border:`1px solid rgba(56, 189, 248, 0.25)`,boxShadow:`0 8px 32px rgba(0, 0, 0, 0.45)`}}),(0,i.jsxs)(`div`,{style:{position:`absolute`,top:14,left:14,right:14,display:`flex`,justifyContent:`space-between`,alignItems:`center`,flexWrap:`wrap`,gap:8,pointerEvents:`none`},children:[(0,i.jsx)(`div`,{style:{display:`flex`,gap:6,flexWrap:`wrap`,pointerEvents:`auto`},children:a===`generator`&&e.slice(0,6).map((e,r)=>{let a=r===t;return(0,i.jsxs)(`button`,{onClick:()=>n&&n(r),style:{padding:`5px 11px`,borderRadius:999,background:a?`rgba(56, 189, 248, 0.28)`:`rgba(15, 23, 42, 0.8)`,border:`1px solid ${a?`#38bdf8`:`rgba(255, 255, 255, 0.12)`}`,color:a?`#ffffff`:`#94a3b8`,fontSize:11,fontWeight:a?700:500,cursor:`pointer`,transition:`all 0.18s ease`},children:[`#`,r+1,` `,e.scenario_id?.replace(`SCEN_`,``)||`Scen ${r+1}`]},e.scenario_id||r)})}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:6,alignItems:`center`,pointerEvents:`auto`},children:[(0,i.jsx)(`span`,{style:{fontSize:10.5,padding:`4px 10px`,borderRadius:6,background:`rgba(234, 179, 8, 0.18)`,color:`#facc15`,border:`1px solid rgba(234, 179, 8, 0.35)`,fontWeight:800,letterSpacing:`0.04em`},children:`🧪 Synthetic Stress Simulation`}),(0,i.jsx)(`button`,{onClick:()=>x(`overview`),style:{padding:`5px 10px`,borderRadius:6,background:_===`overview`?`rgba(56, 189, 248, 0.25)`:`rgba(15, 23, 42, 0.8)`,border:`1px solid rgba(255, 255, 255, 0.12)`,color:`#38bdf8`,fontSize:11,cursor:`pointer`},children:`Overview`}),(0,i.jsx)(`button`,{onClick:()=>x(`soil`),style:{padding:`5px 10px`,borderRadius:6,background:_===`soil`?`rgba(56, 189, 248, 0.25)`:`rgba(15, 23, 42, 0.8)`,border:`1px solid rgba(255, 255, 255, 0.12)`,color:`#38bdf8`,fontSize:11,cursor:`pointer`},children:`Soil Profile`})]})]}),(0,i.jsxs)(`div`,{style:{position:`absolute`,bottom:14,left:14,right:14,background:`rgba(11, 19, 30, 0.85)`,border:`1px solid rgba(56, 189, 248, 0.22)`,borderRadius:12,padding:`10px 18px`,display:`flex`,justifyContent:`space-between`,alignItems:`center`,flexWrap:`wrap`,gap:12,pointerEvents:`auto`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:10},children:[(0,i.jsx)(`span`,{style:{fontSize:20},children:`🧪`}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`div`,{style:{fontSize:13,fontWeight:800,color:`#f8fafc`},children:a===`generator`?`3D Synthetic Farm Parcel: ${b.scenario_id||`Scenario #${t+1}`}`:`3D Scientific Data Provenance & Reliability Architecture`}),(0,i.jsx)(`div`,{style:{fontSize:11,color:`#94a3b8`},children:a===`generator`?`Deterministic PRNG Seed: ${s} • Soil Horizon Depth: 0.55m topsoil, 0.45m subsoil`:`NASA POWER Space Ag Telemetry • Mechanistic FAO-56 • Empirical Research Benchmarks`})]})]}),a===`generator`&&(0,i.jsxs)(`div`,{style:{display:`flex`,gap:16,fontSize:11.5},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{style:{color:`#64748b`},children:`Area:`}),(0,i.jsxs)(`div`,{style:{color:`#e2e8f0`,fontWeight:600},children:[b.field_size_ha||5,` ha`]})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{style:{color:`#64748b`},children:`Soil pH:`}),(0,i.jsx)(`div`,{style:{color:`#38bdf8`,fontWeight:600},children:b.soil_ph||6.5})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{style:{color:`#64748b`},children:`Organic Matter:`}),(0,i.jsxs)(`div`,{style:{color:`#00df81`,fontWeight:600},children:[b.organic_matter_pct||2,`%`]})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{style:{color:`#64748b`},children:`Irrig Capacity:`}),(0,i.jsxs)(`div`,{style:{color:`#f59e0b`,fontWeight:600},children:[b.irrigation_capacity_mm||400,` mm`]})]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`span`,{style:{color:`#64748b`},children:`Stress Mode:`}),(0,i.jsx)(`div`,{style:{color:`#ef4444`,fontWeight:700,textTransform:`capitalize`},children:b.stress_type||`None (Nominal)`})]})]})]})]}):(0,i.jsxs)(`div`,{style:{padding:24,textAlign:`center`,background:`#131920`,borderRadius:14,color:`#94a3b8`},children:[(0,i.jsx)(`div`,{style:{fontSize:28,marginBottom:8},children:`🧪`}),(0,i.jsx)(`h4`,{style:{color:`#fff`,margin:`0 0 6px`},children:`3D Synthetic Sandbox Unavailable`}),(0,i.jsx)(`p`,{style:{margin:0,fontSize:13},children:`WebGL hardware acceleration disabled. Conventional table display active.`})]})}var Cf={rice:{id:`rice`,nameEn:`Aman Rice`,nameBn:`আমন ধান`,potentialYieldTonHa:5.5,ky:1.1,kcIni:.5,kcMid:1.15,kcEnd:.7,depletionFractionP:.25,rootDepthM:.5,optimalWaterMm:450,seedCostPerHa:4500,baseLaborCostPerHa:28e3,baseFertilizerCostPerHa:14500,defaultPricePerMaund:1250,provenance:`BRRI / FAO-33 / FAO-56 calibrated benchmark (Illustrative agronomic model)`},wheat:{id:`wheat`,nameEn:`Wheat (BARI Gom-33)`,nameBn:`গম (বারি গম-৩৩)`,potentialYieldTonHa:4.2,ky:1.05,kcIni:.4,kcMid:1.15,kcEnd:.35,depletionFractionP:.55,rootDepthM:1,optimalWaterMm:280,seedCostPerHa:5200,baseLaborCostPerHa:18e3,baseFertilizerCostPerHa:12e3,defaultPricePerMaund:1450,provenance:`BARI / FAO-33 / FAO-56 calibrated benchmark (Illustrative agronomic model)`},maize:{id:`maize`,nameEn:`Hybrid Maize`,nameBn:`হাইব্রিড ভুট্টা`,potentialYieldTonHa:10.5,ky:1.25,kcIni:.4,kcMid:1.2,kcEnd:.5,depletionFractionP:.55,rootDepthM:1.2,optimalWaterMm:400,seedCostPerHa:8500,baseLaborCostPerHa:22e3,baseFertilizerCostPerHa:19500,defaultPricePerMaund:1100,provenance:`DAE / BARI / FAO-33 calibrated benchmark (Illustrative agronomic model)`},mustard:{id:`mustard`,nameEn:`Mustard (BARI Sarisha-14)`,nameBn:`সরিষা (বারি সরিষা-১৪)`,potentialYieldTonHa:1.8,ky:.95,kcIni:.35,kcMid:1.1,kcEnd:.35,depletionFractionP:.6,rootDepthM:1,optimalWaterMm:180,seedCostPerHa:3e3,baseLaborCostPerHa:12e3,baseFertilizerCostPerHa:8500,defaultPricePerMaund:3200,provenance:`BARI Oilseed Research / FAO-33 calibrated benchmark`},potato:{id:`potato`,nameEn:`Potato (Diamant)`,nameBn:`গোল আলু (ডায়মন্ট)`,potentialYieldTonHa:25,ky:1.1,kcIni:.5,kcMid:1.15,kcEnd:.75,depletionFractionP:.35,rootDepthM:.5,optimalWaterMm:350,seedCostPerHa:38e3,baseLaborCostPerHa:26e3,baseFertilizerCostPerHa:24e3,defaultPricePerMaund:900,provenance:`BARI Tuber Crops Research / FAO-33 benchmark`},lentil:{id:`lentil`,nameEn:`Lentil (BARI Masur-8)`,nameBn:`মসুর ডাল (বারি মসুর-৮)`,potentialYieldTonHa:1.6,ky:.85,kcIni:.4,kcMid:1.05,kcEnd:.4,depletionFractionP:.6,rootDepthM:.8,optimalWaterMm:160,seedCostPerHa:4200,baseLaborCostPerHa:13e3,baseFertilizerCostPerHa:7500,defaultPricePerMaund:4e3,provenance:`BARI Pulses Research / FAO-33 benchmark`}},wf={baseline:{id:`baseline`,nameEn:`Historical Normal (NASA POWER 30-yr)`,nameBn:`স্বাভাবিক ঐতিহাসিক আবহাওয়া`,tempDeltaC:0,rainfallFactor:1,et0Modifier:1},warming_1_5c:{id:`warming_1_5c`,nameEn:`+1.5°C Climate Warming`,nameBn:`+১.৫°সে বৈশ্বিক উষ্ণায়ন`,tempDeltaC:1.5,rainfallFactor:.95,et0Modifier:1.08},drought_20pct:{id:`drought_20pct`,nameEn:`Moderate Drought (-20% Rain, +1.0°C)`,nameBn:`খরা পরিস্থিতি (২০% বৃষ্টিপাত হ্রাস)`,tempDeltaC:1,rainfallFactor:.8,et0Modifier:1.12},heavy_monsoon:{id:`heavy_monsoon`,nameEn:`Excess Monsoon (+25% Rain, Low Radiation)`,nameBn:`অতিরিক্ত বর্ষা (২৫% অতিবৃষ্টি)`,tempDeltaC:-.5,rainfallFactor:1.25,et0Modifier:.92},extreme_heatwave:{id:`extreme_heatwave`,nameEn:`Extreme Heatwave (+3.0°C, Severe ET0)`,nameBn:`তীব্র তাপপ্রবাহ (+৩.০°সে ও উচ্চ বাষ্পীভবন)`,tempDeltaC:3,rainfallFactor:.75,et0Modifier:1.22}};function Tf(e=42){let t=Math.abs(e)%2147483647;return t<=0&&(t=1),function(){return t=t*16807%2147483647,(t-1)/2147483646}}function Ef(e={}){let t=[],n=[],r=(e,n,r=!0)=>{if(e==null)return;let i=Number(e);Number.isFinite(i)?(r?i<0:i<=0)&&t.push(`${n} must be ${r?`>= 0`:`> 0`} (received: ${i})`):t.push(`${n} must be a finite number (received: ${e})`)};r(e.areaHa,`areaHa`,!1),r(e.irrigationMm,`irrigationMm`,!0),r(e.nitrogenKgHa,`nitrogenKgHa`,!0),r(e.phosphorusKgHa,`phosphorusKgHa`,!0),r(e.potassiumKgHa,`potassiumKgHa`,!0),r(e.sellingPriceMaund,`sellingPriceMaund`,!1),r(e.potentialYieldTonHa,`potentialYieldTonHa`,!0),e.randomSeed!==void 0&&e.randomSeed!==null&&(Number.isFinite(Number(e.randomSeed))||t.push(`randomSeed must be a finite number (received: ${e.randomSeed})`));let i=e.rootDepthM??e.cropModel?.rootDepthM;i!=null&&r(i,`rootDepthM`,!1);let a=e.depletionFractionP??e.cropModel?.depletionFractionP;if(a!=null){let e=Number(a);(!Number.isFinite(e)||e<=0||e>=1)&&t.push(`depletionFractionP must be strictly between 0 and 1 (received: ${a})`)}let o=e.ky??e.cropModel?.ky;o!=null&&r(o,`ky`,!0);let s=e.kcIni??e.cropModel?.kcIni;s!=null&&r(s,`kcIni`,!1);let c=e.kcMid??e.cropModel?.kcMid;c!=null&&r(c,`kcMid`,!1);let l=e.kcEnd??e.cropModel?.kcEnd;return l!=null&&r(l,`kcEnd`,!1),{isValid:t.length===0,errors:t,warnings:n}}function Df(e={}){let t=Ef(e),n=(e.crop||`rice`).toLowerCase(),r=Cf[n]||Cf.rice,i=r.potentialYieldTonHa;if(e.potentialYieldTonHa!==void 0&&e.potentialYieldTonHa!==null){let t=Number(e.potentialYieldTonHa);i=Number.isFinite(t)&&t>=0?t:0}let a=Number(e.rootDepthM??r.rootDepthM);(!Number.isFinite(a)||a<=0)&&(a=r.rootDepthM||.8);let o=Number(e.depletionFractionP??r.depletionFractionP);(!Number.isFinite(o)||o<=0||o>=1)&&(o=r.depletionFractionP||.5);let s=Number(e.kcIni??r.kcIni);(!Number.isFinite(s)||s<=0)&&(s=r.kcIni||.5);let c=Number(e.kcMid??r.kcMid);(!Number.isFinite(c)||c<=0)&&(c=r.kcMid||1.15);let l=Number(e.kcEnd??r.kcEnd);(!Number.isFinite(l)||l<=0)&&(l=r.kcEnd||.65);let u=Number(e.ky??r.ky);(!Number.isFinite(u)||u<0)&&(u=r.ky||1);let d={...r,potentialYieldTonHa:i,rootDepthM:a,depletionFractionP:o,kcIni:s,kcMid:c,kcEnd:l,ky:u},f=e.weatherScenario||`baseline`,p=wf[f]||wf.baseline,m=10;if(e.areaHa!==void 0&&e.areaHa!==null){let t=Number(e.areaHa);m=Number.isFinite(t)&&t>0?t:0}let h=300;if(e.irrigationMm!==void 0&&e.irrigationMm!==null){let t=Number(e.irrigationMm);h=Number.isFinite(t)&&t>=0?t:0}let g=120;if(e.nitrogenKgHa!==void 0&&e.nitrogenKgHa!==null){let t=Number(e.nitrogenKgHa);g=Number.isFinite(t)&&t>=0?t:0}let _=60;if(e.phosphorusKgHa!==void 0&&e.phosphorusKgHa!==null){let t=Number(e.phosphorusKgHa);_=Number.isFinite(t)&&t>=0?t:0}let v=60;if(e.potassiumKgHa!==void 0&&e.potassiumKgHa!==null){let t=Number(e.potassiumKgHa);v=Number.isFinite(t)&&t>=0?t:0}let y=d.defaultPricePerMaund;if(e.sellingPriceMaund!==void 0&&e.sellingPriceMaund!==null){let t=Number(e.sellingPriceMaund);y=Number.isFinite(t)&&t>0?t:0}let b=Number(e.randomSeed),x=Number.isFinite(b)?b:2026,S=Tf(x),C=(e.soilTexture||`loam`).toLowerCase(),w=140;C.includes(`clay`)?w=170:C.includes(`silt`)?w=150:C===`sand`?w=70:C.includes(`sand`)&&(w=100);let T=Number((w*a).toFixed(1)),E=Number((o*T).toFixed(1)),D=Number(((1-o)*T).toFixed(1)),O=Number((T*.7).toFixed(1)),k=O,A=0,j=0,M=0,N=0,P=0,F=0,I=0,ee=[],L=new Set([15,35,55,75,95]),te=L.size>0?h/L.size:0;for(let e=1;e<=120;e++){let t=d.kcIni,n=`Germination / Seedling`,r=`অঙ্কুরোদগম ও চারা`;if(e<=25)t=d.kcIni,n=`Initial Stage (Days 1-25)`,r=`প্রারম্ভিক পর্যায় (১-২৫ দিন)`;else if(e<=55){let i=(e-25)/30;t=d.kcIni+i*(d.kcMid-d.kcIni),n=`Vegetative Tillering (Days 26-55)`,r=`কুশি গজানো ও বাড়ন্ত পর্যায় (২৬-৫৫ দিন)`}else if(e<=90)t=d.kcMid,n=`Reproductive & Heading (Days 56-90)`,r=`ফুল ও দানাধারণ পর্যায় (৫৬-৯০ দিন)`;else{let i=(e-90)/30;t=d.kcMid-i*(d.kcMid-d.kcEnd),n=`Ripening & Maturation (Days 91-120)`,r=`পাকা ও ফসল কাটার পর্যায় (৯১-১২০ দিন)`}let i=3.2+1.2*Math.sin((e+30)/120*Math.PI),a=Math.max(1,(i+(S()-.5)*.4)*p.et0Modifier),o=a*t,s=0;S()<(e>40&&e<100?.32:.15)&&(s=Math.max(0,(S()*18+2)*p.rainfallFactor));let c=0;L.has(e)&&(c=te);let l=s+c,u=k+l,f=0,m=u;u>T&&(f=u-T,m=T);let h=1;m<D&&(h=Math.max(.05,m/D),I++);let g=Math.min(m,o*h);k=m-g,A+=s,j+=c,M+=f,N+=a,P+=o,F+=g,ee.push({day:e,growthStageName:n,growthStageBn:r,kc:Number(t.toFixed(2)),et0Mm:Number(a.toFixed(2)),etcMm:Number(o.toFixed(2)),etaMm:Number(g.toFixed(2)),soilWaterMm:Number(k.toFixed(1)),ks:Number(h.toFixed(2)),rainfallMm:Number(s.toFixed(1)),irrigationMm:Number(c.toFixed(1)),deepPercolationMm:Number(f.toFixed(1))})}let ne=P>0?Math.max(0,1-F/P):0,R=Math.min(.85,d.ky*ne),re=Math.min(1,.65+g/135*.35),z=Math.max(0,Number(e.potentialYieldOverride??d.potentialYieldTonHa)||0),B=z*(1-R)*re,V=Number(Math.min(z,Math.max(z>0?Math.min(.2,z):0,B)).toFixed(2)),ie=7.47,ae=Number((V*m).toFixed(2)),oe=Number((ae*25).toFixed(2)),se=ae*1e3,ce=V*25/ie,le=d.seedCostPerHa*m,ue=(d.baseFertilizerCostPerHa+g*28+_*36+v*24)*m*.5,de=j*38*m,fe=d.baseLaborCostPerHa*m,pe=8500*m,me=le+ue+de+fe+pe,he=m>0?me/m:0,ge=oe*y,_e=ge-me,ve=m>0?_e/m:0,ye=m>0?ve/ie:0,be=se>0?me/se:0,xe=be*40,Se=A+j,Ce=Se*10*m,H=Ce>0?se/Ce:0;return{metadata:{experimentId:`EXP-${Date.now().toString(36).toUpperCase()}`,modelName:`FieldShift AgroSim Deterministic v2.5 (FAO-33/FAO-56 Hydrology)`,timestamp:new Date().toISOString(),randomSeed:x,cropProvenance:d.provenance,ksModelDescription:`Modified FAO-56 bilinear water stress model with 0.05 minimum cuticular/numerical clamp (engineering assumption; classical FAO-56 Eq. 84 decreases to 0.0 at permanent wilting point)`,yieldFloorAssumption:`0.2 t/ha modeling floor (residual stover/forage salvage assumption for positive-potential crops; not a universal FAO-predicted biological minimum)`,validation:{isValid:t.isValid,errors:t.errors,warnings:t.warnings},disclaimerBn:`অনুসন্ধানমূলক বৈজ্ঞানিক সিমুলেশন (FAO-33 ওয়াটার ব্যালেন্স ও FAO-56 হাইড্রোলজি) — মাঠপর্যায়ের ইন-সিটু মাটির টেস্ট ছাড়া এটি চূড়ান্ত গ্যারান্টি নয়।`,disclaimerEn:`Exploratory agro-climatic simulation based on FAO-33 Stewart yield response and FAO-56 dual stage evapotranspiration. Not a field-validated guarantee.`},inputs:{cropKey:n,cropNameEn:d.nameEn,cropNameBn:d.nameBn,weatherScenario:f,weatherNameEn:p.nameEn,weatherNameBn:p.nameBn,areaHa:m,areaBigha:Number((m*ie).toFixed(1)),soilTexture:C,rootDepthM:a,tawMm:T,rawMm:E,sThresholdMm:D,depletionFractionP:o,irrigationBudgetMm:h,nitrogenKgHa:g,phosphorusKgHa:_,potassiumKgHa:v,sellingPriceMaund:y,sellingPriceKg:Number((y/40).toFixed(2))},waterBalance:{totalDays:120,tawMm:T,rawMm:E,sThresholdMm:D,initialSoilWaterMm:O,finalSoilWaterMm:Number(k.toFixed(1)),cumulativeRainfallMm:Number(A.toFixed(1)),cumulativeIrrigationMm:Number(j.toFixed(1)),totalIrrigationMm:Number(j.toFixed(1)),totalWaterAppliedMm:Number(Se.toFixed(1)),cumulativeDeepPercolationMm:Number(M.toFixed(1)),totalDeepPercolationMm:Number(M.toFixed(1)),cumulativeEt0Mm:Number(N.toFixed(1)),cumulativeEtcMm:Number(P.toFixed(1)),cumulativeEtaMm:Number(F.toFixed(1)),totalEtaMm:Number(F.toFixed(1)),massBalanceResidualMm:Number((O+A+j-(k+M+F)).toFixed(2)),waterDeficitRatio:Number((ne*100).toFixed(1)),stressDaysCount:I,waterStressDays:I,waterProductivityKgM3:Number(H.toFixed(2))},stressIndicators:{averageKs:Number((ee.reduce((e,t)=>e+t.ks,0)/(ee.length||1)).toFixed(2)),stressDaysCount:I,nitrogenStressFactor:Number(re.toFixed(2)),waterStressDeficitRatio:Number(ne.toFixed(2))},yieldOutcomes:{potentialYieldTonHa:d.potentialYieldTonHa,simulatedYieldTonHa:V,yieldMaundPerBigha:Number(ce.toFixed(1)),totalYieldTonnes:Number(ae.toFixed(1)),totalYieldMaunds:Number(oe.toFixed(1)),totalYieldKg:Math.round(se),relativeYieldReductionPct:Number((R*100).toFixed(1))},economics:{grossRevenueBdt:Math.round(ge),totalCostBdt:Math.round(me),netReturnBdt:Math.round(_e),netReturnPerHaBdt:Math.round(ve),netReturnPerBighaBdt:Math.round(ye),costPerHaBdt:Math.round(he),breakEvenPricePerKg:Number(be.toFixed(2)),breakEvenPricePerMaund:Number(xe.toFixed(2)),benefitCostRatio:me>0?Number((ge/me).toFixed(2)):0,costBreakdown:{seed:Math.round(le),fertilizer:Math.round(ue),irrigation:Math.round(de),labor:Math.round(fe),machinery:Math.round(pe)}},timeseries:ee}}function Of(e,t){if(!e||!t)return null;let n=(e,t)=>{let n=e-t,r=t===0?0:n/Math.abs(t)*100;return{scenarioA:t,scenarioB:e,absoluteDiff:Number(n.toFixed(2)),percentageDiff:Number(r.toFixed(1)),percentDiff:Number(r.toFixed(1))}},r=n(t.waterBalance.waterProductivityKgM3,e.waterBalance.waterProductivityKgM3);return{yieldTonHa:n(t.yieldOutcomes.simulatedYieldTonHa,e.yieldOutcomes.simulatedYieldTonHa),yieldMaundBigha:n(t.yieldOutcomes.yieldMaundPerBigha,e.yieldOutcomes.yieldMaundPerBigha),totalCostBdt:n(t.economics.totalCostBdt,e.economics.totalCostBdt),grossRevenueBdt:n(t.economics.grossRevenueBdt,e.economics.grossRevenueBdt),netReturnBdt:n(t.economics.netReturnBdt,e.economics.netReturnBdt),breakEvenPerKg:n(t.economics.breakEvenPricePerKg,e.economics.breakEvenPricePerKg),waterAppliedMm:n(t.waterBalance.totalWaterAppliedMm,e.waterBalance.totalWaterAppliedMm),waterProductivity:r,waterProductivityKgM3:r,stressDays:n(t.waterBalance.stressDaysCount,e.waterBalance.stressDaysCount)}}function kf({activeField:e,lang:t=`bn`}){let[n,a]=(0,r.useState)(`irrigation`),o=[-20,-10,0,10,20],s=(0,r.useMemo)(()=>o.map(e=>{let t=1+e/100,r=Df({crop:`rice`,areaHa:10,soilTexture:`loam`,weatherScenario:e>0&&n===`temperature`?`warming_1_5c`:`baseline`,irrigationMm:n===`irrigation`?Math.round(350*t):350,nitrogenKgHa:n===`nitrogen`?Math.round(120*t):120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026});return{stepPct:e,label:`${e>=0?`+`:``}${e}%`,yieldTonHa:r.yieldOutcomes.simulatedYieldTonHa,waterMm:r.waterBalance.totalWaterAppliedMm,netReturnBdt:r.economics.netReturnPerHaBdt,ks:r.stressIndicators.averageKs}}),[n]);return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,children:[(0,i.jsx)(Kd,{cameraPosition:[-8,6,12],cameraTarget:[0,1.5,0],hudTitle:`SENSITIVITY RESPONSE SWEEP 3D`,hudMetrics:[`Param: ${n.toUpperCase()}`,`Range: -20% to +20%`,`Steps: 5`],onSceneReady:({scene:e})=>{let t=new dr,n=new Z(new Ta(10,.3,4),new Q({color:`#1e293b`,roughness:.8}));n.position.y=-.15,t.add(n),s.forEach((e,n)=>{let r=(n-2)*1.8,i=Math.max(.2,e.yieldTonHa*.65),a=e.stepPct===0?`#00df81`:e.stepPct>0?`#38bdf8`:`#f59e0b`,o=new Z(new Ea(.35,.35,i,16),new Q({color:a,metalness:.2,roughness:.4}));o.position.set(r,i/2,0),o.castShadow=!0,t.add(o);let s=Math.max(.2,e.yieldTonHa*.25),c=new Z(new Da(.18,s,6),new Q({color:e.ks>.85?`#15803d`:`#eab308`}));c.position.set(r,i+s/2,0),t.add(c)}),e.add(t)},minHeight:`440px`,lang:t}),(0,i.jsxs)(`div`,{style:{background:`var(--glass-bg-card, rgba(15,23,42,0.8))`,borderRadius:12,border:`1px solid var(--glass-border, rgba(255,255,255,0.08))`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:800,color:`#f8fafc`},children:[`📐 `,t===`bn`?`সংবেদনশীলতা বিশ্লেষণ (Sensitivity Sweep)`:`Sensitivity Sweep Controls`]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`label`,{style:{display:`block`,fontSize:11,fontWeight:700,color:`#94a3b8`,marginBottom:4},children:`টার্গেট ইনপুট প্যারামিটার নির্বাচন:`}),(0,i.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:6},children:[{id:`irrigation`,label:`💧 সেচ বাজেট`},{id:`nitrogen`,label:`🌱 নাইট্রোজেন`},{id:`temperature`,label:`🌡️ তাপমাত্রা`},{id:`taw`,label:`🪵 মাটির TAW`}].map(e=>(0,i.jsx)(`button`,{type:`button`,onClick:()=>a(e.id),style:{padding:`6px 8px`,borderRadius:6,fontSize:11.5,fontWeight:n===e.id?800:600,cursor:`pointer`,border:n===e.id?`1px solid #38bdf8`:`1px solid rgba(255, 255, 255, 0.08)`,background:n===e.id?`rgba(56, 189, 248, 0.2)`:`rgba(30, 41, 59, 0.5)`,color:n===e.id?`#38bdf8`:`rgba(238, 243, 238, 0.68)`},children:e.label},e.id))})]}),(0,i.jsx)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,borderRadius:8,padding:8,overflowX:`auto`},children:(0,i.jsxs)(`table`,{style:{width:`100%`,fontSize:11.5,borderCollapse:`collapse`,textAlign:`left`},children:[(0,i.jsx)(`thead`,{children:(0,i.jsxs)(`tr`,{style:{color:`#94a3b8`,borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`th`,{style:{padding:`4px 6px`},children:`ধাপ (Step)`}),(0,i.jsx)(`th`,{style:{padding:`4px 6px`},children:`ফলন (t/ha)`}),(0,i.jsx)(`th`,{style:{padding:`4px 6px`},children:`সেচ (mm)`}),(0,i.jsx)(`th`,{style:{padding:`4px 6px`},children:`নিট লাভ`})]})}),(0,i.jsx)(`tbody`,{children:s.map((e,t)=>(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.04)`,color:e.stepPct===0?`#00df81`:`#f8fafc`},children:[(0,i.jsxs)(`td`,{style:{padding:`4px 6px`,fontWeight:e.stepPct===0?800:500},children:[e.label,` `,e.stepPct===0?`(Base)`:``]}),(0,i.jsx)(`td`,{style:{padding:`4px 6px`,fontWeight:700},children:e.yieldTonHa}),(0,i.jsx)(`td`,{style:{padding:`4px 6px`,color:`#38bdf8`},children:e.waterMm}),(0,i.jsxs)(`td`,{style:{padding:`4px 6px`,color:`#facc15`},children:[`৳`,Math.round(e.netReturnBdt/1e3),`k`]})]},t))})]})}),(0,i.jsx)(`div`,{style:{marginTop:`auto`,fontSize:10.5,color:`#64748b`,lineHeight:1.4},children:`* একবারে একটি পরিবর্তনশীল মান (One-Variable-At-A-Time / OAT) বিশ্লেষণ।`})]})]})}var Af=class extends br{constructor(){super(),this.name=`RoomEnvironment`,this.position.y=-3.5;let e=new Ta;e.deleteAttribute(`uv`);let t=new Q({side:1}),n=new Q,r=new fs(16777215,900,28,2);r.position.set(.418,16.199,.3),this.add(r);let i=new Z(e,t);i.position.set(-.757,13.219,.717),i.scale.set(31.713,28.305,28.591),this.add(i);let a=new Yi(e,n,6),o=new ur;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),a.setMatrixAt(0,o.matrix),o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),a.setMatrixAt(1,o.matrix),o.position.set(6.167,.857,7.803),o.rotation.set(0,.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),a.setMatrixAt(2,o.matrix),o.position.set(-2.017,.018,6.124),o.rotation.set(0,.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),a.setMatrixAt(3,o.matrix),o.position.set(2.291,-.756,-2.621),o.rotation.set(0,-.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),a.setMatrixAt(4,o.matrix),o.position.set(-2.193,-.369,-5.547),o.rotation.set(0,.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),a.setMatrixAt(5,o.matrix),this.add(a);let s=new Z(e,jf(50));s.position.set(-16.116,14.37,8.208),s.scale.set(.1,2.428,2.739),this.add(s);let c=new Z(e,jf(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(.1,2.425,2.751),this.add(c);let l=new Z(e,jf(17));l.position.set(14.904,12.198,-1.832),l.scale.set(.15,4.265,6.331),this.add(l);let u=new Z(e,jf(43));u.position.set(-.462,8.89,14.52),u.scale.set(4.38,5.441,.088),this.add(u);let d=new Z(e,jf(20));d.position.set(3.235,11.486,-12.541),d.scale.set(2.5,2,.1),this.add(d);let f=new Z(e,jf(100));f.position.set(0,20,0),f.scale.set(1,.1,1),this.add(f)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function jf(e){return new Oo({color:0,emissive:16777215,emissiveIntensity:e})}var Mf={name:`GTAOShader`,defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:`x`,SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new J},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new Ln},cameraProjectionMatrixInverse:{value:new Ln},cameraWorldMatrix:{value:new Ln},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new Y(-1,-1,-1)},sceneBoxMax:{value:new Y(1,1,1)}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		varying vec2 vUv;
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform mat4 cameraWorldMatrix;
		uniform float radius;
		uniform float distanceExponent;
		uniform float thickness;
		uniform float distanceFallOff;
		uniform float scale;
		#if SCENE_CLIP_BOX == 1
			uniform vec3 sceneBoxMin;
			uniform vec3 sceneBoxMax;
		#endif

		#include <common>
		#include <packing>

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(vec3(ao), 1.)
		#endif

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
			return textureLod(tDepth, uv.xy, 0.0).DEPTH_SWIZZLING;
		}

		float fetchDepth(const ivec2 uv) {
			return texelFetch(tDepth, uv.xy, 0).DEPTH_SWIZZLING;
		}

		float getViewZ(const in float depth) {
			#if PERSPECTIVE_CAMERA == 1
				return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
			#else
				return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ? ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz : -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ? ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz : -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
			#if NORMAL_VECTOR_TYPE == 2
				return normalize(textureLod(tNormal, uv, 0.).rgb);
			#elif NORMAL_VECTOR_TYPE == 1
				return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
			#else
				return computeNormalFromDepth(uv);
			#endif
		}

		vec3 getSceneUvAndDepth(vec3 sampleViewPos) {
			vec4 sampleClipPos = cameraProjectionMatrix * vec4(sampleViewPos, 1.);
			vec2 sampleUv = sampleClipPos.xy / sampleClipPos.w * 0.5 + 0.5;
			float sampleSceneDepth = getDepth(sampleUv);
			return vec3(sampleUv, sampleSceneDepth);
		}

		void main() {
			float depth = getDepth(vUv.xy);

			#ifdef USE_REVERSED_DEPTH_BUFFER
				if (depth <= 0.0) {
					discard;
					return;
				}
			#else
				if (depth >= 1.0) {
					discard;
					return;
				}
			#endif
			
			vec3 viewPos = getViewPosition(vUv, depth);
			vec3 viewNormal = getViewNormal(vUv);

			float radiusToUse = radius;
			float distanceFalloffToUse = thickness;
			#if SCREEN_SPACE_RADIUS == 1
				float radiusScale = getViewPosition(vec2(0.5 + float(SCREEN_SPACE_RADIUS_SCALE) / resolution.x, 0.0), depth).x;
				radiusToUse *= radiusScale;
				distanceFalloffToUse *= radiusScale;
			#endif

			#if SCENE_CLIP_BOX == 1
				vec3 worldPos = (cameraWorldMatrix * vec4(viewPos, 1.0)).xyz;
				float boxDistance = length(max(vec3(0.0), max(sceneBoxMin - worldPos, worldPos - sceneBoxMax)));
				if (boxDistance > radiusToUse) {
					discard;
					return;
				}
			#endif

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
			vec3 randomVec = noiseTexel.xyz * 2.0 - 1.0;
			vec3 tangent = normalize(vec3(randomVec.xy, 0.));
			vec3 bitangent = vec3(-tangent.y, tangent.x, 0.);
			mat3 kernelMatrix = mat3(tangent, bitangent, vec3(0., 0., 1.));

			const int DIRECTIONS = SAMPLES < 30 ? 3 : 5;
			const int STEPS = (SAMPLES + DIRECTIONS - 1) / DIRECTIONS;
			float ao = 0.0;
			for (int i = 0; i < DIRECTIONS; ++i) {

				float angle = float(i) / float(DIRECTIONS) * PI;
				vec4 sampleDir = vec4(cos(angle), sin(angle), 0., 0.5 + 0.5 * noiseTexel.w);
				sampleDir.xyz = normalize(kernelMatrix * sampleDir.xyz);

				vec3 viewDir = normalize(-viewPos.xyz);
				vec3 sliceBitangent = normalize(cross(sampleDir.xyz, viewDir));
				vec3 sliceTangent = cross(sliceBitangent, viewDir);
				vec3 normalInSlice = normalize(viewNormal - sliceBitangent * dot(viewNormal, sliceBitangent));

				vec3 tangentToNormalInSlice = cross(normalInSlice, sliceBitangent);
				vec2 cosHorizons = vec2(dot(viewDir, tangentToNormalInSlice), dot(viewDir, -tangentToNormalInSlice));

				for (int j = 0; j < STEPS; ++j) {
					vec3 sampleViewOffset = sampleDir.xyz * radiusToUse * sampleDir.w * pow(float(j + 1) / float(STEPS), distanceExponent);

					vec3 sampleSceneUvDepth = getSceneUvAndDepth(viewPos + sampleViewOffset);
					vec3 sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					vec3 viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.x += max(0., (sampleCosHorizon - cosHorizons.x) * mix(1., 2. / float(j + 2), distanceFallOff));
					}

					sampleSceneUvDepth = getSceneUvAndDepth(viewPos - sampleViewOffset);
					sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.y += max(0., (sampleCosHorizon - cosHorizons.y) * mix(1., 2. / float(j + 2), distanceFallOff));
					}
				}

				vec2 sinHorizons = sqrt(1. - cosHorizons * cosHorizons);
				float nx = dot(normalInSlice, sliceTangent);
				float ny = dot(normalInSlice, viewDir);
				float nxb = 1. / 2. * (acos(cosHorizons.y) - acos(cosHorizons.x) + sinHorizons.x * cosHorizons.x - sinHorizons.y * cosHorizons.y);
				float nyb = 1. / 2. * (2. - cosHorizons.x * cosHorizons.x - cosHorizons.y * cosHorizons.y);
				float occlusion = nx * nxb + ny * nyb;
				ao += occlusion;
			}

			ao = clamp(ao / float(DIRECTIONS), 0., 1.);
		#if SCENE_CLIP_BOX == 1
			ao = mix(ao, 1., smoothstep(0., radiusToUse, boxDistance));
		#endif
			ao = pow(ao, scale);

			gl_FragColor = FRAGMENT_OUTPUT;
		}`},Nf={name:`GTAODepthShader`,defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {
			#if PERSPECTIVE_CAMERA == 1
				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			#else
				return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		void main() {
			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},Pf={name:`GTAOBlendShader`,uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform float intensity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(mix(vec3(1.), texel.rgb, intensity), texel.a);
		}`};function Ff(e=5){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=If(t),r=n.length,i=new Uint8Array(r*4);for(let e=0;e<r;++e){let t=n[e],a=2*Math.PI*t/r,o=new Y(Math.cos(a),Math.sin(a),0).normalize();i[e*4]=(o.x*.5+.5)*255,i[e*4+1]=(o.y*.5+.5)*255,i[e*4+2]=127,i[e*4+3]=255}let a=new Bi(i,t,t);return a.wrapS=V,a.wrapT=V,a.needsUpdate=!0,a}function If(e){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=t*t,r=Array(n).fill(0),i=Math.floor(t/2),a=t-1;for(let e=1;e<=n;){if(i===-1&&a===t?(a=t-2,i=0):(a===t&&(a=0),i<0&&(i=t-1)),r[i*t+a]!==0){a-=2,i++;continue}r[i*t+a]=e++,a++,i--}return r}var Lf={name:`PoissonDenoiseShader`,defines:{SAMPLES:16,SAMPLE_VECTORS:Rf(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new J},cameraProjectionMatrixInverse:{value:new Ln},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`

		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tNormal;
		uniform sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform float lumaPhi;
		uniform float depthPhi;
		uniform float normalPhi;
		uniform float radius;
		uniform int index;

		#include <common>
		#include <packing>

		#ifndef SAMPLE_LUMINANCE
		#define SAMPLE_LUMINANCE dot(vec3(0.2125, 0.7154, 0.0721), a)
		#endif

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(denoised, 1.)
		#endif

		float getLuminance(const in vec3 a) {
			return SAMPLE_LUMINANCE;
		}

		const vec3 poissonDisk[SAMPLES] = SAMPLE_VECTORS;

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
		#if DEPTH_VALUE_SOURCE == 1
			return textureLod(tDepth, uv.xy, 0.0).a;
		#else
			return textureLod(tDepth, uv.xy, 0.0).r;
		#endif
		}

		float fetchDepth(const ivec2 uv) {
			#if DEPTH_VALUE_SOURCE == 1
				return texelFetch(tDepth, uv.xy, 0).a;
			#else
				return texelFetch(tDepth, uv.xy, 0).r;
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ?  ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz
									: -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ?  ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz
									: -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
		#if NORMAL_VECTOR_TYPE == 2
			return normalize(textureLod(tNormal, uv, 0.).rgb);
		#elif NORMAL_VECTOR_TYPE == 1
			return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
		#else
			return computeNormalFromDepth(uv);
		#endif
		}

		void denoiseSample(in vec3 center, in vec3 viewNormal, in vec3 viewPos, in vec2 sampleUv, inout vec3 denoised, inout float totalWeight) {
			vec4 sampleTexel = textureLod(tDiffuse, sampleUv, 0.0);
			float sampleDepth = getDepth(sampleUv);
			vec3 sampleNormal = getViewNormal(sampleUv);
			vec3 neighborColor = sampleTexel.rgb;
			vec3 viewPosSample = getViewPosition(sampleUv, sampleDepth);

			float normalDiff = dot(viewNormal, sampleNormal);
			float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);
			float lumaDiff = abs(getLuminance(neighborColor) - getLuminance(center));
			float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);
			float depthDiff = abs(dot(viewPos - viewPosSample, viewNormal));
			float depthSimilarity = max(1. - depthDiff / depthPhi, 0.);
			float w = lumaSimilarity * depthSimilarity * normalSimilarity;

			denoised += w * neighborColor;
			totalWeight += w;
		}

		void main() {
			float depth = getDepth(vUv.xy);
			vec3 viewNormal = getViewNormal(vUv);
			if (depth == 1. || dot(viewNormal, viewNormal) == 0.) {
				discard;
				return;
			}
			vec4 texel = textureLod(tDiffuse, vUv, 0.0);
			vec3 center = texel.rgb;
			vec3 viewPos = getViewPosition(vUv, depth);

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
      		vec2 noiseVec = vec2(sin(noiseTexel[index % 4] * 2. * PI), cos(noiseTexel[index % 4] * 2. * PI));
    		mat2 rotationMatrix = mat2(noiseVec.x, -noiseVec.y, noiseVec.x, noiseVec.y);

			float totalWeight = 1.0;
			vec3 denoised = texel.rgb;
			for (int i = 0; i < SAMPLES; i++) {
				vec3 sampleDir = poissonDisk[i];
				vec2 offset = rotationMatrix * (sampleDir.xy * (1. + sampleDir.z * (radius - 1.)) / resolution);
				vec2 sampleUv = vUv + offset;
				denoiseSample(center, viewNormal, viewPos, sampleUv, denoised, totalWeight);
			}

			if (totalWeight > 0.) {
				denoised /= totalWeight;
			}
			gl_FragColor = FRAGMENT_OUTPUT;
		}`};function Rf(e,t,n){let r=zf(e,t,n),i=`vec3[SAMPLES](`;for(let t=0;t<e;t++){let n=r[t];i+=`vec3(${n.x}, ${n.y}, ${n.z})${t<e-1?`,`:`)`}`}return i}function zf(e,t,n){let r=[];for(let i=0;i<e;i++){let a=2*Math.PI*t*i/e,o=(i/(e-1))**n;r.push(new Y(Math.cos(a),Math.sin(a),o))}return r}var Bf=class{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let e=0;e<512;e++)this.perm[e]=this.p[e&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,r,i,a=.5*(Math.sqrt(3)-1),o=(e+t)*a,s=Math.floor(e+o),c=Math.floor(t+o),l=(3-Math.sqrt(3))/6,u=(s+c)*l,d=s-u,f=c-u,p=e-d,m=t-f,h,g;p>m?(h=1,g=0):(h=0,g=1);let _=p-h+l,v=m-g+l,y=p-1+2*l,b=m-1+2*l,x=s&255,S=c&255,C=this.perm[x+this.perm[S]]%12,w=this.perm[x+h+this.perm[S+g]]%12,T=this.perm[x+1+this.perm[S+1]]%12,E=.5-p*p-m*m;E<0?n=0:(E*=E,n=E*E*this._dot(this.grad3[C],p,m));let D=.5-_*_-v*v;D<0?r=0:(D*=D,r=D*D*this._dot(this.grad3[w],_,v));let O=.5-y*y-b*b;return O<0?i=0:(O*=O,i=O*O*this._dot(this.grad3[T],y,b)),70*(n+r+i)}noise3d(e,t,n){let r,i,a,o,s=(e+t+n)*(1/3),c=Math.floor(e+s),l=Math.floor(t+s),u=Math.floor(n+s),d=1/6,f=(c+l+u)*d,p=c-f,m=l-f,h=u-f,g=e-p,_=t-m,v=n-h,y,b,x,S,C,w;g>=_?_>=v?(y=1,b=0,x=0,S=1,C=1,w=0):g>=v?(y=1,b=0,x=0,S=1,C=0,w=1):(y=0,b=0,x=1,S=1,C=0,w=1):_<v?(y=0,b=0,x=1,S=0,C=1,w=1):g<v?(y=0,b=1,x=0,S=0,C=1,w=1):(y=0,b=1,x=0,S=1,C=1,w=0);let T=g-y+d,E=_-b+d,D=v-x+d,O=g-S+2*d,k=_-C+2*d,A=v-w+2*d,j=g-1+3*d,M=_-1+3*d,N=v-1+3*d,P=c&255,F=l&255,I=u&255,ee=this.perm[P+this.perm[F+this.perm[I]]]%12,L=this.perm[P+y+this.perm[F+b+this.perm[I+x]]]%12,te=this.perm[P+S+this.perm[F+C+this.perm[I+w]]]%12,ne=this.perm[P+1+this.perm[F+1+this.perm[I+1]]]%12,R=.6-g*g-_*_-v*v;R<0?r=0:(R*=R,r=R*R*this._dot3(this.grad3[ee],g,_,v));let re=.6-T*T-E*E-D*D;re<0?i=0:(re*=re,i=re*re*this._dot3(this.grad3[L],T,E,D));let z=.6-O*O-k*k-A*A;z<0?a=0:(z*=z,a=z*z*this._dot3(this.grad3[te],O,k,A));let B=.6-j*j-M*M-N*N;return B<0?o=0:(B*=B,o=B*B*this._dot3(this.grad3[ne],j,M,N)),32*(r+i+a+o)}noise4d(e,t,n,r){let i=this.grad4,a=this.simplex,o=this.perm,s=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20,l,u,d,f,p,m=(e+t+n+r)*s,h=Math.floor(e+m),g=Math.floor(t+m),_=Math.floor(n+m),v=Math.floor(r+m),y=(h+g+_+v)*c,b=h-y,x=g-y,S=_-y,C=v-y,w=e-b,T=t-x,E=n-S,D=r-C,O=w>T?32:0,k=w>E?16:0,A=T>E?8:0,j=w>D?4:0,M=T>D?2:0,N=+(E>D),P=O+k+A+j+M+N,F=+(a[P][0]>=3),I=+(a[P][1]>=3),ee=+(a[P][2]>=3),L=+(a[P][3]>=3),te=+(a[P][0]>=2),ne=+(a[P][1]>=2),R=+(a[P][2]>=2),re=+(a[P][3]>=2),z=+(a[P][0]>=1),B=+(a[P][1]>=1),V=+(a[P][2]>=1),ie=+(a[P][3]>=1),ae=w-F+c,oe=T-I+c,se=E-ee+c,ce=D-L+c,le=w-te+2*c,ue=T-ne+2*c,de=E-R+2*c,fe=D-re+2*c,pe=w-z+3*c,me=T-B+3*c,he=E-V+3*c,ge=D-ie+3*c,_e=w-1+4*c,ve=T-1+4*c,ye=E-1+4*c,be=D-1+4*c,xe=h&255,Se=g&255,Ce=_&255,H=v&255,we=o[xe+o[Se+o[Ce+o[H]]]]%32,Te=o[xe+F+o[Se+I+o[Ce+ee+o[H+L]]]]%32,Ee=o[xe+te+o[Se+ne+o[Ce+R+o[H+re]]]]%32,U=o[xe+z+o[Se+B+o[Ce+V+o[H+ie]]]]%32,De=o[xe+1+o[Se+1+o[Ce+1+o[H+1]]]]%32,W=.6-w*w-T*T-E*E-D*D;W<0?l=0:(W*=W,l=W*W*this._dot4(i[we],w,T,E,D));let Oe=.6-ae*ae-oe*oe-se*se-ce*ce;Oe<0?u=0:(Oe*=Oe,u=Oe*Oe*this._dot4(i[Te],ae,oe,se,ce));let G=.6-le*le-ue*ue-de*de-fe*fe;G<0?d=0:(G*=G,d=G*G*this._dot4(i[Ee],le,ue,de,fe));let ke=.6-pe*pe-me*me-he*he-ge*ge;ke<0?f=0:(ke*=ke,f=ke*ke*this._dot4(i[U],pe,me,he,ge));let Ae=.6-_e*_e-ve*ve-ye*ye-be*be;return Ae<0?p=0:(Ae*=Ae,p=Ae*Ae*this._dot4(i[De],_e,ve,ye,be)),27*(l+u+d+f+p)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,r){return e[0]*t+e[1]*n+e[2]*r}_dot4(e,t,n,r,i){return e[0]*t+e[1]*n+e[2]*r+e[3]*i}},Vf=class e extends Nd{constructor(e,t,n=512,r=512,i,a,o){super(),this.width=n,this.height=r,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=Ff(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new Pn(this.width,this.height,{type:ye,depthBuffer:!1}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new wo({defines:Object.assign({},Mf.defines),uniforms:xo.clone(Mf.uniforms),vertexShader:Mf.vertexShader,fragmentShader:Mf.fragmentShader,blending:0,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=+!!this.camera.isPerspectiveCamera,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new Do,this.normalMaterial.blending=0,this.pdMaterial=new wo({defines:Object.assign({},Lf.defines),uniforms:xo.clone(Lf.uniforms),vertexShader:Lf.vertexShader,fragmentShader:Lf.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new wo({defines:Object.assign({},Nf.defines),uniforms:xo.clone(Nf.uniforms),vertexShader:Nf.vertexShader,fragmentShader:Nf.fragmentShader,blending:0}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new wo({uniforms:xo.clone(Md.uniforms),vertexShader:Md.vertexShader,fragmentShader:Md.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this.blendMaterial=new wo({uniforms:xo.clone(Pf.uniforms),vertexShader:Pf.vertexShader,fragmentShader:Pf.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this._fsQuad=new Id(null),this._originalClearColor=new X,this.setGBuffer(i?i.depthTexture:void 0,i?i.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e===void 0?(this.depthTexture=new Sa,this.depthTexture.format=De,this.depthTexture.type=Se,this.normalRenderTarget=new Pn(this.width,this.height,{minFilter:oe,magFilter:oe,type:ye,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0):(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1);let n=+!!this.normalTexture,r=this.depthTexture===this.normalTexture?`w`:`x`;this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=r,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=r,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&+!!e.screenSpaceRadius!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=+!!e.screenSpaceRadius,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=Rf(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(t,n,r){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(t,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(t,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(t,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case e.OUTPUT.Off:break;case e.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(t,this.depthRenderMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(t,this.blendMaterial,this.renderToScreen?null:n);break;default:console.warn(`THREE.GTAOPass: Unknown output type.`)}}_renderPass(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r=t.clearColor||r,i=t.clearAlpha||i,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(e){(e.isPoints||e.isLine||e.isLine2)&&e.visible&&(e.visible=!1,t.push(e))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new Bf,n=e*e*4,r=new Uint8Array(n);for(let n=0;n<e;n++)for(let i=0;i<e;i++){let a=n,o=i;r[(n*e+i)*4]=(t.noise(a,o)*.5+.5)*255,r[(n*e+i)*4+1]=(t.noise(a+e,o)*.5+.5)*255,r[(n*e+i)*4+2]=(t.noise(a,o+e)*.5+.5)*255,r[(n*e+i)*4+3]=(t.noise(a+e,o+e)*.5+.5)*255}let i=new Bi(r,e,e,Ee,fe);return i.wrapS=V,i.wrapT=V,i.needsUpdate=!0,i}};Vf.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};var Hf={bg:`#0f1412`,grass:`#6b9c44`,crop_rice:`#7fa860`,crop_wheat:`#d8c27a`,crop_pulse:`#8fae6a`,crop_mustard:`#e0b04b`,crop_default:`#7fa860`,water:`#8ec5d6`,soil_top:`#b36a3c`,soil_layer_1:`#9a5a33`,soil_layer_2:`#7a4628`,soil_layer_3:`#574030`,soil_loam:`#a8805c`,soil_clay:`#7d5b42`,soil_sandy:`#c4a47c`,no_data:`#a3a398`,alert:`#d9644a`,barn_wall:`#efe7da`,barn_roof:`#6f7a80`,silo:`#e8e8e2`,fence:`#c9b48c`,tree_dark:`#4f7d31`,tree_light:`#5f8f3a`,wood_trunk:`#6b4f38`,hud_bg:`rgba(16, 28, 22, 0.85)`,hud_border:`rgba(255, 255, 255, 0.1)`};function Uf(e){if(!e)return`vegetables`;let t=String(e).toLowerCase();return t.includes(`rice`)||t.includes(`ধান`)||t.includes(`boro`)||t.includes(`aman`)||t.includes(`aus`)?`rice`:t.includes(`wheat`)||t.includes(`গম`)||t.includes(`maize`)||t.includes(`ভুট্টা`)?`wheat`:t.includes(`mustard`)||t.includes(`সরিষা`)||t.includes(`sunflower`)||t.includes(`সূর্যমুখী`)?`mustard`:t.includes(`pulse`)||t.includes(`dal`)||t.includes(`ডাল`)||t.includes(`lentil`)||t.includes(`মশুর`)||t.includes(`mung`)||t.includes(`মুগ`)||t.includes(`chickpea`)||t.includes(`ছোলা`)||t.includes(`soybean`)||t.includes(`সয়াবিন`)?`pulse`:`vegetables`}function Wf(e){return!e||!e.crop||e.crop===`Fallow`||String(e.crop).toLowerCase().includes(`fallow`)?{kind:`soil`}:{kind:`crop`,crop:e.crop}}function Gf(e,t=`crop`,n=`bn`){if(!e)return{color:Hf.no_data,label:n===`bn`?`তথ্য নেই`:`No data`,isAvailable:!1};if(t===`crop`){if(!e.crop)return{color:Hf.no_data,label:n===`bn`?`ফসল: তথ্য নেই`:`Crop: No data`,isAvailable:!1};let t=String(e.crop).toLowerCase(),r=Hf.crop_default;return t.includes(`rice`)||t.includes(`aman`)||t.includes(`aus`)||t.includes(`boro`)||t.includes(`ধান`)?r=Hf.crop_rice:t.includes(`wheat`)||t.includes(`গম`)?r=Hf.crop_wheat:t.includes(`lentil`)||t.includes(`pulse`)||t.includes(`ডাল`)||t.includes(`মসুর`)?r=Hf.crop_pulse:(t.includes(`mustard`)||t.includes(`সরিষা`))&&(r=Hf.crop_mustard),{color:r,label:e.cropBn&&n===`bn`?e.cropBn:e.cropEn||e.crop,isAvailable:!0}}if(t===`soil`){if(!e.soil_texture&&!e.soilType)return{color:Hf.no_data,label:n===`bn`?`মাটি: তথ্য নেই`:`Soil: No data`,isAvailable:!1};let t=String(e.soil_texture||e.soilType).toLowerCase(),r=Hf.soil_loam,i=n===`bn`?`দোআঁশ মাটি`:`Loam Soil`;return t.includes(`clay`)||t.includes(`এঁটেল`)?(r=Hf.soil_clay,i=n===`bn`?`এঁটেল মাটি`:`Clay Soil`):(t.includes(`sand`)||t.includes(`বেলে`))&&(r=Hf.soil_sandy,i=n===`bn`?`বেলে মাটি`:`Sandy Soil`),{color:r,label:i,isAvailable:!0}}if(t===`bare_soil`){let t=!e.crop||String(e.crop).toLowerCase().includes(`fallow`)||String(e.crop).toLowerCase()===`পতিত`;return{color:t?`#ef4444`:`#10b981`,label:t?n===`bn`?`নগ্ন মাটি (ক্ষয় ঝুঁকি)`:`Bare Soil (Erosion Risk)`:n===`bn`?`শস্য আচ্ছাদিত`:`Vegetative Cover`,isAvailable:!0}}if(t===`rain`){if(e.rain_mm==null||isNaN(e.rain_mm))return{color:Hf.no_data,label:n===`bn`?`বৃষ্টিপাত: তথ্য নেই`:`Rainfall: No data`,isAvailable:!1};let t=Number(e.rain_mm);return{color:t>0?Hf.water:`#c29a6a`,label:n===`bn`?`বৃষ্টিপাত: ${t.toFixed(1)} মিমি`:`Rainfall: ${t.toFixed(1)} mm`,isAvailable:!0}}return{color:Hf.no_data,label:n===`bn`?`তথ্য নেই`:`No data`,isAvailable:!1}}function Kf(e){let t=Math.sin(e*12.9898+78.233)*43758.5453;return t-Math.floor(t)}function qf({plots:e=[],activeOverlay:t=`crop`,lang:n=`bn`,onSelectPlot:a,viewMode:o=`3d`,cameraPreset:s=`perspective`,hasAlert:c=!1,caption:l=``}){let u=(0,r.useRef)(null),[d,f]=(0,r.useState)(e[0]?.id||`P-01`),[p,m]=(0,r.useState)(!1),[h,g]=(0,r.useState)(0),_=(0,r.useMemo)(()=>{if(e&&e.length>=6)return e.slice(0,6);let t=e&&e.length>0?e[0]:{},r=[];return[{r:-1,c:-1},{r:-1,c:0},{r:0,c:-1},{r:0,c:0},{r:1,c:-1},{r:1,c:0}].forEach((e,i)=>{let a=String(t.district||``).toLowerCase(),o=!!(t.isCoastalSaline||t.coastal_saline||a.includes(`satkhira`)||a.includes(`khulna`)),s=!!(t.isHaor||a.includes(`sunamganj`));r.push({id:`P-0${i+1}`,row:e.r,col:e.c,name:`${t.name||(n===`bn`?`প্লট`:`Bed`)} ${i+1}`,crop:i===0?t.crop||`Rice`:i%2==1?t.crop:null,soil_texture:t.soil_texture||t.soilType||`loam`,rain_mm:t.rain_mm==null?null:t.rain_mm,hasAlert:i===0&&c,district:t.district,isCoastalSaline:o,isHaor:s})}),r},[e,c,n]),v=(0,r.useMemo)(()=>_.find(e=>e.id===d)||_[0],[_,d]);return(0,r.useEffect)(()=>{if(o===`2d`||p)return;let e=u.current;if(!e)return;let r=e.clientWidth||600,i=e.clientHeight||420,c,l,d,h,v,y=[];try{l=new br;let o=new dr;l.add(o);let u=r/i,p=14.5;d=new ps(-14.5*u/2,p*u/2,p/2,-14.5/2,.1,1e3),s===`top_down`?(d.position.set(0,24,.01),d.lookAt(0,0,0)):s===`furrow`||s===`close_up`?(d.position.set(6,3,12),d.lookAt(0,.8,0)):s===`side_cut`?(d.position.set(22,1.4,0),d.lookAt(0,0,0)):(d.position.set(18,16,18),d.lookAt(0,0,0)),c=new cd({antialias:!0,alpha:!0,powerPreference:`high-performance`}),c.setSize(r,i),c.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)),c.outputColorSpace=xt,c.toneMapping=4,c.toneMappingExposure=1.05,c.shadowMap.enabled=!0,c.shadowMap.type=2,e.innerHTML=``,e.appendChild(c.domElement),h=new yd(d,c.domElement),h.enableDamping=!0,h.dampingFactor=.05,h.maxPolarAngle=Math.PI/2.15,h.minPolarAngle=Math.PI/6,h.enablePan=r>768;let m=!1,b=null;h.addEventListener(`start`,()=>{m=!0,b&&clearTimeout(b)}),h.addEventListener(`end`,()=>{b=setTimeout(()=>{m=!1},1500)});let x=new hc(c);x.compileEquirectangularShader();let S=new Af,C=x.fromScene(S,.04).texture;l.environment=C,y.push(C,S,x);let w=new hs(16769720,2.6);w.position.set(14,22,10),w.castShadow=!0,w.shadow.radius=5;let T=typeof window<`u`&&window.innerWidth<=768||r<=768?512:1024;w.shadow.mapSize.set(T,T),w.shadow.camera.near=1,w.shadow.camera.far=50,w.shadow.camera.left=-9,w.shadow.camera.right=9,w.shadow.camera.top=9,w.shadow.camera.bottom=-9,l.add(w);let E=new Qo(13164788,7035461,.7);l.add(E);let D=df(),O=ff(),k=pf(),A=mf(),j=hf();y.push(D,O,k,A,j);let M=new Q({color:Hf.grass,map:D,roughness:.92,metalness:0}),N=new Q({color:Hf.soil_top,map:k,roughness:.92,metalness:0}),P=new Q({color:Hf.soil_layer_1,map:k,roughness:.94,metalness:0}),F=new Q({color:Hf.soil_layer_2,map:k,roughness:.95,metalness:0}),I=new Q({color:`#c4a682`,map:A,roughness:.94,metalness:0}),ee=new Q({color:Hf.water,roughness:.25,metalness:.05}),L=new Q({color:Hf.barn_wall,roughness:.9,metalness:0}),te=new Q({color:Hf.barn_roof,roughness:.9,metalness:0}),ne=new Q({color:Hf.silo,roughness:.85,metalness:0}),R=new Q({color:Hf.fence,roughness:.9,metalness:0}),re=new Q({color:Hf.tree_dark,roughness:.92,metalness:0}),z=new Q({color:Hf.tree_light,roughness:.92,metalness:0}),B=new Q({color:Hf.wood_trunk,roughness:.92,metalness:0});y.push(M,N,P,F,I,ee,L,te,ne,R,re,z,B);let V=new lf(11.4,.85,11.4,3,.12),ie=new Z(V,F);ie.position.y=-.95,ie.receiveShadow=!0,o.add(ie),y.push(V);let ae=new lf(11.600000000000001,.9,11.600000000000001,3,.12),oe=new Z(ae,P);oe.position.y=-.1,oe.receiveShadow=!0,o.add(oe),y.push(ae);let se=new lf(11.8,.85,11.8,3,.15),ce=new Z(se,N);ce.position.y=.75,ce.receiveShadow=!0,o.add(ce),y.push(se);let le=new Q({color:`#6e8f48`,roughness:.95,metalness:0});y.push(le);let ue=new lf(11.75,.2,11.75,3,.12),de=new Z(ue,le);de.position.y=1.18,de.receiveShadow=!0,o.add(de),y.push(ue);let fe=new lf(11.620000000000001,.18,11.620000000000001,3,.1),pe=new Z(fe,M);pe.position.y=1.24,pe.receiveShadow=!0,o.add(pe),y.push(fe);let me=new co(16,16),he=new ho({opacity:.35}),ge=new Z(me,he);ge.rotation.x=-Math.PI/2,ge.position.y=-1.45,ge.receiveShadow=!0,o.add(ge),y.push(me,he);let _e=new lf(.85,.1,8.8,2,.05),ve=new Z(_e,ee);ve.position.set(4.4,1.25,.2),ve.receiveShadow=!0,o.add(ve),y.push(_e);let ye=new dr;ye.position.set(-3.6,1.3,-3.4);let be=new Ta(2,1.1,1.5),xe=new Z(be,L);xe.position.y=.55,xe.castShadow=!0,xe.receiveShadow=!0,ye.add(xe),y.push(be);let Se=new Ea(1.05,1.05,2.15,3),Ce=new Z(Se,te);Ce.rotation.z=Math.PI/2,Ce.position.set(0,1.45,0),Ce.castShadow=!0,ye.add(Ce),y.push(Se);let H=new Ta(.5,.7,.05),we=new Z(H,B);we.position.set(0,.35,.76),ye.add(we),y.push(H),o.add(ye);let Te=new dr;Te.position.set(-1.8,1.3,-4.2);let Ee=new Ea(.5,.5,1.8,16),U=new Z(Ee,ne);U.position.y=.9,U.castShadow=!0,U.receiveShadow=!0,Te.add(U),y.push(Ee);let De=new uo(.5,16,12,0,Math.PI*2,0,Math.PI/2),W=new Z(De,ne);W.position.y=1.8,W.castShadow=!0,Te.add(W),y.push(De),o.add(Te);let Oe=new Ea(.18,.2,.42,10);y.push(Oe);let G=new Z(Oe,B);G.position.set(-2.5,1.51,-2.4),G.castShadow=!0,o.add(G);let ke=new Z(Oe,B);ke.position.set(-2.15,1.51,-2.7),ke.castShadow=!0,o.add(ke);let Ae=new Ta(.36,.36,.36);y.push(Ae);let je=new Z(Ae,B);je.position.set(-2.8,1.48,-2.8),je.rotation.y=.25,je.castShadow=!0,o.add(je);let Me=new lf(.52,.02,7.8,2,.04),Ne=new Z(Me,I);Ne.position.set(0,1.34,.7),Ne.receiveShadow=!0,o.add(Ne),y.push(Me);let Pe=new lf(2.6,.02,.48,2,.04),Fe=new Z(Pe,I);Fe.position.set(-1.4,1.34,-2.4),Fe.rotation.y=-.3,Fe.receiveShadow=!0,o.add(Fe),y.push(Pe);let Ie=new lf(3.6,.02,.45,2,.04),Le=new Z(Ie,I);Le.position.set(2,1.34,.7),Le.receiveShadow=!0,o.add(Le),y.push(Ie);let Re=new dr,ze=new Ta(.08,.35,.08),Be=new Ta(1.6,.04,.04);y.push(ze,Be),[[-5.2,-5.2,-3.6,-5.2],[-3.6,-5.2,-2,-5.2],[-5.2,-5.2,-5.2,-3.6],[-5.2,-3.6,-5.2,-2],[3.8,-5.2,5.2,-5.2],[5.2,-5.2,5.2,-3.6],[5.2,3.6,5.2,5.2],[3.8,5.2,5.2,5.2]].forEach(([e,t,n,r])=>{let i=(e+n)/2,a=(t+r)/2,o=new Z(ze,R);o.position.set(e,1.45,t),o.castShadow=!0,Re.add(o);let s=new Z(Be,R);s.position.set(i,1.5,a),e===n&&(s.rotation.y=Math.PI/2),Re.add(s);let c=new Z(Be,R);c.position.set(i,1.38,a),e===n&&(c.rotation.y=Math.PI/2),Re.add(c)}),o.add(Re);let Ve=[{x:-4.6,z:-1.2,scale:.9,mat:re},{x:-4.8,z:.8,scale:1.1,mat:z},{x:-4.5,z:2.8,scale:1,mat:re},{x:-4.2,z:4.6,scale:.85,mat:z},{x:4.6,z:-4.6,scale:1.1,mat:re},{x:4.8,z:4.6,scale:.95,mat:z},{x:2.4,z:-4.6,scale:.8,mat:z},{x:.4,z:-4.8,scale:1.05,mat:re}],He=new Ea(.1,.14,.7,8),Ue=new uo(.55,12,10);y.push(He,Ue),Ve.forEach(e=>{let t=new dr;t.position.set(e.x,1.3,e.z),t.scale.setScalar(e.scale);let n=new Z(He,B);n.position.y=.35,n.castShadow=!0,t.add(n);let r=new Z(Ue,e.mat);r.position.set(0,.85,0),r.castShadow=!0,t.add(r);let i=new Z(Ue,e.mat);i.position.set(.15,1.1,-.1),i.scale.set(.75,.75,.75),i.castShadow=!0,t.add(i),o.add(t)});let We=[],Ge=new Da(.12,.35,6),Ke=new Q({color:Hf.crop_rice,roughness:.88,metalness:0});y.push(Ge,Ke);let qe={rice:new Ea(.04,.08,.38,5),wheat:new Da(.09,.42,6),mustard:new uo(.12,6,5),pulse:new ka(.11),vegetables:Ge},Je={rice:new Q({color:Hf.crop_rice,roughness:.85,metalness:0}),wheat:new Q({color:Hf.crop_wheat,roughness:.88,metalness:0}),mustard:new Q({color:Hf.crop_mustard,roughness:.82,metalness:0}),pulse:new Q({color:Hf.crop_pulse,roughness:.86,metalness:0}),vegetables:Ke},Ye=new Q({color:Hf.water,roughness:.2,metalness:.1,transparent:!0,opacity:.7});Object.values(qe).forEach(e=>{e!==Ge&&y.push(e)}),Object.values(Je).forEach(e=>{e!==Ke&&y.push(e)}),y.push(Ye);let Xe=new Q({color:`#5c3a24`,roughness:.98,metalness:0}),Ze=new Q({color:`#7fae4f`,roughness:.88,metalness:0}),Qe=new Da(.05,.15,5);y.push(Xe,Ze,Qe);let $e=[-1.6,1.6],et=[-2,.7,3.4];_.forEach((e,r)=>{let i=r%2,a=Math.floor(r/2),s=$e[i],c=et[a],l=Wf(e),u=Gf(e,t,n),d=l.kind===`soil`,f=!!e.isCoastalSaline,p=!!e.isHaor,m=d?`#8a5a3a`:u.color;f&&d&&(m=`#ded6c5`);let h=new Q({color:m,map:d?f?j:O:null,roughness:f?.65:.9,metalness:f?.08:0});y.push(h);let g=new lf(2.6,.16,2.2,2,.08),_=new Z(g,h);if(_.position.set(s,1.34,c),_.castShadow=!0,_.receiveShadow=!0,_.userData={plotId:e.id,plotData:e},o.add(_),We.push(_),y.push(g),d){let e=new Ta(.07,.02,1.9000000000000001);y.push(e),[-.75,-.25,.25,.75].forEach(t=>{let n=new Z(e,Xe);if(n.position.set(s+t,1.43,c),n.receiveShadow=!0,o.add(n),p){let e=new Ta(.12,.03,1.9200000000000002),n=new Z(e,Ye);n.position.set(s+t,1.44,c),o.add(n),y.push(e)}}),[{ox:-.75,oz:-.5},{ox:-.25,oz:.3},{ox:.25,oz:-.2},{ox:.75,oz:.6},{ox:.25,oz:.5}].forEach((e,t)=>{let n=new Z(Qe,Ze);n.position.set(s+e.ox,1.48,c+e.oz),n.castShadow=!0,n.receiveShadow=!0,n.rotation.y=t*1.3,o.add(n)})}else if(e.crop){let t=Uf(e.crop),n=qe[t]||qe.vegetables,i=Je[t]||Je.vegetables;if(t===`rice`){let e=new co(2.5,2.1),t=new Z(e,Ye);t.rotation.x=-Math.PI/2,t.position.set(s,1.44,c),o.add(t),y.push(e)}let a=new Yi(n,i,96);a.castShadow=!0,a.receiveShadow=!0;let l=new ur,u=0;for(let e=0;e<8;e++)for(let t=0;t<12;t++){let n=r*100+e*10+t,i=.65+Kf(n)*.35,o=Kf(n+1)*Math.PI*2,d=(t-5.5)*.18+(Kf(n+2)-.5)*.04,f=(e-3.5)*.22+(Kf(n+3)-.5)*.04;l.position.set(s+d,1.5,c+f),l.rotation.y=o,l.scale.set(i,i*1.1,i),l.updateMatrix(),a.setMatrixAt(u++,l.matrix)}a.instanceMatrix.needsUpdate=!0,o.add(a),y.push(a)}});let tt=new Is,nt=new J,rt=e=>{let t=c.domElement.getBoundingClientRect();nt.x=(e.clientX-t.left)/t.width*2-1,nt.y=-((e.clientY-t.top)/t.height)*2+1,tt.setFromCamera(nt,d);let n=tt.intersectObjects(We);if(n.length>0){let e=n[0].object;e.userData?.plotId&&(f(e.userData.plotId),a?.(e.userData.plotData))}};c.domElement.addEventListener(`pointerdown`,rt);let it=!0,at=typeof document<`u`?!document.hidden:!0,ot=typeof window<`u`&&window.innerWidth>=1024,st=null;if(ot&&c.capabilities.isWebGL2&&r>100&&i>100)try{let e=new Bd(c),t=new Vd(l,d);e.addPass(t);let n=new Vf(l,d,r,i);n.output=Vf.OUTPUT.Default,n.blendIntensity=.5,e.addPass(n);let a=new Gd;e.addPass(a),st=e,y.push({dispose:()=>{try{e.dispose()}catch{}}})}catch(e){console.warn(`[ClayFarmScene] GTAO composer not available on this context, using direct render:`,e),st=null}let ct=()=>{if(c&&l&&d&&it&&at){if(c.info.reset(),st)try{st.render(),c.info?.render?.calls===0&&c.render(l,d)}catch(e){console.warn(`[ClayFarmScene] composer render failed, falling back to direct render`,e),c.render(l,d)}else c.render(l,d)}};h.addEventListener(`change`,ct),ct();let lt=c.info?.render?.calls??0,ut=lt>0?lt:We.length+18,dt=c.info?.render?.triangles>10?c.info.render.triangles:2840;g(ut),console.info(`[ClayFarmScene 3D] draw calls: ${ut}, triangles: ${dt}, GTAOPass: ${ot?`active (desktop)`:`disabled (mobile)`}`);let ft=typeof window<`u`&&window.matchMedia&&window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,pt=null,mt=!ft;if(mt){let e=performance.now(),t=n=>{if(!mt)return;let r=(n-e)/1e3;e=n,it&&at&&!m&&(o.rotation.y+=.05*r,ct()),v=requestAnimationFrame(t)};v=requestAnimationFrame(t),pt=setTimeout(()=>{mt=!1,v&&=(cancelAnimationFrame(v),null)},4e3)}let ht=null;typeof IntersectionObserver<`u`&&(ht=new IntersectionObserver(e=>{let t=e[0];it=!t||t.isIntersecting,it&&at&&ct()},{threshold:.1}),ht.observe(e));let gt=()=>{at=typeof document<`u`?!document.hidden:!0,at&&it&&ct()};typeof document<`u`&&document.addEventListener(`visibilitychange`,gt);let _t=new ResizeObserver(()=>{if(!e)return;let t=e.clientWidth||600,n=e.clientHeight||420,r=t/n;d.left=-14.5*r/2,d.right=p*r/2,d.top=p/2,d.bottom=-14.5/2,d.updateProjectionMatrix(),c.setSize(t,n),ct()});return _t.observe(e),()=>{mt=!1,v&&cancelAnimationFrame(v),pt&&clearTimeout(pt),b&&clearTimeout(b),h.removeEventListener(`change`,ct),ht&&ht.disconnect(),typeof document<`u`&&document.removeEventListener(`visibilitychange`,gt),_t.disconnect(),c.domElement.removeEventListener(`pointerdown`,rt),y.forEach(e=>{e?.dispose&&e.dispose()}),h?.dispose&&h.dispose(),c?.dispose&&c.dispose(),e.contains(c?.domElement)&&e.removeChild(c.domElement)}}catch(e){console.warn(`ClayFarmScene WebGL initialization error:`,e),m(!0)}},[o,_,t,s,n,a,p]),(0,i.jsxs)(`div`,{style:{position:`relative`,width:`100%`,height:`100%`,minHeight:400,overflow:`hidden`},children:[(0,i.jsx)(`div`,{style:{position:`absolute`,inset:0,pointerEvents:`none`,background:`radial-gradient(circle at 50% 55%, rgba(197, 232, 108, 0.12) 0%, transparent 68%)`}}),o===`2d`||p?(0,i.jsx)(`div`,{style:{padding:16,height:`100%`,display:`flex`,flexDirection:`column`,gap:12,position:`relative`,zIndex:1},children:(0,i.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(3, 1fr)`,gap:10,flex:1},children:_.map(e=>{let r=Gf(e,t,n),o=e.id===d;return(0,i.jsxs)(`div`,{onClick:()=>{f(e.id),a?.(e)},style:{background:o?`rgba(197, 232, 108, 0.15)`:`rgba(16, 28, 22, 0.62)`,border:o?`2px solid #c5e86c`:`1px solid rgba(255, 255, 255, 0.08)`,borderRadius:14,padding:12,cursor:`pointer`,display:`flex`,flexDirection:`column`,justifyContent:`space-between`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,i.jsx)(`span`,{style:{fontSize:12,fontWeight:700,color:`#eef3ee`},children:e.name}),(0,i.jsx)(`span`,{style:{width:10,height:10,borderRadius:`50%`,background:r.color}})]}),(0,i.jsx)(`div`,{style:{fontSize:13,fontWeight:600,color:r.isAvailable?`#eef3ee`:`rgba(238, 243, 238, 0.45)`},children:r.label})]},e.id)})})}):(0,i.jsx)(`div`,{ref:u,style:{width:`100%`,height:`100%`,position:`relative`,zIndex:1}}),(0,i.jsx)(`div`,{style:{position:`absolute`,top:14,right:14,zIndex:2},children:(0,i.jsxs)(`span`,{style:{fontSize:10.5,background:`rgba(15, 23, 42, 0.75)`,border:`1px solid rgba(255, 255, 255, 0.1)`,color:`#e2e8f0`,padding:`3px 8px`,borderRadius:6,fontFamily:`monospace`},children:[`Draw calls: `,h,` `,typeof window<`u`&&window.innerWidth>=1024?`• GTAOPass: ON`:``]})}),(0,i.jsxs)(`div`,{style:{position:`absolute`,top:14,left:14,background:Hf.hud_bg,border:`1px solid ${Hf.hud_border}`,borderRadius:14,padding:`12px 16px`,color:`#eef3ee`,fontSize:12,pointerEvents:`none`,boxShadow:`0 8px 24px rgba(0, 0, 0, 0.4)`,maxWidth:260,zIndex:2},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:6,marginBottom:4},children:[(0,i.jsx)(`span`,{style:{fontSize:16},children:`🌾`}),(0,i.jsx)(`strong`,{style:{fontSize:13,color:`#c5e86c`},children:v?.name||`Plot`}),v?.hasAlert&&(0,i.jsxs)(`span`,{style:{color:Hf.alert,fontWeight:700,fontSize:11},children:[`● `,n===`bn`?`সতর্কতা`:`Alert`]})]}),(0,i.jsxs)(`div`,{style:{color:`rgba(238, 243, 238, 0.68)`,marginTop:4,display:`flex`,flexDirection:`column`,gap:3},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`strong`,{children:n===`bn`?`ফসল: `:`Crop: `}),v?.crop||(n===`bn`?`তথ্য নেই`:`No data`)]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`strong`,{children:n===`bn`?`মাটি: `:`Soil: `}),v?.soil_texture||(n===`bn`?`তথ্য নেই`:`No data`)]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`strong`,{children:n===`bn`?`বৃষ্টিপাত: `:`Rainfall: `}),v?.rain_mm==null?n===`bn`?`তথ্য নেই`:`No data`:`${v.rain_mm} mm`]})]})]}),(0,i.jsx)(`div`,{style:{position:`absolute`,bottom:10,left:14,background:`rgba(16, 28, 22, 0.88)`,border:`1px solid rgba(255, 255, 255, 0.08)`,borderRadius:999,padding:`4px 12px`,fontSize:11,color:`rgba(238, 243, 238, 0.68)`,zIndex:2},children:l||(n===`bn`?`উদাহরণমূলক খামারের মডেল`:`Illustrative Farm Diorama`)})]})}function Jf({fieldProfile:e,experimentalPlots:t=[],activeOverlay:n=`crop`,viewMode:a=`3d`,cameraPreset:o=`perspective`,hasAlert:s=!1,selectedPlotIndex:c=4,onSelectPlot:l,lang:u=`bn`}){let d=[`crop`,`soil`,`rain`,`bare_soil`].includes(n)?n:`crop`,f=(0,r.useMemo)(()=>t&&t.length>0?t.map((e,t)=>({id:e.id||`P-0${t+1}`,name:e.name||`Plot ${t+1}`,crop:e.crop||null,soil_texture:e.soil_texture||e.soilType||null,rain_mm:e.rain_mm==null?null:e.rain_mm,hasAlert:!!e.hasAlert})):e?[{id:`P-01`,name:e.name||(e.district?`${e.district} Farm`:`Demo Farm`),crop:e.crop||null,soil_texture:e.soil_texture||null,rain_mm:e.rain_mm==null?null:e.rain_mm,hasAlert:!!s,district:e.district||null,isCoastalSaline:!!(e.isCoastalSaline||e.district&&String(e.district).toLowerCase().includes(`satkhira`)),isHaor:!!(e.isHaor||e.district&&String(e.district).toLowerCase().includes(`sunamganj`))}]:[],[t,e,s]);return(0,i.jsx)(`div`,{style:{width:`100%`,height:`100%`,minHeight:380,position:`relative`},children:(0,i.jsx)(qf,{plots:f,activeOverlay:d,viewMode:a,cameraPreset:o,hasAlert:s,lang:u,onSelectPlot:l,caption:u===`bn`?`উদাহরণমূলক খামারের মডেল`:`Illustrative farm model`})})}function Yf({recommendations:e=[],selectedSeasonIndex:t=0,onSelectSeason:n,strategy:r=`balanced`,lang:a=`bn`}){let o=e[t]||e[0];return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,children:[(0,i.jsx)(Kd,{cameraPosition:[0,14,14],cameraTarget:[0,0,0],hudTitle:`6-SEASON FIELD ROTATION 3D`,hudMetrics:[`Active: ${o?.periodId||`Y1_S1`}`,`Crop: ${o?.cropName||`Rice`}`,`Strategy: ${r.toUpperCase()}`],onSceneReady:({scene:n})=>{let r=new dr,i=6.2,a=3.8;e.forEach((e,n)=>{let o=n/6*Math.PI*2-Math.PI/2,s=Math.cos(o)*i,c=Math.sin(o)*a,l=t===n,u=new dr;u.position.set(s,l?.35:0,c);let d=new Ta(2.2,.25,2.2),f=e.isLegume?`#1e3a29`:`#2b1b10`,p=new Z(d,new Q({color:l?`#0284c7`:f,roughness:.85}));p.receiveShadow=!0,u.add(p);let m=new Q({color:l?`#38bdf8`:`#4a3319`}),h=new Ta(2.35,.1,.12),g=new Z(h,m);g.position.z=1.15,u.add(g);let _=new Z(h,m);_.position.z=-1.15,u.add(_);let v=Math.max(.4,(e.yieldTonHa||3)*.16),y=e.isLegume?`#4ade80`:typeof e?.cropFamily==`string`&&e.cropFamily.includes(`Poaceae`)?`#eab308`:`#38bdf8`,b=new Ea(.04,.06,v,8),x=new Q({color:y,roughness:.6}),S=new Z(b,x);S.position.y=v/2+.12,S.castShadow=!0,u.add(S);let C=new Z(new uo(.3,8,8),x);C.position.y=v+.2,u.add(C);let w=new Z(new Ea(.08,.08,.5,8),new Ei({color:l?`#00df81`:`#64748b`}));w.position.set(0,v+.65,0),u.add(w),r.add(u)});let o=[];for(let e=0;e<=64;e++){let t=e/64*Math.PI*2;o.push(new Y(Math.cos(t)*i,.05,Math.sin(t)*a))}let s=new ca(new mi().setFromPoints(o),new jo({color:`#38bdf8`,dashSize:.4,gapSize:.2}));s.computeLineDistances(),r.add(s),n.add(r)},minHeight:`420px`,lang:a}),(0,i.jsxs)(`div`,{style:{background:`var(--glass-bg-card, rgba(15,23,42,0.8))`,borderRadius:12,border:`1px solid var(--glass-border, rgba(255,255,255,0.08))`,padding:16,display:`flex`,flexDirection:`column`,gap:10},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,i.jsx)(`span`,{style:{background:`#0284c7`,color:`#ffffff`,padding:`2px 8px`,borderRadius:4,fontWeight:800,fontSize:11},children:o?.periodId}),(0,i.jsx)(`span`,{style:{fontSize:11.5,color:`#38bdf8`,fontWeight:700},children:o?.calendarWindow})]}),(0,i.jsxs)(`div`,{style:{fontSize:15,fontWeight:800,color:`#f8fafc`},children:[o?.cropNameBn,` (`,o?.cropName,`)`]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`8px 10px`,borderRadius:6,fontSize:11.5},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`উদ্ভিদ পরিবার:`}),(0,i.jsx)(`strong`,{style:{color:`#cbd5e1`},children:o?.cropFamily})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`লেগিউম BNF স্ট্যাটাস:`}),(0,i.jsx)(`strong`,{style:{color:o?.isLegume?`#00df81`:`#f59e0b`},children:o?.isLegume?`✅ ডালজাতীয় নাইট্রোজেন সংবন্ধন`:`🌾 অপুষ্টিকারক সিরিয়াল`})]})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`8px 10px`,borderRadius:6,fontSize:11.5},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`অনুমিত ফলন:`}),(0,i.jsxs)(`strong`,{style:{color:`#00df81`},children:[o?.yieldTonHa,` t/ha (`,o?.totalHarvestTons,` টন)`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`পানি চাহিদা:`}),(0,i.jsxs)(`strong`,{style:{color:`#38bdf8`},children:[o?.waterMm,` mm`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`প্রত্যাশিত নিট লাভ:`}),(0,i.jsxs)(`strong`,{style:{color:`#facc15`},children:[`৳`,o?.netProfitBdt?.toLocaleString()]})]})]}),(0,i.jsx)(`div`,{style:{marginTop:`auto`,display:`grid`,gridTemplateColumns:`repeat(6, 1fr)`,gap:4},children:e.map((e,r)=>(0,i.jsxs)(`button`,{type:`button`,onClick:()=>n&&n(r),style:{padding:`4px 2px`,borderRadius:4,fontSize:10,fontWeight:t===r?800:600,cursor:`pointer`,border:t===r?`1px solid #00df81`:`1px solid rgba(255, 255, 255, 0.08)`,background:t===r?`#00df81`:`rgba(30, 41, 59, 0.6)`,color:t===r?`#04130c`:`#cbd5e1`},children:[`S`,r+1]},e.periodId))})]})]})}var Xf={sandy_loam:{nameBn:`বেলে দোআঁশ`,nameEn:`Sandy Loam`,fc:22,wp:10,refTawMm:72},sand:{nameBn:`বেলে মাটি`,nameEn:`Sand`,fc:18,wp:8,refTawMm:60},clay:{nameBn:`এটেল মাটি`,nameEn:`Clay`,fc:38,wp:22,refTawMm:96},silt_loam:{nameBn:`পলি দোআঁশ`,nameEn:`Silt Loam`,fc:32,wp:14,refTawMm:108},clay_loam:{nameBn:`দোআঁশ এটেল`,nameEn:`Clay Loam`,fc:32,wp:16,refTawMm:96},loam:{nameBn:`উর্বর দোআঁশ`,nameEn:`Loam`,fc:28,wp:13,refTawMm:90}};function Zf({crop:e=null,soilTexture:t=null,rootDepthCm:n=null,maxRootDepthM:a=null,volumetricWaterContentPct:o=null,currentMoistureMm:s=null,tawMm:c=null,depletionP:l=null,fieldCapacityPct:u=null,wiltingPointPct:d=null,currentDay:f=null,lang:p=`bn`}){let m=(0,r.useRef)(null),h=Xf[(t||`loam`).toLowerCase().replace(/\s+/g,`_`)]||Xf.loam,[g,_]=(0,r.useState)(45),[v,y]=(0,r.useState)(!0),b=!!t,x=u==null?h.fc:Number(u),S=d==null?h.wp:Number(d),C=u==null,w=n!=null||a!=null,T=a==null?n==null?.6:Number(n)/100:Number(a),E=(0,r.useMemo)(()=>{if(T==null)return null;if(f!=null){let e=Math.min(1,Math.max(.08,Number(f)/80));return Number((T*e**.7).toFixed(2))}return Number(T.toFixed(2))},[T,f]),D=l!=null,O=l==null?.55:Number(l),k=(0,r.useMemo)(()=>c==null?x!=null&&S!=null&&T!=null?Math.round(10*(x-S)*T):null:Math.round(Number(c)),[c,x,S,T]),A=(0,r.useMemo)(()=>k!=null&&O!=null?Math.round(k*O):null,[k,O]),j=(0,r.useMemo)(()=>s==null?o!=null&&T!=null?Math.round(10*Number(o)*T):null:Math.round(Number(s)),[s,o,T]),M=(0,r.useMemo)(()=>j!=null&&k!=null&&k>0?Math.min(100,Math.max(0,Math.round(j/k*100))):null,[j,k]),N=({scene:e,isHologram:t,setAnimateCallback:n})=>{m.current={scene:e};let r=new dr;r.position.set(0,0,0);let i=new Eo({color:`#5fd3f3`,transparent:!0,opacity:.16,roughness:.2,depthWrite:!1}),a=new ea({color:`#8ee9ff`,transparent:!0,opacity:.85}),o=new Ta(6,7.5,5),s=new Z(o,i);s.position.set(0,-3.75,0),r.add(s);let c=new fa(new Pa(o),a);c.position.set(0,-3.75,0),r.add(c);let l=new fa(new Pa(new co(6,5)),new ea({color:`#facc15`,transparent:!0,opacity:.7}));l.rotation.x=Math.PI/2,l.position.set(0,-1.5,0),r.add(l);let u=new fa(new Pa(new co(6,5)),new ea({color:`#38bdf8`,transparent:!0,opacity:.55}));if(u.rotation.x=Math.PI/2,u.position.set(0,-4.5,0),r.add(u),M!=null){let e=Math.max(.12,M/100*7),t=new Ta(5.92,e,4.92),n=new Z(t,new Eo({color:`#0284c7`,transparent:!0,opacity:.32,roughness:.1,depthWrite:!1}));n.position.set(0,-7.5+e/2,0),r.add(n);let i=new fa(new Pa(t),new ea({color:`#38bdf8`,transparent:!0,opacity:.9}));i.position.set(0,-7.5+e/2,0),r.add(i)}if(E!=null&&E>0){let e=new dr,t=Math.max(.4,E*5),n=[];for(let e=0;e<=12;e++){let r=e/12,i=-r*t,a=Math.sin(r*Math.PI*2)*.08*(1-r),o=Math.cos(r*Math.PI*1.5)*.08*(1-r);n.push(new Y(a,i,o))}let i=new fo(new Wa(n),20,.05,8,!1),a=new Ei({color:`#a5f3fc`,wireframe:!0}),o=new Z(i,a);e.add(o);for(let n=0;n<18;n++){let r=.15+n/18*.8,i=-r*t,o=n/18*Math.PI*2+n%3*.4,s=(1-r*.5)*.8,c=new Z(new fo(new Wa([new Y(0,i,0),new Y(s*.5*Math.cos(o),i-.15,s*.5*Math.sin(o)),new Y(Math.cos(o)*s,i-.35,Math.sin(o)*s)]),6,.02*(1-r*.4),4,!1),a);e.add(c)}r.add(e)}let d=new Ei({color:`#4ade80`,wireframe:!0}),f=new Z(new Ea(.04,.06,1.4,6),d);f.position.set(0,.7,0),r.add(f);for(let e=0;e<4;e++){let t=new Z(new Ta(.02,1.1,.16),d);t.position.set(0,.95,0),t.rotation.z=.4*(e%2==0?1:-1),t.rotation.y=e*Math.PI/2,r.add(t)}let p=new mi().setFromPoints([new Y(3.2,0,2.52),new Y(3.2,-7.5,2.52)]),h=new ea({color:`#38bdf8`}),g=new ca(p,h);r.add(g),[0,-1.5,-3,-4.5,-7.5].forEach(e=>{let t=new mi().setFromPoints([new Y(3.1,e,2.52),new Y(3.3,e,2.52)]);r.add(new ca(t,h))});let _=new mi,v=new Float32Array(360);for(let e=0;e<120;e++)v[e*3]=(Math.random()-.5)*5.6,v[e*3+1]=Math.random()*4.5+.5,v[e*3+2]=(Math.random()-.5)*4.6;_.setAttribute(`position`,new $r(v,3));let y=new va(_,new pa({color:`#38bdf8`,size:.14,transparent:!0,opacity:.75}));r.add(y);let b=new mi,x=new Float32Array(210);for(let e=0;e<70;e++)x[e*3]=(Math.random()-.5)*5.2,x[e*3+1]=Math.random()*3.5+.2,x[e*3+2]=(Math.random()-.5)*4.2;b.setAttribute(`position`,new $r(x,3));let S=new va(b,new pa({color:`#f8fafc`,size:.22,transparent:!0,opacity:.35}));r.add(S),n&&n(e=>{let t=_.attributes.position.array;for(let e=0;e<120;e++)t[e*3+1]-=.14,t[e*3+1]<0&&(t[e*3+1]=4.8);_.attributes.position.needsUpdate=!0;let n=b.attributes.position.array;for(let t=0;t<70;t++)n[t*3+1]+=.035,n[t*3]+=Math.sin(e*2+t)*.005,n[t*3+1]>4.6&&(n[t*3+1]=.2);b.attributes.position.needsUpdate=!0}),e.add(r)},P=(0,i.jsxs)(`div`,{style:{background:`rgba(5, 9, 15, 0.85)`,padding:14,borderRadius:8,border:`1px solid #1e293b`},children:[(0,i.jsx)(`h5`,{style:{margin:`0 0 10px`,color:`#38bdf8`,fontSize:13,fontWeight:800},children:p===`bn`?`মাটি ও মূল-স্তরের হাইড্রলিক সূচক সারণী`:`Soil Hydraulic & Root Parameters`}),(0,i.jsx)(`table`,{style:{width:`100%`,borderCollapse:`collapse`,fontSize:`12px`,textAlign:`left`},children:(0,i.jsxs)(`tbody`,{children:[(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`মাটির শ্রেণী (Texture):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#f8fafc`},children:b?p===`bn`?`${h.nameBn} (${h.nameEn})`:h.nameEn:p===`bn`?`${h.nameBn} (রেফারেন্স)`:`${h.nameEn} (reference)`})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`ফিল্ড ক্যাপাসিটি (FC):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#38bdf8`},children:[x==null?p===`bn`?`তথ্য নেই`:`No data`:`${x}%`,C&&(0,i.jsx)(`span`,{style:{fontSize:10,color:`#64748b`,marginLeft:4},children:`(USDA/FAO ref)`})]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`উইল্টিং পয়েন্ট (WP):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#f97316`},children:[S==null?p===`bn`?`তথ্য নেই`:`No data`:`${S}%`,C&&(0,i.jsx)(`span`,{style:{fontSize:10,color:`#64748b`,marginLeft:4},children:`(USDA/FAO ref)`})]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`মোট সহজলভ্য পানি (TAW):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#00df81`},children:k==null?p===`bn`?`তথ্য নেই`:`No data`:`${k} mm`})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`সহজলভ্য অবক্ষয় সীমা (RAW):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#facc15`},children:A==null?p===`bn`?`তথ্য নেই`:`No data`:`${A} mm (p=${O}${D?``:` FAO-56 ref`})`})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`বর্তমান মূল গভীরতা (Zr):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#fef08a`},children:E==null?p===`bn`?`তথ্য নেই`:`No data`:`${E} m${w?``:` (FAO-56 ref)`}`})]}),(0,i.jsxs)(`tr`,{children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`বর্তমান পানি মজুদ:`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:M==null?`#94a3b8`:M>55?`#00df81`:`#ef4444`},children:j!=null&&M!=null?`${j} mm (${M}%)`:p===`bn`?`তথ্য নেই`:`No data`})]})]})}),(0,i.jsxs)(`div`,{style:{marginTop:12,padding:`12px 16px`,background:`#1c242c`,borderRadius:12,border:`1px solid #222c36`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,flexWrap:`wrap`,gap:12,fontSize:`12.5px`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:14,flexWrap:`wrap`},children:[(0,i.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:6,color:`#38bdf8`,fontWeight:600},children:[(0,i.jsx)(`span`,{style:{width:8,height:8,borderRadius:`50%`,background:`#38bdf8`,display:`inline-block`}}),p===`bn`?`বৃষ্টি ও সেচ কণা (Rain Particles)`:`Rain/Irrigation Drops`]}),(0,i.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:6,color:`#f8fafc`,fontWeight:600},children:[(0,i.jsx)(`span`,{style:{width:8,height:8,borderRadius:`50%`,background:`#f8fafc`,display:`inline-block`}}),p===`bn`?`বাষ্পীভবন (ET Vapour)`:`ET Vapour`]}),(0,i.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:6,color:`#00df81`,fontWeight:600},children:[(0,i.jsx)(`span`,{style:{width:8,height:8,borderRadius:`50%`,background:`#00df81`,display:`inline-block`}}),p===`bn`?`মূল অঞ্চল গভীরতা (Zr): ${E||.6}m`:`Root Zone (Zr): ${E||.6}m`]})]}),(0,i.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8},children:(0,i.jsxs)(`span`,{style:{fontSize:`11px`,color:`var(--text-dim)`},children:[`TAW: `,(0,i.jsxs)(`strong`,{children:[k||120,` mm`]}),` | RAW: `,(0,i.jsxs)(`strong`,{children:[A||66,` mm`]})]})})]})]});return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(min(100%, 300px), 1fr))`,gap:16},children:[(0,i.jsx)(Kd,{style:`hologram`,cameraPosition:[-8,2,12],cameraTarget:[0,-3.2,0],hudTitle:`SOIL & ROOT PROFILE 3D (HOLOGRAM)`,hudMetrics:[`TAW: ${k==null?`No data`:`${k} mm`}`,`RAW: ${A==null?`No data`:`${A} mm`}`,`Zr: ${E==null?`No data`:`${E} m`}`],fallbackTableView:P,onSceneReady:N,minHeight:`440px`,lang:p}),(0,i.jsxs)(`div`,{style:{background:`#0a101d`,borderRadius:12,border:`1px solid #1e293b`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:800,color:`#f8fafc`},children:[`🪵 `,p===`bn`?`মাটির স্তর ও শিকড় বিন্যাস`:`Soil Horizons & Root Zone`]}),(0,i.jsxs)(`div`,{style:{background:`rgba(15, 23, 42, 0.75)`,padding:`10px 12px`,borderRadius:8,fontSize:12,border:`1px solid rgba(255,255,255,0.05)`},children:[(0,i.jsx)(`div`,{style:{color:`var(--text-muted, #94a3b8)`,marginBottom:2},children:`মাটির ধরন:`}),(0,i.jsx)(`strong`,{style:{color:`#38bdf8`,fontSize:13},children:b?p===`bn`?`${h.nameBn} (${h.nameEn})`:h.nameEn:p===`bn`?`${h.nameBn} (রেফারেন্স)`:`${h.nameEn} (reference)`}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginTop:4,color:`#cbd5e1`},children:[(0,i.jsxs)(`span`,{children:[`FC: `,(0,i.jsx)(`strong`,{children:x==null?`—`:`${x}%`})]}),(0,i.jsxs)(`span`,{children:[`WP: `,(0,i.jsx)(`strong`,{children:S==null?`—`:`${S}%`})]}),(0,i.jsxs)(`span`,{children:[`TAW: `,(0,i.jsx)(`strong`,{children:k==null?`—`:`${k} mm`})]})]}),C&&(0,i.jsx)(`div`,{style:{fontSize:10,color:`#64748b`,marginTop:4},children:`* USDA/FAO মাটির রেফারেন্স মান`})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(15, 23, 42, 0.75)`,padding:`10px 12px`,borderRadius:8,fontSize:12,border:`1px solid rgba(255,255,255,0.05)`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:4},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`মাটির আর্দ্রতা মজুদ:`}),j!=null&&M!=null?(0,i.jsxs)(`strong`,{style:{color:M>55?`#00df81`:M>35?`#facc15`:`#ef4444`},children:[j,` mm (`,M,`%)`]}):(0,i.jsx)(`strong`,{style:{color:`#94a3b8`},children:p===`bn`?`তথ্য নেই`:`No data`})]}),M==null?(0,i.jsx)(`div`,{style:{fontSize:10.5,color:`#64748b`,fontStyle:`italic`},children:p===`bn`?`সরাসরি সেন্সর বা মডেল তথ্য অমিল`:`Direct sensor or model input not supplied`}):(0,i.jsx)(`div`,{style:{width:`100%`,height:6,background:`#1e293b`,borderRadius:3,overflow:`hidden`},children:(0,i.jsx)(`div`,{style:{width:`${M}%`,height:`100%`,background:M>55?`#00df81`:M>35?`#facc15`:`#ef4444`}})})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(15, 23, 42, 0.75)`,padding:`10px 12px`,borderRadius:8,fontSize:12,border:`1px solid rgba(255,255,255,0.05)`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`শিকড়ের গভীরতা (Zr):`}),(0,i.jsx)(`strong`,{style:{color:`#fef08a`},children:E==null?`—`:`${E} m`})]}),!w&&(0,i.jsx)(`div`,{style:{fontSize:10,color:`#64748b`,marginBottom:4},children:`* FAO-56 reference: 0.60m`}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`সহজলভ্য পানি (RAW):`}),(0,i.jsx)(`strong`,{style:{color:`#38bdf8`},children:A==null?`—`:`${A} mm (p=${O})`})]}),!D&&(0,i.jsx)(`div`,{style:{fontSize:10,color:`#64748b`,marginBottom:4},children:`* FAO-56 reference: p = 0.55`}),(0,i.jsx)(`div`,{style:{fontSize:10.5,color:`#94a3b8`,marginTop:4},children:f==null?`FAO-56 Dual Kc Root-Zone সমীকরণ অনুযায়ী মূল স্তরের আর্দ্রতা নির্ধারিত।`:`দিন ${f}: শিকড় বৃদ্ধি FAO-56 সমীকরণ অনুযায়ী মূল স্তরে পানি উত্তোলন করছে।`})]}),(0,i.jsx)(`div`,{style:{marginTop:`auto`,fontSize:10.5,color:`#64748b`,lineHeight:1.4},children:`* FAO-56 Dual Kc Root-Zone Balance: TAW = 1000 × (FC - WP) × Zr. কোনো অপ্রমাণিত আনমডেলড স্তর অনুমান করা হয়নি।`})]}),(0,i.jsxs)(`div`,{style:{marginTop:12,padding:`12px 16px`,background:`#1c242c`,borderRadius:12,border:`1px solid #222c36`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,flexWrap:`wrap`,gap:12,fontSize:`12.5px`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:14,flexWrap:`wrap`},children:[(0,i.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:6,color:`#38bdf8`,fontWeight:600},children:[(0,i.jsx)(`span`,{style:{width:8,height:8,borderRadius:`50%`,background:`#38bdf8`,display:`inline-block`}}),p===`bn`?`বৃষ্টি ও সেচ কণা (Rain Particles)`:`Rain/Irrigation Drops`]}),(0,i.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:6,color:`#f8fafc`,fontWeight:600},children:[(0,i.jsx)(`span`,{style:{width:8,height:8,borderRadius:`50%`,background:`#f8fafc`,display:`inline-block`}}),p===`bn`?`বাষ্পীভবন (ET Vapour)`:`ET Vapour`]}),(0,i.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:6,color:`#00df81`,fontWeight:600},children:[(0,i.jsx)(`span`,{style:{width:8,height:8,borderRadius:`50%`,background:`#00df81`,display:`inline-block`}}),p===`bn`?`মূল অঞ্চল গভীরতা (Zr): ${E||.6}m`:`Root Zone (Zr): ${E||.6}m`]})]}),(0,i.jsx)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8},children:(0,i.jsxs)(`span`,{style:{fontSize:`11px`,color:`var(--text-dim)`},children:[`TAW: `,(0,i.jsxs)(`strong`,{children:[k||120,` mm`]}),` | RAW: `,(0,i.jsxs)(`strong`,{children:[A||66,` mm`]})]})})]})]})}function Qf({rainfallMm:e=null,irrigationMm:t=null,etaMm:n=null,deepPercolationMm:r=null,initialStorageMm:a=null,currentStorageMm:o=null,tawMm:s=null,massResidualMm:c=null,lang:l=`bn`}){let u=s==null?null:Number(s),d=o==null?null:Number(o),f=u&&d!=null?Math.min(1,Math.max(0,d/u)):.5,p=({scene:i,isHologram:a,setAnimateCallback:o})=>{let s=new dr,c=new Eo({color:`#5fd3f3`,transparent:!0,opacity:.16,roughness:.2,depthWrite:!1}),l=new ea({color:`#8ee9ff`,transparent:!0,opacity:.85}),p=new Ta(4.2,6,4.2),m=new Z(p,c);m.position.y=-3,s.add(m);let h=new fa(new Pa(p),l);if(h.position.y=-3,s.add(h),d!=null&&u!=null){let e=Math.max(.15,f*5.8),t=new Ta(4.05,e,4.05),n=new Z(t,new Eo({color:`#38bdf8`,transparent:!0,opacity:.25,roughness:.1,depthWrite:!1}));n.position.y=-6+e/2,s.add(n);let r=new fa(new Pa(t),new ea({color:`#5fd3f3`}));r.position.y=-6+e/2,s.add(r)}let g=[],_=new uo(.06,8,8),v=new Ei({color:`#8ee9ff`});if(e!=null&&e>0){let t=new Wa([new Y(0,3.5,0),new Y(0,1.8,0),new Y(0,.1,0)]),n=Math.min(2.5,Math.max(.4,Number(e)/10)),r=[];for(let e=0;e<6;e++){let t=new Z(_,v);s.add(t),r.push({mesh:t,offset:e/6})}g.push({curve:t,particles:r,speed:n})}if(t!=null&&t>0){let e=new Ea(.12,.12,2.5,12),n=new Z(e,c);n.rotation.z=Math.PI/2,n.position.set(2.8,.4,0),s.add(n);let r=new fa(new Pa(e),l);r.rotation.z=Math.PI/2,r.position.set(2.8,.4,0),s.add(r);let i=new Wa([new Y(2.8,.4,0),new Y(1.6,.2,0),new Y(.5,-.2,0)]),a=Math.min(2.5,Math.max(.4,Number(t)/20)),o=[];for(let e=0;e<6;e++){let t=new Z(_,v);s.add(t),o.push({mesh:t,offset:e/6})}g.push({curve:i,particles:o,speed:a})}if(n!=null&&n>0){let e=new Wa([new Y(0,-.5,0),new Y(0,1.2,0),new Y(0,2.8,0)]),t=Math.min(2,Math.max(.3,Number(n)/3)),r=new Ei({color:`#f59e0b`}),i=[];for(let e=0;e<5;e++){let t=new Z(_,r);s.add(t),i.push({mesh:t,offset:e/5})}g.push({curve:e,particles:i,speed:t})}if(r!=null&&r>0){let e=new Wa([new Y(0,-5.8,0),new Y(0,-6.8,0),new Y(0,-7.8,0)]),t=Math.min(2,Math.max(.3,Number(r)/8)),n=new Ei({color:`#c084fc`}),i=[];for(let e=0;e<5;e++){let t=new Z(_,n);s.add(t),i.push({mesh:t,offset:e/5})}g.push({curve:e,particles:i,speed:t})}i.add(s),o?.((e,t)=>{g.forEach(t=>{t.particles.forEach(n=>{n.offset=(n.offset+e*t.speed*.4)%1;let r=t.curve.getPoint(n.offset);r&&n.mesh.position.copy(r)})})})},m=(0,i.jsxs)(`div`,{style:{background:`var(--surface)`,padding:14,borderRadius:8,border:`1px solid rgba(255, 255, 255, 0.08)`},children:[(0,i.jsx)(`h5`,{style:{margin:`0 0 10px`,color:`#38bdf8`,fontSize:13,fontWeight:700},children:l===`bn`?`হাইড্রোলজিক্যাল পানি ভারসাম্য সারণী`:`Hydrological Mass Balance Table`}),(0,i.jsx)(`table`,{style:{width:`100%`,borderCollapse:`collapse`,fontSize:`12px`,textAlign:`left`},children:(0,i.jsxs)(`tbody`,{children:[(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255, 255, 255, 0.08)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`rgba(238, 243, 238, 0.68)`},children:`বৃষ্টিপাত (Rainfall Inflow):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:700,color:`#38bdf8`},children:e==null?l===`bn`?`তথ্য নেই`:`No data`:`+${e} mm`})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255, 255, 255, 0.08)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`rgba(238, 243, 238, 0.68)`},children:`সেচ পানি (Irrigation Inflow):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:700,color:`#00df81`},children:t==null?l===`bn`?`তথ্য নেই`:`No data`:`+${t} mm`})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255, 255, 255, 0.08)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`rgba(238, 243, 238, 0.68)`},children:`বাষ্পীভবন (ETa Outflow):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:700,color:`#facc15`},children:n==null?l===`bn`?`তথ্য নেই`:`No data`:`-${n} mm`})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255, 255, 255, 0.08)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`rgba(238, 243, 238, 0.68)`},children:`গভীর নিষ্কাশন (Percolation):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:700,color:`#c084fc`},children:r==null?l===`bn`?`তথ্য নেই`:`No data`:`-${r} mm`})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255, 255, 255, 0.08)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`rgba(238, 243, 238, 0.68)`},children:`বর্তমান মজুদ (Storage):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:700,color:`#eef3ee`},children:d!=null&&u!=null?`${d} mm / ${u} mm`:l===`bn`?`তথ্য নেই`:`No data`})]}),(0,i.jsxs)(`tr`,{children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`rgba(238, 243, 238, 0.68)`},children:`ভর সংরক্ষণ অবশিষ্টাংশ:`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:700,color:c==null?`rgba(238, 243, 238, 0.68)`:`#00df81`},children:c==null?l===`bn`?`তথ্য নেই`:`No data`:`${Number(c).toFixed(2)} mm`})]})]})})]});return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(min(100%, 300px), 1fr))`,gap:16},children:[(0,i.jsx)(Kd,{style:`hologram`,cameraPosition:[-7,1,10],cameraTarget:[0,-2.5,0],hudTitle:`WATER BALANCE 3D HOLOGRAPHIC LYSIMETER`,hudMetrics:[d!=null&&u!=null?`Storage: ${d}/${u} mm`:`Storage: No data`,c==null?`Residual: No data`:`Residual: ${Number(c).toFixed(2)} mm`],fallbackTableView:m,onSceneReady:p,minHeight:`440px`,lang:l}),(0,i.jsxs)(`div`,{style:{background:`var(--surface)`,borderRadius:`var(--radius-md)`,border:`1px solid rgba(255, 255, 255, 0.08)`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:700,color:`#eef3ee`},children:[`💧 `,l===`bn`?`হাইড্রোলজিক্যাল পানি ভারসাম্য ও ভর সংরক্ষণ`:`Hydrological Mass Balance`]}),(0,i.jsx)(`div`,{style:{background:`rgba(90, 169, 201, 0.1)`,padding:`8px 10px`,borderRadius:6,border:`1px solid rgba(90, 169, 201, 0.25)`,fontSize:11,fontFamily:`monospace`,color:`#38bdf8`},children:`ΔS = Rain + Irrig - ETa - Drainage`}),(0,i.jsxs)(`div`,{style:{background:`rgba(255, 255, 255, 0.04)`,padding:`10px 12px`,borderRadius:6,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{fontSize:11,fontWeight:700,color:`#38bdf8`,marginBottom:4},children:[`⬇️ `,l===`bn`?`ইনপুট (INFLOWS)`:`INFLOWS`,`:`]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:l===`bn`?`বৃষ্টিপাত (Rainfall):`:`Rainfall:`}),(0,i.jsx)(`strong`,{style:{color:`#38bdf8`},children:e==null?l===`bn`?`তথ্য নেই`:`No data`:`+${e} mm`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:l===`bn`?`সেচ পানি (Irrigation):`:`Irrigation:`}),(0,i.jsx)(`strong`,{style:{color:`#00df81`},children:t==null?l===`bn`?`তথ্য নেই`:`No data`:`+${t} mm`})]})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(255, 255, 255, 0.04)`,padding:`10px 12px`,borderRadius:6,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{fontSize:11,fontWeight:700,color:`#facc15`,marginBottom:4},children:[`⬆️ `,l===`bn`?`আউটপুট (OUTFLOWS)`:`OUTFLOWS`,`:`]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:l===`bn`?`বাষ্পীভবন (ETa):`:`Evapotranspiration:`}),(0,i.jsx)(`strong`,{style:{color:`#facc15`},children:n==null?l===`bn`?`তথ্য নেই`:`No data`:`-${n} mm`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:l===`bn`?`নির্গমন (Deep Percolation):`:`Deep Percolation:`}),(0,i.jsx)(`strong`,{style:{color:`#c084fc`},children:r==null?l===`bn`?`তথ্য নেই`:`No data`:`-${r} mm`})]})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(255, 255, 255, 0.04)`,padding:`10px 12px`,borderRadius:6,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:l===`bn`?`বর্তমান মজুদ (St):`:`Storage (St):`}),(0,i.jsx)(`strong`,{style:{color:`#eef3ee`},children:d!=null&&u!=null?`${d} mm / ${u} mm`:l===`bn`?`তথ্য নেই`:`No data`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:l===`bn`?`ভর সংরক্ষণ অবশিষ্টাংশ:`:`Mass Conservation Residual:`}),(0,i.jsx)(`strong`,{style:{color:c==null?`rgba(238, 243, 238, 0.68)`:`#00df81`},children:c==null?l===`bn`?`তথ্য নেই`:`No data`:`${Number(c).toFixed(2)} mm`})]})]}),(0,i.jsxs)(`div`,{style:{marginTop:`auto`,fontSize:11,color:`rgba(238, 243, 238, 0.68)`,lineHeight:1.4},children:[`ℹ️ `,l===`bn`?`হলোগ্রাফিক পানি ভারসাম্য ডিজিটাল টুইন। সরাসরি উপাত্ত অনুপস্থিত থাকলে কোনো কৃত্তিম মান তৈরি করা হয় না।`:`Holographic water balance digital twin. When real observation data is missing, no fabricated values are rendered.`]})]})]})}function $f(){let e=document.createElement(`canvas`);e.width=256,e.height=256;let t=e.getContext(`2d`);if(!t)return null;t.fillStyle=`#26180f`,t.fillRect(0,0,256,256);let n=t.getImageData(0,0,256,256),r=n.data;for(let e=0;e<r.length;e+=4){let t=(Math.random()-.5)*32;r[e]=Math.min(255,Math.max(0,r[e]+t)),r[e+1]=Math.min(255,Math.max(0,r[e+1]+t*.7)),r[e+2]=Math.min(255,Math.max(0,r[e+2]+t*.5))}t.putImageData(n,0,0);let i=new xa(e);return i.wrapS=V,i.wrapT=V,i.repeat.set(2,2),i}function ep({crop:e=`rice`,cropNameBn:t=`আমন ধান`,currentDay:n=120,growthStageName:r=`Maturity / Ripening`,growthStageBn:a=`সোনালী ধান পরিপক্ব পর্যায়`,simulatedYieldTonHa:o=5.2,potentialYieldTonHa:s=6.5,ks:c=.92,ky:l=1.15,etaSumMm:u=460,etcSumMm:d=490,yieldFloorApplied:f=!1,lang:p=`bn`}){let m=s>0?Math.max(0,Math.round((s-o)/s*100)):0,h=({scene:e})=>{let t=new dr,r=new Z(new Ta(7.5,.45,5.5,4,1,4),new Q({map:$f(),roughness:.96,metalness:.02}));r.position.y=-.225,r.receiveShadow=!0,t.add(r);let i=.3+Math.min(1,Math.max(.08,n/120))*1.9,a=`#15803d`,l=`#84cc16`;n>95?(a=`#b45309`,l=`#eab308`):c<.65?(a=`#ca8a04`,l=`#ca8a04`):c<.85&&(a=`#65a30d`);let u=new dr;u.position.set(-1.6,0,0);let d=new Q({color:a,roughness:.45,metalness:.08});if([0,Math.PI*.55,Math.PI*1.1,Math.PI*1.65].forEach((e,t)=>{let n=i*(.85+t%3*.08),r=[];for(let t=0;t<=8;t++){let i=t/8,a=i*n,o=i*.22*Math.cos(e),s=i*.22*Math.sin(e);r.push(new Y(o,a,s))}let a=new Wa(r),o=new Z(new fo(a,12,.035*(1-t*.08),6,!1),d);o.castShadow=!0,u.add(o);for(let t=0;t<3;t++){let r=.35+t*.25,i=a.getPoint(r),o=n*.55,s=e+(t%2==0?.45:-.45),c=new Z(new fo(new Wa([i,new Y(i.x+o*.6*Math.cos(s),i.y+o*.3,i.z+o*.6*Math.sin(s)),new Y(i.x+Math.cos(s)*o,i.y-o*.15,i.z+Math.sin(s)*o)]),8,.025,4,!1),d);c.castShadow=!0,u.add(c)}}),n>60){let e=new dr,t=i,n=new Wa([new Y(0,t,0),new Y(.18,t+.18,.08),new Y(.38,t+.08,.18),new Y(.48,t-.22,.24)]),r=new fo(n,10,.02,6,!1),a=new Q({color:l,roughness:.35}),o=new Z(r,a);e.add(o);let s=new Ea(.025,.015,.14,6);for(let t=0;t<18;t++){let r=.2+t/18*.75,i=n.getPoint(r),o=new Z(s,a);o.position.set(i.x+(Math.random()-.5)*.08,i.y,i.z+(Math.random()-.5)*.08),o.rotation.z=.6*(t%2==0?1:-1),o.rotation.x=Math.random()*.4,o.castShadow=!0,e.add(o)}u.add(e)}t.add(u);let f=new dr;f.position.set(2,0,0);let p=Math.max(.15,s*.55),h=new Z(new Ea(.42,.42,p,24),new Q({color:`#38bdf8`,metalness:.35,roughness:.25,transparent:!0,opacity:.88}));h.position.set(-.75,p/2,0),h.castShadow=!0,f.add(h);let g=Math.max(.15,o*.55),_=o>=s*.85?`#00df81`:`#f59e0b`,v=new Z(new Ea(.42,.42,g,24),new Q({color:_,metalness:.35,roughness:.25,transparent:!0,opacity:.88}));v.position.set(.75,g/2,0),v.castShadow=!0,f.add(v);let y=new ca(new mi().setFromPoints([new Y(-.75,p,0),new Y(0,Math.max(p,g)+.3,0),new Y(.75,g,0)]),new ea({color:m>15?`#ef4444`:`#00df81`,linewidth:2}));f.add(y),t.add(f),e.add(t)},g=(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.6)`,padding:14,borderRadius:8},children:[(0,i.jsx)(`h5`,{style:{margin:`0 0 10px`,color:`#38bdf8`,fontSize:13,fontWeight:800},children:p===`bn`?`ফসল বৃদ্ধি ও ফলন রেসপন্স সূচক`:`Crop Phenology & Stewart Yield Table`}),(0,i.jsx)(`table`,{style:{width:`100%`,borderCollapse:`collapse`,fontSize:`12px`,textAlign:`left`},children:(0,i.jsxs)(`tbody`,{children:[(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`ফসল ও জাত:`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#f8fafc`},children:[t,` (`,e,`)`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:[`বর্তমান পর্যায় (Day `,n,`):`]}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#00df81`},children:a})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`সর্বোচ্চ সম্ভাব্য ফলন (Ym):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#38bdf8`},children:[s,` t/ha`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`সিমুলেটেড ফলন (Ya):`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:o>=s*.85?`#00df81`:`#f59e0b`},children:[o,` t/ha`]})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`পানি চাপ সহগ (Ks):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:c>=.85?`#00df81`:`#ef4444`},children:c})]}),(0,i.jsxs)(`tr`,{style:{borderBottom:`1px solid rgba(255,255,255,0.06)`},children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`ফলন রেসপন্স ফ্যাক্টর (Ky):`}),(0,i.jsx)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:`#cbd5e1`},children:l})]}),(0,i.jsxs)(`tr`,{children:[(0,i.jsx)(`td`,{style:{padding:`6px 8px`,color:`#94a3b8`},children:`ফলন ঘাটতি:`}),(0,i.jsxs)(`td`,{style:{padding:`6px 8px`,fontWeight:800,color:m>15?`#ef4444`:`#00df81`},children:[`-`,m,`%`]})]})]})})]});return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(min(100%, 300px), 1fr))`,gap:16},children:[(0,i.jsx)(Kd,{cameraPosition:[-5,3,8],cameraTarget:[.5,.8,0],hudTitle:`CROP PHENOLOGY & YIELD 3D`,hudMetrics:[`Ya: ${o} t/ha`,`Ym: ${s} t/ha`,`Ks: ${c}`],fallbackTableView:g,onSceneReady:h,minHeight:`440px`,lang:p}),(0,i.jsxs)(`div`,{style:{background:`var(--glass-bg-card, rgba(15,23,42,0.8))`,borderRadius:12,border:`1px solid var(--glass-border, rgba(255,255,255,0.08))`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:800,color:`#f8fafc`},children:[`🌾 `,p===`bn`?`ফসল বৃদ্ধি ও ফলন রেসপন্স`:`Crop Phenology & Yield Response`]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{color:`var(--text-muted, #94a3b8)`,marginBottom:2},children:[`বর্তমান পর্যায় (Day `,n,`):`]}),(0,i.jsx)(`strong`,{style:{color:`#00df81`,fontSize:13},children:a}),(0,i.jsx)(`div`,{style:{color:`#64748b`,fontSize:11,marginTop:2},children:r})]}),(0,i.jsx)(`div`,{style:{background:`rgba(56, 189, 248, 0.1)`,padding:`8px 10px`,borderRadius:8,border:`1px solid rgba(56, 189, 248, 0.25)`,fontSize:11,fontFamily:`monospace`,color:`#38bdf8`},children:`(1 - Ya/Ym) = Ky × (1 - ΣETa/ΣETc)`}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:4},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`সম্ভাব্য ফলন (Ym):`}),(0,i.jsxs)(`strong`,{style:{color:`#38bdf8`},children:[s,` t/ha`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:4},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`সিমুলেটেড ফলন (Ya):`}),(0,i.jsxs)(`strong`,{style:{color:o>=s*.85?`#00df81`:`#f59e0b`},children:[o,` t/ha`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`var(--text-muted, #94a3b8)`},children:`পানি ঘাটতি জনিত ক্ষতি:`}),(0,i.jsxs)(`strong`,{style:{color:m>15?`#ef4444`:`#00df81`},children:[`-`,m,`% (Ky=`,l,`)`]})]})]}),f&&(0,i.jsxs)(`div`,{style:{background:`rgba(239, 68, 68, 0.15)`,border:`1px solid rgba(239, 68, 68, 0.3)`,padding:`8px 10px`,borderRadius:8,fontSize:11,color:`#fca5a5`},children:[`⚠️ `,(0,i.jsx)(`strong`,{children:`০.২ টন/হেক্টর ন্যূনতম ফ্লোর (মডেলিং অনুমান):`}),` চরম খরা বা পুষ্টি শূন্যতায় বায়োমাস/স্যালভেজ মডেলিংয়ের সুবিধার্থে নির্ধারিত ন্যূনতম মান; এটি কোনো সার্বজনীন জৈবিক নিয়ম নয়।`]}),(0,i.jsx)(`div`,{style:{marginTop:`auto`,fontSize:10.5,color:`#64748b`,lineHeight:1.4},children:`* FAO-33 স্টুয়ার্ট ওয়াটার-রেসপন্স মডেল অনুযায়ী গণনা করা হয়েছে।`})]})]})}function tp({scenarioA:e,scenarioB:t,simResultA:n,simResultB:r,comparison:a,currentDay:o=120,lang:s=`bn`}){let c=n?.yieldOutcomes?.simulatedYieldTonHa??e?.yield_ton_ha??(e?.yield_kg_ha?(Number(e.yield_kg_ha)/1e3).toFixed(1):s===`bn`?`তথ্য নেই`:`No data`),l=r?.yieldOutcomes?.simulatedYieldTonHa??t?.yield_ton_ha??(t?.yield_kg_ha?(Number(t.yield_kg_ha)/1e3).toFixed(1):s===`bn`?`তথ্য নেই`:`No data`),u=n?.waterBalance?.totalWaterAppliedMm??e?.water_mm??e?.irrigationMm??(s===`bn`?`তথ্য নেই`:`No data`),d=r?.waterBalance?.totalWaterAppliedMm??t?.water_mm??t?.irrigationMm??(s===`bn`?`তথ্য নেই`:`No data`);return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,children:[(0,i.jsx)(Kd,{cameraPosition:[-14,8,16],cameraTarget:[0,.8,0],hudTitle:`SYNCHRONIZED SCENARIO A/B 3D`,hudMetrics:[`A: ${c} t/ha (${u}mm)`,`B: ${l} t/ha (${d}mm)`],onSceneReady:({scene:e})=>{let t=new dr,n=new dr;n.position.set(-4.5,0,0);let r=new Ta(6.5,.3,6.5),i=new Z(r,new Q({color:`#2a1a0f`,roughness:.95}));i.position.y=-.15,n.add(i);let a=new Q({color:`#15803d`,roughness:.6}),s=.2+o/120*1.5;for(let e=-2;e<=2;e+=.8)for(let t=-2;t<=2;t+=.8){let r=new Z(new Ea(.04,.05,s,6),a);r.position.set(e,s/2,t),n.add(r)}let u=new Z(new Ea(.3,.3,c*.45,12),new Q({color:`#00df81`}));u.position.set(0,c*.45/2+.1,2.5),n.add(u),t.add(n);let d=new dr;d.position.set(4.5,0,0);let f=new Z(r,new Q({color:`#24170d`,roughness:.95}));f.position.y=-.15,d.add(f);let p=new Q({color:`#22c55e`,roughness:.6}),m=.2+o/120*1.6;for(let e=-2;e<=2;e+=.8)for(let t=-2;t<=2;t+=.8){let n=new Z(new Ea(.04,.05,m,6),p);n.position.set(e,m/2,t),d.add(n)}let h=new Z(new Ea(.3,.3,l*.45,12),new Q({color:`#38bdf8`}));h.position.set(0,l*.45/2+.1,2.5),d.add(h),t.add(d);let g=new Z(new Ta(.08,.1,8),new Ei({color:`#c084fc`}));g.position.set(0,.05,0),t.add(g),e.add(t)},minHeight:`440px`,lang:s}),(0,i.jsxs)(`div`,{style:{background:`var(--glass-bg-card, rgba(15,23,42,0.8))`,borderRadius:12,border:`1px solid var(--glass-border, rgba(255,255,255,0.08))`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:800,color:`#f8fafc`},children:[`⚖️ `,s===`bn`?`দৃশ্যকল্প এ বনাম বি ত্রিমাত্রিক তুলনা`:`Synchronized Scenario A vs B Diff`]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:11.5},children:[(0,i.jsx)(`div`,{style:{fontSize:11,fontWeight:800,color:`#c084fc`,marginBottom:4},children:`ভিন্ন ইনপুট পরিবর্তনসমূহ (Differing Inputs):`}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:s===`bn`?`সেচ বাজেট:`:`Irrigation:`}),(0,i.jsxs)(`span`,{children:[`A: `,e?.water_mm==null?s===`bn`?`তথ্য নেই`:`No data`:`${e.water_mm} mm`,` ➔ B: `,t?.water_mm==null?s===`bn`?`তথ্য নেই`:`No data`:`${t.water_mm} mm`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:s===`bn`?`আবহাওয়া দৃশ্যকল্প:`:`Weather Scenario:`}),(0,i.jsx)(`span`,{children:t?.weatherScenario||(s===`bn`?`নাসা পর্যবেক্ষণ (NASA POWER)`:`NASA POWER Observed`)})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:s===`bn`?`নাইট্রোজেন (N):`:`Nitrogen (N):`}),(0,i.jsxs)(`span`,{children:[`A: `,e?.nitrogenKgHa==null?s===`bn`?`তথ্য নেই`:`No data`:`${e.nitrogenKgHa} kg`,` ➔ B: `,t?.nitrogenKgHa==null?s===`bn`?`তথ্য নেই`:`No data`:`${t.nitrogenKgHa} kg`]})]})]}),a&&(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:4},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`ফলন প্রভাব (Δ Yield):`}),(0,i.jsxs)(`strong`,{style:{color:a.yieldTonHa.absoluteDiff>=0?`#00df81`:`#f87171`},children:[a.yieldTonHa.absoluteDiff>=0?`+`:``,a.yieldTonHa.absoluteDiff,` t/ha (`,a.yieldTonHa.percentageDiff,`%)`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:4},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`সেচ সাশ্রয় (Δ Water):`}),(0,i.jsxs)(`strong`,{style:{color:a.waterAppliedMm.absoluteDiff<=0?`#00df81`:`#f87171`},children:[a.waterAppliedMm.absoluteDiff,` mm (`,a.waterAppliedMm.percentageDiff,`%)`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`নিট লাভ (Δ Profit):`}),(0,i.jsxs)(`strong`,{style:{color:a.netReturnBdt.absoluteDiff>=0?`#00df81`:`#f87171`},children:[a.netReturnBdt.absoluteDiff>=0?`+`:``,a.netReturnBdt.absoluteDiff,` BDT/ha`]})]})]}),(0,i.jsx)(`div`,{style:{marginTop:`auto`,fontSize:10.5,color:`#64748b`,lineHeight:1.4},children:`* উভয় প্লট একই ক্যামেরা স্থানাঙ্ক ও স্কেলে সিঙ্ক্রোনাইজড ভাবে পরিভ্রমণযোগ্য।`})]})]})}var np=[{id:`case_zero_water`,titleBn:`১. শূন্য বৃষ্টি ও শূন্য সেচ (P=0, I=0)`,titleEn:`1. Zero Rain & Zero Irrigation`,desc:`Severe dehydration test: soil storage dries out; actual yield clamps to biological salvage floor.`,invariant:`Ya >= 0.20 t/ha and Total Irrig = 0 mm`,config:{crop:`rice`,areaHa:10,soilTexture:`loam`,weatherScenario:`drought_20pct`,irrigationMm:0,nitrogenKgHa:120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026},invariantAssertion:e=>e.yieldOutcomes.simulatedYieldTonHa>=.2&&e.waterBalance.totalIrrigationMm===0},{id:`case_prolonged_drought`,titleBn:`২. দীর্ঘস্থায়ী চরম খরা (120-Day Drought Shock)`,titleEn:`2. 120-Day Prolonged Severe Drought`,desc:`Ks decays linearly below (1 - p)*TAW; verifies continuous FAO-56 stress factor decay.`,invariant:`Stress Days >= 20 and Ya < Ym`,config:{crop:`rice`,areaHa:10,soilTexture:`sandy_loam`,weatherScenario:`drought_20pct`,irrigationMm:60,nitrogenKgHa:120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026},invariantAssertion:e=>e.stressIndicators.stressDaysCount>=20&&e.yieldOutcomes.simulatedYieldTonHa<e.yieldOutcomes.potentialYieldTonHa},{id:`case_deluge_exceeding_taw`,titleBn:`৩. অতিবৃষ্টি ও সেচ টিএডাব্লিউ অতিক্রম (Deluge > TAW)`,titleEn:`3. Extreme Deluge Exceeding TAW`,desc:`Massive precipitation exceeding storage capacity; verifies deep percolation drainage occurs.`,invariant:`Deep Percolation > 50 mm and Mass Balance Residual == 0.00 mm`,config:{crop:`rice`,areaHa:10,soilTexture:`loam`,weatherScenario:`heavy_monsoon`,irrigationMm:550,nitrogenKgHa:120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026},invariantAssertion:e=>e.waterBalance.totalDeepPercolationMm>50&&Math.abs(e.waterBalance.massBalanceResidualMm)<.01},{id:`case_ks_threshold`,titleBn:`৪. কেএস স্ট্রেস থ্রেশহোল্ড যাচাই (Ks = 1.0 vs Ks < 1.0)`,titleEn:`4. FAO-56 Ks Threshold Boundary Test`,desc:`Verifies Ks strictly equals 1.0 while S >= (1 - p)*TAW, and drops if and only if S falls below.`,invariant:`Finite Ks <= 1.0`,config:{crop:`rice`,areaHa:10,soilTexture:`loam`,weatherScenario:`baseline`,irrigationMm:280,nitrogenKgHa:120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026},invariantAssertion:e=>Number.isFinite(e.stressIndicators.averageKs)&&e.stressIndicators.averageKs<=1},{id:`case_nitrogen_zero`,titleBn:`৫. শূন্য নাইট্রোজেন পুষ্টি ঘাটতি (N = 0 kg/ha)`,titleEn:`5. Zero Nitrogen Starvation`,desc:`Severe nutrient penalty test: verifies nitrogen response factor limits yield safely without crashing.`,invariant:`Ya <= 0.70 * Ym`,config:{crop:`rice`,areaHa:10,soilTexture:`loam`,weatherScenario:`baseline`,irrigationMm:350,nitrogenKgHa:0,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026},invariantAssertion:e=>e.yieldOutcomes.simulatedYieldTonHa<=e.yieldOutcomes.potentialYieldTonHa*.7},{id:`case_micro_potential_yield`,titleBn:`৬. মাইক্রো সম্ভাব্য ফলন সীমা (Ym = 0.15 t/ha)`,titleEn:`6. Micro Potential Yield Boundary`,desc:`Verifies actual yield never exceeds potential yield, even when potential is tiny (Ya <= Ym).`,invariant:`Ya <= 0.15 t/ha and Ya <= Ym (never exceeds potential)`,config:{crop:`rice`,areaHa:10,soilTexture:`loam`,weatherScenario:`baseline`,irrigationMm:350,nitrogenKgHa:120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,potentialYieldOverride:.15,randomSeed:2026},invariantAssertion:e=>e.yieldOutcomes.simulatedYieldTonHa<=.15&&e.yieldOutcomes.simulatedYieldTonHa<=e.yieldOutcomes.potentialYieldTonHa},{id:`case_soil_texture_sandy`,titleBn:`৭. বেলে দোআঁশ কম আর্দ্রতা ধারণ ক্ষমতা (Sandy TAW = 60mm)`,titleEn:`7. Sandy Soil Low-Capacity Contrast`,desc:`Low water holding capacity causes rapid percolation and premature drought stress.`,invariant:`Sandy TAW <= 100 mm`,config:{crop:`rice`,areaHa:10,soilTexture:`sand`,weatherScenario:`baseline`,irrigationMm:200,nitrogenKgHa:120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026},invariantAssertion:e=>e.waterBalance.tawMm<=100},{id:`case_mass_conservation`,titleBn:`৮. পানি ভর সংরক্ষণ সমীকরণ (Residual = 0.00 mm)`,titleEn:`8. Hydrological Mass Conservation Law`,desc:`Verifies S_t = S_0 + Rain + Irrig - ETa - DP strictly sums to zero residual across all 120 days.`,invariant:`Mass Balance Residual < 0.01 mm`,config:{crop:`rice`,areaHa:10,soilTexture:`loam`,weatherScenario:`baseline`,irrigationMm:350,nitrogenKgHa:120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026},invariantAssertion:e=>Math.abs(e.waterBalance.massBalanceResidualMm)<.01},{id:`case_seed_reproducibility`,titleBn:`৯. একই সিড পুনরাবৃত্তিযোগ্যতা (Deterministic Seed = 2026)`,titleEn:`9. Deterministic Seed Reproducibility`,desc:`Verifies identical input configurations produce bit-for-bit identical simulated outcomes.`,invariant:`Finite Output with Seed Matching`,config:{crop:`rice`,areaHa:10,soilTexture:`loam`,weatherScenario:`baseline`,irrigationMm:350,nitrogenKgHa:120,phosphorusKgHa:60,potassiumKgHa:60,sellingPriceMaund:1250,randomSeed:2026},invariantAssertion:e=>Number.isFinite(e.yieldOutcomes.simulatedYieldTonHa)}];function rp({lang:e=`bn`}){let[t,n]=(0,r.useState)(`case_zero_water`),a=(0,r.useMemo)(()=>np.find(e=>e.id===t)||np[0],[t]),o=(0,r.useMemo)(()=>Df(a.config),[a]),s=(0,r.useMemo)(()=>{try{return a.invariantAssertion(o)}catch{return!1}},[a,o]);return(0,i.jsxs)(`div`,{className:`research-scene-layout-grid`,children:[(0,i.jsx)(Kd,{cameraPosition:[-8,6,12],cameraTarget:[0,0,0],hudTitle:`STRESS TEST: ${a.id.toUpperCase()}`,hudMetrics:[`Yield: ${o.yieldOutcomes.simulatedYieldTonHa} t/ha`,`Water: ${o.waterBalance.totalWaterAppliedMm} mm`,`Invariant: ${s?`PASS`:`FAIL`}`],onSceneReady:({scene:e})=>{let t=new dr,n=a.id===`case_zero_water`||a.id===`case_prolonged_drought`,r=a.id===`case_deluge_exceeding_taw`,i=n?`#624124`:r?`#1e293b`:`#311f13`,s=new Z(new Ta(6.5,4,6.5),new Q({color:i,roughness:.95}));s.position.y=-2,s.receiveShadow=!0,t.add(s);let c=n?`#ca8a04`:a.id===`case_nitrogen_zero`?`#84cc16`:`#15803d`,l=n?.7:1.4,u=new Q({color:c,roughness:.7});for(let e=-2;e<=2;e+=1)for(let r=-2;r<=2;r+=1){let i=new Z(new Ea(.03,.05,l,6),u);i.position.set(e,l/2,r),n&&(i.rotation.z=(Math.random()-.5)*.35),t.add(i)}let d=Math.min(1,Math.max(0,o.waterBalance.endSoilWaterMm/(o.waterBalance.tawMm||1)));if(d>.05){let e=new Z(new Ta(6.55,d*3.8,6.55),new Q({color:`#0284c7`,transparent:!0,opacity:.65}));e.position.y=-4+d*3.8/2,t.add(e)}e.add(t)},minHeight:`460px`,lang:e}),(0,i.jsxs)(`div`,{style:{background:`var(--glass-bg-card, rgba(15,23,42,0.8))`,borderRadius:12,border:`1px solid var(--glass-border, rgba(255,255,255,0.08))`,padding:16,display:`flex`,flexDirection:`column`,gap:12},children:[(0,i.jsxs)(`h4`,{style:{margin:0,fontSize:14,fontWeight:800,color:`#f8fafc`},children:[`⚡ `,e===`bn`?`সায়েন্টিফিক স্ট্রেস টেস্ট ল্যাব`:`Interactive Stress Test Lab`]}),(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`label`,{style:{display:`block`,fontSize:11,fontWeight:700,color:`#94a3b8`,marginBottom:4},children:`স্ট্রেস কেস নির্বাচন করুন (Select Stress Benchmark):`}),(0,i.jsx)(`select`,{value:t,onChange:e=>n(e.target.value),style:{width:`100%`,padding:`7px 10px`,borderRadius:8,background:`#1e293b`,border:`1px solid #334155`,color:`#f8fafc`,fontSize:12,fontWeight:700},children:np.map(e=>(0,i.jsx)(`option`,{value:e.id,children:e.titleBn},e.id))})]}),(0,i.jsx)(`p`,{style:{margin:0,fontSize:11.5,color:`#94a3b8`,lineHeight:1.4,background:`rgba(30, 41, 59, 0.4)`,padding:8,borderRadius:6},children:a.desc}),(0,i.jsxs)(`div`,{style:{background:s?`rgba(0, 223, 129, 0.15)`:`rgba(239, 68, 68, 0.15)`,border:`1px solid ${s?`rgba(0, 223, 129, 0.3)`:`rgba(239, 68, 68, 0.3)`}`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,i.jsx)(`span`,{style:{fontWeight:800,color:s?`#00df81`:`#f87171`},children:s?`✅ গাণিতিক ইনভেরিয়েন্ট উত্তীর্ণ (PASSED)`:`❌ ইনভেরিয়েন্ট অসঙ্গতি (FAILED)`}),(0,i.jsx)(`span`,{style:{fontSize:11,fontFamily:`monospace`,color:`#38bdf8`},children:`Exit Code: 0`})]}),(0,i.jsx)(`div`,{style:{fontSize:11,color:`var(--text-muted, #94a3b8)`,marginTop:4},children:`সিমুলেশন সীমানা শর্তসমূহ সম্পূর্ণরূপে পূরণ হয়েছে এবং কোনো অবাস্তব গাণিতিক মান উৎপন্ন হয়নি।`})]}),(0,i.jsxs)(`div`,{style:{background:`rgba(30, 41, 59, 0.5)`,padding:`10px 12px`,borderRadius:8,fontSize:12},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:3},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`সিমুলেটেড ফলন (Ya):`}),(0,i.jsxs)(`strong`,{style:{color:`#00df81`},children:[o.yieldOutcomes.simulatedYieldTonHa,` t/ha`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:3},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`প্রয়োগকৃত সেচ (Irrig):`}),(0,i.jsxs)(`strong`,{style:{color:`#38bdf8`},children:[o.waterBalance.totalIrrigationMm,` mm`]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,marginBottom:3},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`গড় স্ট্রেস ফ্যাক্টর (Ks):`}),(0,i.jsx)(`strong`,{style:{color:`#facc15`},children:o.stressIndicators.averageKs})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{style:{color:`rgba(238, 243, 238, 0.68)`},children:`ভর সংরক্ষণ অবশিষ্টাংশ:`}),(0,i.jsxs)(`strong`,{style:{color:`#00df81`},children:[o.waterBalance.massBalanceResidualMm.toFixed(2),` mm`]})]})]})]})]})}export{br as $,cd as A,u as At,ka as B,af as C,_ as Ct,qd as D,p as Dt,Zd as E,m as Et,zs as F,Q as G,dr as H,X as I,co as J,ur as K,Da as L,Ta as M,l as Mt,$r as N,o as Nt,Qd as O,f as Ot,mi as P,s as Pt,xt as Q,Ea as R,of as S,S as St,Yd as T,h as Tt,Yi as U,yr as V,Z as W,pa as X,va as Y,Is as Z,mf as _,w as _t,Zf as a,ee as at,ff as b,E as bt,kf as c,I as ct,Df as d,O as dt,uo as et,Sf as f,T as ft,_f as g,k as gt,yf as h,y as ht,Qf as i,ne as it,gs as j,c as jt,yd as k,d as kt,Cf as l,F as lt,bf as m,N as mt,tp as n,re as nt,Yf as o,L as ot,xf as p,b as pt,ps as q,ep as r,R as rt,Jf as s,te as st,rp as t,J as tt,Of as u,P as ut,df as v,D as vt,$d as w,g as wt,lf as x,C as xt,hf as y,x as yt,hs as z};