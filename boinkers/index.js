const { delay } = require('../base');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const readline = require('readline');

const REPEAT_QUACK = 20;

const MES_QUACK_LOSE = ['Gà vl','Sắp hết mẹ điểm rồi','Bấm thế bố chịu','Thôi em xin anh','Bấm như lozz']
const MES_QUACK_WIN = ['Bú','Mút','Hết nước chấm','Được đấy','Thế mới xứng đáng làm con trai của ta','Trời độ','Vãi loz bấm thế này ai chơi']


const headers = {
  authority: '',
  'Content-Type': 'application/json',
  Origin: '',
  Priority: 'u=1, i',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': 'Windows',
  'Sec-Fetch-Dest': ' empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
};

const mapAuth = new Map();

function getHeader(username, customHeader) {
  if (!username) return { ...headers, ...customHeader };
  const { query_id } = getDataMapAuth(username);
  return { ...headers, Authorization: 'tma ' + query_id, ...customHeader };
}

async function setDataMapAuth(username, data) {
  mapAuth.set(username, data);
}

function getDataMapAuth(username) {
  return mapAuth.get(username);
}

function errors(username, message) {
  console.log(colors.red(`[ Error ]`), colors.red(message));
}

function logs(username, message) {
  console.log(colors.magenta(`[ ${username} ]`), message);
}

async function callApi({ url, method, headers, body }) {
  const res = await fetch(url, {
    method: method,
    headers: headers,
    body: JSON.stringify(body),
  });
  const response = await res.json();
  if (!response || response?.message !== 'SUCCESS') {
    errors('', 'Lỗi call api -' + response?.message);
    return;
  }
  return response;
}

async function processAccount(username) {
  const data = getDataMapAuth(username);
  if (!data) {
    errors('', 'Lỗi lấy data từ authMap ');
    return;
  }
  console.log();
  console.log(
    '-------- Account : ',
    colors.green(extUserName),
    ' running --------',
  );
  try {
    await getInfo(username);
  } catch (e) {
    errors(extUserName, e);
  }
}

async function startExecuteQuack(username) {
  let startLoop = 0;
  logs(username, colors.white(`Auto quack ${REPEAT_QUACK} lượt !`));
  do {
    const isSuccess = await executeQuack(username, startLoop);
    if (isSuccess) {
      ++startLoop;
    }
    await delay(2, true);
  } while (startLoop <= REPEAT_QUACK);
  logs(username, colors.magenta(`Đủ ${50} lượt quack !`));
}

async function executeQuack(username, startLoop) {
  const response = await callApi({
    url: 'https://tgapi.duckchain.io/quack/execute?',
    method: 'GET',
    headers: getHeader(username, {
      path: '/quack/execute?',
    }),
  });

  const { decibel, quackRecords, result } = response?.data;
  const lastItem = quackRecords?.at(-1);
  const randomWin = MES_QUACK_WIN[Math.floor(Math.random() * MES_QUACK_WIN.length)];
  const randomLose = MES_QUACK_LOSE[Math.floor(Math.random() * MES_QUACK_LOSE.length)];

  logs(
    username,
    colors.cyan(
      `Quack ${startLoop} success: ${decibel} quack, ${
        lastItem === 0
          ? 'Chả nhận đc tí quack chó nào'
          : lastItem > 0
          ? colors.green(`${randomWin} được hẳn ${lastItem} quack 🦆🦆🦆`)
          : colors.red(`${randomLose}, bị trừ ${lastItem} quack`)
      }`,
    ),
  );
  return result;
}

const getInfo = async (username) => {
  const response = await callApi({
    url: 'https://tgapi.duckchain.io/user/info',
    method: 'GET',
    headers: getHeader(username, {
      path: '/user/info',
    }),
  });

  const { decibels, boxAmount, quackTimes, quackRecords, cardId } =
    response?.data;

  const totalExecuteQuack = quackRecords.reduce((a, b) => a + +b, 0);
  logs(
    username,
    colors.green(`Đang có ${colors.yellow(decibels)} quack 🦆🦆🦆`),
  );
  logs(
    username,
    colors.green(`Đang có ${colors.yellow(boxAmount)} hộp từ bạn bè ~~ !`),
  );
  logs(username, colors.green(`CardId: ${colors.yellow(cardId)} `));
  logs(username, colors.green(`Đã quack ${colors.yellow(quackTimes)} lần !`));
  logs(
    username,
    colors.green(
      `Nhưng quack hơi gà, từ đầu đến giờ ${
        totalExecuteQuack > 0
          ? `quack thêm được ${colors.yellow(totalExecuteQuack)}`
          : `duma âm bằng này rồi ${colors.red(totalExecuteQuack)}`
      }`,
    ),
  );
  return response;
};

function extractUserData(queryId) {
  const decodedString = decodeURIComponent(queryId);
  const params = new URLSearchParams(decodedString);
  const user = JSON.parse(params.get('user'));
  return {
    extUserId: user.id,
    extUserName: user.username,
    queryDecode: decodedString,
    user: user,
    query_id: queryId,
  };
}

async function loadProfile() {
  try {
    const dataFile = path.join(__dirname, 'data.txt');
    const v = fs
      .readFileSync(dataFile, 'utf8')
      .replace(/\r/g, '')
      .split('\n')
      .filter(Boolean);

    if (v.length) {
      for await (let a of v) {
        const data = extractUserData(a);
        const { extUserName } = data;
        if (!extUserName) {
          errors('', 'Lỗi đọc query_id ! Lấy lại query_id ');
          return;
        }
        await setDataMapAuth(extUserName, data);
      }
      console.log(` Load thành công profile `.green);
      return v;
    }
    console.log(colors.red('Không tìm thấy thông tin nào trong data.txt'));
    return [];
  } catch (e) {
    console.log(colors.red('Không thể load profile: ', e));
  }
}

async function waitWithCountdown(seconds) {
  for (let i = seconds; i >= 0; i--) {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `===== Đã hoàn thành tất cả tài khoản, chờ ${i} giây để tiếp tục vòng lặp =====`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log('');
}

async function eventLoop() {
  for await (const username of mapAuth.keys()) {
    await processAccount(username);
    await delay(1, true);
  }
    const timeWait = 30 * 60; //30p
    await waitWithCountdown(timeWait);
    await eventLoop();
}

(async function main() {
  await loadProfile();
  await delay(1, true);
  await eventLoop();
})();
