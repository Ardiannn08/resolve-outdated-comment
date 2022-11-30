# Resolve Outdated Comment

To keep pull requests free of flooded comments, automatically resolve or remove `outdated` comments on pull requests from a specified GitHub user bot.

This feature will be useful when we have bots to review. Maybe there are a lot of comments from bot review, and after the requestor has fixed the comments, everything that is 'out of date' is still there, and it will make comments from other reviewers pile up or even make other reviewers not aware which parts are completely resolved and which are not.


**Notes:**
```
This flow is far from perfect, 
but it aims to produce the most frictionless experience possible considering technological limitations.
```

# Parameter
- **token**: GitHub Personal Access Token.
- **filter-user**: specify the checked bot user. 
- **mode**: `delete` / `resolve`
  - *delete*: remove an `oudated` comment completely.
  - *resolve*: resolve the conversation of `outdated` comment.

# Example Workflow

```yaml
name: "Auto Resolve Comment"
on: push
jobs:
  required_label:
    name: "Auto Resolve Comment"
    runs-on: ubuntu-latest
    steps:
      - uses: Ardiannn08/resolve-outdated-comment@v1.1
        with:
          token: ${{ secrets.GH_TOKEN }}
          filter-user: "your-bot-name"
          mode: "delete"
```

# Contribution
For now I don't think there will be any contributors, if you have problems or ideas for improvement, feel free to open an issue. I would ❤️ contributions to improve this action. 
