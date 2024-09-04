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

let tickets = 0;
const questWhell = [
  {
    count: 1,
    type: 'bird',
    title: 'Join BIRD',
  },
  {
    count: 5,
    type: 'hour',
    title: 'Watching Video',
  },
  {
    count: 1,
    type: 'daily',
    title: 'Daily Gift',
  },
];

const getInfo = async (onlyBalance = false) => {
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
  const {
    balance,
    tasks,
    tickets: ticketsFromApi,
    daily_streak: { day },
  } = response?.result;
  if (onlyBalance) {
    logs(colors.green(`Balance: ${colors.yellow(formatNumber(balance))}`));
    return tasks;
  }
  logs(colors.green(`Balance: ${colors.yellow(formatNumber(balance))}`));
  logs(colors.green(`Tickets: ${colors.yellow(ticketsFromApi)}`));
  logs(colors.green(`Daily Streak : ${colors.yellow(day)}`));
  tickets = ticketsFromApi;
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
        colors.yellow(
          ` Quest Video ${colors.cyan(roundRunTask)}/${colors.cyan(
            max_count,
          )}: ${colors.white(title)} `,
        ) +
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
            colors.yellow(
              ` Quest Video ${colors.cyan(roundRunTask)}/${colors.cyan(
                max_count,
              )}: ${colors.white(title)} `,
            ) +
            colors.green('Done !                  '),
        );
      } else {
        process.stdout.write(
          `[ ${colors.magenta(`${username}`)} ]` +
            colors.yellow(
              ` Quest Video ${colors.cyan(roundRunTask)}/${colors.cyan(
                max_count,
              )}: ${colors.white(title)} `,
            ) +
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
    const questUnComplete =
      listQuest?.filter(
        (e) => !e?.is_claimed && !excludeTask.includes(e?.type),
      ) || [];

    if (!questUnComplete.length) return;

    const { username } = await getCurrentProfile();

    for await (const task of questUnComplete) {
      const { type, title } = task;

      if (type === 'video') {
        await doQuestViewShortVideo(task);
        continue;
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

async function finishQuest(typeQuest, isQuestWhell = false) {
  try {
    const urlTaskWhell = 'https://api.agent301.org/wheel/task';
    const url = `https://api.agent301.org/completeTask`;
    const res = await callApi({
      url: isQuestWhell ? urlTaskWhell : url,
      method: 'POST',
      isQueryId: true,
      typeQueryId: '',
      body: {
        type: typeQuest,
      },
    });

    return isQuestWhell ? res?.result : res?.result?.is_completed;
  } catch (error) {
    return;
  }
}

async function doQuestWhell() {
  try {
    const { username } = await getCurrentProfile();

    for await (const task of questWhell) {
      const { count, type, title } = task;
      let countQuest = 1;

      do {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(
          `[ ${colors.magenta(`${username}`)} ]` +
            colors.yellow(` Quest: ${colors.white(title)} `) +
            colors.red('Đang làm... '),
        );
        await delay(2);
        const isFinish = await finishQuest(type, true);
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
              colors.red('Hôm nay đã làm rồi !                  '),
          );
          countQuest = 10;
          console.log();
          continue;
        }
        ++countQuest;
        console.log();
      } while (countQuest <= count);
    }

    return questDone?.result?.progress?.includes(7);
  } catch (error) {}
}

async function spining() {
  try {
    const url = `https://api.agent301.org/wheel/spin`;
    const res = await callApi({
      url: url,
      method: 'POST',
      isQueryId: true,
      typeQueryId: '',
    });

    if (!res?.ok) {
      errors('Spin faild !   ');
      return;
    }

    const { balance, reward, tickets } = res?.result;
    logs(
      colors.green(
        `Balance: ${colors.yellow(formatNumber(balance))}`,
        `Reward: ${colors.yellow(reward)}`,
        `Tickets: ${colors.yellow(tickets)}`,
      ),
    );
    return res?.ok;
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
  tickets = 0;
  logs(colors.yellow('Agent-301 start !'));
  const listQuest = await getInfo();
  if (!listQuest) return;
  await doQuest(listQuest);
  await doQuestWhell();
  if (tickets) {
    do {
      await spining();
      --tickets;
      await delay(1);
    } while (tickets);
    await getInfo(true);
  } else {
    await getInfo(true);
  }
  try {
  } catch (e) {
    errors(e);
  }
}

const exportModules = {
  processAccount,
};

module.exports = exportModules;
