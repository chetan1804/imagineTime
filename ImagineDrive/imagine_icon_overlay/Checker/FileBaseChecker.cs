using SharpShell.Interop;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace imagine.Checker
{
    public class FileBaseChecker : IChecker
    {
        DateTime _lastProcessed;
        bool _isInit = false;

        void ProcessReset()
        {
            if (_isInit)
            {
                var diff = DateTime.Now - _lastProcessed;
                if (diff.TotalSeconds < 5)
                    return;
                AppData.ReloadAllDataSource();
            }
            else
                _isInit = true;
            _lastProcessed = DateTime.Now;
        }


        String GetMarkerPath(string relativePath, string statusName)
        {
            return AppData.CurrentUserDir + ".cache\\" + statusName + "\\" + relativePath;
        }

        bool IsFileExistForStatus(string relativePath, string statusName)
        {
            var sourceFile = GetMarkerPath(relativePath, statusName);
            return File.Exists(sourceFile);
        }

        public eSyncState GetFileStatus(string path, FILE_ATTRIBUTE attrib = FILE_ATTRIBUTE.FILE_ATTRIBUTE_NORMAL)
        {
            if (!IsSyncable(path, attrib)) return eSyncState.Unknown;
            var relativePath = Util.GetRelativePath(path, AppData.MountedDrive);
            if (attrib != FILE_ATTRIBUTE.FILE_ATTRIBUTE_DIRECTORY)
            {
                
                if (IsFileExistForStatus(relativePath, "synced"))
                    return eSyncState.Synced;
                else if (IsFileExistForStatus(relativePath, "syncing"))
                    return eSyncState.Syncing;
                else
                    return eSyncState.Unknown;
            }
            else
            {
                var syncingDir = GetMarkerPath(relativePath, "syncing");
                if (Directory.Exists(syncingDir) && Directory.GetFiles(syncingDir).Length > 0)
                    return eSyncState.Syncing;
                else
                    return eSyncState.Synced;
            }
        }

        public bool IsSyncable(string path, FILE_ATTRIBUTE fileAttributes)
        {
            switch (fileAttributes)
            {
                case FILE_ATTRIBUTE.FILE_ATTRIBUTE_HIDDEN:
                case FILE_ATTRIBUTE.FILE_ATTRIBUTE_TEMPORARY:
                    return false;
            }
            ProcessReset();
            if (!AppData.IsMounted) return false;
            return path.StartsWith(AppData.MountedDrive, true, null);
        }
    }
}
