const $=id=>document.getElementById(id);
let deg=false,ans=0;

/* ---------- tabs ---------- */
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x===b));
 document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("on",p.id===b.dataset.p));
 if(b.dataset.p==="gr")draw();
});

/* ---------- math engine ---------- */
function compile(s){
 s=vars(pre(s));
 let t=s.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/π/g,"(Math.PI)")
  .replace(/Ans/g,"("+ans+")").replace(/√\(/g,"Math.sqrt(").replace(/\^/g,"**")
  .replace(/(\d+\.?\d*)%/g,"($1/100)")
  .replace(/\bln\(/g,"Math.log(").replace(/\blog\(/g,"Math.log10(")
  .replace(/\b(sinh|cosh|tanh|cbrt|abs|exp)\(/g,"Math.$1(").replace(/\b(a?)(sin|cos|tan)\(/g,(m,a,n)=>"T"+a+n+"(");
 if(/[^0-9+\-*/().\sA-Za-z_]/.test(t))throw 0;
 if(/[A-Za-z_]/.test(t.replace(/Math\.(PI|E|sqrt|log10|log|sinh|cosh|tanh|cbrt|abs|exp)|T(asin|acos|atan|sin|cos|tan)|\bx\b/g,"")))throw 0;
 const o=(t.match(/\(/g)||[]).length,c=(t.match(/\)/g)||[]).length;
 t+=")".repeat(Math.max(0,o-c));
 const f=x=>deg?x*Math.PI/180:x;
 const g2=y=>deg?y*180/Math.PI:y;return Function("Tsin","Tcos","Ttan","Tasin","Tacos","Tatan","x","return ("+t+")").bind(null,x=>Math.sin(f(x)),x=>Math.cos(f(x)),x=>Math.tan(f(x)),x=>g2(Math.asin(x)),x=>g2(Math.acos(x)),x=>g2(Math.atan(x)));
}
function evalExpr(s){
 if(!s.trim())return "";
 const r=compile(s)(0);
 if(typeof r!=="number"||!isFinite(r))throw 0;
 return +r.toPrecision(12);
}

/* ---------- calculator ---------- */
const keys=[["sin(","fn"],["cos(","fn"],["tan(","fn"],["(","fn"],[")","fn"],
["√(","fn"],["ln(","fn"],["log(","fn"],["^","fn"],["%","fn"],
["7"],["8"],["9"],["÷","op"],["C","fn"],
["4"],["5"],["6"],["×","op"],["⌫","fn"],
["1"],["2"],["3"],["−","op"],["π","fn"],
["0"],["."],["Ans","fn"],["+","op"],["=","eq"]];
const keys2=[
["sin","sin(","k"],["cos","cos(","k"],["tan","tan(","k"],["ln","ln(","k"],["log","log(","k"],
["x²","^2","k"],["√","√(","k"],["xʸ","^","k"],["(","(","k"],[")",")","k"],
["π","π","k"],["(−)","−","k"],["%","%","k"],["DRG","DRG","k"],["1/x","1/(","k"],
["7","7","n"],["8","8","n"],["9","9","n"],["DEL","⌫","d"],["AC","C","d"],
["4","4","n"],["5","5","n"],["6","6","n"],["×","×","o"],["÷","÷","o"],
["1","1","n"],["2","2","n"],["3","3","n"],["+","+","o"],["−","−","o"],
["0","0","n"],[".",".","n"],["×10ˣ","×10^","n"],["Ans","Ans","n"],["=","=","e"]
];
keys2.forEach(([l,k,c])=>{const b=document.createElement("button");b.textContent=l;b.className=c;
 b.onclick=()=>{press(k);if(navigator.vibrate)try{navigator.vibrate(8)}catch(e){}};$("keys").appendChild(b);});
function press(k){
 const e=$("expr");
 if(k==="DRG"){$("deg").click();return}
 if(k==="C")e.value="";else if(k==="⌫")e.value=e.value.slice(0,-1);
 else if(k==="=")commit();else e.value+=k;
 live();e.focus();
}
function live(){try{const r=evalExpr($("expr").value);$("res").textContent=r===""?"":"= "+r}catch(e){$("res").textContent=""}}
function commit(){
 const s=$("expr").value;
 try{const r=evalExpr(s);if(r==="")return;ans=r;
  const d=document.createElement("div");d.textContent=s+" = "+r;d.onclick=()=>{$("expr").value=String(r);live()};
  $("hist").appendChild(d);$("hist").scrollTop=1e6;$("expr").value=String(r);$("res").textContent="";
 }catch(e){$("res").textContent="Check your expression"}
}
$("expr").addEventListener("input",live);
$("expr").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();commit()}});
$("deg").onclick=()=>{deg=!deg;$("deg").textContent=deg?"DEG":"RAD";live();draw()};
$("clearH").onclick=()=>{$("hist").innerHTML=""};

/* ---------- unit converter ---------- */
const U={
 Length:{m:1,km:1000,cm:.01,mm:.001,mile:1609.344,yard:.9144,foot:.3048,inch:.0254},
 Weight:{kg:1,g:.001,mg:1e-6,tonne:1000,pound:.45359237,ounce:.028349523},
 Volume:{litre:1,ml:.001,"gallon (US)":3.785411784,"cup (US)":.2365882365,"fl oz (US)":.0295735296},
 Area:{"m²":1,"km²":1e6,"hectare":1e4,"acre":4046.8564224,"ft²":.09290304},
 Speed:{"m/s":1,"km/h":.2777777778,"mph":.44704,"knot":.5144444444},
 Time:{second:1,minute:60,hour:3600,day:86400,week:604800},
 Data:{byte:1,KB:1e3,MB:1e6,GB:1e9,TB:1e12},
 Temperature:{"°C":1,"°F":1,"K":1}
};
Object.keys(U).forEach(k=>$("cat").add(new Option(k)));
function fillUnits(){
 const u=Object.keys(U[$("cat").value]);
 [$("cf"),$("ct")].forEach((s,i)=>{s.innerHTML="";u.forEach(x=>s.add(new Option(x)));s.selectedIndex=Math.min(i,u.length-1)});
 convert();
}
function toC(v,u){return u==="°F"?(v-32)*5/9:u==="K"?v-273.15:v}
function fromC(c,u){return u==="°F"?c*9/5+32:u==="K"?c+273.15:c}
function convert(){
 const c=$("cat").value,v=parseFloat($("cv").value),f=$("cf").value,t=$("ct").value;
 if(isNaN(v)){$("cout").textContent="–";return}
 let r=c==="Temperature"?fromC(toC(v,f),t):v*U[c][f]/U[c][t];
 $("cout").textContent=+r.toPrecision(10)+" "+t;
}
$("cat").onchange=fillUnits;
["cv","cf","ct"].forEach(i=>{$(i).oninput=convert;$(i).onchange=convert});
$("swap").onclick=()=>{const a=$("cf").selectedIndex;$("cf").selectedIndex=$("ct").selectedIndex;$("ct").selectedIndex=a;convert()};
fillUnits();

/* ---------- currency ---------- */
let R={USD:1,EUR:.92,GBP:.79,KES:129,NGN:1500,ZAR:18,INR:83,JPY:150,CNY:7.2,AED:3.67,CAD:1.37,AUD:1.52};
try{const s=localStorage.getItem("rates");if(s)R=Object.assign(R,JSON.parse(s))}catch(e){}
Object.keys(R).forEach(k=>{$("mf").add(new Option(k));$("mt").add(new Option(k))});
$("mf").value="USD";$("mt").value="KES";
function money(){
 const a=parseFloat($("ma").value);
 if(isNaN(a)){$("mout").textContent="–";return}
 const r=a/R[$("mf").value]*R[$("mt").value];
 $("mout").textContent=r.toLocaleString(undefined,{maximumFractionDigits:2})+" "+$("mt").value;
}
["ma","mf","mt"].forEach(i=>{$(i).oninput=money;$(i).onchange=money});
$("mswap").onclick=()=>{const a=$("mf").value;$("mf").value=$("mt").value;$("mt").value=a;money()};
Object.keys(R).forEach(k=>{
 if(k==="USD")return;
 const d=document.createElement("div");d.innerHTML="<span>"+k+"</span>";
 const i=document.createElement("input");i.type="number";i.value=R[k];
 i.oninput=()=>{const v=parseFloat(i.value);if(v>0){R[k]=v;try{localStorage.setItem("rates",JSON.stringify(R))}catch(e){}money()}};
 d.appendChild(i);$("rates").appendChild(d);
});
money();

/* ---------- math tab (uses math.js) ---------- */
function norm(s){return s.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/π/g,"pi").replace(/√\(/g,"sqrt(").replace(/\blog\(/g,"log10(").replace(/\bln\(/g,"log(")}
const fmt=v=>typeof math==="undefined"?String(v):math.format(v,{precision:10});
const show=t=>{$("ko").textContent=t};
const ev=(c,x)=>c.evaluate({x});
const fx=()=>math.compile(norm($("kf").value));
$("mx").oninput=()=>{
 const v=$("mx").value;if(!v.trim()){$("mxo").textContent="";return}
 try{$("mxo").textContent="= "+fmt(math.evaluate(norm(v)))}catch(e){$("mxo").textContent="…"}
};
$("bd").onclick=()=>{try{
 const d1=math.derivative(norm($("kf").value),"x"),d2=math.derivative(d1,"x"),x=parseFloat($("kx").value);
 let t="f′(x) = "+math.simplify(d1)+"\nf″(x) = "+math.simplify(d2);
 if(!isNaN(x))t+="\nf′("+x+") = "+fmt(d1.evaluate({x}));
 show(t);
}catch(e){show("Could not differentiate. Example: x^2*sin(x)")}};
$("bi").onclick=()=>{try{
 const c=fx(),a=parseFloat($("k1").value),b=parseFloat($("k2").value),n=2000,h=(b-a)/n;
 let s=ev(c,a)+ev(c,b);for(let i=1;i<n;i++)s+=ev(c,a+i*h)*(i%2?4:2);
 const r=s*h/3;if(!isFinite(r))throw 0;
 show("∫ from "+a+" to "+b+" = "+fmt(r));
}catch(e){show("Enter two numbers and a valid f(x)")}};
$("bs").onclick=()=>{try{
 const c=fx(),r=[];let py=ev(c,-50);
 for(let x=-49.95;x<=50;x+=.05){
  const y=ev(c,x);
  if(isFinite(py)&&isFinite(y)&&py*y<=0&&Math.abs(y-py)<1e3){
   let lo=x-.05,hi=x;
   for(let i=0;i<60;i++){const m=(lo+hi)/2;if(ev(c,lo)*ev(c,m)<=0)hi=m;else lo=m}
   const z=+((lo+hi)/2).toPrecision(8);if(!r.some(q=>Math.abs(q-z)<1e-4))r.push(z);
  }
  py=y;
 }
 show(r.length?"f(x) = 0 at x ≈ "+r.join(", "):"No solution found between −50 and 50");
}catch(e){show("Check f(x)")}};
$("bl").onclick=()=>{try{
 const c=fx(),a=parseFloat($("kx").value),l=ev(c,a-1e-7),r=ev(c,a+1e-7);
 show(Math.abs(l-r)<1e-4*(1+Math.abs(l))?"limit as x→"+a+" ≈ "+fmt(+((l+r)/2).toPrecision(8)):"From the left ≈ "+fmt(l)+"\nFrom the right ≈ "+fmt(r)+"\n(no single limit)");
}catch(e){show("Enter a number for x and a valid f(x)")}};

/* ---------- more tools ---------- */
const nums=s=>{const a=s.split(/[,; ]+/).filter(Boolean).map(Number);if(!a.length||a.some(isNaN))throw 0;return a};
const F=v=>fmt(v),Rd=x=>+x.toFixed(10);
const TOOLS=[
["Simplify an expression","2x + 3x + x^2 - x^2",s=>""+math.simplify(norm(s))],
["Quadratic equation: a, b, c","1, -3, 2",s=>{const[a,b,c]=nums(s),d=b*b-4*a*c;if(a===0)throw 0;const q=2*a;return d>=0?"x = "+F((-b+Math.sqrt(d))/q)+" or "+F((-b-Math.sqrt(d))/q)+"\nDiscriminant = "+F(d):"x = "+F(-b/q)+" ± "+F(Math.sqrt(-d)/Math.abs(q))+"i\nDiscriminant = "+F(d)}],
["Solve equations: each row = coefficients, then answer","2, 1, 5; 1, 3, 10",s=>{const R=s.split(";").map(nums),n=R.length,x=math.lusolve(R.map(r=>r.slice(0,n)),R.map(r=>[r[n]]));return x.map((r,i)=>"xyzwuv"[i]+" = "+F(r[0])).join("\n")}],
["Prime factors","360",s=>{let n=Math.floor(+s);if(!(n>1))throw 0;const f=[];for(let p=2;p*p<=n;p++)while(n%p===0){f.push(p);n/=p}if(n>1)f.push(n);return f.join(" × ")+(f.length===1?"  (prime)":"")}],
["GCD and LCM","12, 18, 30",s=>{const a=nums(s);return "GCD = "+math.gcd(...a)+"\nLCM = "+math.lcm(...a)}],
["Permutations and combinations: n, k","10, 3",s=>{const[n,k]=nums(s);return "nPr = "+F(math.permutations(n,k))+"\nnCr = "+F(math.combinations(n,k))}],
["Fractions","3/8 + 1/4",s=>{const fr=math.fraction(math.evaluate(norm(s)));return math.format(fr)+"\n= "+F(math.number(fr))}],
["Percent: x% of y","15, 200",s=>{const[x,y]=nums(s);return x+"% of "+y+" = "+F(x*y/100)+"\n"+y+" + "+x+"% = "+F(y*(1+x/100))+"\n"+y+" − "+x+"% = "+F(y*(1-x/100))}],
["Number bases (decimal to binary, octal, hex)","255",s=>{const n=Math.floor(+s);if(isNaN(n))throw 0;return "Binary: "+n.toString(2)+"\nOctal: "+n.toString(8)+"\nHex: "+n.toString(16).toUpperCase()}],
["Statistics: list of numbers","2, 4, 4, 9, 11",s=>{const a=nums(s);return "Count "+a.length+"\nSum "+F(math.sum(a))+"\nMean "+F(math.mean(a))+"\nMedian "+F(math.median(a))+"\nMode "+math.mode(a).join(", ")+"\nMin "+F(math.min(a))+"  Max "+F(math.max(a))+"\nVariance "+F(math.variance(a))+"\nStd dev "+F(math.std(a))}],
["Matrix: determinant, inverse, transpose","[[1,2],[3,4]]",s=>{const m=math.evaluate(s);let t="Transpose = "+F(math.transpose(m));try{t="Determinant = "+F(math.det(m))+"\n"+t+"\nInverse = "+F(math.inv(m))}catch(e){t+="\n(no determinant or inverse)"}return t}],
["Complex numbers","(2+3i)*(1-i)",s=>{const z=math.evaluate(norm(s));return "Result = "+F(z)+"\nMagnitude = "+F(math.abs(z))+"\nAngle = "+F(math.arg(z))+" rad"}],
["Sum of a series: expression in i, from, to","i^2, 1, 10",s=>{const p=s.split(",").map(x=>x.trim()),c=math.compile(norm(p[0]));let t=0;for(let i=+p[1];i<=+p[2];i++)t+=c.evaluate({i});if(isNaN(t))throw 0;return "Sum = "+F(t)}],
["Degrees and radians","180",s=>{const[v]=nums(s);return v+"° = "+F(v*Math.PI/180)+" rad\n"+v+" rad = "+F(v*180/Math.PI)+"°"}],
["Trig values (angle in degrees)","30",s=>{const[v]=nums(s),r=v*Math.PI/180;return "sin = "+F(Rd(Math.sin(r)))+"\ncos = "+F(Rd(Math.cos(r)))+"\ntan = "+F(Rd(Math.tan(r)))}],
["Circle: radius","5",s=>{const[r]=nums(s);return "Area = "+F(Math.PI*r*r)+"\nCircumference = "+F(2*Math.PI*r)}],
["Rectangle: width, height","4, 6",s=>{const[w,h]=nums(s);return "Area = "+F(w*h)+"\nPerimeter = "+F(2*(w+h))+"\nDiagonal = "+F(Math.hypot(w,h))}],
["Triangle: three sides","3, 4, 5",s=>{const[a,b,c]=nums(s),p=(a+b+c)/2,A=Math.sqrt(p*(p-a)*(p-b)*(p-c));if(!(A>=0))throw 0;return "Area = "+F(A)+"\nPerimeter = "+F(a+b+c)}],
["Sphere: radius","3",s=>{const[r]=nums(s);return "Volume = "+F(4/3*Math.PI*r**3)+"\nSurface area = "+F(4*Math.PI*r*r)}],
["Cylinder: radius, height","2, 5",s=>{const[r,h]=nums(s);return "Volume = "+F(Math.PI*r*r*h)+"\nSurface area = "+F(2*Math.PI*r*(r+h))}],
["Cone: radius, height","3, 4",s=>{const[r,h]=nums(s),l=Math.hypot(r,h);return "Volume = "+F(Math.PI*r*r*h/3)+"\nSlant height = "+F(l)+"\nSurface area = "+F(Math.PI*r*(r+l))}],
["Compound interest: amount, rate %, years, times per year","1000, 5, 10, 12",s=>{const[P,r,t,n]=nums(s),A=P*Math.pow(1+r/100/n,n*t);return "Final amount = "+F(A)+"\nInterest earned = "+F(A-P)}],
["Loan payment: amount, rate %, years","10000, 8, 5",s=>{const[P,r,t]=nums(s),m=r/1200,k=t*12,pay=m?P*m/(1-Math.pow(1+m,-k)):P/k;return "Monthly payment = "+F(pay)+"\nTotal paid = "+F(pay*k)+"\nTotal interest = "+F(pay*k-P)}]
];
TOOLS.forEach((t,i)=>$("tl").add(new Option(t[0],i)));
function pick(){$("ti").value=TOOLS[$("tl").value][1];$("to").textContent=""}
function run(){const t=TOOLS[$("tl").value];try{$("to").textContent=t[2]($("ti").value)}catch(e){$("to").textContent="Check your input. Example: "+t[1]}}
$("tl").onchange=()=>{pick();run()};
$("tg").onclick=run;
$("ti").addEventListener("keydown",e=>{if(e.key==="Enter")run()});
pick();

/* ---------- exam calculator (Casio style) ---------- */
const V={};
let sh=false,al=false,hypF=false,off=false,done=false,asFrac=false,engF=false,fm="norm",fn=0,mode="",pend="",lastR=0,replayI=-1;
const exprs=[];
const fact=n=>{let r=1;for(let i=2;i<=n;i++)r*=i;return r};
const comb=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return Math.round(r)};
function vars(s){return s.replace(/\b[A-FMY]\b/g,m=>"("+(V[m]||0)+")").replace(/\be\b/g,"(Math.E)")}
function pre(s){
 s=s.replace(/Ran#/g,()=>Math.random().toFixed(3))
  .replace(/(\d+\.?\d*)°/g,(m,v)=>"("+(deg?v:v*Math.PI/180)+")")
  .replace(/(\d+)!/g,(m,n)=>fact(+n))
  .replace(/(\d+)C(\d+)/g,(m,n,k)=>comb(+n,+k))
  .replace(/(\d+)P(\d+)/g,(m,n,k)=>comb(+n,+k)*fact(+k));
 for(const tag of ["∫(","d/dx("]){
  let i;
  while((i=s.indexOf(tag))>=0){
   let d=1,j=i+tag.length,st=j;const parts=[];
   for(;j<s.length;j++){const c=s[j];if(c==="(")d++;else if(c===")"){d--;if(d===0)break}else if(c===","&&d===1){parts.push(s.slice(st,j));st=j+1}}
   parts.push(s.slice(st,j));
   const f=compile(parts[0]);let r;
   if(tag==="∫("){const a=compile(parts[1])(0),b=compile(parts[2])(0),n=2000,h=(b-a)/n;let t=f(a)+f(b);for(let k=1;k<n;k++)t+=f(a+k*h)*(k%2?4:2);r=t*h/3}
   else{const x0=compile(parts[1])(0),h=1e-5;r=(f(x0+h)-f(x0-h))/(2*h)}
   s=s.slice(0,i)+"("+r+")"+s.slice(j+1);
  }
 }
 return s;
}
function fmtR(r){
 if(asFrac){try{return Number.isInteger(r)?String(r):math.format(math.fraction(r))}catch(e){}}
 if(engF&&r!==0){const x=Math.floor(Math.log10(Math.abs(r))/3)*3;return +(r/Math.pow(10,x)).toPrecision(10)+"×10^"+x}
 if(fm==="fix")return r.toFixed(fn);
 if(fm==="sci")return r.toExponential(fn).replace("e+","×10^").replace("e","×10^");
 return String(+r.toPrecision(10));
}
function ind(){
 const v=(id,on)=>{$(id).style.visibility=on?"visible":"hidden"};
 v("iS",sh);v("iA",al);v("iH",hypF);v("iM",!!V.M);
 $("iD").textContent=deg?"D":"R";$("iP").textContent=pend.toUpperCase();
}
function rerender(){if(done)$("res").textContent=fmtR(lastR)}
function live(){done=false}
function ins(t){
 const e=$("expr");
 if(done){e.value=/^[+−×÷^]/.test(t)?"Ans":"";done=false;$("res").textContent=""}
 const a=e.selectionStart==null?e.value.length:Math.min(e.selectionStart,e.value.length),b=e.selectionEnd==null?a:e.selectionEnd;
 const p=Math.min(a,e.value.length);
 e.value=e.value.slice(0,p)+t+e.value.slice(Math.max(b,p));
 e.setSelectionRange(p+t.length,p+t.length);
}
function del(){
 const e=$("expr"),p=e.selectionStart==null?e.value.length:e.selectionStart;done=false;
 if(p>0){e.value=e.value.slice(0,p-1)+e.value.slice(p);e.setSelectionRange(p-1,p-1)}
}
function clr(){$("expr").value="";$("res").textContent="";done=false;mode="";sh=false;al=false;pend="";hypF=false;engF=false;ind()}
function commit(){
 const s=$("expr").value;if(!s.trim())return;
 let r;
 try{r=compile(s)(0);if(typeof r!=="number")throw 1;if(!isFinite(r))throw 2}catch(e){$("res").textContent=e===2?"Math ERROR":"Syntax ERROR";return}
 ans=r;lastR=r;done=true;exprs.push(s);replayI=-1;
 const d=document.createElement("div");d.textContent=s+" = "+fmtR(r);$("hist").appendChild(d);$("hist").scrollTop=1e6;
 $("res").textContent=fmtR(r);
}
function solve(){
 try{
  let s=$("expr").value;if(s.includes("=")){const p=s.split("=");s="("+p[0]+")−("+p[1]+")"}
  const f=compile(s),out=[];let py=f(-50);
  for(let x=-49.95;x<=50;x+=.05){
   const y=f(x);
   if(isFinite(py)&&isFinite(y)&&py*y<=0&&Math.abs(y-py)<1e3){
    let lo=x-.05,hi=x;
    for(let i=0;i<60;i++){const m=(lo+hi)/2;if(f(lo)*f(m)<=0)hi=m;else lo=m}
    const z=+((lo+hi)/2).toPrecision(8);if(!out.some(q=>Math.abs(q-z)<1e-4))out.push(z);
   }
   py=y;
  }
  $("res").textContent=out.length?"x = "+out.join(", "):"No solution";
  if(out.length){ans=out[0];lastR=out[0]}
 }catch(e){$("res").textContent="Syntax ERROR"}
}
function modeKey(a){
 if(mode==="m"){
  if(a==="1"){deg=true;mode=""}
  else if(a==="2"){deg=false;mode=""}
  else if(a==="3"){mode="fix";$("res").textContent="Fix 0-9 ?";return}
  else if(a==="4"){mode="sci";$("res").textContent="Sci 1-9 ?";return}
  else if(a==="5"){fm="norm";mode=""}
  else mode="";
 }else if(/^\d$/.test(a)){fm=mode;fn=+a;mode=""}
 else mode="";
 $("res").textContent="";ind();rerender();
}
function K(o){
 const n=o[1];
 if(off&&n!=="@on")return;
 let a=n;
 if(sh&&o[3])a=o[3];else if(al&&o[5])a=o[5];
 if(mode){modeKey(a);sh=false;al=false;ind();return}
 if(pend&&n!=="@shift"&&n!=="@alpha"){
  const L=o[5];
  if(/^[A-FMYx]$/.test(L||"")){if(pend==="sto"){if(L!=="x")V[L]=lastR}else ins(L==="x"?"x":L);pend="";sh=false;al=false;ind();return}
  pend="";
 }
 if(a[0]==="@"){
  switch(a){
   case "@shift":sh=!sh;al=false;ind();return;
   case "@alpha":al=!al;sh=false;ind();return;
   case "@mode":mode="m";$("res").textContent="1:Deg 2:Rad 3:Fix 4:Sci 5:Norm";break;
   case "@on":off=false;$("lcd").classList.remove("off");clr();break;
   case "@off":off=true;$("lcd").classList.add("off");break;
   case "@ac":clr();break;
   case "@del":del();break;
   case "@eq":case "@calc":commit();break;
   case "@solve":solve();break;
   case "@hyp":hypF=true;break;
   case "@rcl":pend="rcl";break;
   case "@sto":pend="sto";break;
   case "@sd":asFrac=!asFrac;rerender();break;
   case "@eng":engF=!engF;rerender();break;
   case "@m+":V.M=(V.M||0)+lastR;break;
   case "@m-":V.M=(V.M||0)-lastR;break;
  }
 }else{
  if(hypF&&/^(sin|cos|tan)\($/.test(a))a=a.slice(0,-1)+"h(";
  hypF=false;
  ins(a);
 }
 sh=false;al=false;ind();$("expr").focus();
}
function pad(d){
 const e=$("expr");
 if(d==="l"||d==="r"){const p=Math.max(0,(e.selectionStart||0)+(d==="l"?-1:1));e.setSelectionRange(p,p);done=false}
 else{
  if(!exprs.length)return;
  if(replayI<0)replayI=exprs.length;
  replayI=d==="u"?Math.max(0,replayI-1):Math.min(exprs.length-1,replayI+1);
  e.value=exprs[replayI];e.setSelectionRange(e.value.length,e.value.length);done=false;$("res").textContent="";
 }
 e.focus();
}
function cell(o){
 const c=document.createElement("div");c.className="cell";
 c.innerHTML='<div class="lab"><span class="s"></span><span class="a"></span></div>';
 c.firstChild.children[0].textContent=o[2];c.firstChild.children[1].textContent=o[4];
 const b=document.createElement("button");b.textContent=o[0];b.className=o[6];
 b.onclick=()=>{K(o);if(navigator.vibrate)try{navigator.vibrate(8)}catch(e){}};
 c.appendChild(b);return c;
}
const e0="";
const R1=[["SHIFT","@shift",e0,e0,e0,e0,"sf"],["ALPHA","@alpha",e0,e0,e0,e0,"al"],"PAD",["MODE","@mode",e0,e0,e0,e0,"md"],["ON","@on",e0,e0,e0,e0,"on"]];
const FK=[
["CALC","@calc","SOLVE","@solve","=","=","k"],["∫dx","∫(","d/dx","d/dx(",e0,e0,"k"],["x⁻¹","^(−1)","x!","!",e0,e0,"k"],["x³","^3","∛","cbrt(",e0,e0,"k"],["nCr","C","nPr","P",e0,e0,"k"],["Abs","abs(",e0,e0,e0,e0,"k"],
["a b/c","÷",e0,e0,e0,e0,"k"],["√","√(",e0,e0,e0,e0,"k"],["x²","^2",e0,e0,e0,e0,"k"],["^","^","ˣ√","^(1÷",e0,e0,"k"],["log","log(","10ˣ","10^(",e0,e0,"k"],["ln","ln(","eˣ","exp(",e0,e0,"k"],
["(−)","−",e0,e0,"A","A","k"],["°′″","°",e0,e0,"B","B","k"],["hyp","@hyp",e0,e0,"C","C","k"],["sin","sin(","sin⁻¹","asin(","D","D","k"],["cos","cos(","cos⁻¹","acos(","E","E","k"],["tan","tan(","tan⁻¹","atan(","F","F","k"],
["RCL","@rcl","STO","@sto",e0,e0,"k"],["ENG","@eng",e0,e0,e0,e0,"k"],["(","(",e0,e0,"Y","Y","k"],[")",")",",",",","X","x","k"],["S⇔D","@sd",e0,e0,e0,e0,"k"],["M+","@m+","M−","@m-","M","M","k"]
];
const NK=[
["7","7",e0,e0,e0,e0,"n"],["8","8",e0,e0,e0,e0,"n"],["9","9",e0,e0,e0,e0,"n"],["DEL","@del",e0,e0,e0,e0,"d"],["AC","@ac","OFF","@off",e0,e0,"d"],
["4","4",e0,e0,e0,e0,"n"],["5","5",e0,e0,e0,e0,"n"],["6","6",e0,e0,e0,e0,"n"],["×","×",e0,e0,e0,e0,"o"],["÷","÷",e0,e0,e0,e0,"o"],
["1","1",e0,e0,e0,e0,"n"],["2","2",e0,e0,e0,e0,"n"],["3","3",e0,e0,e0,e0,"n"],["+","+",e0,e0,e0,e0,"o"],["−","−",e0,e0,e0,e0,"o"],
["0","0",e0,e0,e0,e0,"n"],[".",".","Ran#","Ran#",e0,e0,"n"],["×10ˣ","×10^","π","π","e","e","n"],["Ans","Ans","%","%",e0,e0,"n"],["=","@eq",e0,e0,e0,e0,"e"]
];
R1.forEach(o=>{
 if(o==="PAD"){
  const c=document.createElement("div");c.className="cell";c.innerHTML='<div class="lab"></div><div class="pad"></div>';
  [["▲","u","1","2"],["◀","l","2","1"],["▶","r","2","3"],["▼","d","3","2"]].forEach(([t,d,r,cl])=>{const b=document.createElement("button");b.textContent=t;b.style.gridRow=r;b.style.gridColumn=cl;b.onclick=()=>pad(d);c.lastChild.appendChild(b)});
  $("kr1").appendChild(c);
 }else $("kr1").appendChild(cell(o));
});
FK.forEach(o=>$("fk").appendChild(cell(o)));
NK.forEach(o=>$("k5").appendChild(cell(o)));
ind();

/* ---------- student accounts (Supabase) ---------- */
const SUPABASE_URL="https://fynorhtrsnefwesmshsm.supabase.co";        // paste your Supabase project URL
const SUPABASE_ANON_KEY="sb_publishable_dOfl2sz7BPJMrp8x9yzXxQ_OnL9YpoG";   // paste your Supabase anon (public) key
const NATIVEAPP=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const HOME=NATIVEAPP?"com.bettercalculator.app://auth":location.origin+location.pathname;
const sb=(SUPABASE_URL&&SUPABASE_ANON_KEY&&window.supabase)?supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
const blank=()=>({history:[],solutions:[],activity:[],favs:[],settings:{}});
let S=blank(),USER=null,GUEST=false,loaded=false,saveT=null,lastJ="",amode="login";
const setJ=()=>JSON.stringify([deg,fm,fn,asFrac,engF,V,R,$("gf").value,$("kf").value,$("mx").value,document.documentElement.dataset.theme]);
const when=t=>new Date(t).toLocaleString([],{dateStyle:"medium",timeStyle:"short"});
const goTab=p=>document.querySelector('#tabs button[data-p="'+p+'"]').click();

/* data: record, save, load */
function rec(k,text,x){
 const t=Date.now();
 S.activity.unshift({t,k,text:String(text).slice(0,200)});S.activity=S.activity.slice(0,100);
 if(k!=="fav"){S.history.unshift({t,k,text:String(text).slice(0,400)});S.history=S.history.slice(0,300)}
 queueSave();renderDash();
}
function queueSave(){if(!USER||!loaded)return;clearTimeout(saveT);saveT=setTimeout(saveNow,2500);$("sst").textContent="Saving…"}
async function saveNow(){
 if(!USER||!loaded)return;
 S.settings={deg,fm,fn,asFrac,engF,V,R,gf:$("gf").value,kf:$("kf").value,mx:$("mx").value,th:document.documentElement.dataset.theme||"dark"};
 const {error}=await sb.from("student_progress").upsert({user_id:USER.id,data:S,updated_at:new Date().toISOString()});
 $("sst").textContent=error?"Could not save. Check your connection.":"Saved ✓";
}
function applySettings(s){
 if(typeof s.deg==="boolean")deg=s.deg;
 if(s.fm)fm=s.fm;
 if(typeof s.fn==="number")fn=s.fn;
 asFrac=!!s.asFrac;engF=!!s.engF;
 if(s.V)Object.assign(V,s.V);
 if(s.R){Object.assign(R,s.R);const cs=Object.keys(R).filter(x=>x!=="USD");[...document.querySelectorAll("#rates input")].forEach((i,k)=>{if(cs[k])i.value=R[cs[k]]});money()}
 if(s.gf)$("gf").value=s.gf;
 if(s.kf)$("kf").value=s.kf;
 if(s.mx)$("mx").value=s.mx;
 exprs.length=0;
 S.history.filter(h=>h.k==="calc").slice(0,50).reverse().forEach(h=>exprs.push(h.text.split(" = ")[0]));

 ind();if(s.th)setTheme(s.th);syncSettings();
}
async function loadProgress(){
 loaded=false;$("sst").textContent="Loading…";
 const {data,error}=await sb.from("student_progress").select("data").eq("user_id",USER.id).maybeSingle();
 if(error){$("sst").textContent="Could not load your saved work.";return}
 if(data&&data.data){S=Object.assign(blank(),data.data);applySettings(S.settings||{})}
 loaded=true;lastJ=setJ();renderDash();$("sst").textContent="Saved ✓";
}
function wipe(){
 S=blank();exprs.length=0;Object.keys(V).forEach(k=>delete V[k]);clr();$("hist").innerHTML="";
 ["ko","to","mxo"].forEach(i=>{$(i).textContent=""});
 ans=0;lastR=0;fm="norm";fn=0;asFrac=false;engF=false;ind();renderDash();
}

/* dashboard */
function li(main,sub,fn){
 const d=document.createElement("div");d.className="li";d.textContent=main;
 if(sub){const s=document.createElement("small");s.textContent=sub;d.appendChild(s)}
 if(fn)d.onclick=fn;return d;
}
function renderDash(){
 const n=S.history.filter(h=>h.k==="calc").length;
 $("dstat").innerHTML="<div><b>"+n+"</b>calculations</div><div><b>"+S.favs.length+"</b>favourites</div>";
 const A=$("dact"),F=$("dfav");[A,F].forEach(x=>{x.textContent=""});
 const L={calc:"Calculation",math:"Math tool",long:"Long question",fav:"Favourite saved"};
 S.activity.slice(0,8).forEach(a=>A.appendChild(li(a.text,(L[a.k]||"")+" · "+when(a.t))));
 if(!S.activity.length)A.textContent="Nothing yet. Start calculating!";
 S.favs.forEach((f,i)=>{
  const d=li(f.text,f.type,()=>{$(f.id).value=f.text;goTab(f.p);if(f.id==="gf")draw()});
  const x=document.createElement("button");x.className="star";x.textContent="✕";x.style.float="right";
  x.onclick=e=>{e.stopPropagation();S.favs.splice(i,1);queueSave();renderDash()};
  d.prepend(x);F.appendChild(d);
 });
}
function star(id,type,p,host){
 const el=$(id),b=document.createElement("button");
 b.className="star";b.title="Save as favourite";b.textContent="☆";
 b.onclick=()=>{
  const v=el.value.trim();if(!v||!(USER||GUEST))return;
  if(S.favs.some(f=>f.text===v&&f.id===id))return;
  S.favs.unshift({t:Date.now(),type,text:v,id,p});S.favs=S.favs.slice(0,100);rec("fav","★ "+v);
 };
 if(host){b.style.marginLeft="auto";host.appendChild(b)}else el.parentNode.insertBefore(b,el.nextSibling);
}
star("expr","Calculator","calc",document.querySelector(".ind"));
star("mx","Formula","mth");star("kf","Function","mth");star("gf","Graph","gr");

/* automatic recording of calculations and math solutions */
const _commit=commit;
commit=function(){const n=exprs.length;_commit();if(exprs.length>n)rec("calc",exprs[exprs.length-1]+" = "+fmtR(lastR))};
let mt;
const watch=(el,fn)=>new MutationObserver(()=>{clearTimeout(mt);mt=setTimeout(()=>{const t=el.textContent.trim();if(t&&!/ERROR|Check|Could not|Enter|No solution/.test(t))fn(t)},1200)}).observe(el,{childList:true,characterData:true,subtree:true});
watch($("ko"),t=>rec("math",$("kf").value+" → "+t.replace(/\n/g," ; ")));
watch($("to"),t=>rec("math",TOOLS[$("tl").value][0]+": "+$("ti").value+" → "+t.replace(/\n/g," ; ")));
setInterval(()=>{if(!USER||!loaded)return;const j=setJ();if(j!==lastJ){lastJ=j;queueSave()}},4000);

/* login / register / forgot / reset */
const amsg=(t,k)=>{$("amsg").textContent=t||"";$("amsg").className="msg "+(k||"")};
function showApp(on){$("auth").style.display=on?"none":"flex";$("app").style.display=on?"block":"none";$("bar2").style.display=on?"flex":"none"}
function amodeSet(m){
 amode=m;const rg=m==="reg",rs=m==="reset";
 [...$("aseg").children].forEach(b=>b.classList.toggle("on",b.dataset.m===m));
 $("aseg").style.display=rs?"none":"flex";
 $("ae").style.display=rs?"none":"block";$("ael").style.display=rs?"none":"block";$("au").style.display=rg?"block":"none";$("aul").style.display=rg?"block":"none";$("ap2").style.display=(rg||rs)?"block":"none";
 $("ap").placeholder=rs?"New password (8+ characters)":"Password";$("ap").autocomplete=m==="login"?"current-password":"new-password";
 $("ago").textContent=rs?"Set new password":rg?"Create account":"Sign In";
 $("ahead").textContent=rs?"Set New Password":rg?"Create Account":"Welcome Back";
 $("asub").textContent=rs?"Choose a strong new password":rg?"Join as a student and save your progress":"Sign in to continue to Better Calculator";
 $("aforgot").style.display=m==="login"?"inline":"none";amsg("");
}
$("aseg").onclick=e=>{if(e.target.dataset.m)amodeSet(e.target.dataset.m)};
$("ago").onclick=async()=>{
 if(!sb)return amsg("Sign-in is not configured yet.","err");
 const em=$("ae").value.trim(),pw=$("ap").value;
 try{
  if(amode!=="login"){
   if(pw.length<8)return amsg("Use at least 8 characters.","err");
   if(pw!==$("ap2").value)return amsg("The two passwords do not match.","err");
  }
  if(amode==="reset"){
   const {error}=await sb.auth.updateUser({password:pw});if(error)throw error;
   amodeSet("login");amsg("Password updated. You are signed in.","ok");return;
  }
  if(!/^\S+@\S+\.\S+$/.test(em))return amsg("Enter a valid email address.","err");
  if(amode==="reg"){
   const un=$("au").value.trim();
   if(!/^[A-Za-z0-9_]{3,20}$/.test(un))return amsg("Username: 3 to 20 letters, numbers or underscores.","err");
   const {data,error}=await sb.auth.signUp({email:em,password:pw,options:{emailRedirectTo:HOME,data:{username:un}}});if(error)throw error;
   amsg(data.session?"Account created.":"Account created. Open the confirmation link we emailed you, then log in.","ok");
  }else{
   const {error}=await sb.auth.signInWithPassword({email:em,password:pw});if(error)throw error;
  }
 }catch(e){amsg(e.message||"Something went wrong.","err")}
};
$("aforgot").onclick=async()=>{
 if(!sb)return amsg("Sign-in is not configured yet.","err");
 const em=$("ae").value.trim();if(!/^\S+@\S+\.\S+$/.test(em))return amsg("Type your email above first.","err");
 const {error}=await sb.auth.resetPasswordForEmail(em,{redirectTo:HOME});
 amsg(error?error.message:"If that email has an account, a reset link is on its way.",error?"err":"ok");
};
document.querySelectorAll(".lo").forEach(b=>b.onclick=async()=>{
 if(sb&&USER){await saveNow();await sb.auth.signOut()}
 else{GUEST=false;wipe();showApp(false)}
});
$("dbtn").onclick=()=>goTab("dash");
$("aguest").onclick=()=>{GUEST=true;$("who").textContent="Guest (nothing is saved)";showApp(true)};
if(sb){
 sb.auth.onAuthStateChange((ev,session)=>{
  if(ev==="PASSWORD_RECOVERY"){showApp(false);amodeSet("reset");return}
  if(session&&session.user){
   if(!USER||USER.id!==session.user.id){USER=session.user;wipe();$("who").textContent=(USER.user_metadata&&USER.user_metadata.username)||USER.email||"Student";showApp(true);setTimeout(loadProgress,0)}
  }else if(USER){USER=null;loaded=false;wipe();amodeSet("login");showApp(false)}
 });
}else{
 $("cfgwarn").style.display="block";$("aguest").style.display="inline";
 ["ago","aforgot"].forEach(i=>{$(i).disabled=true});
}
renderDash();

/* ---------- grapher ---------- */
let cx=0,cy=0,sc=40;
const cvs=$("cv2"),g=cvs.getContext("2d");
function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function draw(){
 const W=cvs.width,H=cvs.height;g.clearRect(0,0,W,H);
 const X=x=>W/2+(x-cx)*sc,Y=y=>H/2-(y-cy)*sc;
 g.lineWidth=1;g.strokeStyle=css("--line");g.fillStyle=css("--mut");g.font="20px system-ui";
 const step=sc>80?1:sc>25?2:sc>10?5:10;
 for(let x=Math.ceil((cx-W/2/sc)/step)*step;x<=cx+W/2/sc;x+=step){g.beginPath();g.moveTo(X(x),0);g.lineTo(X(x),H);g.stroke();if(x)g.fillText(x,X(x)+3,Math.min(H-6,Math.max(18,Y(0)+18)))}
 for(let y=Math.ceil((cy-H/2/sc)/step)*step;y<=cy+H/2/sc;y+=step){g.beginPath();g.moveTo(0,Y(y));g.lineTo(W,Y(y));g.stroke();if(y)g.fillText(y,Math.min(W-40,Math.max(4,X(0)+4)),Y(y)-3)}
 g.strokeStyle=css("--mut");g.lineWidth=2;
 g.beginPath();g.moveTo(X(0),0);g.lineTo(X(0),H);g.moveTo(0,Y(0));g.lineTo(W,Y(0));g.stroke();
 let f;try{f=compile($("gf").value)}catch(e){return}
 g.strokeStyle=css("--acc");g.lineWidth=3.5;g.lineJoin="round";g.beginPath();
 let pen=false,py=0;
 for(let px=0;px<=W;px+=2){
  const x=cx+(px-W/2)/sc;let y;
  try{y=f(x)}catch(e){pen=false;continue}
  if(typeof y!=="number"||!isFinite(y)||Math.abs(Y(y))>5*H||(pen&&Math.abs(Y(y)-py)>H)){pen=false;continue}
  const sy=Y(y);if(pen)g.lineTo(px,sy);else{g.moveTo(px,sy);pen=true}py=sy;
 }
 g.stroke();
 drawD(X,Y,W);
}
function drawD(X,Y,W){
 if(!$("gd").checked||typeof math==="undefined")return;
 let c;try{c=math.derivative(norm($("gf").value),"x").compile()}catch(e){return}
 g.strokeStyle="#e17055";g.lineWidth=3;g.beginPath();let pen=false;
 for(let px=0;px<=W;px+=2){
  const x=cx+(px-W/2)/sc;let y;
  try{y=c.evaluate({x})}catch(e){pen=false;continue}
  if(typeof y!=="number"||!isFinite(y)||Math.abs(Y(y))>5*cvs.height){pen=false;continue}
  if(pen)g.lineTo(px,Y(y));else{g.moveTo(px,Y(y));pen=true}
 }
 g.stroke();
}
$("gd").onchange=draw;
$("gf").oninput=draw;
$("zin").onclick=()=>{sc=Math.min(400,sc*1.4);draw()};
$("zout").onclick=()=>{sc=Math.max(4,sc/1.4);draw()};
let drag=null;
cvs.addEventListener("pointerdown",e=>{drag=[e.clientX,e.clientY,cx,cy];cvs.setPointerCapture(e.pointerId)});
cvs.addEventListener("pointermove",e=>{if(!drag)return;const k=cvs.width/cvs.getBoundingClientRect().width;
 cx=drag[2]-(e.clientX-drag[0])*k/sc;cy=drag[3]+(e.clientY-drag[1])*k/sc;draw()});
cvs.addEventListener("pointerup",()=>drag=null);
/* ---------- UI: splash, menu, settings, particles, Android sign-in return ---------- */
const NATIVE=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const menuEl=$("menu"),scrimEl=$("scrim"),burgerEl=$("burger");
function openMenu(o){menuEl.classList.toggle("open",o);scrimEl.classList.toggle("open",o);burgerEl.setAttribute("aria-expanded",String(!!o))}
burgerEl.onclick=()=>openMenu(!menuEl.classList.contains("open"));
scrimEl.onclick=()=>openMenu(false);
document.addEventListener("keydown",e=>{if(e.key==="Escape")openMenu(false)});
menuEl.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{
 goTab(b.dataset.p);
 menuEl.querySelectorAll("[data-p]").forEach(x=>x.classList.toggle("on",x===b));
 if(b.dataset.p==="set")syncSettings();
 openMenu(false);window.scrollTo({top:0,behavior:"smooth"});
});
const _showApp=showApp;
showApp=function(on){_showApp(on);burgerEl.style.display=on?"flex":"none";$("mwho").textContent=on?$("who").textContent:"";openMenu(!!on)};

function setTheme(t){document.documentElement.dataset.theme=t==="light"?"light":"dark";try{localStorage.setItem("bc-theme",t)}catch(e){}}
function syncSettings(){
 $("sa").value=deg?"1":"0";$("sf").value=fm;$("sn").value=String(fn);
 $("st").value=document.documentElement.dataset.theme==="light"?"light":"dark";
 $("sacc").textContent=($("who").textContent||"")+(USER&&USER.email&&USER.email!==$("who").textContent?"\n"+USER.email:"");
}
$("sa").onchange=()=>{deg=$("sa").value==="1";ind();rerender()};
$("sf").onchange=()=>{fm=$("sf").value;rerender()};
$("sn").onchange=()=>{fn=+$("sn").value;rerender()};
$("st").onchange=()=>setTheme($("st").value);
try{const t=localStorage.getItem("bc-theme");if(t)setTheme(t)}catch(e){}

$("eye").onclick=()=>{const t=$("ap").type==="password"?"text":"password";$("ap").type=t;$("ap2").type=t;$("eye").textContent=t==="text"?"🙈":"👁"};

/* Android: finish Google / email-link sign-in when the app is re-opened by its link */
if(NATIVE&&window.Capacitor.Plugins&&Capacitor.Plugins.App){
 Capacitor.Plugins.App.addListener("appUrlOpen",async({url})=>{
  try{
   const u=new URL(url),h=new URLSearchParams(u.hash.slice(1)),q=u.searchParams;
   if(h.get("access_token")){
    await sb.auth.setSession({access_token:h.get("access_token"),refresh_token:h.get("refresh_token")});
    if(h.get("type")==="recovery"){showApp(false);amodeSet("reset")}
   }else if(q.get("code")){await sb.auth.exchangeCodeForSession(q.get("code"))}
   try{Capacitor.Plugins.Browser.close()}catch(e){}
  }catch(e){amsg("Could not complete sign in.","err")}
 });
}

/* floating particles */
(function(){
 const c=$("pt"),x=c.getContext("2d"),still=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
 let W=0,H=0;const P=[];
 const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight};rs();addEventListener("resize",rs);
 for(let i=0;i<(still?0:46);i++)P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2.2+.6,s:Math.random()*.4+.1,a:Math.random()*6.28});
 (function f(){
  if($("auth").style.display!=="none"){
   x.clearRect(0,0,W,H);
   P.forEach(p=>{p.y-=p.s;p.x+=Math.sin(p.a+=.01)*.3;if(p.y<-5){p.y=H+5;p.x=Math.random()*W}
    x.beginPath();x.fillStyle="rgba(100,180,255,"+(.25+.45*Math.abs(Math.sin(p.a)))+")";x.shadowBlur=12;x.shadowColor="#2f8bff";x.arc(p.x,p.y,p.r,0,6.283);x.fill()});
  }
  requestAnimationFrame(f);
 })();
})();

/* opening sequence: logo for about 2 seconds, then the login screen */
setTimeout(()=>{$("splash").classList.add("out");$("auth").classList.add("go");setTimeout(()=>{const s=$("splash");if(s)s.remove()},800)},2200);
