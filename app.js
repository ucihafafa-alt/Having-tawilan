const DEFAULT_KEY='';
function getApiUrl(){
  let key=localStorage.getItem('GEMINI_API_KEY') || DEFAULT_KEY;
  if(!key){
    key=window.prompt('Gemini API key-гээ оруулна уу');
    if(!key) throw new Error('API key оруулаагүй байна');
    localStorage.setItem('GEMINI_API_KEY', key.trim());
  }
  return 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+encodeURIComponent(key.trim());
}
const state={left:null,right:null,leftType:null,rightType:null,leftData:null,rightData:null};
const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');scrollTo({top:0,behavior:'smooth'});}function scrollToForm(){$('form').scrollIntoView({behavior:'smooth'});}function loadImage(side,input){const file=input.files[0];if(!file)return;const r=new FileReader();r.onload=e=>{state[side]=e.target.result;state[side+'Data']=e.target.result.split(',')[1];state[side+'Type']=file.type||'image/jpeg';$(side+'Prev').src=e.target.result;$(side+'Card').classList.add('filled');check();};r.readAsDataURL(file);}function check(){const ok=state.left&&state.right&&$('name').value&&$('age').value&&$('gender').value;$('analyzeBtn').disabled=!ok;}['name','age','gender'].forEach(id=>$(id).addEventListener('input',check));
function loadingAnim(){let i=0;const items=[...document.querySelectorAll('.scan-list li')];return setInterval(()=>{items.forEach(x=>x.classList.remove('on'));items[Math.min(i,items.length-1)].classList.add('on');i=(i+1)%items.length;},1300)}
function formatMongolianDate(d=new Date()){
  return `${d.getFullYear()} оны ${d.getMonth()+1} сарын ${d.getDate()} өдөр`;
}
function buildMeta(name,age,gender){
  return `${name} / ${gender} / ${age} нас / Тайлан авсан огноо: ${formatMongolianDate()}`;
}

const prompt=(name,age,gender)=>`Чи бол Сара нэртэй алганы хээ шинжээч. Монгол хэлээр дулаан, мэргэжлийн, давтагдалгүй тайлан бич. Зураг дээр харагдахгүй зүйлийг баттай мэт зохиохгүй, "ерөнхий ажиглалтаар" гэж болгоомжтой хэл. Хариултыг зөвхөн JSON хэлбэрээр өг. Нэр: ${name}, Нас: ${age}, Хүйс: ${gender}. JSON бүтэц: {"summary":"ерөнхий 5-7 өгүүлбэр", "lineNotes":{"heart":"зүрхний шугамын 2-3 өгүүлбэр", "head":"толгойн шугамын 2-3 өгүүлбэр", "life":"амьдралын шугамын 2-3 өгүүлбэр", "fate":"хувь заяаны шугамын 2-3 өгүүлбэр", "sun":"нарны шугамын 2-3 өгүүлбэр"}, "scores":{"Хайр дурлал":88,"Санхүү":76,"Карьер":82,"Эрүүл мэнд":79,"Тогтвортой байдал":84}, "timeline":[{"age":"Одоо - ${age} нас","text":"...","advice":"..."},{"age":"${Number(age)+1} - ${Number(age)+2} нас","text":"...","advice":"..."},{"age":"${Number(age)+3} - ${Number(age)+4} нас","text":"...","advice":"..."}], "sections":[{"title":"Ерөнхий дүр зураг","body":"180-250 үг"},{"title":"Зан чанар","body":"160-220 үг"},{"title":"Дотоод хүч ба төвлөрөл","body":"140-200 үг"},{"title":"Хайр дурлал","body":"160-220 үг"},{"title":"Ханийн заяа","body":"140-200 үг"},{"title":"Гэр бүл, харилцаа","body":"140-200 үг"},{"title":"Ажил мэргэжил","body":"160-230 үг"},{"title":"Бизнесийн боломж","body":"140-200 үг"},{"title":"Мөнгө санхүү","body":"160-230 үг"},{"title":"Мөнгө тогтоох хандлага","body":"140-200 үг"},{"title":"Эрүүл мэндийн хандлага","body":"Эмнэлгийн онош биш, уламжлалт тайлалын хүрээнд 130-190 үг"},{"title":"Давуу тал","body":"130-190 үг"},{"title":"Сул тал ба анхаарах зүйл","body":"130-190 үг"},{"title":"Аз хийморийн ерөнхий өнгө","body":"130-190 үг"},{"title":"Амьдралын 3 жилийн төлөв","body":"180-260 үг"},{"title":"2026 оны чиглэл","body":"130-190 үг"},{"title":"2027 оны чиглэл","body":"130-190 үг"},{"title":"2028 оны чиглэл","body":"130-190 үг"},{"title":"Сарагийн хувийн зөвлөгөө","body":"160-230 үг"},{"title":"Эцсийн дүгнэлт","body":"160-230 үг"}], "quote":"богино урамтай ишлэл"}`;

