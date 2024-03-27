using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace ImagineTime
{
    public class Program
    {
        private const string errorDialogCaption = "ImagineTime";
        private const string errorDialogNotAuthenticated = "User is not authenticated.";
        private const string errorDialogCouldNotWrite = "Could not create the output file.";
        private const string errorDialogUnexpectedError = "There was an internal error. Enable tracing for details.";

        private const string traceSourceName = "ImagineTime";

        private static readonly TraceSource logEventSource = new TraceSource(traceSourceName);

        [STAThread]
        private static void Main(string[] args)
        {
            Application.EnableVisualStyles();

            AppDomain.CurrentDomain.UnhandledException += Application_UnhandledException;

            var filename = Path.GetTempFileName();

            try
            {
                // Create a temporary file from the incoming printer data. This file is then directly
                // uploaded via the API.
                using (var standardInputReader = new BinaryReader(Console.OpenStandardInput()))
                {
                    using (var standardInputFile = new FileStream(filename, FileMode.Create, FileAccess.ReadWrite))
                    {
                        standardInputReader.BaseStream.CopyTo(standardInputFile);
                    }
                }

                // This code uses a sequence of popup dialogs to collect the user authentication and
                // profile information. This is a design chosen over using a single application with
                // windows since it allows more flexibility for when and what needs to be shown from
                // a background printer process. For example, using the different popups makes it easy
                // if we need to ask the user to choose which firm to use each time.

                // Check if the user has authenticated and show the login form if not.
                if (!Service.HasAuthenticated())
                {
                    using (var form = new LoginForm())
                    {
                        Application.Run(form);
                    }
                }
                // else fall through
                
                // Check authentication again. If the user cancelled or the authentication failed for
                // some reason then show an error and end the print job. Otherwise, check if the user
                // has chose a firm (profile) yet. Prompt and continue as needed.
                if (!Service.HasAuthenticated())
                {
                    logEventSource.TraceEvent(TraceEventType.Error,
                        (int)TraceEventType.Error,
                        errorDialogNotAuthenticated);

                    DisplayErrorMessage(errorDialogCaption,
                        errorDialogNotAuthenticated);
                }
                else if (!Service.HasSelectedFirm())
                {
                    var user = Service.LoadUser();

                    using (var form = new SelectFirmForm(user))
                    {
                        Application.Run(form);
                    }
                }
                // else fail through
                
                // Check if the user has authenticated and that we have the proper profile data. If
                // not then again error and end the print job. Otherwise, show the upload dialog and
                // start uploading.
                if (!Service.HasAuthenticated() && !Service.HasSelectedFirm())
                {
                    logEventSource.TraceEvent(TraceEventType.Error,
                        (int)TraceEventType.Error,
                        errorDialogNotAuthenticated);

                    DisplayErrorMessage(errorDialogCaption,
                        errorDialogNotAuthenticated);
                }
                else
                {
                    var firm = Service.LoadFirm();
                    var user = Service.LoadUser();

                    using (var form = new UploadForm(user, firm))
                    {
                        Application.Run(form);
                    }
                }
            }
            catch (IOException ioEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + ioEx.Message);

                DisplayErrorMessage(errorDialogCaption,
                    errorDialogCouldNotWrite + Environment.NewLine +
                    string.Format($"{filename} is in use."));
            }
            catch (UnauthorizedAccessException unauthorizedEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    errorDialogCouldNotWrite +
                    Environment.NewLine +
                    "Exception message: " + unauthorizedEx.Message);

                DisplayErrorMessage(errorDialogCaption,
                    errorDialogCouldNotWrite + Environment.NewLine +
                    string.Format($"Insufficient privileges to either create or delete {filename}"));
            }
            finally
            {
                try
                {
                    File.Delete(filename);
                }
                catch
                {
                    logEventSource.TraceEvent(TraceEventType.Warning,
                        (int) TraceEventType.Warning,
                        string.Format($"{filename} could not be deleted."));
                }

                logEventSource.Flush();
            }
        }

        private static void Application_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            logEventSource.TraceEvent(TraceEventType.Critical,
                (int) TraceEventType.Critical,
                ((Exception) e.ExceptionObject).Message + Environment.NewLine +
                ((Exception) e.ExceptionObject).StackTrace);

            DisplayErrorMessage(errorDialogCaption,
                errorDialogUnexpectedError);
        }

        private static void DisplayErrorMessage(string boxCaption,
            string boxMessage)
        {
            MessageBox.Show(boxMessage,
                boxCaption,
                MessageBoxButtons.OK,
                MessageBoxIcon.Error,
                MessageBoxDefaultButton.Button1,
                MessageBoxOptions.DefaultDesktopOnly);
        }
    }
}