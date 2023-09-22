import { TeamProvider } from "@gram/core/dist/auth/TeamProvider";
import { Team } from "@gram/core/dist/auth/models/Team";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { Entry } from "ldapts";
import { LDAPClientSettings } from "./LDAPClientSettings";
import { connectLdapClient, ldapQuery, ldapQueryOne } from "./lookup";
import { escapeFilterValue, getAttributeAsArray } from "./util";

export interface LDAPTeamProviderSettings {
  ldapSettings: LDAPClientSettings;

  teamLookup: {
    searchBase: string;
    searchFilter: (teamIds: string[]) => string;
    attributes: string[];
    attributesToTeam: (ldapEntry: Entry) => Promise<Team>;
  };

  userLookup: {
    searchBase: string;
    searchFilter: (sub: string) => string;
    teamAttribute: string;
  };
}

export class LDAPTeamProvider implements TeamProvider {
  constructor(public settings: LDAPTeamProviderSettings) {}

  async lookup(ctx: RequestContext, teamIds: string[]): Promise<Team[]> {
    const ldap = await connectLdapClient(this.settings.ldapSettings);
    try {
      const ldapResult = await ldapQuery(
        ldap,
        this.settings.teamLookup.searchBase,
        {
          scope: "sub",
          filter: this.settings.teamLookup.searchFilter(teamIds),
          attributes: this.settings.teamLookup.attributes,
        }
      );

      const teams = await Promise.all(
        ldapResult.searchEntries.map((entry) =>
          this.settings.teamLookup.attributesToTeam(entry)
        )
      );

      return teams;
    } finally {
      await ldap.unbind();
    }
  }

  async getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]> {
    const ldap = await connectLdapClient(this.settings.ldapSettings);

    try {
      const escapedUserId = escapeFilterValue(userId);

      const ldapUser = await ldapQueryOne(
        ldap,
        this.settings.userLookup.searchBase,
        {
          scope: "sub",
          filter: this.settings.userLookup.searchFilter(escapedUserId),
          attributes: [this.settings.userLookup.teamAttribute],
        }
      );

      if (ldapUser === null) return [];

      const groups = getAttributeAsArray(
        ldapUser,
        this.settings.userLookup.teamAttribute
      );
      const teams = await this.lookup(ctx, groups);
      return teams;
    } finally {
      await ldap.unbind();
    }
  }

  key = "ldap";
}
