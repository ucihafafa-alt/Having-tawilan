const MODEL_CANDIDATES=['gemini-2.5-flash','gemini-2.0-flash','gemini-1.5-flash'];
const DEFAULT_KEY='';
const state={left:null,right:null,leftType:null,rightType:null,leftData:null,rightData:null,lastReport:null,lastClient:null};
const $=id=>document.getElementById(id);

function cleanKey(k){
  return String(k || '').replace(/[^A-Za-z0-9._-]/g,'');
}
function askApiKey(){
  const raw = window.prompt('Gemini AQ auth key-гээ оруулна уу');
  const cleaned = cleanKey(raw);
  if(!cleaned) throw new Error('API key оруулаагүй байна');
  if(cleaned.length < 20) throw new Error('API key хэт богино байна. Бүтнээр нь copy/paste хийнэ үү.');
  localStorage.setItem('GEMINI_API_KEY', cleaned);
  return cleaned;
}
function getApiKey(){
  const saved = cleanKey(localStorage.getItem('GEMINI_API_KEY') || DEFAULT_KEY);
  if(!saved) return askApiKey();
  return saved;
}
function getApiUrl(model){
  return 'https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent';
}
function show(id){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');window.scrollTo({top:0,behavior:'smooth'});}
function scrollToForm(){$('form').scrollIntoView({behavior:'smooth'});} 
function loadImage(side,input){
  const file=input.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=e=>{state[side]=e.target.result;state[side+'Data']=e.target.result.split(',')[1];state[side+'Type']=file.type||'image/jpeg';$(side+'Prev').src=e.target.result;$(side+'Card').classList.add('filled');check();};
  r.readAsDataURL(file);
}
function check(){const ok=state.left&&state.right&&$('name').value.trim()&&$('age').value&&$('gender').value;$('analyzeBtn').disabled=!ok;}
['name','age','gender'].forEach(id=>addEventListener('input',check));
function loadingAnim(){let i=0;const items=[...document.querySelectorAll('.scan-list li')];return setInterval(()=>{items.forEach(x=>x.classList.remove('on'));items[Math.min(i,items.length-1)].classList.add('on');i=(i+1)%items.length;},1300)}

function prompt(name,age,gender){
return `Чи бол Сара нэртэй алганы хээ шинжээч. Монгол хэлээр дулаан, мэргэжлийн, давтагдалгүй тайлан бич. Зураг дээр харагдахгүй зүйлийг баттай мэт зохиохгүй, "ерөнхий ажиглалтаар" гэж болгоомжтой хэл.

Маш чухал заавар:
- Зөвхөн ЦЭВЭР JSON буцаа.
- JSON-оос өөр тайлбар, markdown, code fence, нэмэлт өгүүлбэр бүү нэм.
- "summary" нь 5-7 өгүүлбэрийн дүгнэлт байна.
- "lineNotes" хэсэгт зүрхний шугам, толгойн шугам, амьдралын шугам, хувь заяаны шугам, нарны шугам тус бүр 2-3 өгүүлбэр байна.
- "scores" хэсэгт зөвхөн тоон утга өг.
- "timeline" хэсэгт яг 3 мөр өг.
- "sections" хэсэгт яг 8-10 дэд гарчиг байж болно. Дэд гарчиг бүрийн body нь 4-7 өгүүлбэр байна.
- Body дотор JSON тэмдэг, хаалт, slash, special character бүү оруул.
- Эможи бүү хэрэглэ.

Нэр: ${name}
Нас: ${age}
Хүйс: ${gender}

JSON бүтэц:
{
  "summary":"...",
  "lineNotes":{"heart":"...","head":"...","life":"...","fate":"...","sun":"..."},
  "scores":{"Хайр дурлал":88,"Санхүү":76,"Карьер":82,"Эрүүл мэнд":79,"Тогтвортой байдал":84},
  "timeline":[
    {"age":"Одоо - ${age} нас","text":"...","advice":"..."},
    {"age":"${Number(age)+1} - ${Number(age)+2} нас","text":"...","advice":"..."},
    {"age":"${Number(age)+3} - ${Number(age)+4} нас","text":"...","advice":"..."}
  ],
  "sections":[
    {"title":"Ерөнхий дүр зураг","body":"..."},
    {"title":"Зан чанар","body":"..."},
    {"title":"Хайр дурлал","body":"..."},
    {"title":"Ажил мэргэжил","body":"..."},
    {"title":"Мөнгө санхүү","body":"..."},
    {"title":"Эрүүл мэндийн хандлага","body":"..."},
    {"title":"Давуу тал","body":"..."},
    {"title":"Анхаарах зүйл","body":"..."},
    {"title":"3 жилийн ерөнхий төлөв","body":"..."},
    {"title":"Сарагийн хувийн зөвлөгөө","body":"..."}
  ],
  "quote":"..."
}`;
}

async function callModel(model, name, age, gender){
  const body={
    contents:[{parts:[
      {text:prompt(name,age,gender)},
      {inline_data:{mime_type:state.leftType,data:state.leftData}},
      {inline_data:{mime_type:state.rightType,data:state.rightData}}
    ]}],
    generationConfig:{temperature:.55,maxOutputTokens:8192,response_mime_type:'application/json'}
  };

  async function requestOnce(apiKey){
    const key = cleanKey(apiKey);
    const res=await fetch(getApiUrl(model)+'?key='+encodeURIComponent(key),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok){
      const msg=data.error?.message||'AI холболтын алдаа';
      const low=String(msg).toLowerCase();
      if(low.includes('api key')||low.includes('api_key_invalid')||low.includes('key not valid')||low.includes('valid api key')||low.includes('permission')||low.includes('auth')||low.includes('leak')){
        localStorage.removeItem('GEMINI_API_KEY');
        return {invalidKey:true,msg};
      }
      throw new Error(msg);
    }
    return {text:data.candidates?.[0]?.content?.parts?.[0]?.text||''};
  }

  let first=await requestOnce(getApiKey());
  if(first.invalidKey){
    alert('API key хүчингүй байна. Одоо шинэ key-гээ бүтнээр нь paste хийнэ үү.');
    const second=await requestOnce(askApiKey());
    if(second.invalidKey){
      localStorage.removeItem('GEMINI_API_KEY');
      throw new Error('Шинэ key бас хүчингүй байна. AI Studio-оос зөв key аваад дахин оруулна уу.');
    }
    return second.text||'';
  }
  return first.text||'';
}

function parseAIResponse(txt){
  if(!txt) return null;
  const cleaned=txt.replace(/```json|```/gi,'').trim();
  const attempts=[];
  attempts.push(cleaned);
  const first=cleaned.indexOf('{');
  const last=cleaned.lastIndexOf('}');
  if(first!==-1 && last>first) attempts.unshift(cleaned.slice(first,last+1));
  for(const candidate of attempts){
    try{return JSON.parse(candidate);}catch(e){}
    try{return JSON.parse(candidate.replace(/,\s*([}\]])/g,'$1'));}catch(e){}
    try{return (new Function('return ('+candidate+')'))();}catch(e){}
  }
  return null;
}

