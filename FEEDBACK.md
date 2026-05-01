# TO FIX
- [ ] admin account cannot access to intakes, it only can access the admin dashboard, so if admin logs in, it should be redirected to the admin panel

# TO CHANGE
- [ ] mcp token should be an api token issued from the user
- [ ] add a header bar with the logo (FFIT) on the left and the user avatar on the right (round-avatar) if logged show the first letter from the username, if not show a placeholder
- [ ] authentication states:
  - [ ] if no user is logged: show only the login form
  - [ ] if the user is the admin: go directly to /admin 
  - [ ] if the user is not the admin go to Overview directly (force redirection)

# FOR ANOTHER MR
## NEW
- [ ] users should have a /config panel that allows them to change password, and issue an API_TOKEN to access the api (rest calls and mcp can mod user data with this)

## TO BE FIXED POSTMR
- [ ] reload data button should be removed

