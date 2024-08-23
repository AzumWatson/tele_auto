const { errors, logs, callApi, getCurrentProfile, delay, setCurrentProfile } = require('../../base');
const colors = require('colors');
const readline = require('readline');

async function login(isAll = true) {
  const url = 'https://api.dogx.io/api/oauth/telegram';
  const account = await getCurrentProfile()
  const res = await callApi({
    url: url,
    method: 'POST',
    body:{
      initData: account?.query_id
    }
  });

  const {
    access_token,
    information:{
      point,
      twitterUsername,
      username
    }
  } = res?.data;

  const currentUser = await getCurrentProfile();
  const addToken = {
    ...currentUser,
    token: access_token,
  };
  await setCurrentProfile(addToken);

  if (isAll) {
    logs('Login thành công 😎');
    logs(`Username: ${colors.yellow(username)} ☠`);
    logs(`Username Tweeter: ${colors.yellow(twitterUsername)}`);
  }
  logs(`Balance all: ${colors.cyan(point)}`);
  return twitterUsername
}

async function doQuest() {
  const url = 'https://interface-dogx.vercel.app/mission?_rsc=y9jm5';
  const res = await callApi({
    url: url,
    method: 'GET',
  });
  
  const listQuestUnFinish = tasks.filter((e) => !e.completed && e?.id !== 23);
  const isConnectBitgetWalletTask = listQuestUnFinish.find((e) => e?.id === 23)

  if(type === 'bitget'){
    if(isConnectBitgetWalletTask){
      logs(`Còn quest ${isConnectBitgetWalletTask?.title} chưa làm !`.white)
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
  const url = `https://cats-backend-production.up.railway.app/tasks/${id}/complete`;
  const res = await callApi({
    url: url,
    method: 'POST',
  });
  const { status } = res;
  return status === 'success';
}


async function checkTask() {
  const account = await getCurrentProfile()

  const url = `https://api.dogx.io/api/tasks/` + account?.userId;
  const res = await callApi({
    url: url,
    method: 'GET',
  });
  
  const { message, data: { verifyTwitter } } = res;
  
  if(verifyTwitter){
    logs('Đã verify X !'.green)
    return true
  }
  if(message){
    errors(message)
  }
}


async function processAccount(type, account) {
  if (type !== 'dogx') {
    errors(`Project DOGX not support type ${type}`);
    return;
  }

  if (!account) {
    errors('', 'Account không hợp lệ !');
    return;
  }

  const { username } = account;
  logs(colors.yellow('DOGX start !', username));
  await login();
  const isClaimQuest = await checkTask()
  if(!isClaimQuest) return
  await doQuest()
  try {
  } catch (e) {
    errors('', e);
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
