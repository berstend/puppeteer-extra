console.info("Hello from background!", chrome.runtime.id)

window.addSeven = (number) => number + 7

const delay = ms => new Promise(_ => setTimeout(_, ms));

window.addNineAsync = async (number) => {
  await delay(1000)
  return number + 9
}
