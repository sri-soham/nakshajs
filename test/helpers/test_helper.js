async function wait(seconds) {
  return new Promise((resolve) => {
    let timeout = seconds * 1000;
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

module.exports = {
    'wait': wait
};

