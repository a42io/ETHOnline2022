import{r as T}from"./index.45267a55.js";function M(e){return T.exports.useEffect(()=>()=>e(),[])}const E=1/60*1e3,v=typeof performance<"u"?()=>performance.now():()=>Date.now(),R=typeof window<"u"?e=>window.requestAnimationFrame(e):e=>setTimeout(()=>e(v()),E);function N(e){let t=[],n=[],f=0,o=!1,a=!1;const p=new WeakSet,m={schedule:(s,r=!1,c=!1)=>{const x=c&&o,F=x?t:n;return r&&p.add(s),F.indexOf(s)===-1&&(F.push(s),x&&o&&(f=t.length)),s},cancel:s=>{const r=n.indexOf(s);r!==-1&&n.splice(r,1),p.delete(s)},process:s=>{if(o){a=!0;return}if(o=!0,[t,n]=[n,t],n.length=0,f=t.length,f)for(let r=0;r<f;r++){const c=t[r];c(s),p.has(c)&&(m.schedule(c),e())}o=!1,a&&(a=!1,m.process(s))}};return m}const O=40;let h=!0,i=!1,w=!1;const u={delta:0,timestamp:0},d=["read","update","preRender","render","postRender"],l=d.reduce((e,t)=>(e[t]=N(()=>i=!0),e),{}),P=d.reduce((e,t)=>{const n=l[t];return e[t]=(f,o=!1,a=!1)=>(i||A(),n.schedule(f,o,a)),e},{}),q=d.reduce((e,t)=>(e[t]=l[t].cancel,e),{}),K=d.reduce((e,t)=>(e[t]=()=>l[t].process(u),e),{}),y=e=>l[e].process(u),S=e=>{i=!1,u.delta=h?E:Math.max(Math.min(e-u.timestamp,O),1),u.timestamp=e,w=!0,d.forEach(y),w=!1,i&&(h=!1,R(S))},A=()=>{i=!0,h=!0,w||R(S)},L=()=>u,C="production",U=typeof process>"u"||process.env===void 0?C:"production",g=new Set;function W(e,t,n){e||g.has(t)||(console.warn(t),n&&console.warn(n),g.add(t))}export{q as c,U as e,K as f,L as g,P as s,M as u,W as w};
