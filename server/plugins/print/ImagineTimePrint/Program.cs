using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

namespace ImagineTimePrint
{
    class LogListener : miniws.ILogListener
    {
        public void OnLog(string pLog)
        {
            Program.LogWrite(pLog);
        }
    }

    class Program
    {
        private const string errorDialogCouldNotWrite = "Could not create the output file.";

        private const string traceSourceName = "ImagineTimePrint";

        private static readonly TraceSource logEventSource = new TraceSource(traceSourceName);

        static void Main(string[] args)
        {
            var standardInputFilename = Path.GetTempFileName();
            var outputFilename = Path.GetTempFileName();
            LogWriteLine("************************");
            LogWriteLine("Printer started. Output file @ " + outputFilename + " Input " + standardInputFilename);
            miniws.ConsoleRedirector.attach(new LogListener());

            try
            {
                // Create a temporary file from the incoming printer data. This file is then directly
                // uploaded via the API.
                using (var standardInputReader = new BinaryReader(Console.OpenStandardInput()))
                {
                    using (var standardInputFile = new FileStream(standardInputFilename, FileMode.Create, FileAccess.ReadWrite))
                    {
                        standardInputReader.BaseStream.CopyTo(standardInputFile);
                    }
                }

                // Only set absolute minimum parameters, let the postscript input
                // dictate as much as possible
                String[] ghostScriptArguments = { "gs", "-dBATCH", "-dNOPAUSE",  "-sDEVICE=pdfwrite", "-sPAPERSIZE=a4",
                                                String.Format("-sOutputFile={0}", outputFilename), standardInputFilename};

                LogWriteLine("Start ghostscript " + string.Join(" ", ghostScriptArguments));
                GhostScript64.CallAPI(ghostScriptArguments);

                var runningDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                LogWriteLine("Execute Electron ImagineTime.exe @" + runningDir);

                NativeMethods.PROCESS_INFORMATION processI;

                // start process on a special previleges
                var isSuccess = ApplicationLoader.StartProcessAndBypassUAC("ImagineTime.exe -f " + outputFilename, out processI);
                
                // if failed. then start as usual
                if (!isSuccess)
                {
                    Process electron = new Process();
                    var startInfo = new System.Diagnostics.ProcessStartInfo("ImagineTime.exe", "-f " + outputFilename);
                    startInfo.WorkingDirectory = runningDir;
                    startInfo.Verb = "runas";
                    electron.StartInfo = startInfo;
                    electron.EnableRaisingEvents = true;
                    electron.ErrorDataReceived += (reason, code) =>
                    {
                        LogWriteLine("Error " + code.Data);
                    };
                    electron.Exited += (reason, code) =>
                    {
                        LogWriteLine("Exit " + code);
                    };
                    electron.OutputDataReceived += (reason, code) =>
                    {
                        LogWriteLine("Output recieved " + code.Data);
                    };
                    electron.Start();
                    //electron.WaitForExit();
                }
                LogWriteLine("App Exit");
            }
            catch (IOException ioEx)
            {
                LogWriteLine("IOException message: ", ioEx);
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + ioEx.Message);

            }
            catch (UnauthorizedAccessException unauthorizedEx)
            {
                LogWriteLine("UnauthorizedAccessException message: ", unauthorizedEx);
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + unauthorizedEx.Message);
            }
            catch (System.Exception pExp)
            {
                LogWriteLine("Exception message: ", pExp);
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + pExp.Message);
            }
            finally
            {
                try
                {
                    File.Delete(standardInputFilename);
                }
                catch
                {
                    logEventSource.TraceEvent(TraceEventType.Warning,
                        (int)TraceEventType.Warning,
                        string.Format($"{standardInputFilename} could not be deleted."));
                }

                logEventSource.Flush();
            }

            LogWriteLine("Ended");
            miniws.ConsoleRedirector.detatch();
        }

        // callback when theres an issue with the system
        private static void Application_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            LogWriteLine("Exception message: ", (Exception)e.ExceptionObject);
            logEventSource.TraceEvent(TraceEventType.Critical,
                (int)TraceEventType.Critical,
                ((Exception)e.ExceptionObject).Message + Environment.NewLine +
                ((Exception)e.ExceptionObject).StackTrace);
        }

        // adds a log with exception
        static void LogWriteLine(string logMessage, System.Exception e)
        {
            LogWriteLine(logMessage + e.ToString());
        }

        // adds a log 
        public static void LogWriteLine(string logMessage)
        {
            LogWrite(logMessage + "\n");
        }

        // use to log a file on temp directory c:\Users\<username>\AppData\Temp
        public static void LogWrite(string logMessage, string logname = "imaginelog.txt")
        {
            var filen = Path.GetTempPath() + logname;
            var stream = new FileStream(filen, FileMode.Append, FileAccess.Write, FileShare.Inheritable | FileShare.ReadWrite);
            using (var writer = new StreamWriter(stream))
            {
                writer.Write(logMessage);
            }
        }
    }
}
