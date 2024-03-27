const enabled = process.env.LOG === 'true' | true;

function writet(tag = 'logger', ...arguments) {
    if (enabled)
        console.log(tag, ':', ...arguments);
}

module.exports = {
    writet: writet
}