const ADMIN = 'Admin';

const ME =
  process.env.NODE_ENV !== 'production'
    ? '29:1E95biWo8G5zINZ1vsgTXpTs1ii8bLO47ZmGuqh5l0hY'
    : '29:1r0qCEmujxuyrWfFWM9MfrroGxuQmbsFQeXhR-FSwah8';
const HANH = '29:1Duwxnk57zeo20uPB13GZk-RK2OYHVgQfkB2eMACSxaE';

const powerMap = {
  [ADMIN]: {
    [ME]: true,
    [HANH]: true
  }
};

const getUserPower = userId => {
  return Object.keys(powerMap).reduce((userPower, power) => {
    if (powerMap[power][userId]) {
      userPower[power] = true;
    }
    return userPower;
  }, {});
};

const isAdmin = userId => {
  return powerMap[ADMIN][userId];
};

module.exports = { getUserPower, isAdmin };
