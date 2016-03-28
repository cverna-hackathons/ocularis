'use strict';

let async = require('async');
let models = require('../app/models');
let cProc = require('child_process');

let USERS = [{
  username: 'Kando',
  email: 'kubo@ocularis.com',
  password: 'kubo'
}, {
  username: 'Pelo',
  email: 'pelo@ocularis.com',
  passowrd: 'pelo'
}];

let COMPONENTS = [{
  byNpm: false,
  name: 'ocularis-cube',
  git: 'git@github.com:cverna-hackathons/ocularis-cube.git'
}];

let tasks = [

  //seed all users
  (call) => {
    let promises = USERS.reduce((mem, u) => {
      mem.push((_c) => {
        models.User.findOrCreate({
          where: {
            username: u.username,
            email: u.email,
            password: u.password
          }
        }).then(()=>_c())
          .catch(err => _c(err))
      });
      return mem;
    }, []);
    async.parallel(promises, (err) => call(err));
  },

  //seed all components
  (call) => {
    let promises = COMPONENTS.reduce((mem, c) => {
      mem.push((_c) => {
        cProc.exec(`npm run register:component ${c.byNpm} ${c.name} ${c.git}`, (err) => _c(err));
      });
      return mem;
    }, []);
    async.parallel(promises, (err) => call(err));
  }
];

async.parallel(tasks, (err, results) => {
  if (err) process.exit(1);
  else process.exit(0);
});
