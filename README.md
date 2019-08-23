# NakshaJS
Mapping application written in nodejs.  
This application has been installed and tested on Ubuntu 18.04 only. It may or may not work other versions and distros.

## System Dependencies
- `sudo apt install zip`
- `sudo apt install postgresql-10`
- `sudo apt install postgresql-10-postgis-2.4`
- `sudo apt install apache2`
- `sudo apt install gdal-bin`
- `sudo apt install libmapnik3.0`
- `sudo apt install libmapnik-dev`

## PostgreSQL
Edit /etc/postgresql/10/main/pg_hba.conf. Look for the following line:
<pre>
# "local" is for Unix domain socket connections only
local   all             all                                     peer
</pre>
        
Replace "peer" with "md5". Save the file and then restart postgresql service with  
`sudo systemctl restart postgresql`

## Node
This has been tried and tested with Node 10.16.3. You can install node with [nvm](https://github.com/nvm-sh/nvm)  
`wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash`  
`source ~/.bashrc`
`nvm install v10.16.3`  
`nvm use default`  
Check the [nvm site](https://github.com/nvm-sh/nvm) for latest nvm installation instructions.
You are free to choose any mode of installation.

## Source Code
Create a directory for the application. Let us call it **app-directory** for future reference.
Get the source code of nakshajs throught 'git checkout' in this directory. Or, you can download
the zipfile from github and unzip it here.

## Application Dependencies
Change to **app-directory** and then:  
`npm install --only=production`  
`npm install -g forever`  

## Set Up
For all of the following steps, switch to **app-directory**
### Generate config files
`node cmd/gen_config.js`  
You will have to give following details when prompted:
* Domain name or IP address from which application will be accessed.
* Name for the database
* Username and password combinations for three different types of roles that need access to database
* Port on which the application will be run

### Setup database
Create database and roles needed for NakshaJS with  
`sudo su postgres -c 'psql -f db.sql -b'`

Create required tables with:  
`node -r dotenv/config cmd/import_db.js`

### User accounts
Run this command to create user account for accessing the application.  
`node -r dotenv/config cmd/add_user.js`

### Apache
`sudo cp apache.vhost.conf /etc/apache2/sites-available/010-nakshajs.conf` and then  
`sudo a2ensite 010-nakshajs.conf`

Run following commands to enable the required apache modules.  
- `sudo a2enmod proxy`
- `sudo a2enmod proxy_http`
- `sudo a2enmod rewrite`
- `sudo a2enmod headers`

### Start Application
Start forever: `forever start forever.json`  
Restart apache: `sudo systemctl restart apache2`  

## Start Mapping
From your browser access the application through the domain-name/ip-address that you gave while generating the config files
Use the username/password given while generating the user account
