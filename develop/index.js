
//Run NPM packages
const inquirer = require("inquirer");
const axios = require("axios");
const generateHTML = require('./generateHTML');
// https://github.com/bjrmatos/electron-html-to/blob/master/README.md
//Use the following versions: "electron": "^5.0.12", "electron-html-to": "^2.6.0". In case you need a workaround in the meantime.
//https://github.com/bjrmatos/electron-html-to/issues/459
const fs = require('fs');
const convertFactory = require('electron-html-to');
var conversion = convertFactory({converterPath: convertFactory.converters.PDF});

//Create data object to hold data items collected from GitHub
const data = {};

//Questions to be prompted to user
const questions = [
  {
      type: "input",
      message: "What is your GitHub username?",
      name: "username"
  }, 
  {
      message: "What is your favorite color?",
      name: 'color',
      type: 'list',
      choices:['green', 'blue', 'pink', 'red']
  }
];

function init() {
    //console.log("init has been called")
    //Use inquirer to prompt question getting username and color choice.
    inquirer.prompt(questions).then(function ({username, color}) {
        //Prepare URL for axios call.  Insert username.
        const queryUrl = `https://api.github.com/users/${username}`;
        //Use the above query URL to make axios call  to github below
        axios.get(queryUrl).then((response) => {

            //console.log(response.data);
            //Get data from GitHub for username, favorite color, number of repos, name, followers, following, portPic, location, blog, company,
            //bio, and number of stars.
            data.color = color;
            data.username = username;
            data.numOfRepo = response.data.public_repos;
            data.name = response.data.name;
            data.followers = response.data.followers;
            data.following = response.data.following;
            data.portPic = response.data.avatar_url;
            data.location = response.data.location;
            data.blog = response.data.blog;
            data.company = response.data.company;
            data.bio = response.data.bio;

            // Requires a different axios call to get stars
            axios.get(`https://api.github.com/users/${username}/repos?per_page=100`).then((response) => { 
            //console.log(response);
            data.stars = 0;
            // Loop through each repository and count the number of stars
            for (let i = 0; i < response.data.length; i++) { 
                data.stars += response.data[i].stargazers_count;
            };
            //console.log(data.stars);
            //Call function that generates html and css style
            let profileHTML = generateHTML(data);
            //console.log(profileHTML);

            //https://github.com/bjrmatos/electron-html-to/blob/master/README.md
            conversion({html: profileHTML}, function (err, result) {
            if (err) {
                return console.error(err);
            }
            //console.log(result.numberOfPages);
            //console.log(result.logs);
            result.stream.pipe(fs.createWriteStream('./profile.pdf'));
            conversion.kill(); // necessary if you use the electron-server strategy, see bellow for details
            });
        })//Close second axios call
    })//Close first axios call
});//Close inquirer
};//Close function init

//Call init to start questions and collecting data.
init();


