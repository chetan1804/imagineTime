using System;
using System.Diagnostics;
using System.IO;

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

                GhostScript64.CallAPI(ghostScriptArguments);

                Process electron = new Process();
                electron.StartInfo.FileName = "ImagineTime.exe";
                electron.StartInfo.Arguments = "-f " +  outputFilename;
                electron.EnableRaisingEvents = true;
                electron.Start();
                electron.WaitForExit();
            }
            catch (IOException ioEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + ioEx.Message);
            }
            catch (UnauthorizedAccessException unauthorizedEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + unauthorizedEx.Message);
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
    }
}
