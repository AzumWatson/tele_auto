const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const { DateTime } = require('luxon');

class Boink {
  constructor() {
    this.headers = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language':
        'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
      'Content-Type': 'application/json',
      Origin: 'https://boink.astronomica.io',
      Referer:
        'https://boink.astronomica.io/?tgWebAppStartParam=boink376905749',
      'Sec-Ch-Ua':
        '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    };
  }

  log(msg, type = 'success') {
    switch (type) {
      case 'success':
        console.log(`${colors.cyan('[ BOINKER 💩 ]')}`, `${msg}`.green);
        break;
      case 'custom':
        console.log(`${colors.cyan('[ BOINKER 💩 ]')}`, `${msg}`);
        break;
      case 'error':
        console.log(`${colors.cyan('[ BOINKER 💩 ]')}`, `${msg}`.red);
        break;
      case 'warning':
        console.log(`${colors.cyan('[ BOINKER 💩 ]')}`, `${msg}`.yellow);
        break;
      default:
        console.log(`${colors.cyan('[ BOINKER 💩 ]')}`, `${msg}`.green);
    }
  }

  async countdown(seconds) {
    for (let i = seconds; i >= 0; i--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `===== Đã hoàn thành tất cả tài khoản, chờ ${i} giây để tiếp tục vòng lặp =====`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    this.log('', 'success');
  }

  async loginByTelegram(initDataString) {
    const url =
      'https://boink.astronomica.io/public/users/loginByTelegram?p=android';
    const payload = { initDataString };
    try {
      const response = await axios.post(url, payload, {
        headers: this.headers,
      });
      if (response.status === 200) {
        return { success: true, token: response.data.token };
      } else {
        return { success: false, status: response.status };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  saveToken(userId, token) {
    let tokens = {};
    if (fs.existsSync('token.json')) {
      tokens = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    }
    tokens[userId] = token;
    fs.writeFileSync('token.json', JSON.stringify(tokens, null, 2));
  }

  getToken(userId) {
    if (fs.existsSync('token.json')) {
      const tokens = JSON.parse(fs.readFileSync('token.json', 'utf8'));
      return tokens[userId];
    }
    return null;
  }

  async getUserInfo(token) {
    const url = 'https://boink.astronomica.io/api/users/me?p=android';
    const headers = { ...this.headers, Authorization: token };
    try {
      const response = await axios.get(url, { headers });
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, status: response.status };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleFriendActions(token, friendIds) {
    for (const friendId of friendIds) {
      await this.claimFriendReward(token, friendId);
      await this.pushFriendToPlay(token, friendId);
    }
  }

  extractFirstName(initDataString) {
    try {
      const decodedData = decodeURIComponent(
        initDataString.split('user=')[1].split('&')[0],
      );
      const userData = JSON.parse(decodedData);
      return userData.first_name;
    } catch (error) {
      this.log('Lỗi không lấy được first_name: ' + error.message, 'error');
      return 'Unknown';
    }
  }

  async upgradeBoinker(token) {
    const url =
      'https://boink.astronomica.io/api/boinkers/upgradeBoinker?p=android';
    const payload = {};
    const headers = { ...this.headers, Authorization: token };
    try {
      const response = await axios.post(url, payload, { headers });
      if (response.status === 200 && response.data) {
        const { newSoftCurrencyAmount, newSlotMachineEnergy, rank } =
          response.data;
        this.log(
          `Nâng cấp thành công, Balance: ${colors.yellow(newSoftCurrencyAmount)}`,
          'success',
        );
        return { success: true };
      } else {
        this.log(
          `Nâng cấp thất bại !`,
          'error',
        );
        return { success: false };
      }
    } catch (error) {
      this.log(`Không đủ vàng để nâng cấp!`, 'error');
      return { success: false, error: error.message };
    }
  }

  async claimBooster(token, spin) {
    const payload =
      spin > 30
        ? { multiplier: 2, optionNumber: 3 }
        : { multiplier: 2, optionNumber: 1 };

    try {
      const response = await axios.post(
        'https://boink.astronomica.io/api/boinkers/addShitBooster?p=android',
        payload,
        {
          headers: { ...this.headers, Authorization: token },
        },
      );
      if (response.status === 200) {
        const result = response.data;
        let nextBoosterTime = result.boinker?.booster?.x2
          ?.lastTimeFreeOptionClaimed
          ? DateTime.fromISO(
              result.boinker.booster.x2.lastTimeFreeOptionClaimed,
            )
          : null;

        if (nextBoosterTime) {
          nextBoosterTime = nextBoosterTime.plus({ hours: 2, minutes: 5 });
        }

        this.log(
          `Mua boosts thành công! Coin: ${
            result.userPostBooster.newCryptoCurrencyAmount || 0
          }`,
          'success',
        );
        this.log(`Rank: ${result.userPostBooster.rank}`, 'success');
        if (nextBoosterTime) {
          this.log(
            `Mua boosts tiếp theo vào: ${nextBoosterTime.toLocaleString(
              DateTime.DATETIME_MED,
            )}`,
            'success',
          );
        } else {
          this.log(
            `Không thể xác định thời gian mua boosts tiếp theo.`,
            'warning',
          );
        }

        return { success: true, nextBoosterTime };
      } else {
        this.log(`Lỗi khi mua boosts!`, 'error');
        return { success: false, error: 'API error' };
      }
    } catch (error) {
      console.log(error);
      this.log(`Lỗi khi gửi yêu cầu mua boosts: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async spinSlotMachine(token, spins) {
    const spinAmounts = [150, 50, 25, 10, 5, 1];
    let remainingSpins = spins;

    while (remainingSpins > 0) {
      let spinAmount =
        spinAmounts.find((amount) => amount <= remainingSpins) || 1;

      const url = `https://boink.astronomica.io/api/play/spinSlotMachine/${spinAmount}?p=android`;
      const headers = { ...this.headers, Authorization: token };

      try {
        const response = await axios.post(url, {}, { headers });
        if (response.status === 200) {
          const {
            energyUsed,
            prize: { prizeTypeName, prizeValue },
            slutz,
          } = response;
          console.log('response ___',response);
          
          this.log(
            `Spin ${colors.yellow(energyUsed)} energy: Result [ ${colors.magenta(
                slutz.join(', '),
              )} ], Reward: ${colors.yellow(prizeTypeName)} ${colors.yellow(
                prizeValue,
              )} `.magenta,
            'custom',
          );
          remainingSpins -= spinAmount;
        } else {
          this.log(`Lỗi khi quay: Mã trạng thái ${response.status}`, 'error');
          break;
        }
      } catch (error) {
        this.log(`Lỗi khi gửi yêu cầu quay: ${error.message}`, 'error');
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async performRewardedActions(token) {
    const getRewardedActionListUrl =
      'https://boink.astronomica.io/api/rewardedActions/getRewardedActionList?p=android';
    const getUserInfoUrl =
      'https://boink.astronomica.io/api/users/me?p=android';
    const headers = { ...this.headers, Authorization: token };

    const skippedTasks = [
      'twitterQuotePost20',
      'telegramShareStory5',
      'emojiOnPostTelegramNewsChannel',
      'NotGoldReward',
      'NotPlatinumReward',
      'connectTonWallet',
      'telegramJoinBoinkersNewsChannel',
      'telegramJoinAcidGames',
      'inviteAFriend',
    ];

    try {
      const userInfoResponse = await axios.get(getUserInfoUrl, { headers });
      if (userInfoResponse.status !== 200) {
        this.log(
          `Không thể lấy thông tin người dùng. Mã trạng thái: ${userInfoResponse.status}`,
          'error',
        );
        return;
      }
      const userInfo = userInfoResponse.data;

      const response = await axios.get(getRewardedActionListUrl, { headers });
      if (response.status !== 200) {
        this.log(`Không lấy đc nhiệm vụ !`, 'error');
        return;
      }

      const rewardedActions = response.data;
      this.log(
        `Bắt đầu làm ${colors.yellow(rewardedActions.length)} nhiệm vụ !`,
        'success',
      );

      for (const action of rewardedActions) {
        const nameId = action.nameId;

        if (skippedTasks.includes(nameId)) {
          continue;
        }

        const currentTime = new Date();
        let canPerformTask = true;
        let waitTime = null;

        if (userInfo.rewardedActions && userInfo.rewardedActions[nameId]) {
          const lastClaimTime = new Date(
            userInfo.rewardedActions[nameId].claimDateTime,
          );

          if (nameId === 'SeveralHourlsReward') {
            const nextAvailableTime = new Date(
              lastClaimTime.getTime() + 6 * 60 * 60 * 1000,
            );
            if (currentTime < nextAvailableTime) {
              canPerformTask = false;
              waitTime = nextAvailableTime;
            }
          } else if (
            nameId === 'SeveralHourlsRewardedAdTask' ||
            nameId === 'SeveralHourlsRewardedAdTask2'
          ) {
            const nextAvailableTime = new Date(
              lastClaimTime.getTime() + 6 * 60 * 1000,
            );
            if (currentTime < nextAvailableTime) {
              canPerformTask = false;
              waitTime = nextAvailableTime;
            }
          } else if (userInfo.rewardedActions[nameId].claimDateTime) {
            canPerformTask = false;
          }
        }

        if (!canPerformTask) {
          if (waitTime) {
            const waitMinutes = Math.ceil(
              (waitTime - currentTime) / (60 * 1000),
            );
            this.log(`Chờ ${colors.white(waitMinutes)} phút`, 'success');
          }
          continue;
        }

        if (
          nameId === 'SeveralHourlsRewardedAdTask' ||
          nameId === 'SeveralHourlsRewardedAdTask2'
        ) {
          const providerId =
            nameId === 'SeveralHourlsRewardedAdTask' ? 'adsgram' : 'onclicka';
          await this.handleAdTask(token, nameId, providerId);
        } else {
          const clickUrl = `https://boink.astronomica.io/api/rewardedActions/rewardedActionClicked/${nameId}?p=android`;
          try {
            const clickResponse = await axios.post(clickUrl, {}, { headers });
            this.log(`Đang làm ${nameId.yellow} !`);
          } catch (clickError) {
            this.log(
              `Lỗi: ${JSON.stringify(
                clickError?.response?.data || clickError?.message,
              )}`,
              'error',
            );
            continue;
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));

          const claimUrl = `https://boink.astronomica.io/api/rewardedActions/claimRewardedAction/${nameId}?p=android`;
          try {
            const claimResponse = await axios.post(claimUrl, {}, { headers });
            if (claimResponse.status === 200) {
              const result = claimResponse.data;
              const reward = result.prizeGotten;
              this.log(`Nhiệm vụ ${colors.yellow(nameId)} Done !`, 'success');
            } else {
              this.log(`Không thể nhận thưởng !`, 'error');
            }
          } catch (e) {}
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      this.log(
        `Chi tiết lỗi: ${JSON.stringify(
          error?.response?.data || error?.message,
        )}`,
        'error',
      );
    }
  }

  async handleAdTask(token, nameId, providerId) {
    const headers = { ...this.headers, Authorization: token };

    try {
      const clickUrl = `https://boink.astronomica.io/api/rewardedActions/rewardedActionClicked/${nameId}?p=android`;
      await axios.post(clickUrl, {}, { headers });
      this.log(
        `Đã click nhiệm vụ quảng cáo ${colors.white(nameId)}`,
        'success',
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const adWatchedUrl =
        'https://boink.astronomica.io/api/rewardedActions/ad-watched?p=android';
      await axios.post(adWatchedUrl, { providerId: providerId }, { headers });
      this.log(`Đã xem quảng cáo ${colors.white(nameId)}`, 'success');

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const claimUrl = `https://boink.astronomica.io/api/rewardedActions/claimRewardedAction/${nameId}?p=android`;
      this.log(`Đang nhận thưởng ${colors.white(nameId)}...`, 'success');
      const claimResponse = await axios.post(claimUrl, {}, { headers });

      if (claimResponse.status === 200) {
        const result = claimResponse.data;
        const reward = result.prizeGotten;
        this.log(`Hoàn thành ${colors.white(nameId)} Done !`, 'success');
      } else {
        this.log(`Nhận thưởng lỗi !`, 'error');
      }
    } catch (e) {
      this.log(`Lỗi nhiệm vụ quảng cáo !`, 'error');
    }
  }

  async main() {
    const dataFile = path.join(__dirname, 'data.txt');
    const data = fs
      .readFileSync(dataFile, 'utf8')
      .replace(/\r/g, '')
      .split('\n')
      .filter(Boolean);

    while (true) {
      for (let i = 0; i < data.length; i++) {
        const initDataString = data[i];
        const firstName = this.extractFirstName(initDataString);

        console.log(
            `-------------------------------[ 💤💤💤 : ${firstName.green} ]-------------------------------`,
          );

        const parsedData = JSON.parse(
          decodeURIComponent(initDataString.split('user=')[1].split('&')[0]),
        );
        const userId = parsedData.id;

        let token = this.getToken(userId);
        if (!token) {
          const loginResult = await this.loginByTelegram(initDataString);
          if (loginResult.success) {
            this.log('Đăng nhập thành công!', 'success');
            token = loginResult.token;
            this.saveToken(userId, token);
          } else {
            this.log(
              `Đăng nhập không thành công! ${
                loginResult.status || loginResult.error
              }`,
              'error',
            );
            continue;
          }
        }

        try {
          const userInfoResult = await this.getUserInfo(token);
          if (userInfoResult.success) {
            const userInfo = userInfoResult.data;
            this.log(
              `Level: ${colors.yellow(
                userInfo.boinkers.currentBoinkerProgression.level,
              )}`,
              'success',
            );
            this.log(
              `Balance Gold: ${colors.yellow(userInfo.currencySoft)}`,
              'success',
            );
            if (userInfo.currencyCrypto !== undefined) {
              this.log(
                `Balance Cứt: ${colors.yellow(userInfo.currencyCrypto)}`,
                'success',
              );
            }
            this.log(
              `Spin: ${colors.yellow(userInfo.gamesEnergy.slotMachine.energy)}`,
              'success',
            );

            const currentTime = DateTime.now();
            const lastClaimedTime = userInfo.boinkers?.booster?.x2
              ?.lastTimeFreeOptionClaimed
              ? DateTime.fromISO(
                  userInfo.boinkers.booster.x2.lastTimeFreeOptionClaimed,
                )
              : null;

            if (
              !lastClaimedTime ||
              currentTime > lastClaimedTime.plus({ hours: 2, minutes: 5 })
            ) {
              const boosterResult = await this.claimBooster(
                token,
                userInfo.gamesEnergy.slotMachine.energy,
              );
              if (!boosterResult.success) {
                this.log(
                  `Không thể claim booster: ${boosterResult.error}`,
                  'error',
                );
              }
            } else {
              const nextBoosterTime = lastClaimedTime.plus({
                hours: 2,
                minutes: 5,
              });
              this.log(
                `Thời gian mua boosts tiếp theo: ${colors.cyan(
                  nextBoosterTime.toLocaleString(DateTime.DATETIME_MED),
                )}`,
                'success',
              );
            }

            const spinuser = await this.getUserInfo(token);
            const spinUser = spinuser.data;
            const spins = spinUser.gamesEnergy.slotMachine.energy;
            if (spins > 0) {
              this.log(
                `Bắt đầu quay với ${colors.yellow(spins)} lượt quay`,
                'success',
              );
              await this.spinSlotMachine(token, spins);
            } else {
              this.log('Không có lượt quay nào', 'warning');
            }

            await this.performRewardedActions(token);

            let upgradeSuccess = true;
            while (upgradeSuccess) {
              const upgradeResult = await this.upgradeBoinker(token);
              upgradeSuccess = upgradeResult.success;
            }
          } else {
            this.log(
              `Không thể lấy thông tin người dùng! Mã trạng thái: ${
                userInfoResult.status || userInfoResult.error
              }`,
              'error',
            );
          }
        } catch (error) {
          this.log(`Lỗi khi xử lý tài khoản: ${error.message}`, 'error');
        }
       console.log();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await this.countdown(10 * 60);
    }
  }
}

const boink = new Boink();
boink.main().catch((err) => {
  boink.log(err.message, 'error');
  process.exit(1);
});
