const SKIP = /^(that|this|with|have|more|should|your|than|from|they|will|does|cause|causes|cure|cures|helps?|prevents?)$/;
export function medlineLink(said) {
  const words = (String(said).toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !SKIP.test(w)).slice(0, 4);
  const box = document.createElement('div'), a = document.createElement('a'), note = document.createElement('span');
  box.className = 'lookup-box'; note.className = 'lookup-note'; note.textContent = ' (opens MedlinePlus, the US National Library of Medicine, with these words)';
  a.href = 'https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=' + encodeURIComponent(words.join(' '));
  a.rel = 'noopener'; a.target = '_blank'; a.textContent = 'Read more on MedlinePlus';
  box.append(a, note); return box;
}
