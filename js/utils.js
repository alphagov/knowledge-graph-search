const tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';


const tagOrComment = new RegExp(
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


const id = x => document.getElementById(x);

const sanitise = function(text) {
  let oldText;
  do {
    oldText = text;
    text = text.replace(tagOrComment, '');
  } while (text !== oldText);
  return text.replace(/</g, '&lt;').replace(/""*/g, '"');
};

export { id, sanitise };
