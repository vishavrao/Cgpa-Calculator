/* ====== CORE ====== */
const gradePoints = { S:10, A:9, B:8, C:7, D:6, E:5, F:0 };

const subjectsContainer = document.getElementById('subjects');
const prevCgpaInput = document.getElementById('prevCgpa');
const prevCreditsInput = document.getElementById('prevCredits');
const targetInput = document.getElementById('targetCgpa');
const semesterGpaEl = document.getElementById('semesterGpa');
const cumulativeGpaEl = document.getElementById('cumulativeGpa');
const suggestionEl = document.getElementById('suggestion');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const gaugeCanvas = document.getElementById('gauge');
const visuals = document.getElementById('visuals');

let subjectCounter = 0; // ✅ new counter (replaces subjectCount)

/* init */
function createSubjectNode(index, grade='S', credit=0){
  const wrapper = document.createElement('div');
  wrapper.className = 'subject-card';
  wrapper.innerHTML = `
    <div class="sub-left">Sub ${index}</div>
    <div class="sub-right">
      <select class="grade" aria-label="Grade for subject ${index}" title="Choose grade (S highest, F fail)">
        ${Object.keys(gradePoints).map(g=>`<option value="${g}">${g}</option>`).join('')}
      </select>
      <input class="credit" type="number" step="0.5" min="0" placeholder = "Credit" title="Credit for subject ${index}" />
    </div>
  `;
  wrapper.querySelector('.grade').value = grade;
  return wrapper;
}

function renderSubjects(count=8){
  subjectsContainer.innerHTML = '';
  subjectCounter = 0; // ✅ reset counter
  for(let i=1;i<=count;i++){
    subjectCounter++;
    const node = createSubjectNode(subjectCounter,'S',0);
    subjectsContainer.appendChild(node);
  }
}

/* Add / Remove */
document.getElementById('addSubject').addEventListener('click', ()=>{
  subjectCounter++;
  const node = createSubjectNode(subjectCounter,'S',0);
  subjectsContainer.appendChild(node);
  node.classList.add('new'); 
  setTimeout(()=>node.classList.remove('new'),300);
});

document.getElementById('removeSubject').addEventListener('click', ()=>{
  if(subjectCounter > 1){
    subjectsContainer.lastElementChild.remove();
    subjectCounter--;
  }
});

/* Sample autofill */
document.getElementById('autoFill').addEventListener('click', ()=>{
  const sample = ['S','A','B','C','B','A','D','E'];
  const creditSample = [3,3,4,3,2,3,1,2];
  renderSubjects(sample.length);
  const gradeEls = document.querySelectorAll('.grade');
  const creditEls = document.querySelectorAll('.credit');
  gradeEls.forEach((g,i)=> g.value = sample[i] || 'S');
  creditEls.forEach((c,i)=> c.value = creditSample[i] || 0);
});

/* Calculate */
document.getElementById('calculate').addEventListener('click', ()=>{
  const gradeEls = document.querySelectorAll('.grade');
  const creditEls = document.querySelectorAll('.credit');

  let totalPoints = 0, totalCredits = 0;
  gradeEls.forEach((g, i) => {
    const gp = gradePoints[g.value] ?? 0;
    const cr = parseFloat(creditEls[i].value) || 0;
    totalPoints += gp * cr;
    totalCredits += cr;
  });

  const semesterGPA = totalCredits ? +(totalPoints / totalCredits).toFixed(2) : 0;

  const prevCgpa = parseFloat(prevCgpaInput.value) || 0;
  const prevCredits = parseFloat(prevCreditsInput.value) || 0;

  const cumulativeGPA = (prevCredits + totalCredits) ? +(((prevCgpa * prevCredits) + totalPoints) / (prevCredits + totalCredits)).toFixed(2) : semesterGPA;

  semesterGpaEl.innerText = `Semester GPA: ${semesterGPA.toFixed(2)}`;
  cumulativeGpaEl.innerText = `Cumulative GPA: ${cumulativeGPA.toFixed(2)}`;

  suggestionEl.innerText = buildSuggestion(semesterGPA, cumulativeGPA, totalCredits);

  updateVisuals(semesterGPA);
  prepareShareLinks(semesterGPA, cumulativeGPA);
});

