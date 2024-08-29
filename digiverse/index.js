const {
  delay,
  loadProfileTxt,
  setCurrentProfile,
  getCurrentProfile,
  callApi,
  errors,
  logs,
  toVietNamTime,
  setCurrentProject,
  randomBetweenNumber,
  getCurrentProject,
} = require('../base');

const colors = require('colors');
const readline = require('readline');

const mapAuth = new Map();

async function login(data) {
  try {
    const payload = {
      uid: data?.userId,
      first_name: data?.user?.first_name,
      last_name: data?.user?.last_name,
      username: data?.user?.username,
      tg_login_params: data?.query_id,
    };
    const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/user/login';
    const res = await callApi({
      url: url,
      method: 'POST',
      body: payload,
    });

    if (!res) {
      errors('Login thất bại !');
      return;
    }

    logs('Login thành công !');
    const { token } = res?.data;
    await setCurrentProfile({ ...data, token: token });
    return token;
  } catch (error) {}
}

async function getProfile() {
  try {
    const user = await getCurrentProfile();
    const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/user/profile';
    const res = await callApi({
      url: url,
      method: 'POST',
      body: {
        uid: user?.userId,
      },
      tokenType: '',
    });

    if (!res || res?.code !== 200) {
      errors('Lấy thông tin profile thất bại !');
      return;
    }

    const {
      Balance,
      InviteCount,
      InviteLimit,
      RegistrationIp,
      total_speed,
      IsBot,
    } = res?.data;

    logs(`Balance: ${colors.yellow((Balance / 1000).toFixed(4))}`);
    logs(`Đã invite ${colors.white(`${InviteCount}/${InviteLimit}`)}`);
    logs(`IP tạo account: ${colors.yellow(RegistrationIp)}`);
    logs(`Minning speed: ${colors.yellow(total_speed)}`);
    logs(
      `Check BOT: ${
        !IsBot
          ? colors.yellow('Không phải BOT !')
          : colors.red('Hệ thống xác nhận tài khoản này là BOT !')
      }`,
    );
    return;
  } catch (error) {}
}

async function getStatusDaily() {
  try {
    const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/daily/task/status';
    const res = await callApi({
      url: url,
      method: 'GET',
      tokenType: '',
    });

    if (!res || res.code !== 200) {
      errors('Lấy boots daily thất bại ! !');
      return;
    }
    const listBoots = [...res?.data];
    for await (const boot of listBoots) {
      logs(
        `Boots: ${colors.white(boot?.content)} ${boot?.current_count}/${
          boot?.task_count
        }`,
      );
      if (boot?.current_count < boot?.task_count) {
        let currentCount = boot?.current_count;
        do {
          logs(
            `Đang mua boot ${colors.white(boot?.type)} ${colors.yellow(
              `${currentCount}/${boot?.task_count}`,
            )}`,
          );
          await delay(2);
          await activeBoots(boot?.type);
          ++currentCount;
        } while (currentCount < boot?.task_count);
      }
    }
  } catch (error) {
    console.log('error __', error);

    errors('Lấy boots daily thất bại !');
  }
}

async function activeBoots(typeBoots) {
  try {
    const user = await getCurrentProfile();
    const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/daily/task/purchase';
    const res = await callApi({
      url: url,
      method: 'POST',
      tokenType: '',
      body: {
        uid: user?.userId,
        type: typeBoots,
      },
    });

    const isSuccess = res?.code === 200;
    switch (typeBoots) {
      case 'daily':
        isSuccess
          ? logs(`Mua boots thành công !`)
          : logs(`Đang dùng boots cho lần đào này !`.yellow);
        break;
      case 'mystery':
        logs(`Mua boots ${typeBoots}: ${colors.yellow(res?.data)}`);
        break;
      case 'mystery':
      case 'mystery':
        logs(`Mua boots ${typeBoots}: ${colors.yellow(res?.data)}`);
        break;
      default:
        return;
    }
    return isSuccess;
  } catch (error) {
    errors(`Mua boots ${typeBoots} thất bại !`);
  }
}

async function dailyCheckIn() {
  try {
    const url =
      'https://tgapp-api.digibuy.io/api/tgapp/v1/daily/task/checkIn/status';
    const res = await callApi({
      url: url,
      method: 'GET',
      tokenType: '',
    });

    if (!res || res?.code !== 200) {
      errors('CheckIn thất bại !!');
      return;
    }

    logs(`CheckIn thành công !`);
  } catch (error) {
    errors('CheckIn thất bại !!');
  }
}

async function getStatusFarming() {
  try {
    const user = await getCurrentProfile();
    const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/point/reward';
    const res = await callApi({
      url: url,
      method: 'POST',
      body: {
        uid: user?.userId,
      },
      tokenType: '',
    });

    if (!res || res?.code !== 200) {
      errors(res?.message || 'Lấy trạng thái farming lỗi !');
      return;
    }
    const { next_claim_timestamp, reward } = res?.data;
    logs(
      `Đang farming được ${colors.yellow(
        (reward / 1000).toFixed(4),
      )}, thời gian claim ${colors.cyan(toVietNamTime(next_claim_timestamp))}`,
    );
  } catch (error) {
    errors(error || 'Lấy trạng thái farming lỗi !');
  }
}

async function getIdGame() {
  try {
    const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/game/play';
    const res = await callApi({
      url: url,
      method: 'GET',
      tokenType: '',
    });

    if (!res || res?.code !== 200) {
      errors(res?.message || 'Lấy id game lỗi !');
      return;
    }
    const { game_count, game_id } = res?.data;
    return {
      game_count,
      game_id,
    };
  } catch (error) {
    errors(error || 'Lấy id game lỗi !');
  }
}

