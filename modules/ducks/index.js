const {
  errors,
  logs,
  callApi,
  getCurrentProfile,
  delay,
  setCurrentProfile,
} = require('../core');
const colors = require('colors');
const readline = require('readline');

async function login(isAll = true) {
  try {
    const url = 'https://api.duckcoop.xyz/auth/telegram-login';
    const user = await getCurrentProfile();

    const body = {
      auth_date: user?.auth_date,
      hash: user?.hash,
      query_id: user?.query_id_decode,
      user: user?.user,
    };

    const res = await callApi({
      url: url,
      method: 'POST',
      body: body,
      headersCustom: {
        Authorization: undefined,
      },
      isAuth: false,
    });
    const {
      ipAddr,
      token,
      geo: { city, country, ll, timezone },
      user_info: {
        evm_address,
        telegram_data: { username },
      },
    } = res?.data;
    const currentUser = await getCurrentProfile();
    const addToken = {
      ...currentUser,
      token: token,
    };
    await setCurrentProfile(addToken);

    if (isAll) {
      logs('Login thành công 😎');
      logs(`Username: ${colors.yellow(username)} ☠`);
      logs(
        `Khu vực: ${colors.yellow(city)} ${colors.yellow(
          country,
        )}, tọa độ: ${colors.yellow(ll.join(','))}, timeZone: ${colors.yellow(
          timezone,
        )}`,
      );
      logs(`Ip check: ${colors.yellow(ipAddr)}`);
      logs(
        `EVM Address:${
          evm_address ? colors.yellow(evm_address) : colors.red(' NO !')
        }`,
      );
    }
  } catch (error) {
    errors('Login thất bại ! Lấy lại query ');
  }
}

async function questDone() {
  const url = 'https://api.duckcoop.xyz/user-partner-mission/get';

  const res = await callApi({
    url: url,
    method: 'GET',
  });
  const { data } = res;
  return data;
}

async function doQuest() {
  const url = 'https://api.duckcoop.xyz/partner-mission/list';
  const res = await callApi({
    url: url,
    method: 'GET',
  });
  const { data } = res?.data;
  const listQuestDone = await questDone();
  const listIdQuestDone = listQuestDone.map((e) => e.partner_mission_id);
  const listQuest = data.map((e) => e.partner_missions).flat(1);
  const listQuestUnFinish = listQuest.filter(
    (e) => !listIdQuestDone.includes(e.pm_id),
  );

  if (listQuestUnFinish.length) {
    logs(`Bắt đầu làm ${colors.cyan(listQuestUnFinish.length)} quest...`.white);
  } else {
    logs('Đã làm hết quest'.white);
    return;
  }
  const { username } = await getCurrentProfile();

  for await (const task of listQuestUnFinish) {
    const { pm_id, title } = task;
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `[ ${colors.magenta(`${username}`)} ]` +
        colors.yellow(` Quest : ${colors.white(title)} `) +
        colors.red('Đang làm... '),
    );
    await delay(1);
    const isFinish = await finishQuest(pm_id);
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
  const url = `https://api.duckcoop.xyz/user-partner-mission/claim`;
  const res = await callApi({
    url: url,
    method: 'POST',
    body: {
      partner_mission_id: id,
    },
  });

  if (!res) return;
  const { data } = res;
  return data;
}

async function checkCreateWallet() {
  const url = `https://api-wallet.duckcoop.xyz/wallet/get`;
  const res = await callApi({
    url: url,
    method: 'GET',
  });
  const { error_code } = res;
  if (error_code === 'OK') {
    logs(colors.green('Đã tạo ví SOL trong Ducks !'));
  } else {
    logs(colors.red('Chưa tạo ví SOL trong Ducks !'));
  }
}

async function checkIn() {
  try {
    const url = `https://api.duckcoop.xyz/checkin/claim`;
    const res = await callApi({
      url: url,
      method: 'POST',
    });

    if (res?.error_code === 'DAILY_CHECKIN_CLAIMED') {
      logs(`Hôm nay đã checkin rồi !`);
      return;
    }
    const {
      data: { current_streak, status },
    } = res;
    if (status) {
      logs(
        `Checkin thành công liên tục ${colors.yellow(current_streak)} ngày !`,
      );
    }
  } catch (error) {
    errors(error);
  }
}

async function getBalance() {
  const url = `https://api.duckcoop.xyz/reward/get`;
  const res = await callApi({
    url: url,
    method: 'GET',
  });
  const { age, friends, premium, total } = res?.data;
  logs(`Balance Age Telegram: ${colors.yellow(parseFloat(age))} `);
  logs(`Balance Friend: ${colors.yellow(parseFloat(friends))} `);
  logs(`Balance Premium: ${colors.yellow(parseFloat(premium))} `);
  logs(`Balance Total: ${colors.yellow(parseFloat(total))} ☠`);
}

async function checkQuestDuckCommunity() {
  const url = `https://api.duckcoop.xyz/mission/mission-info`;
  const res = await callApi({
    url: url,
    method: 'GET',
  });
  const { data } = res;
  const taskUnComplete = data?.filter((e) => !e.is_success);
  if (taskUnComplete.length) {
    logs(
      colors.white(
        `Còn ${colors.yellow(
          taskUnComplete.length,
        )} task DuckCommunity chưa làm [ ${colors.yellow(
          taskUnComplete.map((e) => e.title).join(', '),
        )} ], task làm thủ công !`,
      ),
    );
  } else {
    logs(`Đã làm hết task DuckCommunity !!`);
  }
}

async function processAccount(type, account) {
  if (type !== 'ducks') {
    return;
  }

  if (!account) {
    errors('', 'Account không hợp lệ !');
    return;
  }

  const { username } = account;
  logs(colors.yellow('Ducks start !', username));
  await login();
  await checkCreateWallet();
  await checkIn();
  await getBalance();
  await checkQuestDuckCommunity();
  await doQuest();
  await getBalance();
  try {
  } catch (e) {
    errors('', e);
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
