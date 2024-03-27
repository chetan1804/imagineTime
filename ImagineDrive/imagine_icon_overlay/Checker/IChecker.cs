
using SharpShell.Interop;

namespace imagine.Checker
{
    public enum eSyncState
    {
        /// <summary>
        /// not part of the system
        /// </summary>
        Unknown,
        /// <summary>
        /// this file is currently syncing
        /// </summary>
        Syncing, 
        /// <summary>
        /// this file was already synced
        /// </summary>
        Synced,
        /// <summary>
        /// the file needs to be resynced. failed due to source file was unable to resolve
        /// </summary>
        Failed,
    }

    public interface IChecker
    {
        /// <summary>
        /// use to check is part of the sync system
        /// </summary>
        /// <param name="path">the file path use to check</param>
        /// <returns></returns>
        bool IsSyncable(string path, FILE_ATTRIBUTE fileAttributes);

        eSyncState GetFileStatus(string path, FILE_ATTRIBUTE attrib = FILE_ATTRIBUTE.FILE_ATTRIBUTE_NORMAL);
    }
}
