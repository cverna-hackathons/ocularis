'use strict';

let q = require('q');
let models = require('../app/models');

let tasks = [
  models.User.findOrCreate({
    where: {
      username: 'Kando',
      email: 'kubo@ocularis.com',
      password: 'kubo'
    }
  }),

  models.User.create({
    where: {
      username: 'Pelo',
      email: 'pelo@ocularis.com',
      password: 'pelo'
    }
  })

];

q.all(tasks)
  .then(res => {
    process.exit();
  })
  .catch(err => {
    process.exit(1);
  });
