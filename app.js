const header = document.querySelector('#header');
const mobile = document.querySelector('#mobile');
const main = document.querySelector('#content');
const modal = document.querySelector('#dialog');
const toast = document.querySelector('#toast');

const CATEGORIES = ['Warehouse','Manufacturing','Security','Retail','Delivery','Hospitality'];
const SHIFTS = ['Day','Evening','Night'];
const MARKS = {Warehouse:'WH',Manufacturing:'MF',Security:'SC',Retail:'RT',Delivery:'DL',Hospitality:'HT'};
const PREF_SKILLS = ['Barcode scanning','Order picking','Packing','Quality checks','Team handoff','Visitor check-in',
  'Record keeping','Stock checks','Customer service','Route planning','Parcel checks','Guest service'];
const LESSONS = [
  {title:'Picking and packing',label:'Warehouse',duration:'4 min',job:1,steps:[
    'Check in, find your station and open the assigned order.',
    'Read the item code and quantity before picking. Compare the full code on the label.',
    'Flag any mismatch for your lead. Label and hand off the completed order for a final check.'
  ]},
  {title:'Read a job offer',label:'Work ready',duration:'3 min',steps:[
    'Check who is hiring and whether they represent the worksite or a staffing agency.',
    'Read the pay period, shift hours, breaks and worksite. Ask for any missing terms in writing.',
    'Review the documents it asks you to bring and confirm when you are expected.'
  ]},
  {title:'Workplace phrases',label:'Communication',duration:'3 min',steps:[
    '“Where should I check in?” Ask the shift lead when you arrive.',
    '“Could you show me the first step?” Ask for a quick demonstration.',
    '“This item does not match the order.” Point out the difference before handing it over.'
  ]},
  {title:'Prepare for an in-person trial',label:'First shift',duration:'3 min',steps:[
    'Check the mode, date, time and full location before you confirm.',
    'Check what to bring and how to get there.',
    'Tell the recruiter early if you need to decline or ask for another time.'
  ]},
  {title:'Report a quality issue',label:'Manufacturing',duration:'4 min',job:5,steps:[
    'Check the item against the posted sample or work instructions.',
    'Move items that need a second check to the area designated by the supervisor.',
    'Record what you found so the next person can check it.'
  ]},
  {title:'Share a job with a friend',label:'Digital basics',duration:'2 min',steps:[
    'Open the exact listing and copy its link.',
    'Share the link along with the location and shift. Let your friend decide whether it works for them.',
    'Use the official listing for any updated date or job terms.'
  ]}
];
const NON_WAREHOUSE = {
  Manufacturing:['A sample does not meet the checklist. What do you do?','Mark for recheck','Mix it with cleared items'],
  Security:['A visitor is expected. What should you check?','Check the visitor record','Skip the record'],
  Retail:['Two items look alike. What helps you identify the correct one?','Check the shelf label','Choose by colour alone'],
  Delivery:['Before handoff, what should you match to the order?','Confirm the parcel label','Guess from package size'],
  Hospitality:['How do you verify the workstation is ready?','Read the checklist','Assume it was completed']
};
const WALKTHROUGHS = {
'pack-size': {
    title:'Pick the right pack size', poster:'lessons/pack-size.jpg',
    en:['Read the order. Pick two packs of oats, five hundred grams each.','One one-kilogram pack weighs the same, but the order asks for two packs.','Pick two separate five hundred gram packs.'],
    hi:['ऑर्डर पढ़ें। पाँच सौ ग्राम वाले ओट्स के दो पैकेट चाहिए।','एक किलो के एक पैकेट का कुल वजन उतना ही है, लेकिन ऑर्डर में दो पैकेट चाहिए।','पाँच सौ ग्राम के दो अलग पैकेट चुनें।'],
    kn:['ಆರ್ಡರ್ ಓದಿ. ತಲಾ ಐನೂರು ಗ್ರಾಂ ತೂಕದ ಎರಡು ಓಟ್ಸ್ ಪ್ಯಾಕ್‌ಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ.','ಒಂದು ಕಿಲೋ ಪ್ಯಾಕ್‌ನ ಒಟ್ಟು ತೂಕ ಒಂದೇ. ಆದರೆ ಆರ್ಡರ್‌ಗೆ ಎರಡು ಪ್ಯಾಕ್‌ಗಳು ಬೇಕು.','ಐನೂರು ಗ್ರಾಂನ ಎರಡು ಪ್ರತ್ಯೇಕ ಪ್ಯಾಕ್‌ಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ.']
  },
  'product-label': {
    title:'Match the product name', poster:'lessons/product-label.jpg',
    en:['Read the product name on the order. This order asks for toor dal.','Look for toor dal on the pack. Leave the chana dal on the shelf.','Then check the pack size and quantity.'],
    hi:['ऑर्डर में लिखा सामान का नाम पढ़ें। इस ऑर्डर में अरहर दाल चाहिए।','पैकेट पर अरहर दाल का नाम देखें। चना दाल का पैकेट वहीं छोड़ दें।','फिर पैकेट का वजन और संख्या जाँचें।'],
    kn:['ಆರ್ಡರ್‌ನಲ್ಲಿರುವ ಪದಾರ್ಥದ ಹೆಸರನ್ನು ಓದಿ. ಈ ಆರ್ಡರ್‌ಗೆ ತೊಗರಿ ಬೇಳೆ ಬೇಕು.','ಪ್ಯಾಕ್ ಮೇಲೆ ತೊಗರಿ ಬೇಳೆ ಎಂದು ಬರೆದಿದೆಯೇ ನೋಡಿ. ಕಡಲೆ ಬೇಳೆಯ ಪ್ಯಾಕ್ ಅನ್ನು ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ.','ನಂತರ ಪ್ಯಾಕ್‌ನ ತೂಕ ಮತ್ತು ಎಣಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.']
  },
  garment: {
    title:'Garment quality check', poster:'garment-walkthrough.jpg',
    en:['Read the checklist and look at the approved sample.','Check the seams, size and label against the checklist.','Set aside garments that need a second check.','Record the count and hand off the batch.'],
    hi:['जाँच सूची पढ़ें और स्वीकृत नमूना देखें।','सिलाई, नाप और लेबल को सूची से मिलाएँ।','जिन कपड़ों की दोबारा जाँच चाहिए, उन्हें अलग रखें।','गिनती दर्ज करें और बैच सौंप दें।'],
    kn:['ಪರಿಶೀಲನಾ ಪಟ್ಟಿಯನ್ನು ಓದಿ ಮತ್ತು ಅನುಮೋದಿತ ಮಾದರಿಯನ್ನು ನೋಡಿ.','ಹೊಲಿಗೆ, ಗಾತ್ರ ಮತ್ತು ಲೇಬಲ್ ಅನ್ನು ಪಟ್ಟಿಯೊಂದಿಗೆ ಹೋಲಿಸಿ.','ಮತ್ತೆ ಪರಿಶೀಲಿಸಬೇಕಾದ ಉಡುಪುಗಳನ್ನು ಬೇರೆ ಇಡಿ.','ಎಣಿಕೆಯನ್ನು ದಾಖಲಿಸಿ ಮತ್ತು ಬ್ಯಾಚ್ ಅನ್ನು ಒಪ್ಪಿಸಿ.']
  }
};
const state = {user:null,demo:false,jobs:[], saved:new Set(), applications:[], employer:null, filters:{q:'',where:'',shift:'',category:''},
  savedOnly:false,job:null,practice:{variant:0,message:'',passed:false}, profile:null, scan:null, selectedScan:new Set(),
  pending:null, loadError:'', view:'jobs'};
