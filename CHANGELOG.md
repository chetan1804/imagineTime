Master - 4/21/20
  Increased server connection timeout
  More info in file upload error messages

1.5.3
STATUS: RELEASED TO PRODUCTION 3/31/20
  add upload ip address tracking
  client based secret questions for share links
  individual client user based secret questions
  socket.io changes to real time events and connections
  - better alerts and error messages
  - hopefully fixes intermitted 0% upload bugs
  fix blank password on email invites
  misc. null checks and code cleanup
  misc. fixes to email results modal
  shared signer email address on signature requests
  - detect duplicate email and prompt user to enter an email comment. e.g. name(spouse)@domain.com
  - when a shared email address is used, create direct links for each signer in one email
  - display error message when duplicate emails are used on a request with more than two signers
  changed shared clientuser secret to single user secret
  - premissioned user updated api
  fix login cookies to accomodate chrome sameSite changes
  warning modal when downloading more than 10 files

1.5.2
STATUS: RELEASED TO PRODUCTION 2/22/20
  KBA functionlity to assuresign e-sigs
  uploadName free form text field non-logged in file uploads
  booleans to determine whether a staffClient recieves notifications for a given client
  - UI for the staff to change their own, or firm owner to change their staff's
  better workspace filtering and file tagging
  changed the way credentials for OPI and PD are stored in localstorage
  hide convert attachments option in OPI
  added visible version number to OPI and PD for future debugging
  new warning text before firm invites client users
  added changelog file
  bug fixes
  - file search results
  - client address display
  - list comparator icons