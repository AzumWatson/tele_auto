const colors = require('colors');
const readline = require('readline');
const {
  callApi,
  errors,
  logs,
  delay,
  randomBetweenNumber,
  getCurrentProfile,
  formatNumber,
} = require('../../base');

const getInfo = async () => {
  const response = await callApi({
    url: 'https://api.agent301.org/getMe',
    method: 'POST',
    isQueryId: true,
    typeQueryId: '',
    body: {
      referrer_id: 0,
    },
  });

  if (!response || !response?.ok) {
    errors('Query_id lỗi !');
    return;
  }
  const { balance, tasks } = response?.result;
  logs(colors.green(`Balance: ${colors.yellow(formatNumber(balance))}`));
  return tasks;
};

async function doQuestViewShortVideo(task) {
  if (!task) return;
  const { username } = await getCurrentProfile();
  const { count, max_count, title } = task;
  let roundRunTask = count;

  if (count >= max_count) return;

  try {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `[ ${colors.magenta(`${username}`)} ]` +
        colors.yellow(` Quest Video ${colors.cyan(roundRunTask)}/${colors.cyan(max_count)}: ${colors.white(title)} `) +
        colors.red('Đang làm... '),
    );
    do {
      const url = `https://api.agent301.org/completeTask`;
      const res = await callApi({
        url: url,
        method: 'POST',
        isQueryId: true,
        typeQueryId: '',
        body: {
          type: 'video',
        },
      });

      readline.cursorTo(process.stdout, 0);
      if (res?.result?.is_completed) {
        ++roundRunTask;
        process.stdout.write(
          `[ ${colors.magenta(`${username}`)} ]` +
            colors.yellow(` Quest Video ${colors.cyan(roundRunTask)}/${colors.cyan(max_count)}: ${colors.white(title)} `) +
            colors.green('Done !                  '),
        );
      } else {
        process.stdout.write(
          `[ ${colors.magenta(`${username}`)} ]` +
            colors.yellow(` Quest Video ${colors.cyan(roundRunTask)}/${colors.cyan(max_count)}: ${colors.white(title)} `) +
            colors.red('Faild !                  '),
        );
      }
      await delay(2);
    } while (roundRunTask < max_count);
    console.log();
  } catch (error) {
    return;
  }
}

async function doQuest(listQuest) {
  if (!listQuest.length) return;

  try {
    const excludeTask = ['boost'];
    const questUnComplete = listQuest?.filter((e) => !e?.is_claimed && !excludeTask.includes(e?.type)) || [];

    if (!questUnComplete.length) return;

    const { username } = await getCurrentProfile();

    for await (const task of questUnComplete) {
      const { type, title } = task;

      if (type === 'video') {
        await doQuestViewShortVideo(task);
        continue
      }

      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `[ ${colors.magenta(`${username}`)} ]` +
          colors.yellow(` Quest: ${colors.white(title)} `) +
          colors.red('Đang làm... '),
      );
      await delay(2);
      const isFinish = await finishQuest(type);
      readline.cursorTo(process.stdout, 0);
      if (isFinish) {
        process.stdout.write(
          `[ ${colors.magenta(`${username}`)} ]` +
            colors.yellow(` Quest: ${colors.white(title)} `) +
            colors.green('Done !                  '),
        );
      } else {
        process.stdout.write(
          `[ ${colors.magenta(`${username}`)} ]` +
            colors.yellow(` Quest: ${colors.white(title)} `) +
            colors.red('Faild !                  '),
        );
      }
      console.log();
    }

    return questDone?.result?.progress?.includes(7);
  } catch (error) {}
}

async function finishQuest(typeQuest) {
  try {
    const url = `https://api.agent301.org/completeTask`;
    const res = await callApi({
      url: url,
      method: 'POST',
      isQueryId: true,
      typeQueryId: '',
      body: {
        type: typeQuest,
      },
    });

    return res?.result?.is_completed;
  } catch (error) {
    return;
  }
}

async function processAccount(type, account) {
  if (type !== 'agent301') {
    return;
  }

  if (!account) {
    errors('Account không hợp lệ !');
    return;
  }
  logs(colors.yellow('Agent-301 start !'));
  const listQuest = await getInfo();
  if (!listQuest) return;
  await doQuest(listQuest);
  await getInfo();
  try {
  } catch (e) {
    errors(e);
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
