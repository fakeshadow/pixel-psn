#Requirement(tested):
nodejs vv10.14.2
npm 6.4.1

#Setup:
1. clone this repo
2. go into the folder and run 
   npm install
3. Rename .env_sample to .env and change whatever params you want
4. npm start


#API endpoints:

*check https://tusticles.com/psn-php/first_login.html for how to get uuid and 2FA

login                               
/login/<your_uuid>/<your_2FA> 

get user profile                                 
/profile/<user_psn_id>

get user trophy summary
/trophies/<start_number>/<limit_number>/<user_psn_id>

get all trophies of a user
/trophies/getall/<user_psn_id>/<wait_time>     


*<wait_time> is in milliseconds. It's there to prevent throtting your PSN API acess.


#issue:
your refresh token is stored in cert/tokens.json. It's safe to disable cert.save() function
if you don't feel like to store it;

Poor error handling;

process may halt when auto refreshing token;

messy code;

