!function(t,e){if("object"==typeof exports&&"object"==typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var i=e();for(var r in i)("object"==typeof exports?exports:t)[r]=i[r]}}(self,(()=>(()=>{"use strict";var t={d:(e,i)=>{for(var r in i)t.o(i,r)&&!t.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:i[r]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};t.r(e),t.d(e,{OneEuroFilter:()=>i});class i{minCutOff;beta;dCutOff;xPrev;dxPrev;tPrev;initialized;constructor(t,e){this.minCutOff=t,this.beta=e,this.dCutOff=.001,this.xPrev=null,this.dxPrev=null,this.tPrev=null,this.initialized=!1}smoothingFactor(t,e){const i=2*Math.PI*e*t;return i/(i+1)}exponentialSmoothing(t,e,i){return t*e+(1-t)*i}reset(){this.initialized=!1}filter(t,e){if(!this.initialized)return this.initialized=!0,this.xPrev=e,this.dxPrev=e.map((()=>0)),this.tPrev=t,e;const{xPrev:i,tPrev:r,dxPrev:o}=this,n=t-r,s=this.smoothingFactor(n,this.dCutOff),f=[],h=[],l=[];for(let t=0;t<e.length;t++){f[t]=(e[t]-i[t])/n,h[t]=this.exponentialSmoothing(s,f[t],o[t]);const r=this.minCutOff+this.beta*Math.abs(h[t]),a=this.smoothingFactor(n,r);l[t]=this.exponentialSmoothing(a,e[t],i[t])}return this.xPrev=l,this.dxPrev=h,this.tPrev=t,l}}return e})()));