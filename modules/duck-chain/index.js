const colors = require('colors');
const readline = require('readline');
const {
  callApi,
  errors,
  logs,
  delay,
  randomBetweenNumber,
  getCurrentProfile,
} = require('../../base');

let REPEAT_QUACK = 0;
let NUMBER_OF_QUACK = 0;
const TASK = {
  SOCIAL: 'social_media',
  DAILY: 'daily',
  PARTNER: 'partner',
};

const MES_QUACK_LOSE = [
  'Gà vl',
  'Sắp hết mẹ điểm rồi',
  'Bấm thế bố chịu',
  'Thôi em xin anh',
  'Bấm như lozz',
];
const MES_QUACK_WIN = [
  'Bú',
  'Mút',
  'Hết nước chấm',
  'Được đấy',
  'Thế mới xứng đáng làm con trai của ta',
  'Trời độ',
  'Vãi loz bấm thế này ai chơi',
];

async function startExecuteQuack() {
  try {
    logs(
      colors.white(
        `Auto quack ${REPEAT_QUACK} lượt !, còn lại ${
          REPEAT_QUACK - NUMBER_OF_QUACK
        } lượt `,
      ),
    );
    do {
      const isSuccess = await executeQuack(NUMBER_OF_QUACK);
      if (isSuccess) {
        ++NUMBER_OF_QUACK;
      }
      await delay(2);
    } while (NUMBER_OF_QUACK <= REPEAT_QUACK);
    logs(colors.magenta(`Đủ ${REPEAT_QUACK} lượt quack !`));
  } catch (error) {
    errors('Thao tác quá nhanh, đang connect lại !');
    if (NUMBER_OF_QUACK < REPEAT_QUACK) {
      await delay(2);
      await startExecuteQuack(username);
    }
  }
}

async function executeQuack(startLoop) {
  const response = await callApi({
    url: 'https://preapi.duckchain.io/quack/execute?',
    method: 'GET',
    isQueryId: true,
  });

  const { decibel, quackRecords, result } = response?.data;
  const lastItem = quackRecords?.at(-1);
  const randomWin =
    MES_QUACK_WIN[Math.floor(Math.random() * MES_QUACK_WIN.length)];
  const randomLose =
    MES_QUACK_LOSE[Math.floor(Math.random() * MES_QUACK_LOSE.length)];

  logs(
    colors.cyan(
      `Quack ${colors.white(startLoop)} success: ${colors.yellow(decibel)} quack, ${
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

const getInfo = async () => {
  const response = await callApi({
    url: 'https://preapi.duckchain.io/user/info',
    method: 'GET',
    isQueryId: true,
  });

  if (!response) {
    errors('Query_id lỗi !');
    return;
  }

  const { decibels, boxAmount, quackTimes, quackRecords, cardId } =
    response?.data;

  const totalExecuteQuack = quackRecords.reduce((a, b) => a + +b, 0);
  logs(colors.green(`Đang có ${colors.yellow(decibels)} quack 🦆🦆🦆`));
  logs(colors.green(`Đang có ${colors.yellow(boxAmount)} hộp từ bạn bè ~~ !`));
  logs(colors.green(`CardId: ${colors.yellow(cardId)} `));
  logs(colors.green(`Đã quack ${colors.yellow(quackTimes)} lần !`));
  logs(
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

async function getQuestList(type, isGetListDone) {
  const urlInfo = 'https://preapi.duckchain.io/task/task_info?jobId=' + type;
  const urlList = 'https://preapi.duckchain.io/task/task_list?jobId=' + type;
  try {
    const url = isGetListDone ? urlInfo : urlList;
    const res = await callApi({
      url: url,
      method: 'GET',
      isQueryId: true,
    });

    if (res?.message !== 'SUCCESS') {
      errors(res?.message);
    }

    return res?.message === 'SUCCESS' ? res?.data : [];
  } catch (error) {
    return;
  }
}

async function doQuest(type) {
  try {
    const [allQuest, questDone] = await Promise.all([
      getQuestList(type),
      getQuestList(type, true),
    ]);

    if (!allQuest || !allQuest.length) return;

    const excludeTask = [7,  8];
    const listDone = [...questDone?.result?.progress, ...excludeTask] || [];
    const questUnComplete =
      allQuest?.filter((e) => !listDone.includes(e?.taskId)) || [];

    if (!questUnComplete.length) return;

    const { username } = await getCurrentProfile();

    for await (const task of questUnComplete) {
      const { taskId, content, taskType } = task;
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest : ${colors.white(content)} `) +
          colors.red('Đang làm... '),
      );
      await delay(2);
      const isFinish = await finishQuest(type, taskType, taskId);
      readline.cursorTo(process.stdout, 0);
      if (isFinish) {
        process.stdout.write(
          `[ ${colors.magenta(`${username}`)} ]` +
            colors.yellow(` Quest : ${colors.white(content)} `) +
            colors.green('Done !                  '),
        );
      } else {
        process.stdout.write(
          `[ ${colors.magenta(`${username}`)} ]` +
            colors.yellow(` Quest : ${colors.white(content)} `) +
            colors.red('Faild !                  '),
        );
      }
      console.log();
    }

    return questDone?.result?.progress?.includes(7)

  } catch (error) {}
}

async function finishQuest(typeQuest, type, id) {
  let typeActione = typeQuest === 'partner' ? typeQuest : type
  try {
    const url = `https://preapi.duckchain.io/task/${typeActione}?taskId=${id}`;
    const res = await callApi({
      url: url,
      method: 'GET',
      isQueryId: true,
    });
    return res?.message === 'SUCCESS';
  } catch (error) {
    return;
  }
}

async function dailyCheckin() {
  try {
    const url = `https://preapi.duckchain.io/task/sign_in?`;
    const res = await callApi({
      url: url,
      method: 'GET',
      isQueryId: true,
    });

    const isCheckinSuccess = res?.message === 'SUCCESS';
    if(isCheckinSuccess){
      logs('Checkin thành công !')
    }

    if(res?.message === 'No double check-in'){
      logs(colors.white('Hôm nay đã checkin rồi !'))
    }
  } catch (error) {
    return;
  }
}




async function processAccount(type, account) {
  if (type !== 'duck-chain') {
    return;
  }

  if (!account) {
    errors('Account không hợp lệ !');
    return;
  }
  NUMBER_OF_QUACK = 0;
  REPEAT_QUACK = randomBetweenNumber(15, 30);
  logs(colors.yellow('Duckchain start !'));
  const isAuth = await getInfo();
  if (!isAuth) return;
  await dailyCheckin()
  await startExecuteQuack();
  await doQuest(TASK.DAILY);
  await doQuest(TASK.PARTNER)
  await doQuest(TASK.SOCIAL)
  try {
  } catch (e) {
    errors(e);
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
