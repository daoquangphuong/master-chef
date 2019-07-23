// eslint-disable-next-line
module.exports = function error(err, req, res, next) {
  if (err instanceof Error) {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: err.message,
      data: null
    });
  } else {
    res.json({
      success: true,
      error: null,
      data: err
    });
  }
};
