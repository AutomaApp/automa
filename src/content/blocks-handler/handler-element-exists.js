function elementExists({ data }) {
  return new Promise((resolve) => {
    let trying = 0;

    function checkElement() {
      if (trying >= (data.tryCount || 1)) {
        resolve(false);
        return;
      }

      const element = document.querySelector(data.selector);

      if (element) {
        resolve(true);
      } else {
        trying += 1;

        setTimeout(checkElement, data.timeout || 500);
      }
    }

    checkElement();
  });
}

export default elementExists;
