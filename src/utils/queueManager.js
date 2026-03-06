const queue = [];
let processing = false;

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  const { task, resolve, reject } = queue.shift();
  try { resolve(await task()) }
  catch (e) { reject(e) }
  finally {
    processing = false;
    processQueue();
  }
}

function addToQueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    processQueue();
  });
}

module.exports = { addToQueue };