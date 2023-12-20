# BitBucket Pull Request Resource

Tracks BitBucket Pull Requests made to a particular repo.

## Deploying to Concourse

You need to add the resource type to your pipeline:

```yaml
resource_types:
  - name: bitbucket-pullrequest
    type: docker-image
    source:
      repository: halternz/bitbucket-pullrequest-resource
```

## Source Configuration

* `username`: *Required.* BitBucket username.

* `password`: *Required.* BitBucket password.

* `project`: *Required.* BitBucket project.

* `repository`: *Required.* BitBucket repository.

* `git`: *Required.* Configuration is based on the [Git resource](https://github.com/concourse/git-resource). The branch configuration from the original resource is ignored.

* `job_url`: *Optional.* Allow users to provide a custom Continuous Integration (CI) job URL. This parameter enables flexibility in reporting build status to an external system. (Concourse variables `$BUILD_TEAM_NAME, $BUILD_PIPELINE_NAME, $BUILD_JOB_NAME, $BUILD_NAME ,$BUILD_ID` are evaluated)

### Example

Resource configuration for pull requests against this repository:

``` yaml
resources:
  - name: pull-request
    type: bitbucket-pullrequest
    source:
      username: ((bitbucket-username))
      password: ((bitbucket-password))
      project: halternz
      repository: bitbucket-pullrequest-resource
      git:
        uri: git@bitbucket.org:halternz/bitbucket-pullrequest-resource.git
        private_key: ((bitbucket-ssh-private-key))
    webhook_token: ((webhook-token))
    check_every: 24h
```

Example pull request build flow:

``` yaml
jobs:
  - name: pull-request
    serial: true
    plan:
      - aggregate:
        - get: tasks
        - get: pull-request
          version: every
          trigger: true
      - put: pull-request
        params:
          state: INPROGRESS
          name: concourse ci
          path: pull-request
      - do:
        - task: unit-test
          file: tasks/unit-test.yml
          input_mapping: {src: pull-request}
        on_failure:
          put: pull-request
          params:
            state: FAILED
            name: concourse ci
            path: pull-request
        on_success:
          put: pull-request
          params:
            state: SUCCESSFUL
            name: concourse ci
            path: pull-request
```

## Behavior

### `check`: Check for new pull requests

Open pull requests against the chosen repository are fetched from BitBucket. If
new commits get added to the pull request a new version will be emitted.

### `in`: Clone the repository, at the given ref.

Clones the repository to the destination, and locks it down to a given ref.
It will return the same given ref as version.

### `out`: Update build status of pull request.

Update the build status of pull request with desired state.

#### Parameters

* `state`: *Required.* The state to set on the pull request, must be one of:
`INPROGRESS`, `SUCCESS` or `FAILED`

* `path`: *Required.* Path to the pull request input.

* `name`: *Required.* The name of the build result.

* `description`: *Optional.* Description of the build result.
