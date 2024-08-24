const {
  delay,
  callApi,
  setCurrentProfile,
  getCurrentProfile,
  setCurrentProject,
  errors,
  toVietNamTime,
  logs,
  FORMAT_DATE_TIME,
  formatNumber,
} = require('../base');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const readline = require('readline');
const dayjs = require('dayjs');
const rPath = (p) => path.join(__dirname, p);

const TOTAL_REPEAT_BOOTS_AGAIN = 3;
let numberRepeatBoots = 0;

async function processAccount() {
  const profile = await getCurrentProfile();
  if (!profile) {
    errors('', 'Lấy thông tin acount lỗi !');
    return;
  }
  console.log();
  console.log(
    '-------- Account : ',
    colors.green(profile?.username),
    ' running --------',
  );
  try {
    const isAuth = await login();
    if (!isAuth) return;
    await getInfo();
  } catch (e) {
    errors(profile?.username, e);
  }
}

async function login() {
  try {
    const user = await getCurrentProfile();
    const response = await callApi({
      url: 'https://boink.astronomica.io/public/users/loginByTelegram?p=web',
      method: 'POST',
      tokenType: '',
      isAuth: false,
      body: {
        initDataString: user?.query_id,
      },
    });
    if (!response || !response?.token) {
      errors('Lấy lại token !');
      return;
    }
    const { token } = response;
    await setCurrentProfile({
      ...user,
      token: token,
    });
    logs(`Login thành công !`);
    return true;
  } catch (error) {}
}

async function activeBoots() {
  try {
    const response = await callApi({
      url: 'https://boink.astronomica.io/api/boinkers/addShitBooster?p=weba',
      method: 'POST',
      tokenType: '',
      body: {
        purchaseMethod: 'free',
        // 'energy' là boots bằng năng lượng spin
      },
    });

    if (!response) {
      errors('Lấy lại token !');
      return;
    }

    if (response?.message === 'Free booster is not available') {
      logs(colors.yellow(`Boots đang active hoặc chưa sẵn sàng !`));
      return;
    }

    logs(`Active boots free thành công !}`);
    return;
  } catch (error) {
    errors(
      `Active boots faild, đang active lại lần ${colors.yellow(
        numberRepeatBoots,
      )}`,
    );
  }
}

async function autoSpin(levelBetSpin = 1) {
  try {
    const response = await callApi({
      url: `https://boink.astronomica.io/api/play/spinSlotMachine/${levelBetSpin}?p=weba`,
      method: 'POST',
      tokenType: '',
    });

    if (!response) {
      errors('Lấy lại token !');
      return;
    }

    if (response?.code) {
      logs('Hết năng lượng !');
      return;
    }

    const {
      energyUsed,
      newCryptoCurrencyAmount,
      newSoftCurrencyAmount,
      prize: { prizeTypeName, prizeValue },
      slutz,
    } = response;

    logs(
      `Spin ${colors.yellow(energyUsed)} energy: Result [ ${colors.magenta(
        slutz.join(', '),
      )} ], Reward: ${colors.yellow(prizeTypeName)} ${colors.yellow(
        prizeValue,
      )} `,
    );
    switch (prizeTypeName) {
      case 'Gold':
        logs(`Balance Gold: ${colors.yellow(newSoftCurrencyAmount)}`);
        break;
      case '':
        logs(`Balance Cứt: ${colors.yellow(newCryptoCurrencyAmount)}`);
        break;
      default:
        break;
    }
    return {
      spin: prizeTypeName === 'Spins' ? Number(prizeValue) : 0,
      balance: newSoftCurrencyAmount
    };
  } catch (error) {
    errors('Auto spin error: ' + error);
  }
}