function sanitizeText(text=''){
  return String(text)
    .replace(/[{}<>%\[\]]/g,' ')
    .replace(/\"/g,'"')
    .replace(/"summary"\s*:\s*/gi,'')
    .replace(/"title"\s*:\s*/gi,'')
    .replace(/"body"\s*:\s*/gi,'')
    .replace(/"text"\s*:\s*/gi,'')
    .replace(/"advice"\s*:\s*/gi,'')
    .replace(/\s+/g,' ')
    .trim();
}

function extractSentences(text='', max=6){
  const cleaned=sanitizeText(text);
  const sentences=cleaned.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  return sentences.slice(0,max);
}

function fallbackReport(name,age,gender,txt=''){
  const extracted=extractSentences(txt,8);
  const summaryText=extracted.slice(0,4).join(' ') || `${name} таны алганы ерөнхий хэлбэрээс тогтвортой, бодитой, мэдрэмжтэй зан төлөв ажиглагдаж байна. Аливааг тунгааж шийддэг, дотоод хэмнэл сайтай хүн болох шинж харагдана. Харилцаанд үнэнч, ажил төрөлдөө тууштай байх чанар давамгай байна.`;
  return {
    summary: summaryText,
    lineNotes:{
      heart:'Сэтгэлийн илэрхийлэл тогтуун, харилцаанд үнэнч байдлыг эрхэмлэх хандлагатай.',
      head:'Бодол санаа практик, шийдвэр гаргахдаа ажиглаж тунгаах тал давамгай.',
      life:'Амьдралын хэмнэл тогтвортой, эрч хүчээ зөв хуваарилах хэрэгтэй.',
      fate:'Зорилгоо тодруулбал ажил, санхүүгийн зам илүү цэгцтэй болно.',
      sun:'Авьяас чадвар аажмаар тодорч, хүндлэл нэр хүндийг аажмаар татах шинжтэй.'
    },
    scores:{'Хайр дурлал':88,'Санхүү':78,'Карьер':84,'Эрүүл мэнд':76,'Тогтвортой байдал':82},
    timeline:[
      {age:`Одоо - ${age} нас`,text:'Одоо байгаа сонголт, зорилгоо цэгцлэх үе байна.',advice:'● Дотоод хүчээ зөв зүйлд чиглүүл.\n● Яарах бус тогтвортой алх.'},
      {age:`${+age+1} - ${+age+2} нас`,text:'Ажил, санхүү, харилцаанд шинэ боломж нэмэгдэнэ.',advice:'● Шинэ төлөвлөгөөндөө тууштай бай.\n● Боломжийг айлгүй ашигла.'},
      {age:`${+age+3} - ${+age+4} нас`,text:'Өмнөх хөдөлмөрийн үр дүн бодитоор тогтох үе ирнэ.',advice:'● Тогтвортой системээ хадгал.\n● Эхэлснээ дуусгах сахилга барь.'}
    ],
    sections:[
      {title:'Ерөнхий дүр зураг',body: summaryText},
      {title:'Зан чанар',body:'Та аливаад бодитоор ханддаг, нэгэнт шийдсэн бол тууштай ажиллах хандлагатай. Дотоод мэдрэмж сайн тул хүнийг танихдаа алдах нь цөөн. Хариуцлага, тогтвортой байдлыг эрхэмлэдэг шинж тод харагдана.'},
      {title:'Хайр дурлал',body:'Сэтгэлдээ үнэнч, халамжтай харилцааг илүүд үзэх хандлага ажиглагдана. Түргэн шийдвэрээс илүү бат бөх холбоог эрхэмлэнэ. Харилцаанд итгэлцэл маш чухал нөлөөтэй.'},
      {title:'Ажил мэргэжил',body:'Ажил дээрээ хариуцлагатай, зохион байгуулалт сайтай ажиллах чадвар ажиглагдана. Бодитоор төлөвлөж алхвал дэвших боломж өндөр. Удаан хугацааны зорилго танд илүү тохирно.'},
      {title:'Мөнгө санхүү',body:'Орлогоо тогтвортой байлгах чадвар бий. Яаран эрсдэл хийхээс илүү аажмаар бат бөх өсгөх хандлага танд илүү өгөөжтэй. Санхүүгийн сахилга бат чухал түлхүүр болно.'},
      {title:'Эрүүл мэндийн хандлага',body:'Ерөнхий ажиглалтаар эрч хүчээ зөв хуваарилж чадвал биеийн хэмнэл тогтвортой байна. Амралт, унтлагын дэглэмээ анхаарах нь тустай. Энэ нь эмнэлгийн онош биш, уламжлалт тайлалын хүрээний зөвлөмж юм.'},
      {title:'3 жилийн ерөнхий төлөв',body:'Ойрын жилүүдэд өмнөх хүчин чармайлт бодит үр дүн рүү шилжих үе ажиглагдана. Ажил, харилцаа, амьдралын зохион байгуулалтаа зөв тэнцвэржүүлбэл тогтвортой өсөлт ирнэ. Тууштай байдал хамгийн чухал болно.'},
      {title:'Сарагийн хувийн зөвлөгөө',body:'Өөрийн замаа яаралгүй, гэхдээ итгэлтэйгээр бүтээ. Төлөвлөгөө, сахилга бат, харилцааны үнэнч байдал таны гол түлхүүр болно. Чимээгүй боловч тууштай өсөлт танд илүү их үр өгөөж авчирна.'}
    ],
    quote:'Алга тань таны амьдралын газрын зураг юм.'
  }
}

async function startAnalysis(){
  hideError(); setStatus('');
  const name=$('name').value.trim(),age=$('age').value,gender=$('gender').value;
  show('loading');
  const timer=loadingAnim();
  try{
    let txt=''; let lastErr='';
    for(const model of MODEL_CANDIDATES){
      try{ txt=await callModel(model,name,age,gender); if(txt) break; }
      catch(err){ lastErr=err.message||String(err); if(!/high demand|overloaded|unavailable|503|429/i.test(lastErr)) throw err; }
    }
    const report=parseAIResponse(txt)||fallbackReport(name,age,gender,txt);
    state.lastReport=report; state.lastClient={name,age,gender};
    renderReport(report,name,age,gender);
    clearInterval(timer); show('result');
  }catch(e){
    clearInterval(timer); show('start'); showError('Алдаа: '+e.message);
  }
}

function renderReport(r,name,age,gender){
  $('coverName').textContent=name;
  $('coverAge').textContent=age+' нас';
  $('coverGender').textContent=gender;
  $('coverDate').textContent=formatDate(new Date());
  $('meta').textContent=`${name} / ${gender} / ${age} нас`;
  $('l1').textContent=sanitizeText(r.lineNotes?.heart||'');
  $('l2').textContent=sanitizeText(r.lineNotes?.head||'');
  $('l3').textContent=sanitizeText(r.lineNotes?.life||'');
  $('l4').textContent=sanitizeText(r.lineNotes?.fate||'');
  $('l5').textContent=sanitizeText(r.lineNotes?.sun||'');
  renderScores(r.scores||{});
  renderTimeline(r.timeline||[]);
  renderSections(r.sections||[],r.summary||'');
  $('quote').textContent='“'+sanitizeText(r.quote||'Алганы хээ бол таны амьдралын газрын зураг юм.')+'”';
}

function renderScores(scores={}){
  const colors=['#ef5b5b','#2aa66a','#2f8ccf','#86c8b0','#f2a71b'];
  $('scores').innerHTML=Object.entries(scores).slice(0,5).map(([k,v],i)=>`<div class="score"><b>${escapeHtml(sanitizeText(k))}</b><div class="ring" style="--p:${Number(v)||80};--c:${colors[i]}" data-val="${Number(v)||80}"></div><small>${v>=88?'Маш сайн':v>=75?'Сайн':'Анхаарах'}</small></div>`).join('');
}

function renderTimeline(arr=[]){
  $('timeline').innerHTML=arr.slice(0,3).map(t=>`<div class="timebox"><h3>${escapeHtml(sanitizeText(t.age||''))}</h3><p>${escapeHtml(sanitizeText(t.text||''))}</p><small>${bulletBlock(t.advice||'')}</small></div>`).join('');
}

function renderSections(arr=[],summary=''){
  const items=[];
  if(summary) items.push({title:'Ерөнхий дүгнэлт',body:summary});
  arr.forEach(s=>items.push({title:s.title||'Дэд гарчиг',body:s.body||''}));
  $('sections').innerHTML=items.map(s=>sectionPageHtml(s.title,s.body)).join('');
}

function sectionPageHtml(title,body){
  return `<section class="report-page section-page"><img src="icon-192.png" class="page-logo" alt="Лого"><p class="page-kicker">Сарагийн тайлан</p><h2>${escapeHtml(sanitizeText(title))}</h2>${bodyToHtml(body)}</section>`;
}

function bodyToHtml(text=''){
  const sentences=extractSentences(text,12);
  if(!sentences.length) return '<ul class="report-bullets"><li>Мэдээлэл боловсруулах явцад энэ хэсгийг товчлон бэлтгэлээ.</li></ul>';
  return '<ul class="report-bullets">'+sentences.map(s=>`<li>${escapeHtml(s)}</li>`).join('')+'</ul>';
}

function bulletBlock(text=''){
  let parts=String(text).split(/\n+/).map(sanitizeText).filter(Boolean);
  if(parts.length<=1) parts=extractSentences(text,3);
  if(!parts.length) return '● Тогтвортой хэмнэлээ хадгал.';
  return parts.map(p=>'● '+escapeHtml(p)).join('<br>');
}

function escapeHtml(str=''){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function formatDate(d){return `${d.getFullYear()} оны ${d.getMonth()+1} сарын ${d.getDate()} өдөр`;}
function showError(msg){$('error').style.display='block';$('error').textContent=msg}
function hideError(){$('error').style.display='none'}
function setStatus(msg){$('exportStatus').textContent=msg||'';}
function resetApp(){location.reload()}
function reportFileBase(){const name=(state.lastClient?.name||'sara-tailan').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-zа-яёөүң-]+/gi,'');return name||'sara-tailan';}

