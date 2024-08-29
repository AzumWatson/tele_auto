const { delay } = require("../base");

const mapAuth = new Map()

async function login() {
    
}


async function processAccount(username) {
    if (!data) {
      errors('', 'Lỗi lấy data từ authMap ');
      return;
    }
    try {
      const isAuth = await login(data);
      if (!isAuth) return;
     
    } catch (e) {
      errors(extUserName, e);
    }
  }

async function eventLoop() {
    for await (const username of mapAuth.keys()) {
      await processAccount(username);
      await delay(1);
    }
    const timeWait = 4 * 60 * 60; //8h
    await delay(timeWait, true);
    await eventLoop();
  }
  
  (async function main() {
    await loadProfile();
    await delay(1);
    await eventLoop();
  })();
  