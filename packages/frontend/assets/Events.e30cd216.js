import{E as S,S as v,o as l}from"./EventPostsSort.a981b119.js";import{c as P,r as n,d as g,j as e,P as E,a as x,C as I,e as d,B as y,L as A,I as b,S as C}from"./index.45267a55.js";import{u as k}from"./useIsMountedRef.8679602d.js";import{H as w}from"./HeaderBreadcrumbs.aa6f00fa.js";import{G as m,E as H}from"./EventNewEventForm.813d099f.js";import"./Skeleton.2fbea2df.js";import"./icon_plan_premium.9e5277e0.js";import"./illustration_404.9a071508.js";import"./transition.1cb4ca21.js";import"./warn-once.cd84a28c.js";const O=[{value:"latest",label:"Latest"},{value:"oldest",label:"Oldest"}],j=(s,r)=>r==="latest"?l(s,["createdAt"],["desc"]):r==="oldest"?l(s,["createdAt"],["asc"]):s;function F(){const{themeStretch:s}=P(),r=k(),[o,u]=n.exports.useState([]),[a,f]=n.exports.useState("latest"),p=j(o,a),i=n.exports.useCallback(async()=>{try{const t=await g.get("/events");r.current&&u(t.data.events)}catch(t){console.error(t)}},[r]);n.exports.useEffect(()=>{i()},[i]);const h=t=>{t&&f(t)};return e(E,{title:"Event: Posts",children:x(I,{maxWidth:s?!1:"lg",children:[e(w,{heading:"Events",links:[{name:"Home",href:d.events.root},{name:"Events"}],action:e(y,{variant:"contained",component:A,to:d.events.new,startIcon:e(b,{icon:"eva:plus-fill"}),children:"New Event"})}),e(C,{mb:5,direction:"row",alignItems:"center",justifyContent:"space-between",children:e(S,{query:a,options:O,onSort:h})}),e(m,{container:!0,spacing:3,children:(o.length?p:[...Array(5)]).map((t,c)=>t?e(m,{item:!0,xs:12,sm:6,md:4,children:e(H,{post:t,index:c})},t.id):e(v,{},c))})]})})}export{F as default};