async function upgradeLevelBoinker() {
  try {
    const response = await callApi({
      url: 'https://boink.astronomica.io/api/boinkers/upgradeBoinker?p=weba',
      method: 'POST',
      tokenType: '',
    });

    if (!response) {
      errors('Lấy lại token !');
      return;
    }
    const {
      userBoinkers: {
        currentBoinkerProgression: { level },
      },
      newSoftCurrencyAmount
    } = response;
    return { level, balance: newSoftCurrencyAmount  };
  } catch (error) {
    errors('Upgrade level faild !');
  }
}

async function getInfoUpgrade() {
  try {
    const response = await callApi({
      url: `https://boink.astronomica.io/public/data/configV2.js?p=weba`,
      method: 'GET',
      tokenType: '',
      isAuth: false,
    });

    if (!response) {
      errors('Lấy lại token !');
      return;
    }

    const {
      boinkersData: boinkersDataSetting,
      shitBoostersSettings,
      slotMachineSettings,
    } = response;
    return { boinkersDataSetting, shitBoostersSettings, slotMachineSettings };
  } catch (error) {}
}

async function getListTask() {
  try {
    const response = await callApi({
      url: 'https://boink.astronomica.io/api/rewardedActions/getRewardedActionList?p=weba',
      method: 'GET',
      tokenType: '',
    });

    if (!response) {
      errors('Lấy lại token !');
      return;
    }
    const listQuest = [...response];
    logs(`Total quest: ${listQuest.length}`);
  } catch (error) {
    errors('Upgrade level faild !');
  }
}

async function clickTask(id) {
  const url = `https://boink.astronomica.io/api/rewardedActions/rewardedActionClicked/${id}?p=weba`;
  try {
    const response = await callApi({
      url: url,
      method: 'POST',
      tokenType: '',
    });

    if (!response) {
      errors('Lấy lại token !');
      return;
    }
    const listQuest = [...response];
    logs(`Total quest: ${listQuest.length}`);
  } catch (error) {
    errors('Upgrade level faild !');
  }
}

async function claimTask(id) {
  const url = `https://boink.astronomica.io/api/rewardedActions/claimRewardedAction/${id}?p=weba`;
  try {
    const response = await callApi({
      url: url,
      method: 'POST',
      tokenType: '',
    });

    if (!response) {
      errors('Lấy lại token !');
      return;
    }
    return true;
  } catch (error) {
    errors('Upgrade level faild !');
  }
}

