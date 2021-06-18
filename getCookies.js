var Nightmare = require('nightmare');
var nightmare = Nightmare()

var startURL = 'https://ficbook.net/';

module.exports = function (login, password) {
  nightmare
    .goto('https://ficbook.net/')
    .click('#jsLogin span')
    .wait('.login-dropdown')
    .type('form [name=login]', login)
    .type('form [name=password]', password)
    .click('form [name=do_login]')
    .wait('.header-info')
    .cookies.get()
    .end()
    .then(function (cookies) {
      // console.log(cookies);
      return cookies;
    })
    .catch(function (error) {
      console.error('Authorization failed:', error);
    });
}