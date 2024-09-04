const {
  errors,
  logs,
  callApi,
  getCurrentProfile,
  delay,
  setCurrentProfile,
  formatNumber,
} = require('../../base');
const colors = require('colors');
const readline = require('readline');

async function login() {
  try {
    const url = 'https://uat-api.sunkong.cloud/v1/login';
    const account = await getCurrentProfile();
    const res = await callApi({
      url: url,
      method: 'POST',
      body: {
        init_data: account?.query_id,
      },
    });

    if (!res) {
      errors('Login thất bại, lấy lại query_id !');
      return;
    }

    const {
      token: { access_token },
      point,
    } = res;

    const addToken = {
      ...account,
      token: access_token,
    };
    await setCurrentProfile(addToken);

    logs(`Balance: ${colors.yellow(formatNumber(point))} 💰`);
    return access_token;
  } catch (error) {
    console.log(error);

    errors('Login thất bại, lấy lại query_id !');
  }
}

async function doQuest() {
  const url = 'https://uat-api.sunkong.cloud/v1/missions';
  const res = await callApi({
    url: url,
    method: 'GET',
  });

  if (!res) {
    errors('Lấy danh sách nhiệm vụ lỗi !');
    return;
  }

  const tasks = [...res];

  const excludeTask = ['INVITE'];

  const listQuestUnFinish = tasks.filter(
    (e) => !e.is_done && !excludeTask.includes(e?.type),
  );

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
    const isChecked = await checkTask(id);
    if (!isChecked) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest : ${colors.white(title)} `) +
          colors.red('Start quest thất bại !            '),
      );
      console.log();
      continue;
    }

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
  try {
    const url = `
  https://uat-api.sunkong.cloud/v1/missions/claim/${id}`;
    const res = await callApi({
      url: url,
      method: 'POST',
    });
    return res;
  } catch (error) {}
}

async function checkTask(id) {
  try {
    const url = `https://uat-api.sunkong.cloud/v1/missions/complete/${id}`;
    const res = await callApi({
      url: url,
      method: 'POST',
    });
    return res;
  } catch (error) {}
}

async function checkFriendClaim() {
  try {
    const url = `https://uat-api.sunkong.cloud/v1/referral`;
    const res = await callApi({
      url: url,
      method: 'GET',
    });
    if (!res) {
      errors('Không thể lấy danh sách bạn bè !');
      return;
    }

    if (res?.claimable) {
      logs(`Đang có ${res?.claimable} điểm chưa claim từ bạn bè !`);
      return res?.claimable;
    }
  } catch (error) {}
}

async function claimFriend() {
  try {
    const url = `https://uat-api.sunkong.cloud/v1/referral/withdraw`;
    const res = await callApi({
      url: url,
      method: 'POST',
    });
    if (!res) {
      errors('Lỗi claim điểm từ bạn bè !');
      return;
    }

    if (res?.point) {
      logs(
        `Claim thành công, balance: ${colors.yellow(
          formatNumber(res?.point),
        )} `,
      );
    } else {
      errors('Lỗi claim điểm từ bạn bè !');
    }
  } catch (error) {}
}

async function processAccount(type, account) {
  if (type !== 'sunkong') {
    return;
  }

  if (!account) {
    errors('', 'Account không hợp lệ !');
    return;
  }

  const isAuth = await login();
  if (!isAuth) return;
  const hasQuest = await doQuest();
  const hasFriendClaim = await checkFriendClaim();
  if (hasQuest || hasFriendClaim) {
    if (hasFriendClaim) {
      await claimFriend();
    } else await login();
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
