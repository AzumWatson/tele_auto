const {
  errors,
  logs,
  callApi,
  getCurrentProfile,
  delay,
  setCurrentProfile,
} = require('../../base');
const colors = require('colors');
const readline = require('readline');
let processTaskDaily = [];

const DAYLY_TASK = {
  isDailyCheck: 'check-daily',
  isDailyIconTiktok: 'check-icon-tiktok',
  isDailyIconX: 'check-icon-x',
  isDailyTask: 'check-daily-task',
  isDailyTaskTiktok: 'check-daily-task-tiktok',
  isDailyTaskYoutube: 'check-daily-task-youtube',
  isFollowTiktok: 'check-follow-tiktok',
  isFollowYoutube: 'check-follow-youtube',
  isGoodCat: 'check-good-cat',
  statusJoin: 'check-join',
  statusFollow: 'check-follow',
};

async function getUser(isAll = true) {
  const data = await getCurrentProfile();
  const url =
    'https://cats-age-be-54r6.onrender.com/user/info?telegramId=' +
    data?.telegram_id;

  const res = await callApi({
    url: url,
    method: 'GET',
    isAuth: false,
  });

  if (res.message !== 'Get user info success') {
    errors(res?.message);
    return;
  }

  const {
    data: {
      balance,
      balanceYear,
      connectWalletStatus,
      isBlackList,
      isDailyCheck,
      referralBy,
      userName,
      walletAddress,
      isDailyCheckPoint,
      year,
    },
  } = res;

  await setCurrentProfile({
    ...data,
    username: userName,
  });

  if (isAll) {
    logs('Login thành công 😎');
    logs(`Username: ${colors.yellow(userName)} ☠`);
    logs(`Telegram ${colors.yellow(year)} tuổi`);
    logs(`Balance theo tuổi tele: ${colors.yellow(balanceYear)}`);
    logs(`Referral: ${colors.yellow(referralBy.length)}`);
    logs(`Daily Point: ${colors.yellow(isDailyCheckPoint)}`);
    logs(
      `Wallet: ${
        connectWalletStatus
          ? colors.yellow(walletAddress)
          : colors.red('Chưa connect wallet !')
      } `,
    );
    logs(
      `Daily: ${
        isDailyCheck
          ? colors.yellow('Hôm nay đã điểm danh !')
          : colors.red('Chưa điểm danh !')
      }`,
    );
    logs(
      `BlackList Account: ${
        !isBlackList
          ? colors.yellow('Vẫn đang yên bình !')
          : colors.red('Đụ má bị DEV ghim rồi !')
      }`,
    );
  }
  logs(`Balance all: ${colors.cyan(balance)}`);

  const taskUnComplete = [];
  const allTask = Object.keys(DAYLY_TASK);
  const response = res?.data;

  allTask.forEach((taskKey) => {
    const isComplete = response[taskKey];
    if (isComplete) return;
    taskUnComplete.push(taskKey);
  });

  if (!taskUnComplete.length) {
    logs(colors.white('Đã làm hết quest ngày hôm nay !'));
    return;
  }

  processTaskDaily = [...taskUnComplete];
  return true;
}

async function doQuest() {
  if (!processTaskDaily.length) return;
  const { username } = await getCurrentProfile();

  for await (const task of processTaskDaily) {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `[ ${colors.magenta(`${username}`)} ]` +
        colors.yellow(` Quest : ${colors.white(task)} `) +
        colors.red('Đang làm... '),
    );
    await delay(1);
    const isFinish = await claimQuest(DAYLY_TASK[task]);
    readline.cursorTo(process.stdout, 0);
    if (isFinish) {
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest : ${colors.white(task)} `) +
          colors.green('Done !                  '),
      );
    } else {
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest : ${colors.white(task)} `) +
          colors.red('Faild !                  '),
      );
    }
    console.log();
  }

  logs('Đã làm xong hết quest !');
}

async function claimQuest(quest) {
  
  try {
    const { telegram_id } = await getCurrentProfile();
    const url = 'https://cats-age-be-54r6.onrender.com/user/' + quest;

    const res = await callApi({
      url: url,
      method: 'POST',
      isAuth: false,
      body: {
        telegramId: telegram_id,
      },
    });

    if (!res) return;
    const { message } = res;
    return message === 'Done task';
  } catch (error) {}
}

async function processAccount(type, account) {
  processTaskDaily = [];
  if (type !== 'cats-small') {
    return;
  }

  if (!account) {
    errors('', 'Account không hợp lệ !');
    return;
  }

  logs(colors.yellow('Cats-small start !'));
  const hasQuestUnComplete = await getUser();
  if (!hasQuestUnComplete) return;
  await doQuest();
  await getUser(false);
  try {
  } catch (e) {
    errors('', e);
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