function parseAiReport(txt,name,age,gender){
  txt=(txt||'').replace(/```json|```/g,'').trim();
  try{return JSON.parse(txt)}catch(e){}
  const first=txt.indexOf('{'), last=txt.lastIndexOf('}');
  if(first>=0 && last>first){
    const cut=txt.slice(first,last+1);
    try{return JSON.parse(cut)}catch(e){}
  }
  return fallbackReport(name,age,gender,txt);
}
async function startAnalysis(){hideError();const name=$('name').value.trim(),age=$('age').value,gender=$('gender').value;show('loading');const timer=loadingAnim();try{const res=await fetch(getApiUrl(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt(name,age,gender)},{inline_data:{mime_type:state.leftType,data:state.leftData}},{inline_data:{mime_type:state.rightType,data:state.rightData}}]}],generationConfig:{temperature:.65,maxOutputTokens:8192,response_mime_type:'application/json'}})});const data=await res.json();if(!res.ok){
  const msg=data.error?.message||'AI холболтын алдаа';
  if(msg.toLowerCase().includes('leak') || msg.toLowerCase().includes('api key')){
    localStorage.removeItem('GEMINI_API_KEY');
  }
  throw new Error(msg);
}let txt=data.candidates?.[0]?.content?.parts?.[0]?.text||'';txt=txt.replace(/```json|```/g,'').trim();let report=parseAiReport(txt,name,age,gender);clearInterval(timer);renderReport(report,name,age,gender);show('result');}catch(e){clearInterval(timer);show('start');showError('Алдаа: '+e.message);}}
function fallbackReport(name,age,gender,txt){return{summary:txt||`${name} таны алганы ерөнхий хэлбэрээс тогтвортой, бодитой, мэдрэмжтэй зан төлөв ажиглагдаж байна.`,lineNotes:{heart:'Сэтгэлийн илэрхийлэл тогтуун, харилцаанд үнэнч байдлыг эрхэмлэх хандлагатай.',head:'Бодол санаа практик, шийдвэр гаргахдаа ажиглаж тунгаах тал давамгай.',life:'Амьдралын хэмнэл тогтвортой, хүчээ зөв хуваарилах хэрэгтэй.',fate:'Зорилгоо тодруулбал ажил, санхүүгийн зам илүү цэгцтэй болно.',sun:'Авьяас чадвар аажмаар тодрох шинжтэй.'},scores:{'Хайр дурлал':88,'Санхүү':78,'Карьер':84,'Эрүүл мэнд':76,'Тогтвортой байдал':82},timeline:[{age:`Одоо - ${age} нас`,text:'Одоо байгаа сонголтоо цэгцлэх үе.',advice:'Дотоод хүчээ зөв зүйлд чиглүүл.'},{age:`${+age+1} - ${+age+2} нас`,text:'Ажил, санхүү, харилцаанд шинэ боломж нэмэгдэнэ.',advice:'Шинэ төлөвлөгөөнд зоригтой ор.'},{age:`${+age+3} - ${+age+4} нас`,text:'Өмнөх хөдөлмөрийн үр дүн тогтох үе.',advice:'Тогтвортой систем бүтээ.'}],sections:[{title:'Ерөнхий дүр зураг',body:txt||'Таны хоёр гарын ерөнхий хэлбэр, үндсэн шугамуудын байрлал нь бодитой, мэдрэмжтэй, хариуцлагатай хандлагыг илтгэнэ.'},{title:'Сарагийн хувийн зөвлөгөө',body:'Өөрийн замаа яаралгүй, гэхдээ итгэлтэйгээр бүтээ. Төлөвлөгөө, сахилга бат, харилцааны үнэнч байдал таны гол түлхүүр байна.'}],quote:'Алга тань таны замын газрын зураг юм.'}}
function renderReport(r,name,age,gender){$('meta').textContent=buildMeta(name,age,gender);drawPalm();$('l1').textContent=r.lineNotes?.heart||'';$('l2').textContent=r.lineNotes?.head||'';$('l3').textContent=r.lineNotes?.life||'';$('l4').textContent=r.lineNotes?.fate||'';$('l5').textContent=r.lineNotes?.sun||'';renderScores(r.scores);renderTimeline(r.timeline);renderSections(r.sections,r.summary);$('quote').textContent='“'+(r.quote||'Алганы хээ бол таны амьдралын газрын зураг юм.')+'”';}
function drawPalm(){const canvas=$('palmCanvas'),ctx=canvas.getContext('2d'),img=new Image();img.onload=()=>{const maxW=900;const scale=Math.min(1,maxW/img.width);canvas.width=img.width*scale;canvas.height=img.height*scale;ctx.drawImage(img,0,0,canvas.width,canvas.height);const w=canvas.width,h=canvas.height;ctx.lineWidth=Math.max(4,w*.009);ctx.lineCap='round';function curve(color,pts){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(pts[0][0]*w,pts[0][1]*h);for(let i=1;i<pts.length-1;i++){ctx.quadraticCurveTo(pts[i][0]*w,pts[i][1]*h,pts[i+1][0]*w,pts[i+1][1]*h)}ctx.stroke()}curve('#ef5b5b',[[.24,.47],[.44,.44],[.78,.49]]);curve('#2f8ccf',[[.20,.55],[.43,.52],[.70,.62]]);curve('#2aa66a',[[.30,.62],[.25,.75],[.38,.91]]);curve('#f2a71b',[[.55,.42],[.56,.58],[.56,.82]]);curve('#8b4bd6',[[.61,.55],[.60,.68],[.60,.86]]);[[1,.47,.49,'#ef5b5b'],[2,.22,.56,'#2f8ccf'],[3,.34,.73,'#2aa66a'],[4,.78,.49,'#f2a71b'],[5,.60,.69,'#8b4bd6']].forEach(([n,x,y,c])=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x*w,y*h,Math.max(14,w*.032),0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(16,w*.035)}px Inter`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n,x*w,y*h)});};img.src=state.right||state.left;}
function renderScores(scores={}){const colors=['#ef5b5b','#2aa66a','#2f8ccf','#86c8b0','#f2a71b'];$('scores').innerHTML=Object.entries(scores).slice(0,5).map(([k,v],i)=>`<div class="score"><b>${k}</b><div class="ring" style="--p:${Number(v)||80};--c:${colors[i]}" data-val="${Number(v)||80}"></div><small>${v>=88?'Маш сайн':v>=75?'Сайн':'Анхаарах'}</small></div>`).join('')}
function renderTimeline(arr=[]){$('timeline').innerHTML=arr.slice(0,3).map(t=>`<div class="timebox"><h3>${t.age||''}</h3><p>${t.text||''}</p><small><b>Зөвлөмж</b><br>${t.advice||''}</small></div>`).join('')}
function renderSections(arr=[],summary=''){let html=summary?`<article class="section report-page"><h2>Ерөнхий дүгнэлт</h2><p>${summary}</p></article>`:'';html+=arr.map(s=>`<article class="section report-page"><h2>${s.title}</h2><p>${s.body}</p></article>`).join('');$('sections').innerHTML=html;}
function showError(msg){$('error').style.display='block';$('error').textContent=msg}function hideError(){$('error').style.display='none'}function resetApp(){location.reload()}

async function downloadPDF(){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const pageW = 210, pageH = 297;
  const margin = 16;
  const maxW = pageW - margin * 2;
  let y = margin;
  const name = ($('name')?.value || 'sara').trim() || 'sara';
  const meta = $('meta')?.textContent || '';

  function addFooter(){
    pdf.setFontSize(9);
    pdf.setTextColor(120,130,126);
    pdf.text('Системийн зохиогч: Л.Батцог', margin, pageH - 10);
    pdf.text(String(pdf.getNumberOfPages()), pageW - margin, pageH - 10, {align:'right'});
  }
  function newPage(){
    addFooter();
    pdf.addPage();
    y = margin;
  }
  function safeText(txt){
    return String(txt || '').replace(/\s+\n/g,'\n').trim();
  }
  function title(t){
    if(y > pageH - 45) newPage();
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(17);
    pdf.setTextColor(23,63,58);
    const lines = pdf.splitTextToSize(safeText(t), maxW);
    pdf.text(lines, margin, y);
    y += lines.length * 7 + 4;
  }
  function para(t, size=12){
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(size);
    pdf.setTextColor(45,61,57);
    const lines = pdf.splitTextToSize(safeText(t), maxW);
    for(const line of lines){
      if(y > pageH - 22) newPage();
      pdf.text(line, margin, y);
      y += 6.2;
    }
    y += 3;
  }
  function card(label, text){
    if(y > pageH - 55) newPage();
    pdf.setFillColor(246,250,248);
    pdf.setDrawColor(220,232,227);
    pdf.roundedRect(margin, y-2, maxW, 34, 3, 3, 'FD');
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(12);
    pdf.setTextColor(28,117,104);
    pdf.text(safeText(label), margin+5, y+7);
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(55,75,70);
    const lines=pdf.splitTextToSize(safeText(text), maxW-10).slice(0,3);
    pdf.text(lines, margin+5, y+16);
    y += 39;
  }

  // Cover
  pdf.setFillColor(250,248,244);
  pdf.rect(0,0,pageW,pageH,'F');
  pdf.setTextColor(23,63,58);
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(28);
  pdf.text('Хувь Тавилангийн Хээ', pageW/2, 42, {align:'center'});
  pdf.setFont('helvetica','normal');
  pdf.setFontSize(14);
  pdf.text('Сарагийн алганы хээний дэлгэрэнгүй тайлан', pageW/2, 54, {align:'center'});
  try{
    const sara = document.querySelector('img.sara') || document.querySelector('img[src="sara.jpg"]');
    if(sara) pdf.addImage(sara, 'JPEG', 75, 68, 60, 60, undefined, 'FAST');
  }catch(e){}
  pdf.setFontSize(12);
  pdf.text(meta || buildMeta(name, $('age')?.value || '', $('gender')?.value || ''), pageW/2, 145, {align:'center', maxWidth:160});
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(13);
  pdf.text('Алганы шугам, ерөнхий төлөв, амьдралын үе шат, хайр, ажил, санхүүгийн тайлал', pageW/2, 170, {align:'center', maxWidth:165});
  addFooter();
  pdf.addPage(); y = margin;

  // Palm image page
  title('Алганы шугамын зураглал');
  try{
    const canvas = $('palmCanvas');
    if(canvas && canvas.width){
      const img = canvas.toDataURL('image/jpeg',0.92);
      const imgW = maxW;
      const imgH = Math.min(130, canvas.height * imgW / canvas.width);
      pdf.addImage(img,'JPEG',margin,y,imgW,imgH,undefined,'FAST');
      y += imgH + 8;
    }
  }catch(e){}
  const legends = [
    ['1. Зүрхний шугам', $('l1')?.textContent],
    ['2. Толгойн шугам', $('l2')?.textContent],
    ['3. Амьдралын шугам', $('l3')?.textContent],
    ['4. Хувь заяаны шугам', $('l4')?.textContent],
    ['5. Нарны шугам', $('l5')?.textContent],
  ];
  legends.forEach(([a,b])=>card(a,b));

  // Scores
  newPage();
  title('Ерөнхий төлөвийн оноо');
  document.querySelectorAll('#scores .score').forEach((el)=>{
    const b = el.querySelector('b')?.textContent || '';
    const v = el.querySelector('.ring')?.getAttribute('data-val') || '';
    const sm = el.querySelector('small')?.textContent || '';
    card(b + (v ? ' — '+v+'%' : ''), sm);
  });

  // Timeline
  title('Амьдралын үе шат');
  document.querySelectorAll('#timeline .timebox').forEach(el=>{
    const h = el.querySelector('h3')?.textContent || '';
    const p = el.querySelector('p')?.textContent || '';
    const sm = el.querySelector('small')?.textContent || '';
    card(h, p + '\n' + sm);
  });

  // Sections
  document.querySelectorAll('#sections .section').forEach(sec=>{
    const h = sec.querySelector('h2')?.textContent || '';
    const body = sec.querySelector('p')?.textContent || sec.textContent || '';
    newPage();
    title(h);
    para(body, 12);
  });

  const q = $('quote')?.textContent;
  if(q){ newPage(); title('Сарагийн үг'); para(q, 14); }
  addFooter();
  const filename=(name+'-palm-report.pdf').replace(/[\/:*?"<>|]/g,'');
  pdf.save(filename);
}

if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}
