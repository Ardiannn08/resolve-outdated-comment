const core = require('@actions/core');
const github = require('@actions/github');
const accessToken = core.getInput('token');
const octokit = github.getOctokit(accessToken);
const filterUser = core.getInput('filter-user');
const mode = core.getInput('mode') || 'resolve';

async function run() {
  const edges = await getAllReviewThreadList();
  const filteredEdges = edges.filter((edge) => {
    const noOtherAuthorComments = edge.node.comments.edges.length == 1;
    const oudatedAndNeedToResolve = edge.node.isOutdated && !edge.node.isResolved

    console.log(filterUser);

    // no need to filterUser if not specify
    if (filterUser === '') {
      return noOtherAuthorComments && oudatedAndNeedToResolve;
    }

    return edge.node.comments.edges[0].node.author.login == filterUser && noOtherAuthorComments && oudatedAndNeedToResolve;
  });

  for (const edge of filteredEdges) {
    switch (mode) {
      case 'resolve':
        resolveThread(edge.node.id);
        break;
      case 'delete':
        deletePullRequestCommentReview(edge.node.comments.edges[0].node.id);
        break;
      default:
        core.setFailed(`unknown mode ${mode}`)
        break;
    }
  }
}

async function deletePullRequestCommentReview(id) {
  const mutation = `
    mutation DeletePullRequestReviewComment($id:ID!){
      deletePullRequestReviewComment(input:{
        id:$id
      }) {
        clientMutationId
      }
    }
  `

  const parameter = {
    id: id
  }

  await octokit.graphql(mutation, parameter)
}

async function resolveThread(id) {
  const mutation = `
    mutation ResolveThread($id:ID!){
      resolveReviewThread(input:{
        threadId:$id
      }) {
        clientMutationId
      }
    }
  `;

  const parameter = {
    id: id
  };

  await octokit.graphql(mutation, parameter);
}

async function getAllReviewThreadList() {
  const { edges, page_info } = await getReviewThreadList(null);
  if (page_info.hasNextPage) {
    const res = await getReviewThreadList(page_info.endCursor);
    return [...edges, ...res.edges];
  }

  return edges;
}

async function getReviewThreadList(cursor) {
  const query = `
    query GetReviewThreadList($repo_owner:String!, $repo_name:String!, $pull_request_number:Int!, $next_cursor:String){
      repository(owner:$repo_owner, name:$repo_name) {
        id
        pullRequest(number:$pull_request_number) {
          id
          reviewThreads(first:100, after: $next_cursor) {
            pageInfo{
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                comments(first:2){
                  edges{
                    node{
                      id
                      body
                      author{
                        login
                      }
                    }
                  }
                }
                isOutdated
                isResolved
              }
            }
          }
        }
      }
    }
  `

  const parameter = {
    repo_owner: github.context.repo.owner,
    repo_name: github.context.repo.repo,
    pull_request_number: await getPullRequestNumber(),
    next_cursor: cursor
  }

  const result = await octokit.graphql(query, parameter);
  return {
    edges: result.repository.pullRequest.reviewThreads.edges,
    page_info: result.repository.pullRequest.reviewThreads.pageInfo
  }
}

async function getPullRequestNumber() {
  if (github.context.payload.number) {
    return github.context.payload.number;
  }

  const branchName = github.context.payload.pull_request.head.ref;
  if (branchName == undefined) {
    core.setFailed(`branch ${branchName} is invalid`);
  }

  const query = `
    query GetPullRequest($repo_owner:String!, $repo_name:String!, $head_ref:String!) { 
      repository(owner:$repo_owner, name:$repo_name) {
        id
        pullRequests(headRefName:$head_ref, first: 1, states: OPEN) {
          edges {
            node {
              id
              number
            }
          }
        }
      }
    }
  `

  const parameter = {
    repo_owner: github.context.repo.owner,
    repo_name: github.context.repo.repo,
    head_ref: branchName
  }

  const result = await octokit.graphql(query, parameter);
  return result.repository.pullRequests.edges[0].node.number;
}

run();
