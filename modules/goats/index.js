const {
  errors,
  logs,
  callApi,
  getCurrentProfile,
  setCurrentProfile,
  delay,
} = require('../../base');
const colors = require('colors');
const readline = require('readline');
const ID_QUEST_NOT_AUTO = [];

async function getInfo(isAll = true) {
  const url = 'https://dev-api.goatsbot.xyz/users/me';

  const res = await callApi({
    url: url,
    method: 'GET',
  });

  if (!res) return;

  const {
    age,
    balance,
    balance_age,
    balance_ref,
    balance_premium,
    is_premium,
    address,
    username,
  } = res;

  if (res?.statusCode === 401) {
    errors('Token hết hạn !');
    return;
  }

  if (username) {
    const currentUser = await getCurrentProfile();
    const dataUsername = {
      ...currentUser,
      username: username,
    };
    await setCurrentProfile(dataUsername);
  }
  if (isAll) {
    logs(`Telegram ${colors.yellow(age)} tuổi`);
    logs(`Balance theo tuổi tele: ${colors.yellow(balance_age)}`);
    logs(`Balance ref: ${colors.yellow(balance_ref)}`);
    if (is_premium) {
      logs(`Balance Premium: ${colors.zebra(balance_premium)}`);
    }
    logs(`${address ? 'Đã bind ví' : colors.red('Chưa bind ví')}`);
  }
  logs(`Balance all: ${colors.cyan(balance)}`);
  return true;
}

async function refreshToken() {
  try {
    const data = await getCurrentProfile();
    const { refreshToken: tokenRefreshData } = data;
    const url = 'https://dev-api.goatsbot.xyz/auth/refresh-tokens';
    const res = await callApi({
      url: url,
      method: 'POST',
      body: {
        refreshToken: tokenRefreshData,
      },
    });

    if (!res) {
      errors('Refresh token lỗi !');
      return;
    }
    const {
      tokens: {
        access: { token: accessToken },
        refresh: { token: tokenRefresh },
      },
    } = res;

    await setCurrentProfile({
      ...data,
      token: accessToken,
      refreshToken: tokenRefresh,
    });

    logs(`Refresh token thành công !`);
    await login()
    return res;
  } catch (error) {}
}

async function doQuest() {
  const url = 'https://api-mission.goatsbot.xyz/missions/user';
  const res = await callApi({
    url: url,
    method: 'GET',
  });
  const listQuest = Object.values(res).flat(1);
  const listQuestUnFinish = listQuest.filter(
    (e) => !e.status && !ID_QUEST_NOT_AUTO.includes(e._id),
  );
  const listQuestUnAutoComplete = listQuest.filter(
    (e) => !e.status && ID_QUEST_NOT_AUTO.includes(e._id),
  );
  if (listQuestUnAutoComplete.length) {
    logs(
      colors.green(
        `Quest làm thủ công chưa làm: ${colors.yellow(
          listQuestUnAutoComplete.map((e) => e.name).join(', '),
        )}`,
      ),
    );
  }

  if (listQuestUnFinish.length) {
    logs(`Bắt đầu làm ${colors.cyan(listQuestUnFinish.length)} quest...`.white);
  } else {
    logs('Đã làm hết quest'.white);
    return;
  }

  const data = await getCurrentProfile();
  const { username } = data;
  for await (const task of listQuestUnFinish) {
    const { _id, name } = task;
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `[ ${colors.magenta(`${username}`)} ]` +
        colors.yellow(` Quest : ${colors.white(name)} `) +
        colors.red('Đang làm... '),
    );
    await delay(2);
    const isFinish = await finishQuest(_id);
    readline.cursorTo(process.stdout, 0);
    if (isFinish) {
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest : ${colors.white(name)} `) +
          colors.green('Done !                  '),
      );
    } else {
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest : ${colors.white(name)} `) +
          colors.red('Faild !                  '),
      );
    }
    console.log();
  }
  logs('Đã xong hết tất cả các quest !');
  return true;
}

async function finishQuest(id) {
  try {
    const url = 'https://dev-api.goatsbot.xyz/missions/action/' + id;
    const res = await callApi({
      url: url,
      method: 'POST',
    });
    const { status } = res;
    return status === 'success';
  } catch (error) {
    return;
  }
}

async function dailyCheckin() {
  try {
    const url =
      'https://api-checkin.goatsbot.xyz/checkin/action/66cc7580df664984e4617ce0';
    const res = await callApi({
      url: url,
      method: 'POST',
    });

    const isCheckinSuccess = res?.status === 'success';
    if (isCheckinSuccess) {
      logs('Điểm danh thành công !');
    } else {
      logs(colors.white('Hôm nay đã điểm danh rồi !'));
    }
    return isCheckinSuccess;
  } catch (error) {
    return;
  }
}

async function login() {
  try {
    const data = await getCurrentProfile();
    const url = 'https://dev-api.goatsbot.xyz/auth/login';
    const res = await callApi({
      url: url,
      method: 'POST',
      isQueryId: true,
      typeQueryId: 'raw',
    });

    if (!res) {
      errors('Login lỗi, đang thử đăng nhập lại !');
      await refreshToken();
      return
    }

    const {
      tokens: {
        access: { token: accessToken },
        refresh: { token: tokenRefresh },
      },
    } = res;

    await setCurrentProfile({
      ...data,
      token: accessToken,
      refreshToken: tokenRefresh,
    });

    logs('Login thành công !');
    return true;
  } catch (error) {
    errors('Login lỗi, đang thử đăng nhập lại !');
    await refreshToken();
  }
}

async function processAccount(type, account) {
  if (type !== 'goats') {
    return;
  }

  if (!account) {
    errors('', 'Account không hợp lệ !');
    return;
  }

  logs(colors.yellow('GOATS start !'));
  const isAuth = await login();
  if (!isAuth) return;
  await getInfo();
  await dailyCheckin()
  const isReloadBalance = await doQuest();
  if (!isReloadBalance) return;
  await getInfo(false);
  try {
  } catch (e) {
    errors('', e);
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
