using imagine.Checker;
using SharpShell.Attributes;
using SharpShell.Interop;
using SharpShell.SharpIconOverlayHandler;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace imagine
{

    [ComVisible(true)]
    public class ImagineShareSynced : SharpIconOverlayHandler
    {
        protected override bool CanShowOverlay(string path, FILE_ATTRIBUTE attributes)
        {
            var status = CheckerManager.CurrentChecker.GetFileStatus(path, attributes);
            return status == eSyncState.Synced;
        }

        protected override Icon GetOverlayIcon()
        {
            return imagine.Properties.Resources.done;
        }

        protected override int GetPriority()
        {
            return 2;
        }
    }

    [ComVisible(true)]
    public class ImagineShareSyncing : SharpIconOverlayHandler
    {
        protected override bool CanShowOverlay(string path, FILE_ATTRIBUTE attributes)
        {
            var status = CheckerManager.CurrentChecker.GetFileStatus(path, attributes);
            return status == eSyncState.Syncing;
        }

        protected override Icon GetOverlayIcon()
        {
            return imagine.Properties.Resources.refresh;
        }

        protected override int GetPriority()
        {
            return 1;
        }
    }

    [ComVisible(true)]
    [COMServerAssociation(AssociationType.AllFiles)]
    public class ShareLinkExtension : SharpShell.SharpContextMenu.SharpContextMenu
    {
        public ShareLinkExtension() : base()
        {
            SocketHandler.Initialize();
        }

        protected override bool CanShowMenu()
        {
            return true;
        }

        protected override ContextMenuStrip CreateMenu()
        {
            var menuStrip = new ContextMenuStrip();
            if (SelectedItemPaths.Count() > 1 || !AppData.IsMounted) return menuStrip;

            var filePath = SelectedItemPaths.First();
            if (!AppData.IsChildPath(filePath)) return menuStrip;

            var copyMenu = new ToolStripMenuItem()
            {
                Text = "Copy ImagineShare Link",
                Image = imagine.Properties.Resources.app
                
            };
            copyMenu.Click += (sender, args) => CopyLink();
            menuStrip.Items.Add(copyMenu);
            return menuStrip;
        }

        async void CopyLink()
        {
            var selectedItem = SelectedItemPaths.First();
            var relativePath = Util.GetRelativePath(selectedItem, AppData.MountedDrive);
            try
            {
                var link = await SocketHandler.CopyLinkFile(relativePath);
                if (!String.IsNullOrEmpty(link))
                    Clipboard.SetText(link);
            }
            catch(System.Exception e)
            {
                LogError("ERror on copylink", e);
            }
            
        }
    }
}