var t={d:(i,e)=>{for(var r in e)t.o(e,r)&&!t.o(i,r)&&Object.defineProperty(i,r,{enumerable:!0,get:e[r]})},o:(t,i)=>Object.prototype.hasOwnProperty.call(t,i)},i={};t.d(i,{L:()=>e});class e{minCutOff;beta;dCutOff;xPrev;dxPrev;tPrev;initialized;constructor(t,i){this.minCutOff=t,this.beta=i,this.dCutOff=.001,this.xPrev=null,this.dxPrev=null,this.tPrev=null,this.initialized=!1}smoothingFactor(t,i){const e=2*Math.PI*i*t;return e/(e+1)}exponentialSmoothing(t,i,e){return t*i+(1-t)*e}reset(){this.initialized=!1}filter(t,i){if(!this.initialized)return this.initialized=!0,this.xPrev=i,this.dxPrev=i.map((()=>0)),this.tPrev=t,i;const{xPrev:e,tPrev:r,dxPrev:n}=this,s=t-r,h=this.smoothingFactor(s,this.dCutOff),o=[],a=[],l=[];for(let t=0;t<i.length;t++){o[t]=(i[t]-e[t])/s,a[t]=this.exponentialSmoothing(h,o[t],n[t]);const r=this.minCutOff+this.beta*Math.abs(a[t]),v=this.smoothingFactor(s,r);l[t]=this.exponentialSmoothing(v,i[t],e[t])}return this.xPrev=l,this.dxPrev=a,this.tPrev=t,l}}var r=i.L;export{r as OneEuroFilter};