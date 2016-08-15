#!/usr/bin/env node

var cp = require('child_process')
var net = require('net')
var argv = require('minimist')(process.argv.slice(2))

const PASS_WORD = "moyuyc"

const server = net.createServer((socket) => {
	// console.log(socket);
	socket.write('welcome, please input password (like -password 123456)\r\n')
	socket.setEncoding('ascii')
	socket.setKeepAlive(true)
	const shell = cp.exec('/bin/sh', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		console.log(`stdout: ${stdout}`);
		console.log(`stderr: ${stderr}`);
	});
	let isChecked = false
	// socket.pipe(shell.stdin)
	shell.stdout.on('data', (data) => {
		let s = `stdout: ${data}`;
		socket.write(s)
	})
	shell.stderr.on('data', (data) => {
		let s = `stderr: ${data}`;
		socket.write(s)
	})
	shell.on('close', function (code) {
		let s = 'child process exited with code ' + code
		console.log(s)
		socket.end(s)
	})
	socket.on('data', (data) => {
		data = data.replace(/[\r\n]+$/, '');
		console.log('data: ', data)
		if(data.charCodeAt(0) == 127 && data.charCodeAt(1) == 116) {
			shell.kill()
			return
		}
		if(data.startsWith('-password ')) {
			isChecked = data.split(' ')[1] === PASS_WORD
			socket.write((isChecked ? 'password correct!' : 'password wrong')+'\r\n')
			return
		}
		if(isChecked) {
			data = new Buffer(data).toString('utf-8')
			data = data == '' ? 'pwd' : data
			shell.stdin.write(data+'\n')
		} else {
			socket.write('please input password (like -password 123456)\r\n')
		}
	})
}).on('error', (error) => {
	console.error(error)
	throw error
})

server.listen(argv.p || 9988, () => {
	let address = server.address();
    console.log('opened server on %j', address);
})


//cp.