async function claimGame(id) {
  try {
    const pointEarn = randomBetweenNumber(149, 153);
    const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/game/claim';
    const res = await callApi({
      url: url,
      method: 'POST',
      tokenType: '',
      body: {
        game_id: id,
        point: pointEarn,
      },
    });

    if (!res || res?.code !== 200) {
      errors(res?.message || 'Lấy id game lỗi !');
      return;
    }

    return res?.code === 200 ? pointEarn : undefined;
  } catch (error) {
    errors(error || 'Claim game thất bại !');
  }
}

async function playGame() {
  try {
    let maxGame = 1;
    do {
      const resGetId = await getIdGame();
      if (!resGetId) return;
      const { game_count, game_id } = resGetId;
      maxGame = game_count;
      --maxGame;
      if (!!maxGame) {
        logs(`Hôm nay đã hết lượt chơi !`);
        return;
      }
      logs(
        `Bắt đầu chơi game ${colors.yellow(game_id)}, còn ${colors.yellow(
          maxGame,
        )} game !`,
      );
      await delay(30);
      const isClaimed = await claimGame(game_id);
      isClaimed
        ? logs(`Kiếm được ${isClaimed} điểm !`)
        : logs(`Claim điểm game !`);
      await delay(2);
    } while (!!maxGame);
  } catch (error) {
    errors(error || 'Lấy trạng thái farming lỗi !');
  }
}

async function doQuest() {
  try {
    const user = await getCurrentProfile();
    const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/tasks/list';
    const res = await callApi({
      url: url,
      method: 'POST',
      tokenType: '',
      body: {
        uid: user?.userId,
      },
    });

    if (!res || res?.code !== 200) {
      errors(res?.message || 'Lấy nhiệm vụ lỗi !');
      return;
    }
    const allQuest = Object.values(res?.data)
      .flat(1)
      .filter((e) => !e?.complete);
    if (!allQuest.length) {
      logs('Đã làm hết quest !');
      return;
    }

    const project = await getCurrentProject();

    for await (const task of allQuest) {
      const { type, name } = task;
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `${colors.cyan(
          `[ ${project.toUpperCase()} - ${user?.user?.username} ]`,
        )}` +
          colors.yellow(` Quest : ${colors.white(type)} `) +
          colors.red('Đang làm... '),
      );
      const isComplete = await competeQuest(name);
      if (!isComplete) {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(
          `${colors.cyan(
            `[ ${project.toUpperCase()} - ${user?.user?.username} ]`,
          )}` +
            colors.yellow(` Quest : ${colors.white(type)} `) +
            colors.red('Làm nhiệm vụ thất bại !     '),
        );
        continue;
      }
      await delay(2);
      const isFinish = await claimQuest(name);
      readline.cursorTo(process.stdout, 0);
      if (isFinish) {
        process.stdout.write(
          `${colors.cyan(
            `[ ${project.toUpperCase()} - ${user?.user?.username} ]`,
          )}` +
            colors.yellow(` Quest : ${colors.white(type)} `) +
            colors.green('Done !                  '),
        );
      } else {
        process.stdout.write(
          `${colors.cyan(
            `[ ${project.toUpperCase()} - ${user?.user?.username} ]`,
          )}` +
            colors.yellow(` Quest : ${colors.white(type)} `) +
            colors.red('Faild !                  '),
        );
      }
      console.log();
      await delay(2);
    }
  } catch (error) {
    errors(error || 'Không thể làm nhiệm vụ !');
  }
}

async function claimQuest(name) {
  const user = await getCurrentProfile();
  const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/tasks/claim';
  const res = await callApi({
    url: url,
    method: 'POST',
    tokenType: '',
    body: {
      uid: user?.userId,
      type: name,
    },
  });

  return res.code === 200;
}

async function competeQuest(name) {
  const user = await getCurrentProfile();
  const url = 'https://tgapp-api.digibuy.io/api/tgapp/v1/tasks/complete';
  const res = await callApi({
    url: url,
    method: 'POST',
    tokenType: '',
    body: {
      uid: user?.userId,
      type: name,
    },
  });

  return res.code === 200;
}

async function processAccount() {
  const user = await getCurrentProfile();
  if (!user) {
    errors('', 'Lỗi lấy data từ authMap ');
    return;
  }
  console.log();
  console.log(
    `-------------------------------[ 💤💤💤 : ${colors.yellow(
      user?.user?.username,
    )} ]-------------------------------`,
  );
  try {
    const isAuth = await login(user);
    if (!isAuth) return;
    await getProfile();
    await getStatusFarming();
    await dailyCheckIn();
    await getStatusDaily();
    await playGame();
    await doQuest();
  } catch (e) {
    errors(extUserName, e);
  }
}

async function eventLoop() {
  const listAccount = Array.from(...mapAuth.values());
  for await (const acc of listAccount) {
    await setCurrentProfile(acc);
    await processAccount();
    await delay(1);
  }
  const timeWait = 6 * 60 * 60; //6h
  await delay(timeWait, true);
  await eventLoop();
}

async function loadProfile() {
  const profiles = loadProfileTxt(__dirname);
  mapAuth.set('auth', profiles);
}

(async function main() {
  await setCurrentProject('Digiverse');
  await loadProfile();
  await delay(1);
  await eventLoop();
})();
