const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const sh = require('shelljs');
const util = require('util');
const gittar = require('gittar');
const { green, red } = require('chalk');

const shExec = util.promisify(sh.exec);

const isWindows = process.platform === 'win32';

const ProjectType = {
  Contract: 1,
  Library: 2,
  StatefullContract: 3
}

/**
 * Create a new sCrypt project with recommended dir structure, Prettier config,
 * testing lib, etc. Warns if already exists and does NOT overwrite.
 * @param {string} projType - The user's desired project type.
 * @param {object} argv - The arguments object provided by yargs.
 * @param {string} argv.name - The user's desired project name.
 * @return {Promise<void>}
 */
async function project(projType, { name }) {
  if (fs.existsSync(name)) {
    console.error(red(`Directory already exists. Not proceeding`));
    return;
  }

  // Git must be initialized before running `npm install` b/c Husky runs an
  // NPM `prepare` script to set up its pre-commit hook within `.git`.
  // Check before fetching project template, to not leave crud on user's system.
  if (!sh.which('git')) {
    console.error(red('Please ensure Git is installed, then try again.'));
    return;
  }


  sh.mkdir('-p', name); // Create path/to/dir with their desired name
  sh.cd(name); // Set dir for shell commands. Doesn't change user's dir in their CLI.

  // Initialize .git in the root, whether monorepo or not.
  await step('Initialize Git repo', 'git init -q');

  if (projType == ProjectType.Contract) {
    if (!(await fetchProjectTemplate("demo-contract"))) return;
  } else if (projType == ProjectType.Library) {
    if (!(await fetchProjectTemplate("demo-lib"))) return;
  } else if (projType == ProjectType.StatefullContract) {
    if (!(await fetchProjectTemplate("counter"))) return;
  } else {
    return;
  }

  // `/dev/null` on Mac or Linux and 'NUL' on Windows is the only way to silence
  // Husky's install log msg. (Note: The contract project template commits
  // package-lock.json so we can use `npm ci` for faster installation.)

  await step(
    'NPM install',
    `npm ci --silent > ${isWindows ? 'NUL' : '"/dev/null" 2>&1'}`
  );

  // Build the template contract so it can be imported into the ui scaffold
  await step('NPM build contract', 'npm run build --silent');

  await setProjectName('.', name.split(path.sep).pop());

  // `-n` (no verify) skips Husky's pre-commit hooks.
  //await step(
  //  'Git init commit',
  //  'git add . && git commit -m "Init commit" -q -n && git branch -m main'
  //);

  const resStr = `\nProject ${name} was successfully created!\n` +
    `\nAdd your Git repo URL and you're good to go:` +
    `\ncd ${name} && git remote add origin <your-repo-url>`;

  console.log(green(resStr));
  process.exit(0);
}

/**
 * Fetch project template.
 * @returns {Promise<boolean>} - True if successful; false if not.
 */
async function fetchProjectTemplate(projectName) {
  const step = 'Set up project';
  const spin = ora({ text: `${step}...`, discardStdin: true }).start();

  try {
    const src = 'github:sCrypt-Inc/scrypt-cli#master';
    await gittar.fetch(src, { force: true });

    // Note: Extract will overwrite any existing dir's contents. Ensure
    // destination does not exist before this.
    const TEMP = '.gittar-temp-dir';
    await gittar.extract(src, TEMP, {
      filter(path) {
        return path.includes(`templates/${projectName}/`);
      },
    });
    
    // Copy files into current working dir
    sh.cp(
      '-r',
      `${path.join(TEMP, 'templates', projectName)}${path.sep}.`,
      '.'
    );
    sh.rm('-r', TEMP);

    // Create a keys dir because it's not part of the project scaffolding given
    // we have `keys` in our .gitignore.
    sh.mkdir('keys');

    spin.succeed(green(step));
    return true;
  } catch (err) {
    spin.fail(step);
    console.error(err);
    return false;
  }
}

/**
 * Helper for any steps that need to call a shell command.
 * @param {string} step - Name of step to show user
 * @param {string} cmd - Shell command to execute.
 * @returns {Promise<void>}
 */
async function step(step, cmd) {
  const spin = ora({ text: `${step}...`, discardStdin: true }).start();
  try {
    await shExec(cmd);
    spin.succeed(green(step));
  } catch (err) {
    console.log(err);
    spin.fail(step);
    process.exit(1);
  }
}

/**
 * Step to replace placeholder names in the project with the properly-formatted
 * version of the user-supplied name as specified via `zk project <name>`
 * @param {string} dir - Path to the dir containing target files to be changed.
 * @param {string} name - User-provided project name.
 * @returns {Promise<void>}
 */
async function setProjectName(dir, name) {
  const step = 'Set project name';
  const spin = ora(`${step}...`).start();

  replaceInFile(path.join(dir, 'README.md'), 'PROJECT_NAME', titleCase(name));
  replaceInFile(
    path.join(dir, 'package.json'),
    'package-name',
    kebabCase(name)
  );

  spin.succeed(green(step));
}

/**
 * Helper to replace text in a file.
 * @param {string} file - Path to file
 * @param {string} a - Old text.
 * @param {string} b - New text.
 */
function replaceInFile(file, a, b) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(a, b);
  fs.writeFileSync(file, content);
}

function titleCase(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())
    .join(' ').replace("Scrypt", "sCrypt");
}

function kebabCase(str) {
  return str.toLowerCase().replace(' ', '-');
}

module.exports = {
  project,
  ProjectType,
  step,
  setProjectName,
  replaceInFile,
  titleCase,
  kebabCase,
};
