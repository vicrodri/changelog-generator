const child = require('child_process');
const fs = require("fs");

const latestTag = child.execSync('git describe --tags').toString('utf-8').split('-')[0];
const output = child.execSync(`git log --format=%B%H----DELIMITER----`).toString('utf-8');

const commitsArray = output.split('----DELIMITER----\n').map(commit => {
  const [message, sha] = commit.split('\n');

  return { sha, message };
}).filter(commit => Boolean(commit.sha));

console.log({ commitsArray });

const currentChangelog = fs.readFileSync("./CHANGELOG.md", "utf-8");
const currentVersion = Number(require("./package.json").version);
const newVersion = (currentVersion + 1);

let newChangelog = `# Version ${newVersion} (${
  new Date().toISOString().split("T")[0]
})\n\n`;

const features = [];
const fixes = [];

commitsArray.forEach(commit => {
  if (commit.message.includes("[FEATURE")) {
    features.push(
      `* ${commit.message} ([${commit.sha.substring(
        0,
        6
      )}])\n`
    );
  }
  if (commit.message.includes("[FIX")) {
    fixes.push(
      `* ${commit.message} ([${commit.sha.substring(
        0,
        6
      )}])\n`
    );
  }
});

if (features.length) {
  newChangelog += `## Features\n`;
  features.forEach(feature => {
    newChangelog += feature;
  });
  newChangelog += '\n';
}

if (fixes.length) {
  newChangelog += `## Fixes\n`;
  fixes.forEach(fix => {
    newChangelog += fix;
  });
  newChangelog += '\n';
}

// prepend the newChangelog to the current one
fs.writeFileSync("./CHANGELOG.md", `${newChangelog}${currentChangelog}`);

// update package.json
fs.writeFileSync("./package.json", JSON.stringify({ version: String(newVersion) }, null, 2));

// create a new commit
child.execSync('git add .');
child.execSync(`git commit -m "[FEATURE]: Bump to version ${newVersion}"`);

// tag the commit
child.execSync(`git tag v0.0.${newVersion}`);