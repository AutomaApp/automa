function clipboard() {
  return new Promise((resolve) => {
    const text = window.getSelection().toString();
    resolve(text);
  });
}

export default clipboard;
