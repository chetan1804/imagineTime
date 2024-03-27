using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

namespace ImagineTimePrint
{
    class Program
    {
        private const string errorDialogCouldNotWrite = "Could not create the output file.";

        private const string traceSourceName = "ImagineTimePrint";

        private static readonly TraceSource logEventSource = new TraceSource(traceSourceName);

        static void Main(string[] args)
        {
            var standardInputFilename = Path.GetTempFileName();
            var outputFilename = Path.GetTempFileName();
            LogWrite("************************");
            LogWrite("Print started. Output file @ " + outputFilename);

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
                String[] ghostScriptArguments = { "-dBATCH", "-dNOPAUSE", "-dSAFER",  "-sDEVICE=pdfwrite",
                                                String.Format("-sOutputFile={0}", outputFilename), standardInputFilename,
                                                "-c", @"[/Creator(PdfScribe 1.0.7 (PSCRIPT5)) /DOCINFO pdfmark", "-f"};

                LogWrite("Start ghostscript " + string.Join(' ', ghostScriptArguments));
                GhostScript64.CallAPI(ghostScriptArguments);

                LogWrite("Execute Electron ImagineTime.exe");
                /*
                Process electron = new Process();
                electron.StartInfo.FileName = "ImagineTime.exe";
                electron.StartInfo.Arguments = "-f " + outputFilename;
                electron.EnableRaisingEvents = true;
                electron.Start();
                electron.WaitForExit();
                */
                LogWrite("App Exit");
            }
            catch (IOException ioEx)
            {
                LogWrite("Exception message: " + ioEx.Message);
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + ioEx.Message);
            }
            catch (UnauthorizedAccessException unauthorizedEx)
            {
                LogWrite("Exception message: " + unauthorizedEx.Message);
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + unauthorizedEx.Message);
            }
            catch (System.Exception pExp)
            {
                LogWrite("Exception message: " + pExp.Message);
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
                    File.Delete(outputFilename);
                }
                catch
                {
                    logEventSource.TraceEvent(TraceEventType.Warning,
                        (int)TraceEventType.Warning,
                        string.Format($"{standardInputFilename} could not be deleted."));
                }

                logEventSource.Flush();
            }
        }

        private static void Application_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            logEventSource.TraceEvent(TraceEventType.Critical,
                (int)TraceEventType.Critical,
                ((Exception)e.ExceptionObject).Message + Environment.NewLine +
                ((Exception)e.ExceptionObject).StackTrace);
        }

        static void LogWrite(string logMessage)
        {
            var m_exePath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            File.AppendAllText("imagetimelog.txt", logMessage + Environment.NewLine);
        }
    }
}