/* Build suggestion */
function buildSuggestion(sem, cum, credits){
  const target = parseFloat(targetInput.value);
  if(target && credits>0){
    const neededTotal = target * (credits + (parseFloat(prevCreditsInput.value)||0));
    const current = (parseFloat(prevCgpaInput.value)||0) * (parseFloat(prevCreditsInput.value)||0) + sem*credits;
    const diff = neededTotal - current;
    if(diff <= 0) return `You're on track to reach ${target.toFixed(2)}.`;
    const avgPointNeeded = (diff / credits) || 0;
    const approx = Math.min(10, (avgPointNeeded + 0).toFixed(2));
    return `To reach target ${target.toFixed(2)}, you need approx. avg grade point of ${approx} across these ${credits} credits.`;
  }
  return 'Tip: Fill credits & grades then click Calculate.';
}

/* Visuals: progress bar & circular gauge */
function updateVisuals(gpa){
  const pct = Math.max(0, Math.min(100, (gpa/10)*100));
  progressBar.style.width = pct + '%';
  progressPercent.innerText = Math.round(pct) + '%';
  drawGauge(pct);
}

/* Draw circular gauge */
function drawGauge(percent){
  const c = gaugeCanvas;
  const ctx = c.getContext('2d');
  const w = c.width;
  const h = c.height;

  ctx.clearRect(0,0,w,h);

  const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 10;

  ctx.beginPath();
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#e6eef8';
  ctx.arc(cx, cy, r, -Math.PI*0.75, Math.PI*0.75, false);
  ctx.stroke();

  const start = -Math.PI*0.75;
  const end = start + ((percent/100) * (Math.PI*1.5));
  const grad = ctx.createLinearGradient(0,0,w,0);
  grad.addColorStop(0, '#2b90ff');
  grad.addColorStop(1, '#22d3aa');

  ctx.beginPath();
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = grad;
  ctx.arc(cx, cy, r, start, end, false);
  ctx.stroke();

  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillStyle = getContrastColor();
  ctx.textAlign = 'center';
  ctx.fillText((percent/10).toFixed(2), cx, cy+6);
}

/* determine text color */
function getContrastColor(){
  return document.body.classList.contains('dark') ? '#e6eef8' : '#0b1220';
}

/* Reset */
document.getElementById('reset').addEventListener('click', ()=>{
  prevCgpaInput.value = 0; 
  prevCreditsInput.value = 0; 
  targetInput.value = '';
  renderSubjects(8); 
  semesterGpaEl.innerText = 'Semester GPA: —'; 
  cumulativeGpaEl.innerText = 'Cumulative GPA: —';
  suggestionEl.innerText = 'Tip: Add credits and grades then click Calculate.'; 
  updateVisuals(0);
});

