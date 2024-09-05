const {
  errors,
  logs,
  callApi,
  getCurrentProfile,
  delay,
} = require('../../base');
const colors = require('colors');
const readline = require('readline');

async function getUser(isAll = true) {
  const url = 'https://cats-backend-cxblew-prod.up.railway.app/user';

  const res = await callApi({
    url: url,
    method: 'GET',
    isQueryId: true,
  });

  if (!res || !res?.username) {
    errors('Query hết hạn !');
    return;
  }

  const {
    username,
    telegramAge,
    telegramAgeReward,
    totalRewards,
    tasksReward,
    referrerReward,
    premiumRewards,
  } = res;

  if (isAll) {
    logs('Login thành công 😎');
    logs(`Username: ${colors.yellow(username)} ☠`);
    logs(`Telegram ${colors.yellow(telegramAge)} tuổi`);
    logs(`Balance theo tuổi tele: ${colors.yellow(telegramAgeReward)}`);
    logs(`Balance ref: ${colors.yellow(referrerReward)}`);
    logs(`Balance task: ${colors.yellow(tasksReward)}`);
    // if (userNomisScore !== null && !!rewardPoints) {
    //   logs(`Nomis score: ${colors.yellow(rewardPoints)}`);
    // } else logs(`Connect ví để làm task nomis !!`)
    if (premiumRewards) {
      logs(`Balance Premium: ${colors.zebra(premiumRewards)}`);
    }
  }
  logs(`Balance all: ${colors.cyan(totalRewards)}`);
  return true;
}

async function doQuest(type) {
  const url =
    'https://cats-backend-cxblew-prod.up.railway.app/tasks/user?group=' +
    type;
  const res = await callApi({
    url: url,
    method: 'GET',
    isQueryId: true,
  });
  const { tasks } = res;

  const idExclude = [23, 5, 4, 49,2,3];
  const listQuestUnFinish = tasks.filter(
    (e) => !e.completed && !idExclude.includes(e?.id),
  );
  const isConnectBitgetWalletTask = listQuestUnFinish.find((e) => e?.id === 23);

  if (type === 'bitget') {
    if (isConnectBitgetWalletTask) {
      logs(`Còn quest ${isConnectBitgetWalletTask?.title} chưa làm !`.white);
    }
  }

  if (listQuestUnFinish.length) {
    logs(`Bắt đầu làm ${colors.cyan(listQuestUnFinish.length)} quest...`.white);
  } else {
    logs('Đã làm hết quest'.white);
    return;
  }

  const { username } = await getCurrentProfile();

  for await (const task of listQuestUnFinish) {
    const { id, title } = task;
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `[ ${colors.magenta(`${username}`)} ]` +
        colors.yellow(` Quest : ${colors.white(title)} `) +
        colors.red('Đang làm... '),
    );
    await delay(2);
    const isFinish = await finishQuest(id);
    readline.cursorTo(process.stdout, 0);
    if (isFinish) {
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest : ${colors.white(title)} `) +
          colors.green('Done !                  '),
      );
    } else {
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest : ${colors.white(title)} `) +
          colors.red('Faild !                  '),
      );
    }
    console.log();
  }
  logs('Đã xong hết tất cả các quest !');
  return true;
}

async function finishQuest(id) {
  const url = `https://cats-backend-cxblew-prod.up.railway.app/tasks/${id}/complete`;
  const res = await callApi({
    url: url,
    method: 'POST',
    isQueryId: true,
  });
  if(!res) return
  const { status } = res;
  return status === 'success';
}

async function taskNomis() {
  const url = `https://cats-backend-cxblew-prod.up.railway.app/tasks/nomis`;
  const res = await callApi({
    url: url,
    method: 'POST',
    isQueryId: true,
    body: {
      walletAddress: '',
    },
  });
  const { rewardPoints } = res;
  return rewardPoints;
}

async function processAccount(type, account) {
  if (type !== 'cats') {
    return;
  }

  if (!account) {
    errors('', 'Account không hợp lệ !');
    return;
  }

  const { username } = account;
  logs(colors.yellow('CATS start !', username));
  const isAuth = await getUser();
  if (!isAuth) return;
  await doQuest('cats');
  await doQuest('bitget');
  // await taskNomis()
  try {
  } catch (e) {
    errors('', e);
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