async function getInfo() {
  try {
    const response = await callApi({
      url: 'https://boink.astronomica.io/api/users/me?p=weba',
      method: 'GET',
      tokenType: '',
    });

    if (!response) {
      errors('Lấy lại token !');
      return;
    }

    const {
      boinkers: {
        booster,
        completedBoinkers,
        currentBoinkerProgression: { level, id },
      },
      currencySoft,
      currencyCrypto,
      friends,
      offlineEarningsCollected,
      rank,
      gamesEnergy: {
        slotMachine: { energy },
      },
      userName,
    } = response;

    await activeBoots();

    logs(`Tổng số Boinkers: ${colors.yellow(completedBoinkers)}`);
    logs(`Boots Free: Hết lúc ${colors.cyan(toVietNamTime(booster?.endsAt))}`);
    logs(`Balance Gold: ${colors.yellow(formatNumber(currencySoft))}`);
    logs(`Balance Cứt: ${colors.yellow(currencyCrypto?.toFixed(5) || 0)}`);
    logs(`Total Ref: ${colors.yellow(friends.length)}`);
    logs(
      `Cứt đào offline: ${colors.yellow(
        offlineEarningsCollected?.toFixed(5) || 0,
      )}`,
    );
    logs(`Rank: ${colors.yellow(rank)}`);
    logs(`Username: ${colors.yellow(userName)}`);
    logs(`Năng lượng: ${colors.yellow(energy)}🔋`);
    
    let currentBalanceGold = currencySoft

    const { boinkersDataSetting, slotMachineSettings } = await getInfoUpgrade();

    // Auto Spin
    if (energy) {
      const betConfig = slotMachineSettings?.BETS_CONDITIONS;
      let maxBet = 1;
      const listBetValid = betConfig
        .filter((e) => e?.energyAmountForTempUnlock < energy)
        .map((e) => e?.bet);
      if (listBetValid.length) {
        maxBet = Math.max(
          ...betConfig
            .filter((e) => e?.energyAmountForTempUnlock < energy)
            .map((e) => e?.bet),
        );
      }
  
      const numberSpinMaxLevel = Math.round(energy / maxBet);
      let numberSpinOneLevel = energy - numberSpinMaxLevel * maxBet;
  
      logs(
        `Đang auto spin ${colors.yellow(
          numberSpinMaxLevel + numberSpinOneLevel,
        )} lần !`,
      );
  
      if (numberSpinMaxLevel) {
        let slotMaxLevel = 0;
        do {
          ++slotMaxLevel;
          const res = await autoSpin(maxBet);
          if(!res){
            --slotMaxLevel
            currentBalanceGold = 0
            return
          }
          numberSpinOneLevel += res?.spin
          currentBalanceGold = res?.balance
        } while (numberSpinMaxLevel > 0 && slotMaxLevel <= numberSpinMaxLevel);
      }
  
      if (numberSpinOneLevel) {
        let slotOneLevel = 0;
        do {
          ++slotOneLevel;
          const res = await autoSpin(1);
          if(!res){
            --slotMaxLevel
            currentBalanceGold = 0
            return
          }
          currentBalanceGold = res?.balance
        } while (numberSpinOneLevel > 0 && slotOneLevel <= numberSpinMaxLevel);
      }
  
    }


    // Auto upgrade level Boinker
    const currentBoinkerSetting = boinkersDataSetting?.find(
      (e) => e?.id === id,
    );
    
    if (currentBoinkerSetting) {
      const priceUpgradeSetting = currentBoinkerSetting?.pricesByLevel;
      const priceToUpgrade = priceUpgradeSetting[level] || 999999999999;

      if (currentBalanceGold < priceToUpgrade) {
        logs(
          colors.red(
            `Không đủ gold để update level, cần ${colors.yellow(
              formatNumber(priceToUpgrade),
            )}`,
          ),
        );
        return;
      }

      let currentPriceUpgrade = priceToUpgrade;
      do {
        const res = await upgradeLevelBoinker();
        if (!res || !res?.level) {
          currentBalanceGold = 0;
        }
        logs(`Đã upgrade Boinker lên level ${res?.level}`)
        currentPriceUpgrade = priceUpgradeSetting[res?.level] || 999999999999;
        currentBalanceGold = res?.balance
      } while (currentBalanceGold > 0 && currentBalanceGold >= currentPriceUpgrade);
      
      if(currentBalanceGold < currentPriceUpgrade){
        logs(
          colors.red(
            `Không đủ gold để update level, cần ${colors.yellow(
              formatNumber(currentPriceUpgrade),
            )}`,
          ),
        );
      }
    }

    return true;
  } catch (error) {
    errors(error);
    return;
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

async function loadProfile() {
  try {
    const v = JSON.parse(fs.readFileSync(rPath('data.json'), 'utf8') || '[]');
    if (v.length) {
      console.log(colors.green(`Load thành công ${v.length} profile`));
      return v;
    }
    console.log(colors.red('Không tìm thấy thông tin nào trong data.json'));
    return [];
  } catch (e) {
    console.log(colors.red('Không thể load profile'));
  }
}

(async function main() {
  await setCurrentProject('Boinker 💩');
  const profiles = await loadProfile();
  await delay(1);
  for await (const profile of profiles) {
    numberRepeatBoots = 0;
    await setCurrentProfile(profile);
    await processAccount();
    await delay(1);
  }
  const timeWait = 2 * 60 * 60; //2h
  await waitWithCountdown(timeWait);
  await main();
})();
