const DEFAULT_KEY='';
const SYSTEM_NAME='Хувь Тавилангийн Хээ';
const EXPERT_NAME='Сара';
const EXPERT_ROLE='Алганы хээний шинжээч';
const AUTHOR_NAME='Л.Батцог';
const LOGO_SRC='icon-192.png';

const GEMINI_MODELS=[
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash'
];

function getApiKey(){
  let key=localStorage.getItem('GEMINI_API_KEY') || DEFAULT_KEY;
  if(!key){
    key=window.prompt('Gemini API key-гээ оруулна уу');
    if(!key) throw new Error('API key оруулаагүй байна');
    localStorage.setItem('GEMINI_API_KEY', key.trim());
  }
  return key.trim();
}
function getApiUrl(model){
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(getApiKey())}`;
}
function isTransientAiError(message=''){
  const msg=String(message).toLowerCase();
  return msg.includes('high demand') || msg.includes('overloaded') || msg.includes('temporar') || msg.includes('try again') || msg.includes('503') || msg.includes('429') || msg.includes('quota');
}
async function callGeminiModel(model,payload){
  const res=await fetch(getApiUrl(model),{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
    const msg=data.error?.message || `AI холболтын алдаа (${res.status})`;
    if(msg.toLowerCase().includes('leak') || msg.toLowerCase().includes('api key')){
      localStorage.removeItem('GEMINI_API_KEY');
    }
    const err=new Error(msg);
    err.status=res.status;
    throw err;
  }
  return data;
}
async function generateWithFallback(payload){
  const errors=[];
  for(const model of GEMINI_MODELS){
    for(let attempt=1;attempt<=2;attempt++){
      try{
        const data=await callGeminiModel(model,payload);
        return {data,model};
      }catch(e){
        errors.push(`${model}: ${e.message}`);
        if(!isTransientAiError(e.message) || attempt===2) break;
        await wait(1100*attempt);
      }
    }
  }
  throw new Error('AI сервер түр ачаалалтай байна. 1-2 минутын дараа дахин дараарай. Дэлгэрэнгүй: '+errors.slice(-2).join(' | '));
}

const state={left:null,right:null,leftType:null,rightType:null,leftData:null,rightData:null,lastReport:null,lastClient:null};
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const paragraph=value=>esc(value).replace(/\n/g,'<br>');

function show(id){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  $(id).classList.add('active');
  scrollTo({top:0,behavior:'smooth'});
}
function scrollToForm(){$('form').scrollIntoView({behavior:'smooth'});}
function loadImage(side,input){
  const file=input.files[0];
  if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    state[side]=e.target.result;
    state[side+'Data']=e.target.result.split(',')[1];
    state[side+'Type']=file.type||'image/jpeg';
    $(side+'Prev').src=e.target.result;
    $(side+'Card').classList.add('filled');
    check();
  };
  r.readAsDataURL(file);
}
function check(){
  const ok=state.left&&state.right&&$('name').value&&$('age').value&&$('gender').value;
  $('analyzeBtn').disabled=!ok;
}
['name','age','gender'].forEach(id=>$(id)?.addEventListener('input',check));

function loadingAnim(){
  let i=0;
  const items=[...document.querySelectorAll('.scan-list li')];
  return setInterval(()=>{
    items.forEach(x=>x.classList.remove('on'));
    items[Math.min(i,items.length-1)]?.classList.add('on');
    i=(i+1)%items.length;
  },1300);
}

const prompt=(name,age,gender)=>`Чи бол Сара нэртэй алганы хээ шинжээч. Монгол хэлээр дулаан, мэргэжлийн, давтагдалгүй тайлан бич. Зураг дээр харагдахгүй зүйлийг баттай мэт зохиохгүй, "ерөнхий ажиглалтаар" гэж болгоомжтой хэл. Хариултыг зөвхөн JSON хэлбэрээр өг. Нэр: ${name}, Нас: ${age}, Хүйс: ${gender}. JSON бүтэц: {"summary":"ерөнхий 5-7 өгүүлбэр", "lineNotes":{"heart":"зүрхний шугамын 2-3 өгүүлбэр", "head":"толгойн шугамын 2-3 өгүүлбэр", "life":"амьдралын шугамын 2-3 өгүүлбэр", "fate":"хувь заяаны шугамын 2-3 өгүүлбэр", "sun":"нарны шугамын 2-3 өгүүлбэр"}, "scores":{"Хайр дурлал":88,"Санхүү":76,"Карьер":82,"Эрүүл мэнд":79,"Тогтвортой байдал":84}, "timeline":[{"age":"Одоо - ${age} нас","text":"...","advice":"..."},{"age":"${Number(age)+1} - ${Number(age)+2} нас","text":"...","advice":"..."},{"age":"${Number(age)+3} - ${Number(age)+4} нас","text":"...","advice":"..."}], "sections":[{"title":"Ерөнхий дүр зураг","body":"120-170 үг"},{"title":"Зан чанар","body":"120-170 үг"},{"title":"Хайр дурлал","body":"120-170 үг"},{"title":"Ажил мэргэжил","body":"120-170 үг"},{"title":"Мөнгө санхүү","body":"120-170 үг"},{"title":"Эрүүл мэндийн хандлага","body":"Эмнэлгийн онош биш, уламжлалт тайлалын хүрээнд 100-150 үг"},{"title":"Давуу тал","body":"100-150 үг"},{"title":"Анхаарах зүйл","body":"100-150 үг"},{"title":"3 жилийн ерөнхий төлөв","body":"150-200 үг"},{"title":"Сарагийн хувийн зөвлөгөө","body":"120-170 үг"}], "quote":"богино урамтай ишлэл"}`;

async function startAnalysis(){
  hideError();
  const name=$('name').value.trim(),age=$('age').value,gender=$('gender').value;
  show('loading');
  const timer=loadingAnim();
  try{
    const payload={
      contents:[{parts:[
        {text:prompt(name,age,gender)},
        {inline_data:{mime_type:state.leftType,data:state.leftData}},
        {inline_data:{mime_type:state.rightType,data:state.rightData}}
      ]}],
      generationConfig:{temperature:.65,maxOutputTokens:8192,response_mime_type:'application/json'}
    };
    const {data}=await generateWithFallback(payload);
    let txt=data.candidates?.[0]?.content?.parts?.[0]?.text||'';
    txt=txt.replace(/```json|```/g,'').trim();
    let report;
    try{report=JSON.parse(txt)}catch(e){report=fallbackReport(name,age,gender,txt)}
    clearInterval(timer);
    renderReport(report,name,age,gender);
    show('result');
  }catch(e){
    clearInterval(timer);
    show('start');
    const friendly=String(e.message||'').includes('AI сервер түр ачаалалтай')
      ? e.message
      : 'Алдаа: '+e.message;
    showError(friendly);
  }
}

function fallbackReport(name,age,gender,txt){
  return{
    summary:txt||`${name} таны алганы ерөнхий хэлбэрээс тогтвортой, бодитой, мэдрэмжтэй зан төлөв ажиглагдаж байна.`,
    lineNotes:{
      heart:'Сэтгэлийн илэрхийлэл тогтуун, харилцаанд үнэнч байдлыг эрхэмлэх хандлагатай.',
      head:'Бодол санаа практик, шийдвэр гаргахдаа ажиглаж тунгаах тал давамгай.',
      life:'Амьдралын хэмнэл тогтвортой, хүчээ зөв хуваарилах хэрэгтэй.',
      fate:'Зорилгоо тодруулбал ажил, санхүүгийн зам илүү цэгцтэй болно.',
      sun:'Авьяас чадвар аажмаар тодрох шинжтэй.'
    },
    scores:{'Хайр дурлал':88,'Санхүү':78,'Карьер':84,'Эрүүл мэнд':76,'Тогтвортой байдал':82},
    timeline:[
      {age:`Одоо - ${age} нас`,text:'Одоо байгаа сонголтоо цэгцлэх үе.',advice:'Дотоод хүчээ зөв зүйлд чиглүүл.'},
      {age:`${+age+1} - ${+age+2} нас`,text:'Ажил, санхүү, харилцаанд шинэ боломж нэмэгдэнэ.',advice:'Шинэ төлөвлөгөөнд зоригтой ор.'},
      {age:`${+age+3} - ${+age+4} нас`,text:'Өмнөх хөдөлмөрийн үр дүн тогтох үе.',advice:'Тогтвортой систем бүтээ.'}
    ],
    sections:[
      {title:'Ерөнхий дүр зураг',body:txt||'Таны хоёр гарын ерөнхий хэлбэр, үндсэн шугамуудын байрлал нь бодитой, мэдрэмжтэй, хариуцлагатай хандлагыг илтгэнэ.'},
      {title:'Сарагийн хувийн зөвлөгөө',body:'Өөрийн замаа яаралгүй, гэхдээ итгэлтэйгээр бүтээ. Төлөвлөгөө, сахилга бат, харилцааны үнэнч байдал таны гол түлхүүр байна.'}
    ],
    quote:'Алга тань таны замын газрын зураг юм.'
  };
}

function reportDate(){
  return new Date().toLocaleDateString('mn-MN',{year:'numeric',month:'long',day:'numeric'});
}
function setText(id,value){const el=$(id);if(el)el.textContent=value||'';}
function pageLogo(){return `<img src="${LOGO_SRC}" class="page-logo" alt="Лого">`;}

function renderReport(r,name,age,gender){
  state.lastReport=r;
  state.lastClient={name,age,gender,date:reportDate()};
  setText('meta',`${name} / ${gender} / ${age} нас`);
  setText('coverName',name);
  setText('coverAge',`${age} нас`);
  setText('coverGender',gender);
  setText('coverDate',state.lastClient.date);
  setText('coverAuthor',`Системийн зохиогч: ${AUTHOR_NAME}`);
  setText('coverSystem',SYSTEM_NAME);
  setText('coverExpert',`${EXPERT_NAME} — ${EXPERT_ROLE}`);
  drawPalm();
  setText('l1',r.lineNotes?.heart||'');
  setText('l2',r.lineNotes?.head||'');
  setText('l3',r.lineNotes?.life||'');
  setText('l4',r.lineNotes?.fate||'');
  setText('l5',r.lineNotes?.sun||'');
  renderScores(r.scores);
  renderTimeline(r.timeline);
  renderSections(r.sections,r.summary);
  setText('quote','“'+(r.quote||'Алганы хээ бол таны амьдралын газрын зураг юм.')+'”');
  setText('finalAuthor',`Системийн зохиогч: ${AUTHOR_NAME}`);
}

function drawPalm(){
  const canvas=$('palmCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  canvas.width=820;
  canvas.height=760;
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#fffdf9';
  ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.translate(w*.5,h*.56);
  ctx.strokeStyle='#cbb68c';
  ctx.fillStyle='#fff8ec';
  ctx.lineWidth=8;
  ctx.lineJoin='round';
  ctx.lineCap='round';

  ctx.beginPath();
  ctx.moveTo(-155,18);
  ctx.bezierCurveTo(-184,-104,-179,-237,-139,-242);
  ctx.bezierCurveTo(-106,-247,-101,-121,-97,-50);
  ctx.bezierCurveTo(-94,-193,-85,-312,-39,-316);
  ctx.bezierCurveTo(7,-320,5,-180,7,-53);
  ctx.bezierCurveTo(22,-201,42,-318,87,-307);
  ctx.bezierCurveTo(130,-296,104,-169,91,-46);
  ctx.bezierCurveTo(125,-152,160,-236,198,-217);
  ctx.bezierCurveTo(238,-198,188,-69,157,24);
  ctx.bezierCurveTo(210,8,247,28,248,68);
  ctx.bezierCurveTo(249,113,191,134,155,158);
  ctx.bezierCurveTo(107,191,79,258,53,324);
  ctx.lineTo(-115,324);
  ctx.bezierCurveTo(-132,257,-173,204,-189,147);
  ctx.bezierCurveTo(-200,109,-184,53,-155,18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  function curve(color,pts,width=9){
    ctx.strokeStyle=color;
    ctx.lineWidth=width;
    ctx.beginPath();
    ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length-1;i++)ctx.quadraticCurveTo(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);
    ctx.stroke();
  }
  curve('#ef5b5b',[[-132,-28],[-35,-64],[142,-24]]);
  curve('#2f8ccf',[[-139,45],[-43,18],[112,78]]);
  curve('#2aa66a',[[-92,96],[-153,190],[-84,303]]);
  curve('#f2a71b',[[13,-40],[18,79],[16,263]]);
  curve('#8b4bd6',[[72,35],[68,136],[58,282]]);

  const markers=[
    [1,-14,-44,'#ef5b5b'],[2,-131,45,'#2f8ccf'],[3,-111,177,'#2aa66a'],[4,135,-25,'#f2a71b'],[5,66,154,'#8b4bd6']
  ];
  markers.forEach(([n,x,y,c])=>{
    ctx.fillStyle=c;
    ctx.beginPath();
    ctx.arc(x,y,25,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#fff';
    ctx.font='bold 28px Inter, Arial';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(n,x,y+1);
  });

  ctx.restore();
}

function renderScores(scores={}){
  const colors=['#ef5b5b','#2aa66a','#2f8ccf','#86c8b0','#f2a71b'];
  $('scores').innerHTML=Object.entries(scores).slice(0,5).map(([k,v],i)=>{
    const n=Math.max(0,Math.min(100,Number(v)||80));
    return `<div class="score"><b>${esc(k)}</b><div class="ring" style="--p:${n};--c:${colors[i]}" data-val="${n}"></div><small>${n>=88?'Маш сайн':n>=75?'Сайн':'Анхаарах'}</small></div>`;
  }).join('');
}
function renderTimeline(arr=[]){
  $('timeline').innerHTML=arr.slice(0,3).map(t=>`<div class="timebox"><h3>${esc(t.age||'')}</h3><p>${paragraph(t.text||'')}</p><small><b>Зөвлөмж</b><br>${paragraph(t.advice||'')}</small></div>`).join('');
}
function splitBody(text,maxWords=190){
  const words=String(text||'').split(/\s+/).filter(Boolean);
  if(words.length<=maxWords)return [String(text||'')];
  const chunks=[];
  for(let i=0;i<words.length;i+=maxWords)chunks.push(words.slice(i,i+maxWords).join(' '));
  return chunks;
}
function renderSections(arr=[],summary=''){
  const pages=[];
  if(summary){
    pages.push(`<article class="report-page section-page">${pageLogo()}<p class="page-kicker">Сарагийн тайлан</p><h2>Ерөнхий дүгнэлт</h2><p>${paragraph(summary)}</p></article>`);
  }
  (arr||[]).forEach(s=>{
    splitBody(s.body,190).forEach((chunk,idx)=>{
      const title=idx===0?s.title:`${s.title} — үргэлжлэл`;
      pages.push(`<article class="report-page section-page">${pageLogo()}<p class="page-kicker">Сарагийн тайлан</p><h2>${esc(title)}</h2><p>${paragraph(chunk)}</p></article>`);
    });
  });
  $('sections').innerHTML=pages.join('');
}
function showError(msg){$('error').style.display='block';$('error').textContent=msg;}
function hideError(){$('error').style.display='none';}
function resetApp(){location.reload();}

function safeFileName(text){
  return String(text||'sara').toLowerCase().replace(/[^a-zа-яөүё0-9]+/gi,'-').replace(/^-+|-+$/g,'')||'sara';
}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
async function waitImages(root){
  const imgs=[...root.querySelectorAll('img')];
  await Promise.all(imgs.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;})));
}
function setExportStatus(text){
  const el=$('exportStatus');
  if(el)el.textContent=text||'';
}

async function downloadPDF(){
  const report=$('report');
  const pages=[...report.querySelectorAll('.report-page')];
  if(!pages.length)return;
  try{
    setExportStatus('PDF бэлдэж байна...');
    document.body.classList.add('exporting');
    await waitImages(report);
    await wait(80);
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF('p','mm','a4');
    for(let i=0;i<pages.length;i++){
      const canvas=await html2canvas(pages[i],{scale:2,useCORS:true,allowTaint:true,backgroundColor:'#faf8f4',windowWidth:794,windowHeight:1123});
      const img=canvas.toDataURL('image/jpeg',.94);
      if(i>0)pdf.addPage();
      pdf.addImage(img,'JPEG',0,0,210,297,undefined,'FAST');
    }
    pdf.save(`${safeFileName(state.lastClient?.name)}-sara-tailan.pdf`);
  }catch(e){
    alert('PDF үүсгэхэд алдаа гарлаа: '+e.message);
  }finally{
    document.body.classList.remove('exporting');
    setExportStatus('');
  }
}

async function imageToDataURL(url){
  return new Promise(resolve=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        canvas.width=img.naturalWidth;
        canvas.height=img.naturalHeight;
        canvas.getContext('2d').drawImage(img,0,0);
        resolve(canvas.toDataURL('image/png'));
      }catch(e){resolve(url);}
    };
    img.onerror=()=>resolve(url);
    img.src=url;
  });
}
async function downloadWord(){
  const report=$('report');
  try{
    setExportStatus('Word файл бэлдэж байна...');
    document.body.classList.add('exporting');
    await waitImages(report);
    await wait(60);
    const clone=report.cloneNode(true);
    const logoData=await imageToDataURL(LOGO_SRC);
    clone.querySelectorAll('img.page-logo').forEach(img=>img.src=logoData);
    const originalCanvas=$('palmCanvas');
    clone.querySelectorAll('canvas').forEach(canvas=>{
      const image=document.createElement('img');
      image.src=originalCanvas.toDataURL('image/png');
      image.className='word-palm-map';
      image.alt='Ерөнхий гарын зураглал';
      canvas.replaceWith(image);
    });
    const css=`@page WordSection1{size:595.3pt 841.9pt;margin:0} body{font-family:Arial,sans-serif;background:#faf8f4;color:#273b39} .report-page{page:WordSection1;width:595pt;min-height:842pt;box-sizing:border-box;padding:54pt 42pt 42pt;position:relative;page-break-after:always;background:#fffdf9;border:1pt solid #e7e2d9} .page-logo{position:absolute;right:28pt;top:24pt;width:34pt;height:34pt;object-fit:contain}.cover-title{font-size:34pt;line-height:1;color:#173f3a}.cover-author{position:absolute;right:32pt;bottom:28pt;color:#7a6441;font-size:10pt}.client-info{margin-top:26pt;border-collapse:collapse;width:100%}.client-info td{border:1pt solid #e7e2d9;padding:10pt}.palm-card,.score-card,.timeline-card{border:1pt solid #e7e2d9;padding:16pt}.word-palm-map{width:100%;max-height:470pt;object-fit:contain}.legend div,.score,.timebox{border:1pt solid #e7e2d9;padding:10pt;margin:6pt 0}.section-page h2{font-size:24pt;color:#173f3a}.section-page p{font-size:12pt;line-height:1.7}.final-page blockquote{font-size:20pt;color:#315f58}`;
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(SYSTEM_NAME)} — тайлан</title><style>${css}</style></head><body>${clone.innerHTML}</body></html>`;
    const blob=new Blob(['\ufeff',html],{type:'application/msword;charset=utf-8'});
    const link=document.createElement('a');
    link.href=URL.createObjectURL(blob);
    link.download=`${safeFileName(state.lastClient?.name)}-sara-tailan.doc`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
  }catch(e){
    alert('Word файл үүсгэхэд алдаа гарлаа: '+e.message);
  }finally{
    document.body.classList.remove('exporting');
    setExportStatus('');
  }
}
function printReport(){
  setExportStatus('Хэвлэх цонх нээгдэж байна...');
  setTimeout(()=>{window.print();setExportStatus('');},100);
}

if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{});}
