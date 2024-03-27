using System.Diagnostics;
using ImagineTimeCore;
using Microsoft.Deployment.WindowsInstaller;

namespace ImagineTimeInstallCustomAction
{
    public class CustomActions
    {
        [CustomAction]
        public static ActionResult CheckIfPrinterCheckIfPrinterNotInstalled(Session session)
        {
            ActionResult resultCode;

            var installTraceListener = new SessionLogWriterTraceListener(session);

            var installer = new ImagineTimeInstaller();
            installer.AddTraceListener(installTraceListener);

            try
            {
                resultCode = installer.IsPrinterInstalled() ? ActionResult.Success : ActionResult.Failure;
            }
            finally
            {
                installTraceListener.Dispose();
            }

            return resultCode;
        }

        [CustomAction]
        public static ActionResult InstallImagineTimePrinter(Session session)
        {
            ActionResult printerInstalled;

            var driverSourceDirectory = session.CustomActionData["DriverSourceDirectory"];
            var outputCommand = session.CustomActionData["OutputCommand"];
            var outputCommandArguments = session.CustomActionData["OutputCommandArguments"];

            var installTraceListener = new SessionLogWriterTraceListener(session)
            {
                TraceOutputOptions = TraceOptions.DateTime
            };

            var installer = new ImagineTimeInstaller();
            installer.AddTraceListener(installTraceListener);

            try
            {
                printerInstalled = installer.InstallPrinter(driverSourceDirectory,
                    outputCommand,
                    outputCommandArguments)
                    ? ActionResult.Success
                    : ActionResult.Failure;

                installTraceListener.CloseAndWriteLog();
            }
            finally
            {
                installTraceListener.Dispose();
            }

            return printerInstalled;
        }

        [CustomAction]
        public static ActionResult UninstallImagineTimePrinter(Session session)
        {
            ActionResult printerUninstalled;

            var installTraceListener = new SessionLogWriterTraceListener(session)
            {
                TraceOutputOptions = TraceOptions.DateTime
            };

            var installer = new ImagineTimeInstaller();
            installer.AddTraceListener(installTraceListener);

            try
            {
                printerUninstalled = installer.UninstallPrinter()
                    ? ActionResult.Success
                    : ActionResult.Failure;

                installTraceListener.CloseAndWriteLog();
            }
            finally
            {
                installTraceListener.Dispose();
            }

            return printerUninstalled;
        }
    }
}