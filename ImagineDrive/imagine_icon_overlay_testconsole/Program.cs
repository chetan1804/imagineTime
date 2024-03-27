using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using imagine.Checker;
using imagine;

namespace imagine_icon_overlay_testconsole
{
    class Program
    {
        static void Main(string[] args)
        {
            //InstallerCustomAction.CustomAction.RegisterShellDll(null);
            //SocketHandler.CopyLinkFile("client 1\\sdfsd.txt").Wait();/*
            var result = CheckerManager.CurrentChecker.GetFileStatus("K:\\client 1\\New Text Document.txt");
            var result2 = CheckerManager.CurrentChecker.GetFileStatus("K:\\client 1\\New Text Dokcument.txt"); 
            var result3 = CheckerManager.CurrentChecker.GetFileStatus("K:\\");
            var result4 = CheckerManager.CurrentChecker.GetFileStatus("K:\\client 1\\", SharpShell.Interop.FILE_ATTRIBUTE.FILE_ATTRIBUTE_DIRECTORY);
            var result5 = CheckerManager.CurrentChecker.GetFileStatus("K:\\client 1\\New Text Document - Copy.txt");
            /*Console.WriteLine(result);*/
            Console.ReadKey();
        }
    }
}
