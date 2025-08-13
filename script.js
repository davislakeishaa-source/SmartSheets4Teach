// Black & Grey Worksheet Builder
// Uses jsPDF (UMD) in the page to export clean, copier-friendly PDFs.
(function(){
  const { jsPDF } = window.jspdf || {};

  const form = document.getElementById('worksheetForm');
  const previewBtn = document.getElementById('previewBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  const prevTitle = document.getElementById('prevTitle');
  const prevMeta = document.getElementById('prevMeta');
  const prevBody = document.getElementById('prevBody');
  const prevWatermark = document.getElementById('prevWatermark');

  function getField(id){ return document.getElementById(id).value; }
  function getChecked(id){ return document.getElementById(id).checked; }

  // Simple question stem banks by subject/type
  const STEMS = {
    ELA: {
      practice: [
        "Read a short paragraph about {topic}. Identify the main idea and one supporting detail.",
        "Underline two context clues that help define the word related to {topic}. Then write the likely meaning.",
        "Write a two-sentence summary about {topic} using key details only.",
        "What inference can you make about {topic}? Cite evidence from the text.",
        "Explain the author's purpose related to {topic}: inform, entertain, or persuade? Why?",
        "Compare two ideas about {topic}. How are they similar and different?",
        "Identify the claim about {topic} and one piece of evidence that supports it.",
        "Paraphrase a complex sentence about {topic} in simpler language."
      ],
      study_guide: [
        "Key Terms & Concepts about {topic}",
        "How to find the main idea (RI/RL): look for repeated ideas and key details about {topic}.",
        "Summarizing formula: Somebody—Wanted—But—So—Then (adapt for {topic}).",
        "Evidence sentence frames about {topic}: 'According to the text, ...' / 'The author states ...'",
        "Common text structures seen with {topic}: Cause/Effect, Compare/Contrast, Problem/Solution."
      ],
      guided_notes: [
        "{topic} is mainly about ______________________________.",
        "One important detail is _______________________________.",
        "The text structure used is ____________________________ (e.g., Cause/Effect).",
        "An inference I can make about {topic} is _______________________ because ____________.",
        "Evidence: '____________________________________' (line ___)."
      ]
    },
    Math: {
      practice: [
        "Solve a problem about {topic}. Show each step clearly.",
        "Write an equation that models a word problem involving {topic}.",
        "Explain which property or rule applies to {topic} and why.",
        "Create and solve your own {topic} problem; include an answer.",
        "Graph or draw a model to represent {topic}."
      ],
      study_guide: [
        "Definitions & formulas for {topic}.",
        "Common error checks for {topic}: what to avoid and how to verify.",
        "Worked example for {topic} (label each step)."
      ],
      guided_notes: [
        "Formula for {topic}: ____________________.",
        "Step 1: ____________________  Step 2: ____________________  Step 3: ____________________.",
        "Check: Does my answer make sense? Why/why not? ____________."
      ]
    },
    Science: {
      practice: [
        "Define {topic} in your own words and provide one real-world example.",
        "Describe a simple investigation to test a claim about {topic}.",
        "Explain how cause and effect relate to {topic}.",
        "Create a labeled diagram related to {topic}.",
        "Compare {topic} to a related concept."
      ],
      study_guide: [
        "Vocabulary for {topic}: term — meaning — example.",
        "Diagram + labels for {topic}.",
        "Processes & cycles linked to {topic} (steps in order)."
      ],
      guided_notes: [
        "{topic} involves ______________________.",
        "Important parts: ______________________.",
        "Evidence shows ______________________ because ______________________."
      ]
    },
    "Social Studies": {
      practice: [
        "Describe a primary source perspective on {topic}.",
        "Explain cause and effect related to {topic}.",
        "Compare two viewpoints about {topic} and support with evidence.",
        "Place {topic} on a simple timeline and annotate what happened.",
        "Write a short claim about {topic} and support it with two facts."
      ],
      study_guide: [
        "Key people, places, dates connected to {topic}.",
        "Why {topic} mattered: short summary of impact.",
        "Cause → Event → Effect chain for {topic}."
      ],
      guided_notes: [
        "{topic} happened in/around ______________________.",
        "Key figures include ______________________ because ______________________.",
        "A long-term effect of {topic} is ______________________."
      ]
    },
    Other: {
      practice: [
        "Define {topic} and list two examples.",
        "Describe why {topic} is important in this subject.",
        "Create a real-world connection to {topic}.",
        "Explain a challenge people face with {topic} and a solution."
      ],
      study_guide: [
        "Essential questions about {topic}.",
        "Core vocabulary for {topic}.",
        "Common misconceptions about {topic} and corrections."
      ],
      guided_notes: [
        "{topic} connects to ______________________.",
        "Important detail: ______________________. Another: ______________________.",
        "I can apply {topic} by ______________________."
      ]
    }
  };

  function getStems(subject, type){
    const bank = STEMS[subject] || STEMS.Other;
    return bank[type] || [];
  }

  function byDifficulty(items, difficulty){
    // Light difficulty shaping: more/less lines or more open prompts
    if(difficulty <= 2){
      return items.slice(0, Math.ceil(items.length*0.6));
    }else if(difficulty >= 5){
      return items.concat([
        "Extend your thinking about {topic}: What would change if one key detail was different? Explain."
      ]);
    }
    return items;
  }

  function titleCase(s){
    return s.replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1));
  }

  function buildPreview(){
    const company = getField('company');
    const title = getField('title');
    const grade = getField('grade');
    const subject = getField('subject');
    const topic = getField('topic');
    const type = document.getElementById('type').value;
    const difficulty = parseInt(getField('difficulty')||'3',10);
    const numQ = Math.min(Math.max(parseInt(getField('numQuestions')||'10',10),1),30);
    const includeGraphics = getChecked('includeGraphics');

    prevTitle.textContent = title || 'Worksheet Title';
    prevMeta.textContent = `Grade ${grade || '—'} • ${subject || '—'} • ${topic || '—'}`;
    prevWatermark.textContent = `© ${company} • For classroom use`;

    const body = [];

    // Directions
    const dirText = document.getElementById('directions').value.trim();
    if(dirText){
      body.push(`<h4>Directions</h4><p>${escapeHtml(dirText)}</p>`);
    }

    // Sections, by type
    if(type === 'study_guide' || type === 'mixed'){
      body.push(`<h4>Study Guide</h4>`);
      const stems = byDifficulty(getStems(subject, 'study_guide'), difficulty);
      stems.forEach(s => body.push(`<p class="q">• ${escapeHtml(s.replaceAll('{topic}', topic))}</p>`));
    }
    if(type === 'guided_notes' || type === 'mixed'){
      body.push(`<h4>Guided Notes</h4>`);
      const stems = byDifficulty(getStems(subject, 'guided_notes'), difficulty);
      stems.forEach(s => body.push(`<p class="q">${escapeHtml(s.replaceAll('{topic}', topic))}</p><span class='line'></span>`));
    }
    if(type === 'practice' || type === 'mixed'){
      body.push(`<h4>Practice</h4>`);
      const base = byDifficulty(getStems(subject, 'practice'), difficulty);
      const prompts = [];
      for(let i=0;i<numQ;i++){
        prompts.push(base[i % base.length].replaceAll('{topic}', topic));
      }
      prompts.forEach((p,idx) => body.push(`<p class="q"><strong>${idx+1}.</strong> ${escapeHtml(p)}</p><span class='line'></span>`));
    }

    prevBody.innerHTML = includeGraphics ? withSubtleGraphics(body.join('')) : body.join('');
  }

  function withSubtleGraphics(html){
    // Add toned accents (black/grey rules) via wrapper
    return `<div class="accent-wrap">${html}</div>`;
  }

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[m]));
  }

  function mm(n){ return n; } // keep units plain; we'll treat as pt-based using jsPDF defaults

  function buildPdf(){
    if(!jsPDF){
      alert("PDF library failed to load. Check your connection or CDN script tag.");
      return;
    }
    const doc = new jsPDF({ unit:'pt', format:'letter' }); // 612 x 792 pt
    const margin = { left: 54, right: 54, top: 56, bottom: 46 };
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin.top;

    const company = getField('company');
    const title = getField('title');
    const grade = getField('grade');
    const subject = getField('subject');
    const topic = getField('topic');
    const type = document.getElementById('type').value;
    const difficulty = parseInt(getField('difficulty')||'3',10);
    const numQ = Math.min(Math.max(parseInt(getField('numQuestions')||'10',10),1),30);
    const includeKey = getChecked('includeKey');
    const includeGraphics = getChecked('includeGraphics');
    const dirText = document.getElementById('directions').value.trim();

    // Header: Name/Date line
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    doc.text('Name: ___________________________', margin.left, y);
    doc.text('Date: ___________', pageW - margin.right - 120, y);
    y += 18;

    // Title
    doc.setFont('helvetica','bold'); doc.setFontSize(16);
    doc.text(title || 'Worksheet Title', margin.left, y);
    y += 16;

    // Meta line
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Grade ${grade || '—'}  •  ${subject || '—'}  •  ${topic || '—'}`, margin.left, y);
    doc.setTextColor(0);
    y += 8;

    // Divider (grey band)
    if(includeGraphics){
      doc.setDrawColor(180); doc.setFillColor(230);
      doc.roundedRect(margin.left, y, pageW - margin.left - margin.right, 6, 2, 2, 'F');
    }
    y += 16;

    // Directions
    if(dirText){
      y = writeHeading(doc, 'Directions', margin.left, y, pageW, margin);
      y = writeParagraph(doc, dirText, margin, y);
      y += 6;
      y = pageBreakIfNeeded(doc, y, margin, pageH);
    }

    // Sections
    if(type === 'study_guide' || type === 'mixed'){
      y = writeHeading(doc, 'Study Guide', margin.left, y, pageW, margin, includeGraphics);
      let stems = byDifficulty(getStems(subject, 'study_guide'), difficulty).map(s => s.replaceAll('{topic}', topic));
      y = bulletList(doc, stems, margin, y);
      y = pageBreakIfNeeded(doc, y, margin, pageH);
    }

    if(type === 'guided_notes' || type === 'mixed'){
      y = writeHeading(doc, 'Guided Notes', margin.left, y, pageW, margin, includeGraphics);
      let stems = byDifficulty(getStems(subject, 'guided_notes'), difficulty).map(s => s.replaceAll('{topic}', topic));
      y = linesList(doc, stems, margin, y);
      y = pageBreakIfNeeded(doc, y, margin, pageH);
    }

    if(type === 'practice' || type === 'mixed'){
      y = writeHeading(doc, 'Practice', margin.left, y, pageW, margin, includeGraphics);
      const base = byDifficulty(getStems(subject, 'practice'), difficulty).map(s => s.replaceAll('{topic}', topic));
      const prompts = [];
      for(let i=0;i<numQ;i++) prompts.push(base[i % base.length]);
      y = numberedQuestions(doc, prompts, margin, y, pageH);
    }

    // Footer watermark
    addWatermark(doc, company, margin, pageW, pageH);

    // Answer Key page
    if(includeKey){
      doc.addPage();
      y = margin.top;
      doc.setFont('helvetica','bold'); doc.setFontSize(16);
      doc.text('Answer Key', margin.left, y);
      y += 18;
      doc.setFont('helvetica','normal'); doc.setFontSize(11);

      // Provide model/placeholder answers
      if(type === 'practice' || type === 'mixed'){
        const base = byDifficulty(getStems(subject, 'practice'), difficulty).map(s => s.replaceAll('{topic}', topic));
        for(let i=0;i<numQ;i++){
          const ans = generateSampleAnswer(base[i % base.length], subject);
          y = writeParagraph(doc, `${i+1}. ${ans}`, margin, y);
          y += 6;
          y = pageBreakIfNeeded(doc, y, margin, pageH);
        }
      } else if(type === 'guided_notes'){
        const stems = byDifficulty(getStems(subject, 'guided_notes'), difficulty).map(s => s.replaceAll('{topic}', topic));
        stems.forEach((s, idx) => {
          const ans = generateSampleAnswer(s, subject);
          y = writeParagraph(doc, `${idx+1}. ${ans}`, margin, y);
          y += 6; y = pageBreakIfNeeded(doc, y, margin, pageH);
        });
      } else if(type === 'study_guide'){
        y = writeParagraph(doc, "Suggested responses will vary. Encourage use of vocabulary and evidence.", margin, y);
      }
      addWatermark(doc, company, margin, pageW, pageH);
    }

    doc.save(safeFilename(`${title || 'worksheet'}_${new Date().toISOString().slice(0,10)}.pdf`));
  }

  function safeFilename(s){ return s.replace(/[^\w\d\-_]+/g,'_'); }

  function addWatermark(doc, company, margin, pageW, pageH){
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(120);
    doc.text(`© ${company} • Classroom use only`, pageW/2, pageH - 24, { align: 'center' });
    doc.setTextColor(0);
  }

  function writeHeading(doc, text, x, y, pageW, margin, band=false){
    if(band){
      doc.setFillColor(240); doc.setDrawColor(200);
      doc.roundedRect(x, y, pageW - margin.left - margin.right, 22, 3, 3, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text(text, x+10, y+14);
      return y + 28;
    }else{
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text(text, x, y);
      return y + 14;
    }
  }

  function writeParagraph(doc, text, margin, y){
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    const pageW = doc.internal.pageSize.getWidth();
    const maxW = pageW - margin.left - margin.right;
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, margin.left, y);
    return y + 14 * lines.length;
  }

  function bulletList(doc, items, margin, y){
    const pageW = doc.internal.pageSize.getWidth();
    const maxW = pageW - margin.left - margin.right - 14;
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    items.forEach(it => {
      const lines = doc.splitTextToSize(it, maxW);
      doc.text('•', margin.left, y);
      doc.text(lines, margin.left+12, y);
      y += 14 * lines.length + 6;
      y = pageBreakIfNeeded(doc, y, margin, doc.internal.pageSize.getHeight());
    });
    return y;
  }

  function linesList(doc, items, margin, y){
    const pageW = doc.internal.pageSize.getWidth();
    const maxW = pageW - margin.left - margin.right;
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    items.forEach(it => {
      const lines = doc.splitTextToSize(it, maxW);
      doc.text(lines, margin.left, y);
      y += 14 * lines.length;
      // Add a writing line
      doc.setDrawColor(80);
      doc.line(margin.left, y+6, pageW - margin.right, y+6);
      y += 18;
      y = pageBreakIfNeeded(doc, y, margin, doc.internal.pageSize.getHeight());
    });
    return y;
  }

  function numberedQuestions(doc, items, margin, y, pageH){
    const pageW = doc.internal.pageSize.getWidth();
    const maxW = pageW - margin.left - margin.right - 24;
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    items.forEach((it, idx) => {
      const lines = doc.splitTextToSize(`${idx+1}. ${it}`, maxW);
      doc.text(lines, margin.left, y);
      y += 14 * lines.length;
      // writing space
      doc.setDrawColor(80);
      doc.line(margin.left, y+6, pageW - margin.right, y+6);
      y += 18;
      y = pageBreakIfNeeded(doc, y, margin, pageH);
    });
    return y;
  }

  function pageBreakIfNeeded(doc, y, margin, pageH){
    if(y > pageH - margin.bottom - 40){
      addWatermark(doc, getField('company'), margin, doc.internal.pageSize.getWidth(), pageH);
      doc.addPage();
      return margin.top;
    }
    return y;
  }

  function generateSampleAnswer(prompt, subject){
    // Very light heuristic for placeholder/model answers
    const base = "Answers will vary; look for clear reasoning and evidence.";
    if(subject === 'Math'){
      return "Student work should show the setup, each operation, and a final statement with units.";
    }
    if(/main idea/i.test(prompt)) return "A concise main idea capturing the central point and excluding minor details.";
    if(/inference/i.test(prompt)) return "A logical inference tied to specific clues from the text.";
    if(/evidence|cite/i.test(prompt)) return "Direct quote or paraphrase that clearly supports the claim.";
    if(/define|meaning/i.test(prompt)) return "A student-friendly definition supported by context clues.";
    return base;
  }

  // Wire up UI
  previewBtn.addEventListener('click', buildPreview);
  downloadBtn.addEventListener('click', buildPdf);
  // Initial preview
  buildPreview();
})();
