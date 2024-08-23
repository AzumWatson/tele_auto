const {
  delay,
  profileSumary,
  profile,
  loadConfig,
  setCurrentProfile,
  setCurrentProject,
} = require('./base');
const colors = require('colors');
const { processAccount: processGoats } = require('./modules/goats');
const { processAccount: processCat } = require('./modules/cats');
const { processAccount: processDuck } = require('./modules/ducks');
const { processAccount: processBool } = require('./modules/bool');

async function startSession() {
  for await (const project of profile.keys()) {
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
        // case 'dogx':
        //   await processDogX(project, account);
        //   break;
        default:
          break;
      }
      console.log('--------------------------------------------------');
      await delay(3);
    }
    console.log('');
  }
}

(async function main() {
  await loadConfig('data.json');
  console.log('');
  profileSumary();
  console.log('');
  await startSession();
})();
