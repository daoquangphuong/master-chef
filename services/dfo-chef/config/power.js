const ADMIN = 'Admin';

const ME = '29:1r0qCEmujxuyrWfFWM9MfrroGxuQmbsFQeXhR-FSwah8';

const powerMap = {
  [ADMIN]: {
    [ME]: true
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