async function capturePages(){
  const pages=[...document.querySelectorAll('#report .report-page')];
  const results=[];
  for(const page of pages){
    const canvas=await html2canvas(page,{scale:2,useCORS:true,backgroundColor:'#f7f3ec',windowWidth:1240});
    results.push(canvas);
  }
  return results;
}

async function downloadPDF(){
  try{
    setStatus('PDF бэлтгэж байна...');
    const pages=await capturePages();
    const {jsPDF}=window.jspdf; const pdf=new jsPDF('p','mm','a4');
    pages.forEach((canvas,i)=>{
      if(i>0) pdf.addPage();
      const img=canvas.toDataURL('image/jpeg',0.95);
      pdf.addImage(img,'JPEG',0,0,210,297);
    });
    pdf.save(`${reportFileBase()}-sara-tailan.pdf`);
    setStatus('PDF тайлан амжилттай бэлэн боллоо.');
  }catch(e){ setStatus('PDF гаргахад алдаа гарлаа.'); }
}

function buildDocHtml(){
  const reportHtml=document.getElementById('report').innerHTML;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sara Report</title><style>
  body{font-family:Arial,sans-serif;background:#f7f3ec;color:#21332f;margin:0;padding:0}
  .report-page{width:794px;min-height:1123px;margin:0 auto 18px;background:#fffdf8;padding:38px 42px;box-sizing:border-box;position:relative;page-break-after:always;border:1px solid #e8dfd1}
  .page-logo{position:absolute;top:18px;right:18px;width:42px;height:42px;border-radius:50%}
  .page-kicker,.eyebrow{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a8b66;margin-bottom:10px}
  h1,h2{font-family:Georgia,serif;color:#1f4a44;margin:0 0 14px}
  h1{font-size:38px;line-height:1.1} h1 span{font-size:46px} h2{font-size:28px}
  .client-info{width:100%;border-collapse:collapse;margin-top:20px}.client-info th,.client-info td{border:1px solid #e5dccf;padding:10px 12px;text-align:left}
  .client-info th{width:38%;background:#f6efe3}
  .palm-card,.score-card,.timeline-card,.footer,blockquote,.legend div{border:1px solid #e5dccf;border-radius:18px;background:#fff;padding:18px;box-sizing:border-box}
  .palm-photo{width:100%;height:360px;object-fit:cover;border-radius:16px}.palm-note{font-size:12px;color:#7d776c;margin-top:10px}
  .legend{display:flex;flex-direction:column;gap:10px;margin-top:14px}.legend div{display:grid;grid-template-columns:34px 1fr;gap:6px 12px}.legend span{grid-column:2;line-height:1.7}
  .dot{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;color:#fff;font-weight:bold}.red{background:#ef5b5b}.blue{background:#2f8ccf}.green{background:#2aa66a}.yellow{background:#f2a71b}.purple{background:#8b4bd6}
  .scores{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.score{border:1px solid #e5dccf;border-radius:16px;padding:14px;text-align:center}.ring{display:none}.score small{display:block;margin-top:10px;color:#6e7068}
  .timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.timebox{border:1px solid #e5dccf;border-radius:16px;padding:14px}.timebox h3{color:#1c7568;margin-bottom:8px}
  .report-bullets{margin:14px 0 0 0;padding-left:0;list-style:none}.report-bullets li{margin:0 0 12px 0;line-height:1.8}.report-bullets li:before{content:"● ";color:#1c7568;font-weight:bold}
  blockquote{font-family:Georgia,serif;font-style:italic;font-size:24px;background:#eef6f1}.footer{display:flex;justify-content:space-between;margin-top:24px;color:#746f64;font-size:13px}
  .cover-author{position:absolute;right:42px;bottom:28px;color:#746f64;font-size:13px}.meta,.cover-expert,.cover-lead{color:#5d685f;line-height:1.7}
  </style></head><body>${reportHtml}</body></html>`;
}

function downloadWord(){
  try{
    const blob=new Blob([buildDocHtml()],{type:'application/msword'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${reportFileBase()}-sara-tailan.doc`; a.click();
    setStatus('Word файл бэлэн боллоо.');
  }catch(e){ setStatus('Word файл бэлтгэхэд алдаа гарлаа.'); }
}

function printReport(){
  const w=window.open('','_blank');
  if(!w) return;
  w.document.open(); w.document.write(buildDocHtml()); w.document.close();
  w.focus();
  setTimeout(()=>{w.print();},500);
}

if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(regs=>regs.forEach(r=>r.unregister())).catch(()=>{});
}
if('caches' in window){
  caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).catch(()=>{});
}