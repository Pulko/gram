import { randomUUID } from "crypto";
import { Request } from "express";
import { App } from "octokit";
import { AuthProvider } from "../../auth/AuthProvider";
import { Role } from "../../auth/models/Role";
import { UserToken } from "../../auth/models/UserToken";
import config from "config";

export class GithubAuthProvider implements AuthProvider {
  constructor(private app: App) {}
  async params() {
    const origin = config.get("origin");
    const { url } = this.app!.oauth.getWebFlowAuthorizationUrl({
      state: randomUUID(),
      redirectUrl: `${origin}/login/callback/github`,
    });
    return { redirectUrl: url, icon: "/assets/github/github-icon.svg" };
  }
  async getIdentity(request: Request): Promise<UserToken> {
    const code = request.query.code?.toString();
    const state = request.query.state?.toString();

    if (!code) {
      throw new Error("Invalid code-param in Github OAuth callback");
    }

    const {
      authentication: { token },
    } = await this.app.oauth.createToken({ code, state });

    // console.log(token);
    const octo = await this.app.oauth.getUserOctokit({ token });

    // Helpful: https://docs.github.com/en/graphql/overview/explorer
    const {
      viewer: { login, email, name, avatarUrl },
    } = (await octo.graphql(`{ 
      viewer { 
        login
        email
        name
        avatarUrl
      }
    }`)) as any; // hack as I didnt find types for gql

    const { data: installations } = await octo.request(
      "GET /user/installations",
      {}
    );

    return {
      roles: [Role.User],
      sub: login, //TODO get email (is currently null)
      teams: installations.installations.map((inst) => ({
        id: inst.id.toString(),
        name: inst.account?.login || inst.id.toString(),
      })),
      provider: this.key,
      name: name || login,
      picture: avatarUrl,
      providerToken: token,
    };
  }
  key: string = "github";
}