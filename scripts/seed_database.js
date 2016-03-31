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

let COMPONENTS = [
  {
    byNpm: false,
    name: 'ocularis-cube',
    git: 'git@github.com:cverna-hackathons/ocularis-cube.git'
  },
  {
    byNpm: false,
    name: 'ocularis-pane',
    git: 'git@github.com:cverna-hackathons/ocularis-pane.git'
  }
];

let tasks = [
  //seed all users
  (done) => {
    let promises = USERS.reduce((mem, u) => {
      mem.push((next) => {
        console.log('Seeding user:', u.username);
        models.User.findOrCreate({
          where: {
            username: u.username,
            email: u.email,
            password: u.password
          }
        }).then(()=>next()).catch(err => next(err))
      });
      return mem;
    }, []);
    async.parallel(promises, (err) => done(err));
  },
  //seed all components
  (done) => {
    let promises = COMPONENTS.reduce((mem, c) => {
      mem.push((next) => {
        console.log('Seeding component:', c.name, c.git);
        cProc.exec(
          `npm run register:component ${c.byNpm} ${c.name} ${c.git}`, 
          (err, stdout, stderr) => {
            console.log('Component seeding stdout, stderr:', stdout, stderr);
            return next(err);
          }
        );
      });
      return mem;
    }, []);
    async.series(promises, (err) => done(err));
  }
];

async.series(tasks, (errors, results) => {
  if (errors) {
    console.log('Failed to seed, errors:', errors);
    process.exit(1);
  }
  else process.exit(0);
});
