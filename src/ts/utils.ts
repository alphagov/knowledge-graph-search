const id = (x: string): (HTMLElement | null) => document.getElementById(x);


const tagBody: string = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';


const tagOrComment: RegExp = new RegExp(
  '<(?:'
  // Comment body.
  + '!--(?:(?:-*[^->])*--+|-?)'
  // Special "raw text" elements whose content should be elided.
  + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
  + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
  // Regular name
  + '|/?[a-z]'
  + tagBody
  + ')>',
  'gi');


const getFormInputValue = (inputId: string): string =>
  sanitiseInput((<HTMLInputElement>id(inputId))?.value);


const sanitiseInput = function(text: string): string {
  // remove text that could lead to script injections
  if (!text) return '';
  let oldText: string;
  do {
    oldText = text;
    text = text.replace(tagOrComment, '');
  } while (text !== oldText);
  return text.replace(/</g, '&lt;').replace(/""*/g, '"');
};


const sanitiseOutput = function(text: string): string {
  const escapeHTML = (str: string) => new Option(str).innerHTML;
  return escapeHTML(text)
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
};


export { id, sanitiseInput, sanitiseOutput, getFormInputValue };
