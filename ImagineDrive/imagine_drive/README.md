# imagine_drive

## Setup
- Install Flutter 2.2.3 Windows
https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_2.2.3-stable.zip

- Install Dokan Plugin
https://github.com/dokan-dev/dokany/releases/download/v2.0.5.1000/Dokan_x64.msi

- Install the Flutter and Dart VS Plugins
Start VS Code.
Invoke View > Command Palette….
Type “install”, and select Extensions: Install Extensions.
Type “flutter” in the extensions search field, select Flutter in the list, and click Install. This also installs the required Dart plugin.

- Visual Studio
Make sure you have installed Visual Studio (preferrably 2019) requirements for Windows compilation

- Configure project
On current Flutter project directory
type flutter config --enable-windows-desktop
this will add configuration for desktop platform

## Getting Started

- Local Testing
1. On imagine drive flutter source, make sure utils/constants.dart ACCESS_REMOTE constant is set to false

- Building client app
flutter build windows

- Packaging 
1. Locate <Imagine Drive Root folders>/installer
2. Build Package via Wix project with Release x86

- Uploading Server source files
gcloud app deploy

## Debugging
For frontend make sure there is a launch.json with value
`
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Flutter",
            "request": "launch",
            "type": "dart",
            "flutterMode": "debug"
        }
    ]
}
`

For Backend run imagine_drive_server directory as npm

