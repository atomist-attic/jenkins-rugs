/*
 * Copyright © 2017 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventHandler, Tags } from "@atomist/rug/operations/Decorators";
import {
    DirectedMessage, EventPlan, HandleEvent, LifecycleMessage, UserAddress,
} from "@atomist/rug/operations/Handlers";
import { GraphNode, Match, PathExpression } from "@atomist/rug/tree/PathExpression";

import { Build } from "@atomist/cortex/Build";

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
    public handle(event: Match<Build, Build>): EventPlan {
        const build = event.root();
        const plan = new EventPlan();

        const repo = build.repo.name;
        const owner = build.repo.owner;
        const cid = "commit_event/" + owner + "/" + repo + "/" + build.commit.sha;

        const message = new LifecycleMessage(build, cid);

        if (build.status === "failed" || build.status === "broken") {
            try {
                if (build.commit.author != null && build.commit.author.person != null) {
                    const body = `Jenkins build \`#${build.name}\` of \`${owner}/${repo}\` failed` +
                        ` after your last commit \`${build.commit.sha}\`: ${build.buildUrl}`;
                    const address = new UserAddress(build.commit.author.person.chatId.id);
                    plan.add(new DirectedMessage(body, address));
                }
            } catch (e) {
                console.log((e as Error).message);
            }
        }
        plan.add(message);
        return plan;
    }
}
export const built = new Built();
