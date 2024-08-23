const colors = require('colors');
const fs = require('fs');
const path = require('path');

const profile = new Map();
const currentAccount = new Map();
const currentProject = new Map();
const KEY_CURRENT_PROFILE = 'currentProfile';
const KEY_CURRENT_PROJECT = 'currentProject';

const headers = {
  authority: '',
  'Content-Type': 'application/json',
  Origin: '',
  scheme: 'https',
  Priority: 'u=1, i',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': 'Windows',
  'Sec-Fetch-Dest': ' empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
};

async function errors(message) {
  const { username } = await getCurrentProfile(KEY_CURRENT_PROFILE);
  const project = await getCurrentProject(KEY_CURRENT_PROFILE);
  console.log(
    colors.red(
      `[ ${project.toUpperCase()}${username ? ' - ' + username : ''} ]`,
    ),
    colors.red(message),
  );
}

async function logs(message) {
  const { username } = await getCurrentProfile(KEY_CURRENT_PROFILE);
  const project = await getCurrentProject(KEY_CURRENT_PROFILE);
  console.log(
    colors.cyan(
      `[ ${project.toUpperCase()}${username ? ' - ' + username : ''} ]`,
    ),
    colors.green(message),
  );
}

async function setCurrentProfile(data) {
  currentAccount.set(KEY_CURRENT_PROFILE, data);
}

async function getCurrentProfile() {
  return currentAccount.get(KEY_CURRENT_PROFILE);
}

async function setCurrentProject(data) {
  currentProject.set(KEY_CURRENT_PROJECT, data);
}

async function getCurrentProject() {
  return currentProject.get(KEY_CURRENT_PROJECT);
}

async function getProfile() {
  return profile;
}

async function getHeader(isQueryId = false, url, method, customHeader) {
  const splitUrl = url.split('/');
  const domain = [...splitUrl].slice(0, 3).join('/');
  const path = '/' + [...splitUrl].slice(3, splitUrl.length).join('/');

  const authDomain = {
    Origin: domain,
    authority: domain,
    path: path,
    method: method,
  };
  const { query_id, token } = await getCurrentProfile();
  if (isQueryId) {
    return {
      ...headers,
      ...authDomain,
      Authorization: 'tma ' + query_id,
      rawdata: query_id,
      ...customHeader,
    };
  }
  return {
    ...headers,
    ...authDomain,
    Authorization: 'Bearer ' + token,
    ...customHeader,
  };
}

async function callApi({
  url,
  method,
  body = {},
  isQueryId = false,
  headersCustom = {},
  isAuth = true,
  typeQueryId
}) {
  try {
    const genHeaders = await getHeader(
      isQueryId,
      url,
      method,
      headersCustom
    );


    if (!isAuth) {
      delete genHeaders.Authorization;
      delete genHeaders.rawdata;
    }

    if (isQueryId) {
      typeQueryId === 'raw'
        ? delete genHeaders.Authorization
        : delete genHeaders.rawdata;
    }

    const res = await fetch(url, {
      method: method,
      headers: genHeaders,
      ...(method !== 'GET' && { body: JSON.stringify(body) }),
    });
    const response = await res.json();

    if (
      !response ||
      response?.statusCode === 500 ||
      (response?.error_code && response?.error_code !== 'OK')
    ) {
      errors('', 'Lỗi call api:' + url + `[ ${response?.message} ]`);
      return response;
    }
    return response;
  } catch (error) {
    errors('', error);
  }
}

function extractUserData(queryId) {
  const isUseDecode = queryId.startsWith('user=');
  const decodedString = decodeURIComponent(queryId);
  const params = new URLSearchParams(decodedString);
  const user = JSON.parse(params.get('user'));
  const query_id_decode = params.get('query_id');
  const auth_date = params.get('auth_date');
  const chat_instance = params.get('chat_instance');
  const start_param = params.get('start_param');
  const hash = params.get('hash');
  const chat_type = params.get('chat_type');

  return {
    userId: user.id,
    username: user.username,
    user: user,
    query_id: isUseDecode ? queryId : decodedString,
    token: '',
    auth_date: auth_date,
    chat_instance: chat_instance,
    start_param: start_param,
    hash: hash,
    chat_type: chat_type,
    query_id_decode: query_id_decode,
    isUseDecode: isUseDecode
  };
}

async function loadConfig(nameFile) {
  return new Promise((res, rej) => {
    parentDir = path.join(__dirname, '..');
    fs.readFile(
      path.resolve(parentDir, nameFile),
      'utf-8',
      async (err, data) => {
        if (err) {
          rej(err);
        }

        const d = JSON.parse(data);
        for (const item in d) {
          const convertQueryId = d[item]?.map((e) => {
            const hasQueryId = Object.keys(e).includes('query_id');
            if (hasQueryId) {
              return extractUserData(e['query_id']);
            }
            return e;
          });
          profile.set(item, convertQueryId);
        }

        await delay(2);
        res(d);
      },
    );
  });
}

async function delay(second, show) {
  show && console.log('delay', colors.yellow(second), 'seconds');
  return new Promise((ok) => setTimeout(ok, second > 0 ? second * 1000 : 100));
}

function profileSumary() {
  profile.forEach((v, k) => {
    let key = k;

    console.log(`[ ${key} ]`.cyan, colors.green(v.length), 'profiles');
  });
}

const publicModules = {
  loadConfig,
  profileSumary,
  logs,
  errors,
  getCurrentProfile,
  getProfile,
  setCurrentProfile,
  profile,
  currentAccount,
  callApi,
  getHeader,
  delay,
  setCurrentProject,
  getCurrentProject,
};

module.exports = publicModules;