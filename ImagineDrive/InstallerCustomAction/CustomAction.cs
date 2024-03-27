using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Deployment.WindowsInstaller;

namespace InstallerCustomAction
{
    public class CustomAction
    {
        static Process process;

        static string Path
        {
            get => Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86) + "\\Imagine Share\\";
        }

        [CustomAction]
        public static ActionResult SilentCommand(Session session)
        {
            RunProcess(session.CustomActionData.ToString());
            return ActionResult.Success;
        }

        [CustomAction]
        public static ActionResult RunInit(Session session)
        {
            RunProcess(Path + "init.bat");
            RunProcess(Path + "dokanctl", "/i d");
            return ActionResult.Success;
        }

        [CustomAction]
        public static ActionResult RunUninit(Session session)
        {
            RunProcess(Path + "uninit.bat");
            RunProcess(Path + "dokanctl", "/r d");
            return ActionResult.Success;
        }

        static void RunProcess(string command, string args = null)
        {
            var process = new Process();
            CustomAction.process = process;
            process.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
            process.StartInfo.CreateNoWindow = true;
            process.EnableRaisingEvents = true;
            //File.WriteAllText("c:/hello.text", command);
            process.StartInfo.FileName = command;
            if (!string.IsNullOrEmpty(args))
                process.StartInfo.Arguments = args;
            process.StartInfo.UseShellExecute = false;
            process.Start();
        }
    }
}
