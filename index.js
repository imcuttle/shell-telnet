#!/usr/bin/env node

"use strict";
var cp = require('child_process')
var net = require('net')
var argv = require('minimist')(process.argv.slice(2))

const PASS_WORD = argv.pwd || "123456"

const server = net.createServer((socket) => {
	// console.log(socket);
	const shell = cp.exec('/bin/sh', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		console.log(`stdout: ${stdout}`);
		console.log(`stderr: ${stderr}`);
	});
	socket.write('welcome, please input password (like -password 123456)\r\n')
	// socket.setEncoding('ascii')
	socket.setKeepAlive(true)
	socket.on('end', () => {
		shell.kill()
		console.log('kill!')
	})
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
	})
	socket.on('data', (data) => {
		data = data.toString('utf-8').replace(/[\r\n]+$/, '')
		if(data.startsWith('-password ')) {
			isChecked = data.split(' ')[1] === PASS_WORD
			socket.write((isChecked ? 'password correct!' : 'password wrong')+'\r\n')
			return
		}
		if(isChecked) {
			data = data == '' ? 'pwd' : data
			shell.stdin.write(data+'\n')
		} else {
			socket.write('please input password (like -password 123456)\r\n')
		}
		console.log('data: ', data)
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