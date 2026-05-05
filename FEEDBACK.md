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
- [x] new /config page for users
- [x] only authenticated non-admin users can access /config
- [x] add config navigation from the logged-in header/avatar area
- [x] has a sidebar with the following sections:
  - [x] change password
  - [x] manage api tokens

## PR 3: change password
- [x] add change password form in /config
- [x] require current password before setting a new password
- [x] validate and persist the new password through an authenticated API route
- [x] show success and validation errors inline

## PR 4: manage api tokens
- [x] add named API token storage for users
- [x] manage api tokens section shows list of current issued tokens
- [x] every token shows the name and first n chars of the token
- [x] every token has a copy to clipboard action
- [x] every token has a remove action
- [x] new token -> asks for a name -> confirm -> adds it to the list

## EDITOR FEEDBACK
- [x] Moment should be a selectable field between Breakfast, Lunch, Snacks and Dinner
- [x] Units should be a selectable between the most used
- [x] in Overview -> Calendar clicking on a day should take you to that day entry

## GENERAL FEEDBACK
- [ ] make header sticky
- [ ] make the Log table the size of the screen + sidebar and scroll only its content
