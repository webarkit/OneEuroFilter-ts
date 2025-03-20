!function(t,e){if("object"==typeof exports&&"object"==typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var i=e();for(var o in i)("object"==typeof exports?exports:t)[o]=i[o]}}(self,(()=>(()=>{"use strict";var t={d:(e,i)=>{for(var o in i)t.o(i,o)&&!t.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:i[o]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};t.r(e),t.d(e,{OneEuroFilter:()=>o});const{rE:i}={rE:"0.1.2"};class o{minCutOff;beta;dCutOff;xPrev;dxPrev;tPrev;initialized;version=i;constructor(t,e){this.minCutOff=t,this.beta=e,this.dCutOff=.001,this.xPrev=null,this.dxPrev=null,this.tPrev=null,this.initialized=!1,console.log("OneEuroFilter: ",this.version)}smoothingFactor(t,e){const i=2*Math.PI*e*t;return i/(i+1)}exponentialSmoothing(t,e,i){return t*e+(1-t)*i}reset(){this.initialized=!1}filter(t,e){if(!this.initialized)return this.initialized=!0,this.xPrev=e,this.dxPrev=e.map((()=>0)),this.tPrev=t,e;const{xPrev:i,tPrev:o,dxPrev:r}=this,n=t-o,s=this.smoothingFactor(n,this.dCutOff),l=[],h=[],f=[];for(let t=0;t<e.length;t++){l[t]=(e[t]-i[t])/n,h[t]=this.exponentialSmoothing(s,l[t],r[t]);const o=this.minCutOff+this.beta*Math.abs(h[t]),a=this.smoothingFactor(n,o);f[t]=this.exponentialSmoothing(a,e[t],i[t])}return this.xPrev=f,this.dxPrev=h,this.tPrev=t,f}}return e})()));