let timeout;
let renderTicket=0;

const e = value => String(value ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const rupees = amount => '₹'+Number(amount).toLocaleString('en-IN');
const pay = j => rupees(j.low)+'–'+rupees(j.high)+' / month';
const id = value => Number(value);
const selected = (a,b) => a===b?' selected':'';
const opt = (label,value,active)=>'<option value="'+e(value)+'"'+selected(active,value)+'>'+e(label)+'</option>';
const options = (names,active)=>names.map(x=>opt(x,x,active)).join('');
const btn = (label,action,style='',args='')=>'<button type="button" class="btn '+style+'" data-action="'+action+'" '+args+'>'+e(label)+'</button>';
const link = (label,href,style='')=>'<a class="linkbtn '+style+'" href="'+href+'">'+e(label)+'</a>';
const badge = (s,cls='')=>'<span class="badge '+cls+'">'+e(s)+'</span>';
const tags = list=>'<div class="tags">'+list.map(s=>'<span class="tag">'+e(s)+'</span>').join('')+'</div>';
const empty = (title,copy,actions='')=>'<section class="panel empty"><h3>'+e(title)+'</h3><p class="muted">'+e(copy)+'</p>'+(actions?'<div class="actions">'+actions+'</div>':'')+'</section>';
function date(value) {
  if(!value) return '';
  const date = new Date(value+'T00:00:00+05:30');
  return Number.isNaN(+date)?value:new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(date);
}
function isoToday() {
  return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Kolkata'}).format(new Date());
}
function notify(message) {
  toast.textContent=message;
  clearTimeout(timeout);
  timeout=setTimeout(()=>{toast.textContent='';},4100);
}
async function api(path,body,method=body===undefined?'GET':'POST') {
  const response=await fetch('/api'+path,{method,headers:body===undefined?{}:{'Content-Type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body),credentials:'same-origin'});
  let data;
  try {data=await response.json();}catch {throw new Error('The Rozgaar server is unavailable.');}
  if(!response.ok) throw new Error(data.error||'Request failed.');
  return data;
}
const route = ()=>location.hash.replace(/^#\/?/,'')||'jobs';
function go(target) {
  if(route()===target) refresh();
  else location.hash=target;
}
function nav(nodes,current,mobileView=false) {
  return nodes.map(([path,label,mark])=>'<a href="#'+path+'"'+(path===current?' aria-current="page"':'')+'>'+
    (mobileView?'<i aria-hidden="true">'+mark+'</i>':'')+label+'</a>').join('');
}
function renderHeader(current) {
  const employer=state.user?.role==='employer';
  const items=employer?[['jobs','Jobs','⌂'],['employer','Employers','▤'],['learn','Learn','▷']]:
    [['jobs','Jobs','⌂'],['learn','Learn','▷'],['applications','Applications','▤'],['profile','Profile','◎']];
  const account=state.user?'<span class="avatar" aria-hidden="true">'+e(state.user.name.slice(0,1).toUpperCase())+'</span><span class="name">'+e(state.user.name)+'</span>'+
    btn('Sign out','logout','compact') : btn('Employer','employer-signin','compact quiet')+btn('Sign in','signin','primary compact');
  header.innerHTML='<div class="top-inner"><a class="brand" href="#jobs"><img alt="" src="/assets/logo.webp">Rozgaar</a>'+
    '<nav class="top-nav" aria-label="Main navigation">'+nav(items,current)+'</nav><div class="account">'+account+'</div></div>';
  mobile.innerHTML=nav(items,current,true);
}
function status(s) {
  return badge(s,['Confirmed','Attended','Open'].includes(s)?'green':s==='Invited'?'orange':s==='Closed'||s==='Declined'?'gray':'');
}
function reasons(job) {
  const p=state.user?.profile||{};
  return [
    p.roles?.includes(job.category)?job.category+' interest':null,
    p.locality&&job.location.toLowerCase().includes(p.locality.toLowerCase())?'Near '+job.location:null,
    p.shifts?.includes(job.shift)?job.shift+' shift preference':null
  ].filter(Boolean);
}
function savedButton(j) {
  const saved=state.saved.has(j.id);
  return '<button type="button" class="iconbtn" aria-label="'+(saved?'Unsave job':'Save job')+'" aria-pressed="'+saved+'" data-action="save" data-id="'+j.id+'">'+(saved?'★':'☆')+'</button>';
}
function jobCard(j) {
  return '<article class="job-card"><div class="row"><div class="job-name"><span class="role-mark" data-group="'+e(j.category)+'">'+e(MARKS[j.category])+
    '</span><div><h3><a href="#job/'+j.id+'">'+e(j.name)+'</a></h3><p class="muted small">'+e(j.company)+' · '+e(j.location)+'</p></div></div>'+
    savedButton(j)+'</div>'+tags([j.shift+' shift',j.openings+' openings',...(j.sample?['Sample']:[])])+
    '<div class="job-bottom"><span class="pay">'+pay(j)+'</span><a class="linkbtn" href="#job/'+j.id+'">View shift</a></div></article>';
}
function jobsView() {
  const f=state.filters;
  const queries=f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const sorted=state.jobs.filter(j=> (!state.savedOnly||state.saved.has(j.id)) &&
    (!f.category||j.category===f.category)&&(!f.shift||j.shift===f.shift)&&(!f.where||j.location===f.where)&&
    queries.every(q=>[j.name,j.company,j.location,j.category,...j.skills].join(' ').toLowerCase().includes(q)))
    .sort((a,b)=>reasons(b).length-reasons(a).length);
  const featured=state.jobs.find(j=>j.id===1 && j.category==='Warehouse');
  const suggested=sorted.find(j=>reasons(j).length);
  const locations=[...new Set(state.jobs.map(j=>j.location))].sort();
  const counts=CATEGORIES.map(v=>[v,state.jobs.filter(j=>j.category===v).length]);
  return '<section class="hero"><div><h1>See the shift before you travel.</h1><p>Check the worksite, pay and hours. Practice one task and apply when the shift works for you.</p><div class="actions">'+
    '<a class="linkbtn" href="#job-list" data-action="scroll-jobs">Browse shifts</a>'+link('Explore lessons','#learn')+'</div></div>'+
    (featured?'<figure><a class="visual" href="#job/'+featured.id+'"><img src="/assets/warehouse-poster.webp" alt="Illustrated warehouse shift preview"><span class="play" aria-hidden="true">▶</span></a><figcaption>Warehouse picker · Simulated role preview</figcaption></figure>':'')+'</section>'+
    '<form id="filters" class="searchbar"><label><span class="filter-label">Search jobs</span><input type="search" name="q" placeholder="Role, employer or skill" value="'+e(f.q)+'"></label>'+
    '<label><span class="filter-label">Locality</span><select name="where">'+opt('All localities','',f.where)+options(locations,f.where)+'</select></label>'+
    '<label><span class="filter-label">Shift</span><select name="shift">'+opt('Any shift','',f.shift)+options(SHIFTS,f.shift)+'</select></label><button class="btn primary" type="submit">Search jobs</button></form>'+
    '<div class="chips" aria-label="Filter by role category">'+[['All',state.jobs.length],...counts].map(([name,count])=>
      '<button type="button" class="chip" data-action="category" data-value="'+e(name==='All'?'':name)+'" aria-pressed="'+(f.category===(name==='All'?'':name))+'">'+e(name)+' <span>'+count+'</span></button>').join('')+'</div>'+
    '<div class="section-title" id="job-list"><div><h2>'+(state.savedOnly?'Saved jobs':'Open shifts')+'</h2><p class="muted small">'+sorted.length+' '+(sorted.length===1?'listing':'listings')+(state.demo?' · Preview data available':'')+'</p></div>'+
      btn(state.savedOnly?'Show all':'Saved jobs','saved-filter','compact')+'</div>'+
    '<div class="feed"><section class="cards" aria-label="Job listings">'+(sorted.length?sorted.map(jobCard).join(''):
      empty('No matching shifts','Try another role, shift or locality.',btn('Clear filters','clear-filters')) )+'</section><aside class="aside">'+
    (suggested?'<section class="panel panel-accent"><p class="kicker">Suggested for you</p><h3>'+e(suggested.name)+'</h3><p class="muted small">'+e(reasons(suggested).join(' · '))+'</p><div class="actions">'+link('View suggested shift','#job/'+suggested.id)+'</div></section>':'')+
    '<section class="panel"><h3>Before you apply</h3><ol class="steps small"><li>Confirm the pay, shift and worksite.</li><li>Preview the work or read the steps.</li><li>Check the trial details before you travel.</li></ol></section>'+
    '<section class="panel"><h3>'+(state.user?'Your next step':'Try a worker account')+'</h3><p class="muted small">'+(state.user?'Check applications and answer trial invitations.':'Save shifts, scan a résumé and follow a trial invitation with a sample profile.')+'</p><div class="actions">'+
      (state.user?link('View applications','#applications'):state.demo?btn('Enter worker demo','demo','primary','data-role="worker"'):btn('Create an account','register','primary'))+'</div></section></aside></div>';
}
function fact(label,value) {return '<div class="fact"><span>'+e(label)+'</span><strong>'+e(value)+'</strong></div>';}
const walkthroughLanguages={en:'English',hi:'हिन्दी (Hindi)',kn:'ಕನ್ನಡ (Kannada)'};
const clipUrl=(key,lang)=>'/assets/lessons/'+key+'-'+lang+'.mp4';
const transcript=(clip,lang)=>clip[lang].map(line=>'<li>'+e(line)+'</li>').join('');
const preferredLanguage=()=> {
  const value=localStorage.getItem('rozgaar-lesson-language');
  return Object.hasOwn(walkthroughLanguages,value)?value:'en';
};
let lessonSizes;
function walkthroughView(key) {
  const clip=WALKTHROUGHS[key], lang=preferredLanguage(), url=clipUrl(key,lang);
  return '<div class="walkthrough" data-clip="'+key+'">'+
    '<div class="walkthrough-meta"><h3>'+e(clip.title)+'</h3><label>Audio language <select data-voice aria-label="Audio language">'+
    Object.entries(walkthroughLanguages).map(([code,label])=>opt(label,code,lang)).join('')+'</select></label></div>'+
    '<video class="walkthrough-video" aria-label="'+e(clip.title)+'" src="'+url+'" '+
    'poster="/assets/'+clip.poster+'" playsinline controls preload="none">'+
    (key==='garment'?'<track kind="captions" srclang="en" label="English" src="/assets/garment-walkthrough.vtt">':'')+'</video>'+
    '<div class="walkthrough-meta lesson-download"><a class="linkbtn compact" download href="'+url+'">Download MP4</a>'+
    '<span class="muted small">Narration by <a href="https://elevenlabs.io/">ElevenLabs</a></span></div>'+
    '<details><summary>Read transcript</summary><ol class="steps" data-transcript>'+transcript(clip,lang)+'</ol></details></div>';
}
function connectWalkthrough() {
  const players=main.querySelectorAll('.walkthrough');
  if(!players.length) return;
  lessonSizes ??= fetch('/assets/lessons/sizes.json').then(response=>response.ok?response.json():{}).catch(()=>({}));
  for(const container of players) {
    const key=container.dataset.clip, clip=WALKTHROUGHS[key];
    const video=container.querySelector('video'), select=container.querySelector('[data-voice]');
    const download=container.querySelector('[download]');
    const updateSize=async()=>{
      const bytes=(await lessonSizes)[key]?.[select.value];
      download.textContent=bytes?'Download MP4 · '+Math.ceil(bytes/1000)+' kB':'Download MP4';
    };
    updateSize();
    video.addEventListener('play',()=>{
      for(const other of players) if(other!==container) other.querySelector('video').pause();
    });
    select.addEventListener('change',()=>{
      const lang=select.value, url=clipUrl(key,lang);
      video.pause();
      video.src=url;
      download.href=url;
      container.querySelector('[data-transcript]').innerHTML=transcript(clip,lang);
      localStorage.setItem('rozgaar-lesson-language',lang);
      updateSize();
    });
  }
}
function jobView() {
  const j=state.job;
  if(!j) return empty('Shift unavailable',state.loadError||'This listing may have been removed.',link('Browse shifts','#jobs'));
  const p=state.practice, existing=state.applications.find(a=>a.job===j.id);
  const clip=j.name==='Garment quality checker'?'garment':
    j.name==='Warehouse picker'?'product-label':j.name==='Packing associate'?'pack-size':null;
  let [question,right,wrong]=NON_WAREHOUSE[j.category]||['Pick the item with code '+(p.variant?'B24':'B17')+'.',p.variant?'B24':'B17',p.variant?'B42':'B71'];
  if(j.category!=='Warehouse'&&p.variant) question='A similar situation occurs on your next shift. '+question;
  const answers=p.variant?[right,wrong]:[wrong,right];
  return '<div class="page-head detail"><a href="#jobs">← Back to jobs</a><p class="kicker" style="margin-top:10px">'+e(j.category)+' · '+e(j.location)+', Bengaluru</p>'+
    '<h1>'+e(j.name)+'</h1><p class="muted">'+e(j.company)+(j.sample?' · Sample listing':'')+'</p><div class="actions">'+status(j.status)+savedButton(j)+'</div></div>'+
    '<div class="page-grid"><div class="details"><section class="panel"><h2>Worksite and pay</h2><p>'+e(j.summary)+'</p><div class="facts" style="margin-top:12px">'+
      fact('Pay',pay(j))+fact('Shift',j.shift+' · '+j.hours)+fact('Location',j.location+', Bengaluru')+fact('Openings',j.openings)+
      fact('Apply by',date(j.deadline))+fact('What to bring',j.bring||'Ask the recruiter when invited')+'</div><div class="tags">'+j.skills.map(x=>'<span class="tag">'+e(x)+'</span>').join('')+'</div></section>'+
    '<section class="panel" id="role-preview"><h2>See how the work goes</h2>'+
      (j.site_steps?'<p class="muted small">Steps provided by the employer for this worksite.</p>':'')+
      (clip?walkthroughView(clip):j.site_steps?'':'<p class="muted small">Example tasks for this role.</p>')+
      '<ol class="steps">'+j.tasks.map(t=>'<li>'+e(t)+'</li>').join('')+'</ol></section>'+
    '<section class="panel" id="practice"><p class="kicker">Optional practice</p><h2>Try one task</h2><p>'+e(question)+'</p><div class="actions">'+answers.map((x,i)=>btn(x,'answer',i===0?'':'','data-text="'+e(x)+'"')).join('')+
      '</div><p role="status" class="'+(p.passed?'muted':'error')+'">'+e(p.message)+'</p></section></div>'+
    '<aside class="aside"><section class="panel panel-accent"><h2>Ready to apply?</h2><p class="muted">'+e(j.location+' · '+j.shift+' shift')+'</p><p class="pay">'+pay(j)+'</p><div class="actions">'+
      (existing?link('Track application','#applications','primary'):j.status==='Open'?btn('Apply for this shift','apply','primary'):badge('Drive closed','gray'))+
      btn('Share shift','share','compact')+'</div></section>'+
    '<section class="panel"><h3>Next steps</h3><ol class="steps small"><li>Send your availability.</li><li>Look for the employer’s invite in Applications.</li><li>Confirm the time and place if it works.</li></ol></section></aside></div>';
}
function inviteInfo(a) {
  const i=a.invite||{};
  if(!i.mode) return '';
  return '<p class="muted small">'+e(i.mode+' · '+date(i.date)+' at '+i.time+' IST · '+i.duration+' min')+'</p><p>'+e(i.place)+'</p>';
}
function applicationView() {
  return '<div class="page-head"><h1>My applications</h1><p class="muted">Review trial invitations and confirm when you can attend.</p></div>'+
    (!state.user||state.user.role!=='worker'?empty('Your applications belong here','Sign in as a worker to see application status and invitations.',
        btn('Sign in','signin','primary')+(state.demo?btn('Try worker demo','demo','','data-role="worker"'):'')):
      state.applications.length?'<div class="stack">'+state.applications.map(a=>'<article class="list-card"><div class="row"><h3>'+
       '<a href="#job/'+a.job+'">'+e(a.name)+'</a></h3>'+status(a.status)+'</div><p class="muted">'+e(a.company)+' · '+e(a.location)+'</p>'+inviteInfo(a)+
       (a.status==='Invited'?'<div class="actions">'+btn('Confirm attendance','respond','primary','data-id="'+a.id+'" data-value="Confirmed"')+
         btn('Decline','respond','','data-id="'+a.id+'" data-value="Declined"')+'</div>':'')+'</article>').join('')+'</div>':
      empty('No applications yet','Apply for a shift and it will appear here.',link('Find a shift','#jobs','primary')));
}
function profileChips(items,selected,key) {
  return '<div class="chips">'+items.map(value=>'<button type="button" class="chip" data-action="profile-chip" data-key="'+key+'" data-value="'+e(value)+'" aria-pressed="'+selected.includes(value)+'">'+e(value)+'</button>').join('')+'</div>';
}
function profileView() {
  if(!state.user||state.user.role!=='worker') return '<div class="page-head"><h1>Work profile</h1></div>'+
    empty('Build your work profile','Set preferences, scan a document and choose the skills you want to share.',btn('Sign in','signin','primary')+
    (state.demo?btn('Try worker demo','demo','','data-role="worker"'):''));
  const p=state.profile;
  const scan=state.scan;
  return '<div class="page-head"><h1>Work profile</h1><p class="muted">Choose the work and shifts that fit you. Update your skills any time.</p></div>'+
    '<div class="page-grid"><section class="panel"><h2>Preferences and skills</h2><form class="form" id="profile-form">'+
    '<div class="grid2"><label>Full name<input name="name" maxlength="70" required value="'+e(p.name)+'"></label><label>Preferred locality<input name="locality" maxlength="70" placeholder="e.g. Peenya" value="'+e(p.locality)+'"></label></div>'+
    '<div class="grid2"><label>Preferred language<select name="language">'+opt('Choose language','',p.language)+options(['English','Hindi','Kannada','Tamil','Telugu'],p.language)+'</select></label>'+
    '<label>Experience<select name="experience">'+opt('Prefer to skip','',p.experience)+options(['New to this work','Under a year','1–3 years','More than 3 years'],p.experience)+'</select></label></div>'+
    '<label>Education (optional)<input name="education" maxlength="70" value="'+e(p.education)+'"></label>'+
    '<fieldset class="fieldgroup"><legend>Roles</legend>'+profileChips(CATEGORIES,p.roles,'roles')+'</fieldset><fieldset class="fieldgroup"><legend>Available shifts</legend>'+profileChips(SHIFTS,p.shifts,'shifts')+'</fieldset>'+
    '<fieldset class="fieldgroup"><legend>Skills you want to share</legend>'+profileChips([...new Set([...PREF_SKILLS,...p.skills])],p.skills,'skills')+'</fieldset>'+
    '<div class="actions"><button type="submit" class="btn primary">Save profile</button>'+link('Browse shifts','#jobs')+'</div><p class="error" data-form-error role="status"></p></form></section>'+
    '<aside class="panel"><h2>Scan a résumé</h2><p class="muted small">Upload a PDF, PNG or JPEG up to 6 MB. Review the extracted text and choose which skills to add.</p>'+
    '<form class="form" id="scan-form" style="margin-top:12px"><label class="file">Choose PDF or image<input name="document" type="file" accept="application/pdf,image/png,image/jpeg" required></label>'+
    '<div class="actions"><button type="submit" class="btn primary">Extract text</button>'+(state.demo?btn('Scan sample','sample-ocr','compact'):'')+'</div><p class="error" data-form-error role="status"></p></form>'+
    (scan?'<div><h3>Extracted text</h3><pre class="console">'+e(scan.text)+'</pre><h3>Suggestions</h3>'+
    (scan.skills.length?'<div class="chips">'+scan.skills.map(x=>'<button type="button" class="chip" data-action="scan-chip" data-value="'+e(x)+'" aria-pressed="'+state.selectedScan.has(x)+'">'+e(x)+'</button>').join('')+
      '</div><div class="actions">'+btn('Add selected to profile','adopt-scan','primary')+'</div>':'<p class="muted small">No matching skills were found. You can add skills manually.</p>')+'</div>':'')+
    '</aside></div>';
}
function learnView() {
  return '<div class="page-head"><h1>Learn a task</h1><p class="muted">Free, short lessons for the work you’re considering.</p></div><div class="lesson-grid lesson-videos">'+Object.keys(WALKTHROUGHS).map(key=>'<section class="panel">'+walkthroughView(key)+'</section>').join('')+'</div><div class="lesson-grid">'+LESSONS.map((l,i)=>
    '<article class="panel"><div class="row"><p class="kicker">'+e(l.label)+'</p>'+badge(l.duration,'gray')+'</div><h3>'+e(l.title)+'</h3><p class="muted small">'+e(l.steps[0])+'</p><div class="actions">'+btn('Open lesson','lesson','primary','data-id="'+i+'"')+'</div></article>').join('')+'</div>';
}
function employerView() {
  if(state.user?.role!=='employer') return '<div class="page-head"><h1>Employer workspace</h1></div>'+
    empty('Manage your hiring drives','Post shifts, review applications and send trial invitations.',btn('Employer sign in','employer-signin','primary')+
     (state.demo?btn('Try employer demo','demo','','data-role="employer"'):''));
  const info=state.employer||{jobs:[],candidates:[]};
  const metrics=[['Open drives',info.jobs.filter(j=>j.status==='Open').length],['Applications',info.candidates.length],
    ['Awaiting response',info.candidates.filter(a=>a.status==='Invited').length],['Confirmed or attended',info.candidates.filter(a=>['Confirmed','Attended'].includes(a.status)).length]];
  return '<div class="row page-head"><div><h1>Hiring workspace</h1><p class="muted">Manage shifts and follow each applicant to their trial.</p></div>'+
    btn('Post a shift','new-job','primary')+'</div><div class="stats">'+metrics.map(([s,n])=>'<section class="panel stat"><strong>'+n+'</strong><p>'+s+'</p></section>').join('')+'</div>'+
    '<div class="page-grid"><section class="stack"><h2>Candidate queue</h2>'+
    (info.candidates.length?info.candidates.map(a=>'<article class="list-card"><div class="row"><h3>'+e(a.worker_name)+'</h3>'+status(a.status)+'</div><p>'+e(a.name)+' · '+e(a.company)+'</p>'+
      tags([...a.profile?.skills||[],...(a.practiced?['Practice completed']:[])])+inviteInfo(a)+'<div class="actions">'+
      (a.status==='Applied'?btn('Invite to trial','invite','primary','data-id="'+a.id+'"'):a.status==='Confirmed'?btn('Mark attended','attend','primary','data-id="'+a.id+'"'):'')+
      '</div></article>').join(''):empty('No applicants yet','New applications will appear here.'))+'</section>'+
    '<section class="stack"><h2>Your shifts</h2>'+(info.jobs.length?info.jobs.map(j=>'<article class="list-card"><div class="row"><h3>'+e(j.name)+'</h3>'+status(j.status)+'</div>'+
      '<p class="muted small">'+e(j.location)+' · '+j.openings+' openings</p><div class="actions">'+link('View shift','#job/'+j.id)+
      (j.status==='Open'?btn('Close shift','close-job','compact danger','data-id="'+j.id+'"'):'')+'</div></article>').join(''):
        empty('No hiring drives yet','Post the first shift.',btn('Post a shift','new-job','primary')))+'</section></div>';
}
function render() {
  const page=state.view;
  renderHeader(page.startsWith('job/')?'jobs':page);
  if(state.loadError&&!page.startsWith('job/')) {
    main.innerHTML=empty('Could not load Rozgaar',state.loadError,btn('Try again','refresh','primary'));
    return;
  }
  const views={jobs:jobsView,applications:applicationView,profile:profileView,learn:learnView,employer:employerView};
  main.innerHTML=page.startsWith('job/')?jobView():(views[page]||jobsView)();
  connectWalkthrough();
}
function resetProfile() {
  state.profile = {name:state.user?.name||'',locality:'',language:'',education:'',experience:'',roles:[],skills:[],shifts:[],
    ...(state.user?.profile||{})};
}
async function refresh() {
  const current=route();
  if(current==='job-list') return;
  const ticket=++renderTicket;
  state.view=current;state.loadError='';
  try {
    if(current.startsWith('job/')) {
      const jid=id(current.split('/')[1]);
      if(!Number.isInteger(jid)||jid<1) throw new Error('Job not found.');
      if(state.job?.id!==jid) state.practice={variant:0,message:'',passed:false};
      state.job=null;
      const next=await api('/jobs/'+jid);
      if(ticket!==renderTicket) return;
      state.job=next;
    }
    if(current==='jobs') {
      const jobs=await api('/jobs');
      if(ticket!==renderTicket) return;
      state.jobs=jobs;
    }
    if(state.user?.role==='worker'&&(current==='jobs'||current.startsWith('job/')||current==='applications')) {
      const [saved,applications]=await Promise.all([api('/saved'),api('/applications')]);
      if(ticket!==renderTicket) return;
      state.saved=new Set(saved);state.applications=applications;
    }
    if(current==='employer'&&state.user?.role==='employer') {
      const result=await api('/employer');
      if(ticket!==renderTicket) return;
      state.employer=result;
    }
  } catch(error) {
    if(ticket!==renderTicket) return;
    state.loadError=error.message;
  }
  render();
}
function showModal(title,body,description='') {
  modal.innerHTML='<div class="dialog-head"><div><h2 id="dialog-title">'+e(title)+'</h2>'+
    (description?'<p class="muted">'+e(description)+'</p>':'')+'</div><button type="button" class="iconbtn" aria-label="Close dialog" data-action="close-dialog">×</button></div>'+body;
  if(!modal.open) modal.showModal();
}
function auth(reg=false,wanted='worker') {
  const switcher='<div class="tabs">'+btn('Sign in','signin','compact','aria-pressed="'+!reg+'"')+btn('Create worker account','register','compact','aria-pressed="'+reg+'"')+'</div>';
  showModal(reg?'Create your Rozgaar account':wanted==='employer'?'Employer sign in':'Welcome back',
    switcher+'<form id="'+(reg?'register':'login')+'" class="form">'+(reg?'<label>Full name<input name="name" autocomplete="name" maxlength="70" required></label>':'')+
    '<label>Indian mobile number<input name="phone" inputmode="tel" placeholder="+91" autocomplete="tel" required></label>'+
    '<label>Password<input name="password" type="password" minlength="8" maxlength="100" autocomplete="'+(reg?'new-password':'current-password')+'" required></label>'+
    '<button class="btn primary" type="submit">'+(reg?'Create account':'Sign in')+'</button><p data-form-error class="error" role="status"></p></form>'+
    (state.demo?'<div class="actions">'+btn('Try worker demo','demo','compact','data-role="worker"')+btn('Try employer demo','demo','compact','data-role="employer"')+'</div>':''));
}
async function sessionChanged(result) {
  state.user=result.user;state.applications=[];state.saved=new Set();state.employer=null;state.scan=null;state.selectedScan.clear();state.savedOnly=false;
  resetProfile();
  modal.close();
  const pending=state.pending;
  state.pending=null;
  if(state.user.role==='employer') go('employer');
  else if(pending&&route().startsWith('job/')) {
    await refresh();
    if(pending==='apply'&&state.job) openApply();
    if(pending==='save'&&state.job) await toggleSave(state.job.id);
  } else go(route().startsWith('job/')?route():'jobs');
}
function openApply() {
  if(!state.user) {state.pending='apply';auth();return;}
  if(state.user.role!=='worker') throw new Error('Use a worker account to apply.');
  showModal('Confirm your availability','<form class="form" id="apply-form"><label class="check"><input type="checkbox" name="age" required> I am 18 or older</label>'+
    '<label class="check"><input type="checkbox" name="availability" required> I can work the listed shift</label>'+
    '<button class="btn primary" type="submit">Submit application</button><p data-form-error class="error" role="status"></p></form>',
    state.job.name+' · '+state.job.hours+' · '+state.job.location);
}
async function toggleSave(jid) {
  if(!state.user) {if(state.job?.id===jid&&route().startsWith('job/'))state.pending='save';auth();return;}
  if(state.user.role!=='worker') throw new Error('Switch to a worker account to save shifts.');
  const saved=!state.saved.has(jid);
  await api('/jobs/'+jid+'/save',{saved});
  if(saved) state.saved.add(jid);else state.saved.delete(jid);
  render();notify(saved?'Job saved.':'Job removed from Saved.');
}
function readProfile(form=document.querySelector('#profile-form')) {
  if(!form) return;
  for(const [key,value] of new FormData(form)) state.profile[key]=String(value);
}
function fileData(file) {
  if(!file?.size || file.size>6_000_000) return Promise.reject(new Error('Choose a PDF or image under 6 MB.'));
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('The file could not be read.'));
    reader.onload=()=>resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
}
let browserOcr;
function getBrowserOcr() {
  if (globalThis.Tesseract) return Promise.resolve(globalThis.Tesseract);
  if (browserOcr) return browserOcr;
  browserOcr=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
    script.onload=()=>globalThis.Tesseract?resolve(globalThis.Tesseract):reject(new Error('OCR did not load.'));
    script.onerror=()=>{script.remove();reject(new Error('Could not load browser OCR. Check the connection or enable server OCR.'));};
    document.head.append(script);
  }).catch(error=>{browserOcr=null;throw error;});
  return browserOcr;
}
async function scanFile(file) {
  readProfile();
  const data=await fileData(file);
  let result;
  try {result=await api('/ocr',{data});}
  catch(error) {
    if(!/^image\/(png|jpeg)$/.test(file.type) || !/could not be read|unavailable/i.test(error.message)) throw error;
    notify('Trying OCR in your browser…');
    const engine=await getBrowserOcr();
    const worker=await engine.createWorker('eng');
    try {
      const recognition=await worker.recognize(file);
      const text=recognition.data.text.trim().slice(0,12000);
      if(!text) throw new Error('No readable text found. Try a clearer image.');
      const skills=PREF_SKILLS.filter(skill=>text.toLowerCase().includes(skill.toLowerCase()));
      result={text,skills};
    } finally {await worker.terminate();}
  }
  state.scan=result;
  state.selectedScan=new Set(result.skills);
  render();
  notify('Review the extracted text before adding skills.');
}
function employerGate() {
  if(state.user?.role!=='employer') {auth(false,'employer');return false;}
  return true;
}
function openNewJob() {
  if(!employerGate()) return;
  const label=(title,markup)=>'<label>'+title+markup+'</label>';
  showModal('Post a shift','<form class="form" id="post-shift">'+label('Role title','<input name="name" required maxlength="120">')+
    '<div class="grid2">'+label('Employer or worksite','<input name="company" required maxlength="120">')+label('Locality','<input name="location" required maxlength="120">')+'</div>'+
    '<div class="grid2">'+label('Category','<select name="category">'+options(CATEGORIES)+'</select>')+label('Shift','<select name="shift">'+options(SHIFTS)+'</select>')+'</div>'+
    '<div class="grid2">'+label('Minimum monthly pay (₹)','<input name="low" type="number" min="1" required>')+
    label('Maximum monthly pay (₹)','<input name="high" type="number" min="1" required>')+'</div>'+
    '<div class="grid2">'+label('Openings','<input name="openings" type="number" min="1" required>')+
    label('Apply by','<input name="deadline" type="date" min="'+isoToday()+'" required>')+'</div>'+
    label('What will the worker do?','<textarea name="summary" required maxlength="850"></textarea>')+
    '<div class="grid2">'+label('Exact working hours','<input name="work_hours" maxlength="60" placeholder="7:30 AM to 4:30 PM">')+
    label('What to bring','<input name="bring" maxlength="120" placeholder="Photo ID, if needed">')+'</div>'+
    label('Worksite walkthrough (2–4 steps, one per line)','<textarea name="preview_steps" maxlength="650" placeholder="Check in at reception&#10;Meet the shift lead at the dispatch desk"></textarea>')+
    label('Preferred skills (comma separated)','<input name="skills" maxlength="350">')+
    '<button class="btn primary" type="submit">Publish shift</button><p class="error" data-form-error role="status"></p></form>');
}
function openInvite(candidateId) {
  if(!employerGate()) return;
  showModal('Send a trial invitation','<form class="form" id="invite-form" data-id="'+candidateId+'">'+
    '<label>Interview mode<select name="mode">'+options(['In person','Phone','Video'])+'</select></label>'+
    '<div class="grid2"><label>Date<input name="date" type="date" min="'+isoToday()+'" required></label>'+
    '<label>Time (IST)<input name="time" type="time" required></label></div>'+
    '<label>Duration in minutes<input name="duration" type="number" min="5" max="120" value="20" required></label>'+
    '<label>Worksite, phone instructions or meeting link<input name="place" required maxlength="150" placeholder="e.g. Main reception, Gate 1"></label>'+
    '<button type="submit" class="btn primary">Send invitation</button><p class="error" data-form-error role="status"></p></form>');
}
const actions = {
  'scroll-jobs':()=>document.querySelector('#job-list')?.scrollIntoView({block:'start'}),
  'refresh':()=>refresh(),
  'signin':()=>auth(),
  'register':()=>auth(true),
  'employer-signin':()=>auth(false,'employer'),
  'close-dialog':()=>modal.close(),
  'demo':async b=>sessionChanged(await api('/demo',{role:b.dataset.role})),
  'logout':async()=>{await api('/logout',{});state.user=null;state.pending=null;state.saved=new Set();state.applications=[];state.savedOnly=false;
    state.employer=null;state.scan=null;state.selectedScan.clear();go('jobs');notify('Signed out.');},
  'category':b=>{state.filters.category=b.dataset.value;render();},
  'clear-filters':()=>{state.filters={q:'',where:'',shift:'',category:''};state.savedOnly=false;render();},
  'saved-filter':()=>{if(state.user?.role!=='worker'){auth();return;}state.savedOnly=!state.savedOnly;render();},
  'save':b=>toggleSave(id(b.dataset.id)),
  'apply':()=>openApply(),
  'share':async()=>{const text=location.href;
    try {await navigator.clipboard.writeText(text);notify('Shift link copied.');}
    catch {showModal('Share this shift','<label class="form">Copy this link<input readonly value="'+e(text)+'" aria-label="Shareable shift link"></label>');}},
  'answer':async b=>{
    const answer=b.dataset.text;
    let correct;
    if(state.user?.role==='worker') correct=(await api('/jobs/'+state.job.id+'/practice',{answer,variant:state.practice.variant})).correct;
    else correct=answer===(NON_WAREHOUSE[state.job.category]?.[1]||(state.practice.variant?'B24':'B17'));
    state.practice.passed=correct;
    state.practice.message=correct?'Correct. You checked the work step.':
      'Try again. '+(state.job.category==='Warehouse'?'Compare every character in the item code.':'Check the role instructions before choosing.');
    if(!correct) state.practice.variant=1;
    render();
  },
  'respond':async b=>{await api('/applications/'+id(b.dataset.id)+'/response',{status:b.dataset.value});await refresh();notify('Response recorded.');},
  'lesson':b=>{
    const l=LESSONS[id(b.dataset.id)];
    showModal(l.title,'<ol class="steps">'+l.steps.map(x=>'<li>'+e(x)+'</li>').join('')+'</ol>'+
      (l.job?'<div class="actions"><a href="#job/'+l.job+'" data-action="close-dialog" class="linkbtn primary">Open role and practice</a></div>':''),l.label+' · '+l.duration);
  },
  'profile-chip':b=>{
    const {key,value}=b.dataset;
    const list=state.profile[key];
    state.profile[key]=list.includes(value)?list.filter(x=>x!==value):[...list,value];
    b.setAttribute('aria-pressed',String(state.profile[key].includes(value)));
  },
  'sample-ocr':async b=>{
    const response=await fetch('/assets/resume-sample.png');
    if(!response.ok) throw new Error('Could not load the sample résumé.');
    try { await scanFile(await response.blob()); }
    catch (err) { const error=b.closest('form')?.querySelector('[data-form-error]');if(error)error.textContent=err.message;else throw err;}
  },
  'scan-chip':b=>{const {value}=b.dataset; if(state.selectedScan.has(value))state.selectedScan.delete(value);else state.selectedScan.add(value);
    b.setAttribute('aria-pressed',String(state.selectedScan.has(value)));},
  'adopt-scan':()=>{readProfile();state.profile.skills=[...new Set([...state.profile.skills,...state.selectedScan])];
    render();notify('Skills added. Save your profile to keep them.');},
  'new-job':()=>openNewJob(),
  'invite':b=>openInvite(id(b.dataset.id)),
  'attend':async b=>{await api('/employer/applications/'+id(b.dataset.id)+'/attend',{});await refresh();notify('Attendance recorded.');},
  'close-job':b=>showModal('Close this hiring drive?','<p class="muted">The drive will stop taking applications. Existing candidates remain in your queue.</p><div class="actions">'+
    btn('Close drive','confirm-close','danger','data-id="'+id(b.dataset.id)+'')+btn('Cancel','close-dialog')+'</div>'),
  'confirm-close':async b=>{await api('/employer/jobs/'+id(b.dataset.id)+'/close',{});modal.close();await refresh();notify('Drive closed.');}
};
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');
  if(!button||!actions[button.dataset.action]) return;
  if(button.tagName==='A'&&button.dataset.action==='scroll-jobs')event.preventDefault();
  try {
    if(button.tagName==='BUTTON')button.disabled=true;
    await actions[button.dataset.action](button);
  } catch(error) {notify(error.message);}
  finally {if(button.tagName==='BUTTON')button.disabled=false;}
});
document.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target;
  const value=Object.fromEntries(new FormData(form));
  const error=form.querySelector('[data-form-error]');
  const submit=form.querySelector('[type=submit]');
  if(error) error.textContent='';
  if(submit) submit.disabled=true;
  try {
    if(form.id==='filters') {
      state.filters={...state.filters,...value};render();
    } else if(form.id==='login'||form.id==='register') {
      await sessionChanged(await api('/'+form.id,value));
    } else if(form.id==='apply-form') {
      await api('/jobs/'+state.job.id+'/apply',{age:value.age==='on',availability:value.availability==='on'});
      modal.close();go('applications');notify('Application submitted.');
    } else if(form.id==='profile-form') {
      readProfile(form);
      const result=await api('/profile',state.profile,'PATCH');
      state.user=result.user;resetProfile();render();notify('Work profile saved.');
    } else if(form.id==='scan-form') {
      if(submit) submit.textContent='Extracting…';
      await scanFile(value.document);
    } else if(form.id==='invite-form') {
      await api('/employer/applications/'+id(form.dataset.id)+'/invite',value);
      modal.close();await refresh();notify('Trial invitation sent.');
    } else if(form.id==='post-shift') {
      value.skills=String(value.skills).split(',').map(x=>x.trim()).filter(Boolean);
      await api('/employer/jobs',value);
      modal.close();await refresh();notify('Shift published.');
    }
  } catch(failure) {
    if(error)error.textContent=failure.message;else notify(failure.message);
  } finally {
    if(submit){submit.disabled=false;if(form.id==='scan-form')submit.textContent='Extract text';}
  }
});
window.addEventListener('hashchange',()=>{window.scrollTo(0,0);refresh();});
(async()=>{
  try {const session=await api('/session');state.user=session.user;state.demo=session.demo;resetProfile();await refresh();}
  catch(error) {
    main.innerHTML=empty('Start the Rozgaar server',error.message,btn('Reload','boot-refresh','primary'));
    actions['boot-refresh']=()=>location.reload();
  }
})();

