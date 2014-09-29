Oral History Meta Data tool
===================

A heroku app for tagging and adding meta-data to any html5 audio/video.

#Installation

* Download and Install Node.js: http://nodejs.org/download/ (try running node command to make sure it is installed)
* Create a heroku account (it is free for applications with limited traffic)
* Install heroku client: https://devcenter.heroku.com/articles/getting-started-with-nodejs#set-up
* Create a Mongo Db instance (either MongoHQ or Mongolabs, also free for small amount of storage)
* Download/Clone the repo
* Add db credentials to config/environment.js file.
* run 'npm install' in the project directory to get required node packages (not realy needed if you just want to deploy to herolu server)
* run 'git push heroku master' (more info here: https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-the-app but you don't need to run 'heroku create' since the heroku app is already created) to deploy it to heroku.
* run 'foreman start web' if you want to run it locally (in this case you need 'npm install' from above

