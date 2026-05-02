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
## PR 1: header cleanup
- [x] reload data button should be removed
- [x] add dark/light theme toggle to header bar and always accessible

## PR 2: user config page shell
- [ ] new /config page for users
- [ ] only authenticated non-admin users can access /config
- [ ] add config navigation from the logged-in header/avatar area
- [ ] has a sidebar with the following sections:
  - [ ] change password
  - [ ] manage api tokens

## PR 3: change password
- [ ] add change password form in /config
- [ ] require current password before setting a new password
- [ ] validate and persist the new password through an authenticated API route
- [ ] show success and validation errors inline

## PR 4: manage api tokens
- [ ] add named API token storage for users
- [ ] manage api tokens section shows list of current issued tokens
- [ ] every token shows the name and first n chars of the token
- [ ] every token has a copy to clipboard action
- [ ] new token -> asks for a name -> confirm -> adds it to the list
