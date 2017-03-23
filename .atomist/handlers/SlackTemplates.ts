import * as mustache from 'mustache'
import { Issue } from "@atomist/github/core/Core"


let failure = `{
  "attachments": [
    {
      "fallback": "Unable to run command",
      "mrkdwn_in": ["text", "pretext"],
      "author_name": "Unable to run command",
      "author_icon": "https://images.atomist.com/rug/error-circle.png",
      "color": "#D94649",
      "text" : "{{{text}}}"
    }
  ]
}`

//generic error rendering
function renderError(msg: string): string {
try{
    return mustache.render(failure, {text: msg})
  }catch(ex) {
    return `Failed to render message using template: ${ex}`
  }
}

let success = `{
  "attachments": [
    {
      "fallback": "{{{text}}}",
      "mrkdwn_in": ["text", "pretext"],
      "author_name": "Successfully ran command",
      "author_icon": "https://images.atomist.com/rug/check-circle.gif?gif={{random}}",
      "color": "#45B254",
      "text": "{{{text}}}"
    }
  ]
}`

//generic success rendering
function renderSuccess(msg: string): string {
try{
    return mustache.render(success, {text: msg})
  }catch(ex) {
    return `Failed to render message using template: ${ex}`
  }
}

export {renderError, renderSuccess}
