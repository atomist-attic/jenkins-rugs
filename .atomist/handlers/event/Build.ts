import { HandleEvent, Message } from '@atomist/rug/operations/Handlers'
import { GraphNode, Match, PathExpression } from '@atomist/rug/tree/PathExpression'
import { EventHandler, Tags } from '@atomist/rug/operations/Decorators'

import { Build } from '@atomist/cortex/Build'

@EventHandler("JenkinsBuilds", "Handle build events from Jenkins",
    new PathExpression<Build, Build>(
        `/Build
            [@platform='jenkins']
            [/hasBuild::Commit()/author::GitHubId()
                [/hasGithubIdentity::Person()/hasChatIdentity::ChatId()]?]
            [/on::Repo()/channel::ChatChannel()]
            [/triggeredBy::Push()
                [/contains::Commit()/author::GitHubId()
                    [/hasGithubIdentity::Person()/hasChatIdentity::ChatId()]?]
                [/on::Repo()]]`))
@Tags("ci", "jenkins")
class Built implements HandleEvent<Build, Build> {
    handle(event: Match<Build, Build>): Message {
        let build = event.root() as any

        let message = new Message()
        message.withNode(build)

        let repo = build.on().name()

        let cid = "commit_event/" + build.on().owner() + "/" + repo + "/" + build.hasBuild().sha()
        message.withCorrelationId(cid)

        // TODO split this into two handlers with proper tree expressions with predicates
        /*if (build.status() == "Passed" || build.status() == "Fixed") {
            if (build.status() == "Fixed") {
                if (build.hasBuild().author().hasGithubIdentity() != null) {
                    message.body = `Jenkins build ${build.name()} of repo ${repo} is now fixed`
                    message.channelId = build.hasBuild().author().hasGitHubIdentity().hasChatIdentity().id()
                }
            }
        }
        else if (build.status() == "Failed" || build.status() == "Broken" || build.status() == "Still Failing") {
            if (build.hasBuild().author().hasGithubIdentity() != null) {
                let commit = "`" + build.hasBuild().sha() + "`"
                message.body = `Jenkins build ${build.name()} of repo ${repo} failed after commit ${commit}: ${build.build_url()}`
                message.channelId = build.hasBuild().author().hasGitHubIdentity().hasChatIdentity().id()
            }
        }*/

        return message
    }
}
export const built = new Built()
