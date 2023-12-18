// todo: split into separate files and add tests

import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'

const PNF = PhoneNumberFormat
const phoneUtil: PhoneNumberUtil = PhoneNumberUtil.getInstance()

const id = (x: string): HTMLElement | null => document.getElementById(x)

const tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*'

const tagOrComment = new RegExp(
  '<(?:' +
    // Comment body.
    '!--(?:(?:-*[^->])*--+|-?)' +
    // Special "raw text" elements whose content should be elided.
    '|script\\b' +
    tagBody +
    '>[\\s\\S]*?</script\\s*' +
    '|style\\b' +
    tagBody +
    '>[\\s\\S]*?</style\\s*' +
    // Regular name
    '|/?[a-z]' +
    tagBody +
    ')>',
  'gi'
)

const getFormInputValue = (inputId: string): string =>
  sanitiseInput((<HTMLInputElement>id(inputId))?.value)

// TODO: Support many phone numbers at once.  Available distributions of
// libphonenumber don't support this, so we would have to require users to
// separate numbers by delimiters.
const getPhoneNumber = function (phoneNumberElementId: string): { phoneNumber: string, error: boolean } {
    let phoneNumber: string = (<HTMLInputElement>id(phoneNumberElementId))?.value
    let parsedPhoneNumber: string
    try {
      return {
        phoneNumber: parsedPhoneNumber = phoneUtil.format(
          phoneUtil.parseAndKeepRawInput(
            phoneNumber,
            'GB'
          ),
          PNF.E164
          ),
        error: false
      }
    } catch {
      return { phoneNumber: phoneNumber, error: true }
    }
}

const sanitiseInput = function (text: string | undefined): string {
  // remove text that could lead to script injections
  if (!text) return ''
  text = text.trim()
  let oldText: string
  do {
    oldText = text
    text = text.replace(tagOrComment, '')
  } while (text !== oldText)
  return text.replace(/</g, '&lt;').replace(/""*/g, '"')
}

const sanitiseOutput = function (text: string): string {
  const escapeHTML = (str: string) => new Option(str).innerHTML
  return escapeHTML(text).replace(/'/g, '&apos;').replace(/"/g, '&quot;')
}

const splitKeywords = function (keywords: string): string[] {
  const wordsToIgnore = ['of', 'for', 'the', 'or', 'and']
  const regexp = /[^\s,"]+|"([^"]*)"/gi
  const output = []
  let match: RegExpExecArray | null
  do {
    match = regexp.exec(keywords)
    if (match) {
      output.push(match[1] ? match[1] : match[0])
    }
  } while (match)
  return output.filter((d) => d.length > 0 && !wordsToIgnore.includes(d))
}

export {
  id,
  sanitiseInput,
  sanitiseOutput,
  getFormInputValue,
  getPhoneNumber,
  splitKeywords,
}
