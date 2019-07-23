const fsExtra = require('fs-extra');
const path = require('path');
const cp = require('child_process');
const netrc = require('netrc-rw');
const auth = require('./auth');
// const cloudflare = require('./cloudflare');

const spawn = (command, args, options) =>
  new Promise((resolve, reject) => {
    cp.spawn(command, args, options).on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} => ${code} (error)`));
      }
    });
  });

const root = path.resolve(__dirname, '..');
const clientPath = path.resolve(root, 'services', 'dfo-chef');
const buildPath = path.resolve(clientPath, 'build');
const deployPath = path.resolve(root, 'deploy');
const publicPath = path.resolve(deployPath, 'public');

const options = {
  cwd: deployPath,
  stdio: ['ignore', 'inherit', 'inherit']
};

const remote = {
  id: 'dfo-chef',
  name: 'dfo-chef',
  url: `https://git.heroku.com/dfo-chef.git`,
  branch: 'master'
};

async function deploy() {
  await spawn('yarn', ['install'], { ...options, cwd: clientPath });
  await spawn('yarn', ['build'], { ...options, cwd: clientPath });

  await fsExtra.remove(deployPath);

  await fsExtra.ensureDir(deployPath);

  await fsExtra.ensureDir(publicPath);

  await spawn('git', ['init', '--quiet'], options);
  // Changing a remote's URL
  let isRemoteExists = false;
  try {
    await spawn(
      'git',
      ['config', '--get', `remote.${remote.name}.url`],
      options
    );
    isRemoteExists = true;
  } catch (error) {
    /* skip */
  }
  await spawn(
    'git',
    ['remote', isRemoteExists ? 'set-url' : 'add', remote.name, remote.url],
    options
  );
  // Fetch the remote repository if it exists
  let isRefExists = false;
  try {
    await spawn(
      'git',
      ['ls-remote', '--quiet', '--exit-code', remote.url, remote.branch],
      options
    );
    isRefExists = true;
  } catch (error) {
    await spawn('git', ['update-ref', '-d', 'HEAD'], options);
  }
  if (isRefExists) {
    await spawn('git', ['fetch', remote.name], options);
    await spawn(
      'git',
      ['reset', `${remote.name}/${remote.branch}`, '--hard'],
      options
    );
    await spawn('git', ['clean', '--force'], options);
  }

  const excludeRemove = ['.git'];

  fsExtra.readdirSync(deployPath).forEach(item => {
    const isExclude = excludeRemove.some(exclude => {
      if (exclude instanceof RegExp) {
        return item.match(exclude);
      }
      return exclude === item;
    });
    if (isExclude) {
      return;
    }
    fsExtra.removeSync(path.resolve(deployPath, item));
  });

  const excludeClientCopy = [
    '.git'
    // 'service-worker.js',
    // 'asset-manifest.json',
    // /precache-manifest.*\.js/
  ];

  fsExtra.readdirSync(buildPath).forEach(item => {
    const isExclude = excludeClientCopy.some(exclude => {
      if (exclude instanceof RegExp) {
        return item.match(exclude);
      }
      return exclude === item;
    });
    if (isExclude) {
      return;
    }
    fsExtra.copySync(
      path.resolve(buildPath, item),
      path.resolve(publicPath, item)
    );
  });

  fsExtra.copySync(
    path.resolve(clientPath, 'static.json'),
    path.resolve(deployPath, 'static.json')
  );

  // Push the contents of the build folder to the remote server via Git
  await spawn('git', ['add', '.', '--all'], options);
  try {
    await spawn('git', ['diff', '--cached', '--exit-code', '--quiet'], options);
  } catch (error) {
    await spawn(
      'git',
      ['commit', '--message', `Deploy ${new Date().toISOString()}`],
      options
    );
  }
  await spawn(
    'git',
    ['push', remote.name, remote.branch, '--set-upstream'],
    options
  );

  // wait 30 seconds then clear the cache
  // console.info('Wait 30 seconds before clear the cache');
  // await new Promise(r => setTimeout(r, 30000));
  // await cloudflare.PurgeAllFiles();
}

const setAuth = () => {
  netrc.host('git.heroku.com').login = auth[remote.id].login;
  netrc.host('git.heroku.com').password = auth[remote.id].password;
  netrc.write();
};

const restoreAuth = () => {
  netrc.host('git.heroku.com').login = netrc.host('api.heroku.com').login;
  netrc.host('git.heroku.com').password = netrc.host('api.heroku.com').password;
  netrc.write();
};

Promise.resolve()
  .then(() => {
    setAuth();
    return deploy();
  })
  .then(() => {
    restoreAuth();
  })
  .catch(err => {
    console.error(err);
    restoreAuth();
  });