/* Download — build a new image from gauge + text and force download */
document.getElementById('download').addEventListener('click', () => {
  try {
    const sem = semesterGpaEl.innerText || 'Semester GPA: —';
    const cum = cumulativeGpaEl.innerText || 'Cumulative GPA: —';
    const sug = suggestionEl.innerText || '';
    const pct = parseInt(progressPercent.innerText) || 0;

    // final image size
    const W = 900;
    const H = 380;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // background (adapt to dark mode)
    const bg = document.body.classList.contains('dark') ? '#071026' : '#ffffff';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // title
    ctx.fillStyle = document.body.classList.contains('dark') ? '#e6eef8' : '#0b1220';
    ctx.font = '700 20px Inter, Arial, sans-serif';
    ctx.fillText('Flexi GPA Results', 220, 36);

    // try to render the gauge canvas into the new canvas
    try {
      const gaugeData = gaugeCanvas.toDataURL('image/png');
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 20, 20, 180, 180);
        drawRestAndDownload();
      };
      img.onerror = () => {
        // fallback: draw a simple colored circle if gauge image fails
        drawFallbackGauge(ctx);
        drawRestAndDownload();
      };
      img.src = gaugeData;
    } catch (err) {
      // if toDataURL fails for some reason, fallback to drawing a gauge manually
      drawFallbackGauge(ctx);
      drawRestAndDownload();
    }

    // draws the progress bar and texts then triggers download
    function drawRestAndDownload() {
      // progress bar
      const barX = 220, barY = 66, barW = 640, barH = 20;
      ctx.fillStyle = '#eef6ff';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#2b90ff';
      ctx.fillRect(barX, barY, Math.max(0, Math.min(1, pct/100)) * barW, barH);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.strokeRect(barX, barY, barW, barH);

      // labels and values
      ctx.font = '600 16px Inter, Arial, sans-serif';
      ctx.fillStyle = document.body.classList.contains('dark') ? '#e6eef8' : '#0b1220';
      ctx.fillText(sem, 220, 110);
      ctx.fillText(cum, 220, 140);

      // suggestion text wrapped
      ctx.font = '14px Inter, Arial, sans-serif';
      ctx.fillStyle = document.body.classList.contains('dark') ? '#cbd8ec' : '#333';
      wrapText(ctx, sug, 220, 170, barW, 20);

      // footer note
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.fillStyle = '#777';
      ctx.fillText('Generated by Flexi GPA Calculator', 220, H - 18);

      // create download link
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cgpa_results.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // simple fallback gauge (if embedding gauge image fails)
    function drawFallbackGauge(ctx) {
      const cx = 110, cy = 110, r = 70;
      ctx.beginPath();
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#e6eef8';
      ctx.arc(cx, cy, r, -Math.PI*0.75, Math.PI*0.75, false);
      ctx.stroke();

      // filled arc
      const start = -Math.PI*0.75;
      const end = start + ((pct/100) * (Math.PI*1.5));
      const g = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      g.addColorStop(0, '#2b90ff');
      g.addColorStop(1, '#22d3aa');
      ctx.beginPath();
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.strokeStyle = g;
      ctx.arc(cx, cy, r, start, end, false);
      ctx.stroke();

      // center text
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = document.body.classList.contains('dark') ? '#e6eef8' : '#0b1220';
      ctx.textAlign = 'center';
      ctx.fillText((pct/10).toFixed(2), cx, cy + 6);
      ctx.textAlign = 'start';
    }

    // helper: wrap text
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      if (!text) return;
      const words = text.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line) ctx.fillText(line.trim(), x, y);
    }

  } catch (e) {
    console.error('Download image error:', e);
    alert('Failed to create image. Please try again.');
  }
});


/* Share */
document.getElementById('share').addEventListener('click', async ()=>{
  const sem = semesterGpaEl.innerText || 'Semester GPA: —';
  const cum = cumulativeGpaEl.innerText || 'Cumulative GPA: —';
  const text = `${sem}\n${cum}\nGenerated by Flexi GPA Calculator`;
  try{
    await navigator.clipboard.writeText(text);
    alert('Results copied to clipboard!');
  }catch(e){
    alert('Failed to copy to clipboard.');
  }
});

function prepareShareLinks(sem, cum){
  const text = encodeURIComponent(`${sem}\n${cum}\nShared via Flexi GPA Calculator`);
  document.getElementById('waShare').href = `https://wa.me/?text=${text}`;
  document.getElementById('mailShare').href = `mailto:?subject=CGPA Results&body=${text}`;
}

/* Dark mode toggle */
const darkToggle = document.getElementById('darkToggle');
darkToggle.addEventListener('change', (e)=>{
  if(e.target.checked) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  drawGauge(parseFloat(progressPercent.innerText) || 0);
});

/* initial render */
renderSubjects(8);
updateVisuals(0);
document.getElementById('year').innerText = new Date().getFullYear();

/* Accessibility */
document.addEventListener('keydown', (e)=>{
  if(e.altKey && e.key === 'a'){ document.getElementById('addSubject').click(); }
  if(e.altKey && e.key === 'r'){ document.getElementById('removeSubject').click(); }
});