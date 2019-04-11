
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var logger = require('../utils/logger');

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    for (const id in cluster.workers) {
        cluster.workers[id].on('message', function (msg) {
            console.log('[master] ' + 'fork: worker' + msg);
        });
    }
    console.log('[master] ' + "master started, pid:" + process.pid);
    cluster.on('fork', function (worker) {
        console.log('[master] ' + 'fork: worker' + worker.id);
    });
    cluster.on('online', function (worker) {
        console.log('[master] ' + 'online: worker' + worker.id);
    });
    cluster.on('exit', function (worker, code, signal) {
        if (signal) {
            console.log(`worker was killed by signal: ${signal}`);
            return;
        }
        if (code !== 0) {
            console.log(`worker exited with error code: ${code}`);
            return;
        }
        if (worker.exitedAfterDisconnect === true) {
            console.log('[master] ' + 'exit worker' + worker.id + 'voluntary – no need to worry');
            return;
        }
        console.log('[master] ' + 'exit worker' + worker.id + ' died, try to fork a new worker.');
        cluster.fork();
    });
    process.on('uncaughtException', function ( err ) {
        logger.error_log("loginServer [master] id:" + process.pid + ' Caught exception: ' + err.stack );
    });
} else if (cluster.isWorker) {
    console.log('[worker] ' + "worker" + cluster.worker.id + " started, pid:" + process.pid);

    process.on('message', function (msg) {
        console.log('[worker] worker' + cluster.worker.id + ' received msg:' + msg);
        process.send('[worker] send msg ' + cluster.worker.id + ' to master.');
    });
    process.on('uncaughtException', function ( err ) {
        logger.error_log("loginServer [worker] id:" + cluster.worker.id  + ' process.pid: ' + process.pid + ' Caught exception: ' + err.stack );
    });

    setTimeout(() => {
        console.log('This will still run.');
    }, 500);

    // 故意调用一个不存在的函数，应用会抛出未捕获的异常
    nonexistentFunc();
    console.log('This will not run.');


}