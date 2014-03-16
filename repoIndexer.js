var Q = require('q');
var tokens = require('./lib/tokens')();
var JSONStream = require('JSONStream');
var outStream = JSONStream.stringify();
outStream.pipe(process.stdout);

if (tokens.enabled > 0) {
  var githubClient = require('./lib/ghclient')(tokens);
  findRepositories(100000, []).fail(function(err) {
    console.error(err);
  });
} else {
  printTokenHelp();
}

function findRepositories(minStars) {
  // github client can only process 1000 records. Split that into pages:
  return githubClient.findRepo('stars:<' + minStars)
     .then(pause(5000))
     .then(processNextPage);

  function processNextPage(repositories) {
    var minWatchers;
    for (var i = 0; i < repositories.length; ++i) {
      var repo = repositories[i];
      minWatchers = repo.watchers;
      if (minWatchers >= 200) {
        outStream.write(repo);
      }
    }

    return findRepositories(minWatchers);
  }
}

function printTokenHelp() {
  [
    'Github access token is not present in environment variables',
    'Go to https://github.com/settings/applications and click "Create new token"',
    'Pass tokens as a comma-separated argument --tokens="A,B,C"'
  ].forEach(function (line) { console.log(line); });
}

function pause(timeMS) {
  return function (result) {
    var deferred = Q.defer();
    setTimeout(function () {
      deferred.resolve(result);
    }, timeMS);

    return deferred.promise;
  };
}
