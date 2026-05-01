# TO FIX
- [x] admin account cannot access to intakes, it only can access the admin dashboard, so if admin logs in, it should be redirected to the admin panel

# TO CHANGE
- [x] mcp token should be an api token issued from the user
- [x] add a header bar with the logo (FFIT) on the left and the user avatar on the right (round-avatar) if logged show the first letter from the username, if not show a placeholder
- [x] authentication states:
  - [x] if no user is logged: show only the login form
  - [x] if the user is the admin: go directly to /admin 
  - [x] if the user is not the admin go to Overview directly (force redirection)
  - [x] logout always redirects to root path
  - [x] accessing /admin without logging shows 403



# FOR ANOTHER MR
## NEW
- [ ] new /config page for users
  - [ ] has a sidebar with the following sections:
  - [ ] change password
  - [ ] manage api tokens
    - [ ] on clicked shows list of current issued tokens
      - [ ] every token show has a the name and first n chars of the api, then at the right, a copy to clipboard button
    - [ ] new token -> asks for a name -> confirm -> adds it to the list
## TO BE FIXED POSTMR
- [ ] reload data button should be removed
- [ ] add dark/light theme toggle to header bar and always accessible
- [ ] 
