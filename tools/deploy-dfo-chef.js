const fsExtra = require('fs-extra');
const webpack = require('webpack');
const path = require('path');
const cp = require('child_process');
const netrc = require('netrc-rw');
const auth = require('./auth');

function webpackBundle(config) {
  return new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      console.info(stats.toString());
      if (stats.hasErrors()) {
        return reject(new Error('Webpack compilation errors'));
      }

      return resolve();
    });
  });
}

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

const serverPath = path.resolve(root, 'services/dfo-chef');
const deployPath = path.resolve(root, 'deploy');

const webpackConfig = {
  mode: 'production',
  target: 'node',
  node: {
    console: false,
    global: false,
    process: false,
    __filename: false,
    __dirname: false,
    Buffer: false,
    setImmediate: false
  },
  entry: {
    index: path.resolve(serverPath, 'index.js')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(deployPath)
  },
  devtool: 'source-map',
  externals: [
    (context, request, callback) => {
      if (/^[^./].*$/.test(request)) {
        return callback(null, `require("${request}");`);
      }
      return callback();
    }
  ],
  plugins: [
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false
    })
  ]
};

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
  await fsExtra.remove(deployPath);

  await fsExtra.ensureDir(deployPath);

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

  await webpackBundle(webpackConfig);

  const includeServerCopy = ['package.json', 'yarn.lock'];

  includeServerCopy.forEach(item => {
    fsExtra.copySync(
      path.resolve(serverPath, item),
      path.resolve(deployPath, item)
    );
  });

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
