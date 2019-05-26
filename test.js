const Ssh  = require('node-ssh');
const exec = require('child_process').exec;
const Discord = require('discord.js');
var fs = require('fs');

var json = JSON.parse(fs.readFileSync('./key/key.json', 'utf8'));
var instance_isrunning = false
const client = new Discord.Client();
const token = json.apikey
const sshPrivateKey = './key/minecraft_tokyo.pem';

MINECRAFT_CTRL = "sudo service minecraft "
MINECRAFT_CMD = "sudo service minecraft command "
AWS_STOP = "aws ec2 stop-instances --instance-ids "
AWS_START = "aws ec2 start-instances --instance-ids "
AWS_INSTANCE_ID = json.instanceID

async function ssh_sendcmd(cmd) {
    const ssh = new Ssh();
    
    // 接続
    await ssh.connect({
        host: '54.95.155.34',
        port: 22,
        username: 'ec2-user',
        privateKey: sshPrivateKey
    });

    // コマンド実行
    // res = await ssh.execCommand(cmd, {options: {pty: true}});
    res = await ssh.execCommand(cmd, {options: {pty: true}});

    // console.log(res)
    // 切断
    ssh.dispose();
    return res
}
async function aws_control(cmd) {
    exec(cmd, (err, stdout, stderr) => {
        if (err) { console.log(err); }
        console.log(stdout);
      });
}

client.on('ready', () => {
    console.log('ready...');
});
//Bot自身の発言を無視する呪い
client.on('message', message =>{
    if(message.author.bot){
        return;
    }
    if (message.channel.name === 'minecraft_status'){
        if (message.content === "!start") {
            if (instance_isrunning == false) {
                instance_isrunning = true
                message.channel.send("サーバーを起動しています　数分お待ちください")
                ssh_sendcmd(AWS_START + AWS_INSTANCE_ID)
                .then(ret => message.channel.send(String(ret.stdout)))
                .catch(error => console.log(error))
            }
            else {
                message.channel.send("サーバーは既に起動中です...")
            }
        }
        else if (message.content === "!stop") {
            if (instance_isrunning == false) {
                message.channel.send("サーバーを停止しています...")
                ssh_sendcmd(MINECRAFT_CMD + 'stop')
                .then(ret => message.channel.send(String(ret.stdout)))
                .catch(error => console.log(error))
                ssh_sendcmd(AWS_STOP + AWS_INSTANCE_ID)
                .then(ret => message.channel.send(String(ret.stdout)))
                .catch(error => console.log(error))
            }
            else {
                message.channel.send("サーバーは既に停止中です...")
            }

        }
        else if (message.content === "!status") {
            if (instance_isrunning == true) {
                message.channel.send("サーバーは起動中です")
            }
            else {
                message.channel.send("サーバーは停止中です")
            }
            ssh_sendcmd(MINECRAFT_CMD + 'list')
            .then(ret => message.channel.send(String(ret.stdout)))
            .catch(error => console.log(error))
        }
        else if (message.content === "!save") {
            ssh_sendcmd(MINECRAFT_CMD + 'save-all')
            .then(ret => message.channel.send(String(ret.stdout)))
            .catch(error => console.log(error))
        }
        else if (message.content === "DEATH羅生門") {
            message.channel.send("しね")
        }

        return
    }
    if (message.content.match(/discord.gg/)) {
        message.delete(100)
    }
});
client.login(token);