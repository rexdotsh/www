export interface GitHubRepository {
  name: string;
  stars: number;
  updated: string;
}

export interface GitHubActivity {
  action: string;
  date: string;
  id: string;
  repository: string;
  url: string;
}

export interface GitHubDesk {
  activity: GitHubActivity[];
  repositories: GitHubRepository[];
}

const ACTIONS: Record<string, string> = {
  PushEvent: "pushed to",
  PullRequestEvent: "worked on a pull request in",
  CreateEvent: "created something in",
  ReleaseEvent: "released something in",
  IssuesEvent: "tracked an issue in",
  IssueCommentEvent: "left a note in",
};

export function parseRepositories(value: unknown): GitHubRepository[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((repo) => {
    if (
      !repo ||
      repo.private === true ||
      typeof repo.name !== "string" ||
      !Number.isInteger(repo.stargazers_count) ||
      repo.stargazers_count < 0 ||
      typeof repo.pushed_at !== "string" ||
      !Number.isFinite(Date.parse(repo.pushed_at))
    )
      return [];
    return [
      {
        name: repo.name,
        stars: repo.stargazers_count,
        updated: repo.pushed_at,
      },
    ];
  });
}

export function parseActivity(value: unknown): GitHubActivity[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((event) => {
      const action = event && ACTIONS[event.type];
      const repository = event?.repo?.name;
      if (
        typeof action !== "string" ||
        typeof event.id !== "string" ||
        typeof repository !== "string" ||
        !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
        typeof event.created_at !== "string" ||
        !Number.isFinite(Date.parse(event.created_at)) ||
        event.public !== true
      )
        return [];
      return [
        {
          action,
          date: event.created_at,
          id: event.id,
          repository,
          url: `https://github.com/${repository}`,
        },
      ];
    })
    .slice(0, 5);
}
