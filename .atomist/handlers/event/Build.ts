import { EventPlan, HandleEvent, LifecycleMessage, DirectedMessage, UserAddress } from '@atomist/rug/operations/Handlers'
import { GraphNode, Match, PathExpression } from '@atomist/rug/tree/PathExpression'
import { EventHandler, Tags } from '@atomist/rug/operations/Decorators'

import { Build } from '@atomist/cortex/Build'

@EventHandler("JenkinsBuilds", "Handle build events from Jenkins",
    new PathExpression<Build, Build>(
        `/Build
            [@provider='jenkins']
            [/commit::Commit()[/author::GitHubId()[/person::Person()/chatId::ChatId()]?]
                [/tags::Tag()]?]
                [/repo::Repo()/channels::ChatChannel()]
            [/push::Push()
                [/commits::Commit()/author::GitHubId()
                    [/person::Person()/chatId::ChatId()]?]
                [/repo::Repo()]]`))
@Tags("ci", "jenkins")
class Built implements HandleEvent<Build, Build> {
    handle(event: Match<Build, Build>): EventPlan {
        let build = event.root()
        let plan = new EventPlan()

        let repo = build.repo.name
        let owner = build.repo.owner
        let cid = "commit_event/" + owner + "/" + repo + "/" + build.commit.sha

        let message = new LifecycleMessage(build, cid)

        if (build.status == "failed" || build.status == "broken") {
            try {
                if (build.commit.author != null && build.commit.author.person != null) {
                    let body = `Jenkins build \`#${build.name}\` of \`${owner}/${repo}\` failed after your last commit \`${build.commit.sha}\`: ${build.buildUrl}`
                    let address = new UserAddress(build.commit.author.person.chatId.id)
                    plan.add(new DirectedMessage(body, address))
                }
            }
            catch (e) {
                console.log((<Error>e).message)
            }
        }
        plan.add(message)
        return plan
    }
}
export const built = new Built()
