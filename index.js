const {
  delay,
  profileSumary,
  profile,
  loadConfig,
  setCurrentProfile,
  setCurrentProject,
  errors,
} = require('./base');
const colors = require('colors');
const { processAccount: processGoats } = require('./modules/goats');
const { processAccount: processCat } = require('./modules/cats');
const { processAccount: processDuck } = require('./modules/ducks');
const { processAccount: processBool } = require('./modules/bool');
const { processAccount: processDogX } = require('./modules/dogx');
const { processAccount: processDuckChain } = require('./modules/duck-chain');
const { processAccount: processCatsSmall } = require('./modules/cats-small');
const CONSTANT = require('./constant');
let runTheFirst = true;

async function startSession() {
  for await (const project of profile.keys()) {
    console.log('');
    const isRunningAllow = CONSTANT.PROJECT_REPEAT.includes(project);
    if (!runTheFirst && !isRunningAllow) {
      errors(
        `Đã setting dự án ${colors.cyan(
          project,
        )} dừng chạy sau lần chạy dầu tiên !`,
      );
      return;
    }

    await setCurrentProject(project);
    if (project === 'bool') {
      console.log(
        colors.red(
          `[ BOOL-WARNING ]: Phải là query_id bắt đầu bằng query_id hoặc copy payload của api "strict" thì app mới chạy !`,
        ),
      );
      console.log();
      await delay(2);
    }
    const listAccount = profile.get(project);

    if (!listAccount.length) return;

    for await (const account of listAccount) {
      await setCurrentProfile(account);
      switch (project) {
        case 'goats':
          await processGoats(project, account);
          break;
        case 'cats':
          await processCat(project, account);
          break;
        case 'ducks':
          await processDuck(project, account);
          break;
        case 'bool':
          await processBool(project, account);
          break;
        case 'duck-chain':
          await processDuckChain(project, account);
          break;
        case 'cats-small':
          await processCatsSmall(project, account);
          break;
        default:
          break;
      }
      console.log('');
      console.log(
        '-------------------------------[ 💤💤💤 ]-------------------------------',
      );
      console.log('');
      await delay(2);

    }
  }
  runTheFirst = false;
  await delay(CONSTANT.TIME_REPEAT_AGAIN, true);
  console.log('');
  await startSession();
}

(async function main() {
  console.log();
  await loadConfig('data.json');
  profileSumary();
  await startSession();
})();
