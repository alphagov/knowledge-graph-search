const id = x => document.getElementById(x);

const sanitise = function(text) {
  const escapeHTML = str => new Option(str).innerHTML;
  return escapeHTML(text)
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
};


const splitKeywords = function(keywords) {
  const regexp = /[^\s,"]+|"([^"]*)"/gi;
  const output = [];
  let match;
  do {
    match = regexp.exec(keywords);
    if (match) {
        output.push(match[1] ? match[1] : match[0]);
    }
  } while (match);
  return output.filter(d => d.length > 0);
};


export { id, sanitise, splitKeywords };
