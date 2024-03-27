using Newtonsoft.Json.Linq;
using SharpShell.Interop;
using System;
using System.Collections.Generic;
using System.IO;

namespace imagine.Checker
{
    public class AppData
    {
        const string IMAGINEDRIVE_DIR = "ImagineShareTemp";
        const string DB_NAME = "sync11.dat";
        static String _windowsLocation = null;

        /// <summary>
        /// get the current installation of windows
        /// </summary>
        static String WindowsLocation
        {
            get
            {
                if (_windowsLocation != null) return _windowsLocation;

                var drives = new char[] { 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm' };
                foreach (var drive in drives)
                {
                    if (Directory.Exists(drive + ":\\Windows\\System32"))
                    {
                        _windowsLocation = drive + ":\\";
                        break;
                    }
                }
                if (_windowsLocation == null)
                    _windowsLocation = "";
                return _windowsLocation;
            }
        }

        static String ImagineShareDir { get => WindowsLocation + IMAGINEDRIVE_DIR + "\\"; }

        // VARIABLES for SOURCE DATA
        static JObject _lastAppSettings = null;
        static int _lastUserId = -1;
        static string _lastUserWorkingDir = null;
        static string _mountedDrive = null;
        static bool _isMounted = false;

        static public JObject AppSettings
        {
            get
            {
                if (_lastAppSettings != null)
                    return _lastAppSettings;

                var settingPath = ImagineShareDir + "settings";
                JObject settingsObj;
                if (Util.TryLoadFromFile(settingPath, out settingsObj))
                    _lastAppSettings = settingsObj;
                return _lastAppSettings;
            }
        }

        static public int CurrentUserId
        {
            get
            {
                if (_lastUserId > -1) return _lastUserId;
                JToken lastUSer;
                if (AppSettings.TryGetValue("lastUser", out lastUSer))
                {
                    _lastUserId = lastUSer.Value<int>();
                }
                return _lastUserId;
            }
        }

        static public String CurrentUserDir
        {
            get
            {
                if (!string.IsNullOrEmpty(_lastUserWorkingDir)) return _lastUserWorkingDir;
                if (CurrentUserId == -1) return null;
                // STEP: retrieve user directory based from app settings
                JToken UDID;
                if (AppSettings.TryGetValue("path" + CurrentUserId, out UDID))
                {
                    _lastUserWorkingDir = ImagineShareDir + UDID.ToString() + "\\";
                }
                return _lastUserWorkingDir;
            }
        }

        
        static public string MountedDrive
        {
            get
            {
                if (!string.IsNullOrEmpty(_mountedDrive)) return _mountedDrive;

                // STEP: load the mounted drive letter based from settings
                JToken driveLetter;
                if (AppSettings.TryGetValue("lastDriveUsed", out driveLetter))
                {
                    _mountedDrive = driveLetter.ToString().ToUpper() + "\\";
                }
                else
                {
                    _mountedDrive = "empty";
                }
                
                _isMounted = Directory.Exists(_mountedDrive + "\\");
                return _mountedDrive;
            }
        }

        static public bool IsMounted
        {
            get
            {
                return !string.IsNullOrEmpty(MountedDrive) && _isMounted;
            }
        }

        static public bool IsChildPath(string path)
        {
            return path.StartsWith(AppData.MountedDrive, true, null);
        }

        static public void ReloadAllDataSource()
        {
            _lastAppSettings = null;
            _lastUserId = -1;
            _lastUserWorkingDir = null;
            _mountedDrive = null;
            _isMounted = false;
        }
    }
}
