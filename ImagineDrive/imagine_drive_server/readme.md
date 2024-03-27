# DESCRIPTION
- Backend support for imagine time file sharing 

# DEPLOYING
- deploying uses gcloud utility. Please see website for gcloud installation and config.
cd <this directory>
gcloud app deploy

# ENVIRONMENT VARIABLES
- Please check file ./app.yaml for configuration
-- LOG - true if enable logging
-- STAGING - true if this is demo purposes, false if production