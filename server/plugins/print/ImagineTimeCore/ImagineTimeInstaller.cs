using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security;
using System.Text;
using Microsoft.Win32;

namespace ImagineTimeCore
{
    public class ImagineTimeInstaller
    {
        private const uint DRIVER_KERNELMODE = 0x00000001;
        private const uint DRIVER_USERMODE = 0x00000002;

        private const uint APD_STRICT_UPGRADE = 0x00000001;
        private const uint APD_STRICT_DOWNGRADE = 0x00000002;
        private const uint APD_COPY_ALL_FILES = 0x00000004;
        private const uint APD_COPY_NEW_FILES = 0x00000008;
        private const uint APD_COPY_FROM_DIRECTORY = 0x00000010;

        private const uint DPD_DELETE_UNUSED_FILES = 0x00000001;
        private const uint DPD_DELETE_SPECIFIC_VERSION = 0x00000002;
        private const uint DPD_DELETE_ALL_FILES = 0x00000004;

        private const int WIN32_FILE_ALREADY_EXISTS = 183; // Returned by XcvData "AddPort" if the port already exists

        private const string ENVIRONMENT_64 = "Windows x64";
        private const string PRINTERNAME = "ImagineTime Secure Print";
        private const string DRIVERNAME = "ImagineTime Secure Printer";
        private const string HARDWAREID = "ImagineTime_Driver0101";
        private const string PORTMONITOR = "IMAGINETIME";
        private const string MONITORDLL = "redmon64it.dll";
        private const string PORTNAME = "IMGTME:";
        private const string PRINTPROCESOR = "winprint";

        private const string DRIVERMANUFACTURER = "ImagineTime";

        private const string DRIVERFILE = "PSCRIPT5.DLL";
        private const string DRIVERUIFILE = "PS5UI.DLL";
        private const string DRIVERHELPFILE = "PSCRIPT.HLP";
        private const string DRIVERDATAFILE = "SCPDFPRN.PPD";

        private const string FILENOTDELETED_INUSE = "{0} is being used by another process. File was not deleted.";

        private const string FILENOTDELETED_UNAUTHORIZED =
            "{0} is read-only, or its file permissions do not allow for deletion.";

        private const string FILENOTCOPIED_PRINTERDRIVER = "Printer driver file was not copied. Exception message: {0}";

        private const string FILENOTCOPIED_ALREADYEXISTS =
            "Destination file {0} was not copied/created - it already exists.";

        private const string WIN32ERROR = "Win32 error code {0}.";

        private const string NATIVE_COULDNOTENABLE64REDIRECTION = "Could not enable 64-bit file system redirection.";
        private const string NATIVE_COULDNOTREVERT64REDIRECTION = "Could not revert 64-bit file system redirection.";

        private const string INSTALL_ROLLBACK_FAILURE_AT_FUNCTION =
            "Partial uninstallation failure. Function {0} returned false.";

        private const string REGISTRYCONFIG_NOT_ADDED =
            "Could not add port configuration to registry. Exception message: {0}";

        private const string REGISTRYCONFIG_NOT_DELETED =
            "Could not delete port configuration from registry. Exception message: {0}";

        private const string INFO_INSTALLPORTMONITOR_FAILED = "Port monitor installation failed.";
        private const string INFO_INSTALLCOPYDRIVER_FAILED = "Could not copy printer driver files.";
        private const string INFO_INSTALLPORT_FAILED = "Could not add redirected port.";
        private const string INFO_INSTALLPRINTERDRIVER_FAILED = "Printer driver installation failed.";
        private const string INFO_INSTALLPRINTER_FAILED = "Could not add printer.";
        private const string INFO_INSTALLCONFIGPORT_FAILED = "Port configuration failed.";

        private readonly TraceSource logEventSource;
        private readonly string logEventSourceNameDefault = "ImagineTimeCore";
        private readonly string[] printerDriverDependentFiles = {"PSCRIPT.NTF"};

        private readonly string[] printerDriverFiles = {DRIVERFILE, DRIVERUIFILE, DRIVERHELPFILE, DRIVERDATAFILE};

        public ImagineTimeInstaller()
        {
            logEventSource = new TraceSource(logEventSourceNameDefault)
            {
                Switch = new SourceSwitch("ImagineTimeCoreAll")
                {
                    Level = SourceLevels.All
                }
            };
        }

        public void AddTraceListener(TraceListener additionalListener)
        {
            logEventSource.Listeners.Add(additionalListener);
        }

        private bool AddPort()
        {
            var portAdded = false;

            var portAddResult = DoXcvDataPortOperation(PORTNAME, PORTMONITOR, "AddPort");

            switch (portAddResult)
            {
                case 0:
                case WIN32_FILE_ALREADY_EXISTS: // Port already exists - this is OK, we'll just keep using it
                    portAdded = true;
                    break;
            }

            return portAdded;
        }

        public bool DeletePort()
        {
            var portDeleted = false;

            var portDeleteResult = DoXcvDataPortOperation(PORTNAME, PORTMONITOR, "DeletePort");

            switch (portDeleteResult)
            {
                case 0:
                    portDeleted = true;
                    break;
            }

            return portDeleted;
        }

        private int DoXcvDataPortOperation(string portName, string portMonitor, string xcvDataOperation)
        {
            int win32ErrorCode;

            var printerDefaults = new PRINTER_DEFAULTS
            {
                pDatatype = null,
                pDevMode = IntPtr.Zero,
                DesiredAccess = 1 //Server Access Administer
            };

            var printerHandle = IntPtr.Zero;

            if (NativeMethods.OpenPrinter(",XcvMonitor " + portMonitor, ref printerHandle, printerDefaults) != 0)
            {
                if (!portName.EndsWith("\0")) portName += "\0"; // Must be a null terminated string

                var size = (uint) (portName.Length * 2);

                var portPtr = Marshal.AllocHGlobal((int) size);
                Marshal.Copy(portName.ToCharArray(), 0, portPtr, portName.Length);

                uint needed; // Not that needed in fact...
                uint xcvResult; // Will receive de result here

                NativeMethods.XcvData(printerHandle, xcvDataOperation, portPtr, size, IntPtr.Zero, 0, out needed,
                    out xcvResult);

                NativeMethods.ClosePrinter(printerHandle);
                Marshal.FreeHGlobal(portPtr);
                win32ErrorCode = (int) xcvResult;
            }
            else
            {
                win32ErrorCode = Marshal.GetLastWin32Error();
            }

            return win32ErrorCode;
        }

        public bool AddPortMonitor(string monitorFilePath)
        {
            var monitorAdded = false;

            var oldRedirectValue = IntPtr.Zero;

            try
            {
                oldRedirectValue = DisableWow64Redirection();
                if (!DoesMonitorExist(PORTMONITOR))
                {
                    var fileSourcePath = Path.Combine(monitorFilePath, MONITORDLL);
                    var fileDestinationPath = Path.Combine(Environment.SystemDirectory, MONITORDLL);

                    try
                    {
                        File.Copy(fileSourcePath, fileDestinationPath, true);
                    }
                    catch (IOException)
                    {
                        // ignore
                    }

                    var newMonitor = new MONITOR_INFO_2
                    {
                        pName = PORTMONITOR,
                        pEnvironment = ENVIRONMENT_64,
                        pDLLName = MONITORDLL
                    };

                    if (!AddPortMonitor(newMonitor))
                        logEventSource.TraceEvent(TraceEventType.Error,
                            (int) TraceEventType.Error,
                            string.Format("Could not add port monitor {0}", PORTMONITOR) + Environment.NewLine +
                            string.Format(WIN32ERROR, Marshal.GetLastWin32Error().ToString()));
                    else
                        monitorAdded = true;
                }
                else
                {
                    logEventSource.TraceEvent(TraceEventType.Warning,
                        (int) TraceEventType.Warning,
                        string.Format("Port monitor {0} already installed.", PORTMONITOR));
                    monitorAdded = true;
                }
            }
            finally
            {
                if (oldRedirectValue != IntPtr.Zero) RevertWow64Redirection(oldRedirectValue);
            }

            return monitorAdded;
        }

        private IntPtr DisableWow64Redirection()
        {
            var oldValue = IntPtr.Zero;

            if (Environment.Is64BitOperatingSystem && !Environment.Is64BitProcess)
            {
                if (!NativeMethods.Wow64DisableWow64FsRedirection(ref oldValue))
                {
                    throw new Win32Exception(Marshal.GetLastWin32Error(),
                        "Could not disable Wow64 file system redirection.");
                }
            }

            return oldValue;
        }

        private void RevertWow64Redirection(IntPtr oldValue)
        {
            if (Environment.Is64BitOperatingSystem && !Environment.Is64BitProcess)
            {
                if (!NativeMethods.Wow64RevertWow64FsRedirection(oldValue))
                {
                    throw new Win32Exception(Marshal.GetLastWin32Error(),
                        "Could not reenable Wow64 file system redirection.");
                }
            }
        }

        public bool RemovePortMonitor()
        {
            var monitorRemoved = false;
            if (NativeMethods.DeleteMonitor(null, ENVIRONMENT_64, PORTMONITOR) != 0)
            {
                monitorRemoved = true;

                if (!DeletePortMonitorDll())
                {
                    logEventSource.TraceEvent(TraceEventType.Warning,
                        (int) TraceEventType.Warning,
                        "Could not remove port monitor dll.");
                }
            }

            return monitorRemoved;
        }

        private bool DeletePortMonitorDll()
        {
            return DeletePortMonitorDll(MONITORDLL);
        }

        private bool DeletePortMonitorDll(string monitorDll)
        {
            var monitorDllRemoved = false;

            var monitorDllFullPathname = string.Empty;
            var oldRedirectValue = IntPtr.Zero;
            try
            {
                oldRedirectValue = DisableWow64Redirection();

                monitorDllFullPathname = Path.Combine(Environment.SystemDirectory, monitorDll);

                File.Delete(monitorDllFullPathname);
                monitorDllRemoved = true;
            }
            catch (Win32Exception windows32Ex)
            {
                logEventSource.TraceEvent(TraceEventType.Critical,
                    (int) TraceEventType.Critical,
                    NATIVE_COULDNOTENABLE64REDIRECTION +
                    string.Format(WIN32ERROR, windows32Ex.NativeErrorCode.ToString()));
                throw;
            }
            catch (IOException)
            {
                // File still in use
                logEventSource.TraceEvent(TraceEventType.Error, (int) TraceEventType.Error,
                    string.Format(FILENOTDELETED_INUSE, monitorDllFullPathname));
            }
            catch (UnauthorizedAccessException)
            {
                // File is readonly, or file permissions do not allow delete
                logEventSource.TraceEvent(TraceEventType.Error, (int) TraceEventType.Error,
                    string.Format(FILENOTDELETED_INUSE, monitorDllFullPathname));
            }
            finally
            {
                try
                {
                    if (oldRedirectValue != IntPtr.Zero) RevertWow64Redirection(oldRedirectValue);
                }
                catch (Win32Exception windows32Ex)
                {
                    // Couldn't turn file redirection back on -
                    // this is not good
                    logEventSource.TraceEvent(TraceEventType.Critical,
                        (int) TraceEventType.Critical,
                        NATIVE_COULDNOTREVERT64REDIRECTION +
                        string.Format(WIN32ERROR, windows32Ex.NativeErrorCode.ToString()));
                    throw;
                }
            }

            return monitorDllRemoved;
        }

        private bool AddPortMonitor(MONITOR_INFO_2 newMonitor)
        {
            return NativeMethods.AddMonitor(null, 2, ref newMonitor) != 0;
        }

        private bool DeletePortMonitor(string monitorName)
        {
            return NativeMethods.DeleteMonitor(null, ENVIRONMENT_64, monitorName) != 0;
        }

        private bool DoesMonitorExist(string monitorName)
        {
            var monitorExists = false;
            var portMonitors = EnumerateMonitors();

            foreach (var portMonitor in portMonitors)
                if (portMonitor.pName == monitorName)
                {
                    monitorExists = true;
                    break;
                }

            return monitorExists;
        }


        public List<MONITOR_INFO_2> EnumerateMonitors()
        {
            var portMonitors = new List<MONITOR_INFO_2>();

            uint pcbNeeded = 0;
            uint pcReturned = 0;

            if (!NativeMethods.EnumMonitors(null, 2, IntPtr.Zero, 0, ref pcbNeeded, ref pcReturned))
            {
                var pMonitors = Marshal.AllocHGlobal((int) pcbNeeded);
                if (NativeMethods.EnumMonitors(null, 2, pMonitors, pcbNeeded, ref pcbNeeded, ref pcReturned))
                {
                    var currentMonitor = pMonitors;

                    for (var i = 0; i < pcReturned; i++)
                    {
                        portMonitors.Add(
                            (MONITOR_INFO_2) Marshal.PtrToStructure(currentMonitor, typeof(MONITOR_INFO_2)));
                        currentMonitor = IntPtr.Add(currentMonitor, Marshal.SizeOf(typeof(MONITOR_INFO_2)));
                    }

                    Marshal.FreeHGlobal(pMonitors);
                }
                else
                {
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not enumerate port monitors.");
                }
            }
            else
            {
                throw new Win32Exception(Marshal.GetLastWin32Error(),
                    "Call to EnumMonitors in winspool.drv succeeded with a zero size buffer - unexpected error.");
            }

            return portMonitors;
        }

        public string RetrievePrinterDriverDirectory()
        {
            var driverDirectory = new StringBuilder(1024);
            var dirSizeInBytes = 0;

            if (!NativeMethods.GetPrinterDriverDirectory(null,
                null,
                1,
                driverDirectory,
                1024,
                ref dirSizeInBytes))
                throw new DirectoryNotFoundException("Could not retrieve printer driver directory.");

            return driverDirectory.ToString();
        }

        public bool InstallPrinter(string driverSourceDirectory,
            string outputHandlerCommand,
            string outputHandlerArguments)
        {
            var printerInstalled = false;

            var undoInstallActions = new Stack<undoInstall>();

            var driverDirectory = RetrievePrinterDriverDirectory();

            undoInstallActions.Push(DeletePortMonitorDll);

            if (AddPortMonitor(driverSourceDirectory))
            {
                logEventSource.TraceEvent(TraceEventType.Verbose,
                    (int) TraceEventType.Verbose,
                    "Port monitor successfully installed.");
                undoInstallActions.Push(RemovePortMonitor);

                if (CopyPrinterDriverFiles(driverSourceDirectory,
                    printerDriverFiles.Concat(printerDriverDependentFiles).ToArray()))
                {
                    logEventSource.TraceEvent(TraceEventType.Verbose,
                        (int) TraceEventType.Verbose,
                        "Printer drivers copied or already exist.");
                    undoInstallActions.Push(RemovePortMonitor);

                    if (AddPort())
                    {
                        logEventSource.TraceEvent(TraceEventType.Verbose,
                            (int) TraceEventType.Verbose,
                            "Redirection port added.");
                        undoInstallActions.Push(RemovePrinterDriver);

                        if (InstallPrinterDriver())
                        {
                            logEventSource.TraceEvent(TraceEventType.Verbose,
                                (int) TraceEventType.Verbose,
                                "Printer driver installed.");
                            undoInstallActions.Push(DeletePrinter);
                            if (AddPrinter())
                            {
                                logEventSource.TraceEvent(TraceEventType.Verbose,
                                    (int) TraceEventType.Verbose,
                                    "Virtual printer installed.");
                                undoInstallActions.Push(RemovePortConfig);
                                if (ConfigureImagineTimePort(outputHandlerCommand, outputHandlerArguments))
                                {
                                    logEventSource.TraceEvent(TraceEventType.Verbose,
                                        (int) TraceEventType.Verbose,
                                        "Printer configured.");
                                    printerInstalled = true;
                                }
                                else
                                {
                                    logEventSource.TraceEvent(TraceEventType.Error,
                                        (int) TraceEventType.Error,
                                        INFO_INSTALLCONFIGPORT_FAILED);
                                }
                            }
                            else
                            {
                                logEventSource.TraceEvent(TraceEventType.Error,
                                    (int) TraceEventType.Error,
                                    INFO_INSTALLPRINTER_FAILED);
                            }
                        }
                        else
                        {
                            logEventSource.TraceEvent(TraceEventType.Error,
                                (int) TraceEventType.Error,
                                INFO_INSTALLPRINTERDRIVER_FAILED);
                        }
                    }
                    else
                    {
                        logEventSource.TraceEvent(TraceEventType.Error,
                            (int) TraceEventType.Error,
                            INFO_INSTALLPORT_FAILED);
                    }
                }
                else
                {
                    logEventSource.TraceEvent(TraceEventType.Error,
                        (int) TraceEventType.Error,
                        INFO_INSTALLCOPYDRIVER_FAILED);
                }
            }
            else
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    INFO_INSTALLPORTMONITOR_FAILED);
            }

            if (printerInstalled == false)
                while (undoInstallActions.Count > 0)
                {
                    var undoAction = undoInstallActions.Pop();
                    try
                    {
                        if (!undoAction())
                            logEventSource.TraceEvent(TraceEventType.Error,
                                (int) TraceEventType.Error,
                                string.Format(INSTALL_ROLLBACK_FAILURE_AT_FUNCTION, undoAction.Method.Name));
                    }
                    catch (Win32Exception win32Ex)
                    {
                        logEventSource.TraceEvent(TraceEventType.Error,
                            (int) TraceEventType.Error,
                            string.Format(INSTALL_ROLLBACK_FAILURE_AT_FUNCTION, undoAction.Method.Name) +
                            string.Format(WIN32ERROR, win32Ex.ErrorCode.ToString()));
                    }
                }

            logEventSource.Flush();

            return printerInstalled;
        }

        public bool UninstallPrinter()
        {
            return DeletePrinter() &&
                   RemovePrinterDriver() &&
                   DeletePort() &&
                   RemovePortMonitor() &&
                   RemovePortConfig() &&
                   DeletePortMonitorDll();
        }

        private bool CopyPrinterDriverFiles(string driverSourceDirectory, string[] filesToCopy)
        {
            var filesCopied = false;

            var driverDestinationDirectory = RetrievePrinterDriverDirectory();

            try
            {
                foreach (var file in filesToCopy)
                {
                    var fileSourcePath = Path.Combine(driverSourceDirectory, file);
                    var fileDestinationPath = Path.Combine(driverDestinationDirectory, file);

                    try
                    {
                        File.Copy(fileSourcePath, fileDestinationPath);
                    }
                    catch (PathTooLongException)
                    {
                        throw;
                    }
                    catch (DirectoryNotFoundException)
                    {
                        throw;
                    }
                    catch (FileNotFoundException)
                    {
                        throw;
                    }
                    catch (IOException)
                    {
                        logEventSource.TraceEvent(TraceEventType.Verbose,
                            (int) TraceEventType.Verbose,
                            string.Format(FILENOTCOPIED_ALREADYEXISTS, fileDestinationPath));
                    }
                }

                filesCopied = true;
            }
            catch (IOException ioEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    string.Format(FILENOTCOPIED_PRINTERDRIVER, ioEx.Message));
            }
            catch (UnauthorizedAccessException unauthorizedEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    string.Format(FILENOTCOPIED_PRINTERDRIVER, unauthorizedEx.Message));
            }
            catch (NotSupportedException notSupportedEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    string.Format(FILENOTCOPIED_PRINTERDRIVER, notSupportedEx.Message));
            }

            return filesCopied;
        }

        private bool DeletePrinterDriverFiles(string driverSourceDirectory, string[] filesToDelete)
        {
            var filesDeleted = true;

            foreach (var file in filesToDelete)
                try
                {
                    File.Delete(Path.Combine(driverSourceDirectory, file));
                }
                catch
                {
                    filesDeleted = false;
                }

            return filesDeleted;
        }

        private bool IsPrinterDriverInstalled(string driverName)
        {
            var driverInstalled = false;

            var installedDrivers = EnumeratePrinterDrivers();

            foreach (var printerDriver in installedDrivers)
                if (printerDriver.pName == driverName)
                {
                    driverInstalled = true;
                    break;
                }

            return driverInstalled;
        }

        public List<DRIVER_INFO_6> EnumeratePrinterDrivers()
        {
            var installedPrinterDrivers = new List<DRIVER_INFO_6>();

            uint pcbNeeded = 0;
            uint pcReturned = 0;

            if (!NativeMethods.EnumPrinterDrivers(null, ENVIRONMENT_64, 6, IntPtr.Zero, 0, ref pcbNeeded,
                ref pcReturned))
            {
                var pDrivers = Marshal.AllocHGlobal((int) pcbNeeded);
                if (NativeMethods.EnumPrinterDrivers(null, ENVIRONMENT_64, 6, pDrivers, pcbNeeded, ref pcbNeeded,
                    ref pcReturned))
                {
                    var currentDriver = pDrivers;
                    for (var loop = 0; loop < pcReturned; loop++)
                    {
                        installedPrinterDrivers.Add(
                            (DRIVER_INFO_6) Marshal.PtrToStructure(currentDriver, typeof(DRIVER_INFO_6)));
                        currentDriver = IntPtr.Add(currentDriver, Marshal.SizeOf(typeof(DRIVER_INFO_6)));
                    }

                    Marshal.FreeHGlobal(pDrivers);
                }
                else
                {
                    // Failed to enumerate printer drivers
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "Could not enumerate printer drivers.");
                }
            }
            else
            {
                throw new Win32Exception(Marshal.GetLastWin32Error(),
                    "Call to EnumPrinterDrivers in winspool.drv succeeded with a zero size buffer - unexpected error.");
            }

            return installedPrinterDrivers;
        }

        private bool InstallPrinterDriver()
        {
            var driverInstalled = false;

            if (!IsPrinterDriverInstalled(DRIVERNAME))
            {
                var driverSourceDirectory = RetrievePrinterDriverDirectory();

                var nullTerminatedDependentFiles = new StringBuilder();
                if (printerDriverDependentFiles.Length > 0)
                {
                    for (var loop = 0; loop <= printerDriverDependentFiles.GetUpperBound(0); loop++)
                    {
                        nullTerminatedDependentFiles.Append(printerDriverDependentFiles[loop]);
                        nullTerminatedDependentFiles.Append("\0");
                    }

                    nullTerminatedDependentFiles.Append("\0");
                }
                else
                {
                    nullTerminatedDependentFiles.Append("\0\0");
                }

                var printerDriverInfo = new DRIVER_INFO_6
                {
                    cVersion = 3,
                    pName = DRIVERNAME,
                    pEnvironment = ENVIRONMENT_64,
                    pDriverPath = Path.Combine(driverSourceDirectory, DRIVERFILE),
                    pConfigFile = Path.Combine(driverSourceDirectory, DRIVERUIFILE),
                    pHelpFile = Path.Combine(driverSourceDirectory, DRIVERHELPFILE),
                    pDataFile = Path.Combine(driverSourceDirectory, DRIVERDATAFILE),
                    pDependentFiles = nullTerminatedDependentFiles.ToString(),
                    pMonitorName = PORTMONITOR,
                    pDefaultDataType = string.Empty,
                    dwlDriverVersion = 0x0000000200000000U,
                    pszMfgName = DRIVERMANUFACTURER,
                    pszHardwareID = HARDWAREID,
                    pszProvider = DRIVERMANUFACTURER
                };

                driverInstalled = InstallPrinterDriver(ref printerDriverInfo);
            }
            else
            {
                driverInstalled = true; // Driver is already installed, we'll just use the installed driver
            }

            return driverInstalled;
        }

        private bool InstallPrinterDriver(ref DRIVER_INFO_6 printerDriverInfo)
        {
            var driverInstalled = NativeMethods.AddPrinterDriver(null, 6, ref printerDriverInfo);

            if (!driverInstalled)
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    "Could not add ImagineTime printer driver. " +
                    string.Format(WIN32ERROR, Marshal.GetLastWin32Error().ToString()));

            return driverInstalled;
        }


        public bool RemovePrinterDriver()
        {
            var driverRemoved =
                NativeMethods.DeletePrinterDriverEx(null, ENVIRONMENT_64, DRIVERNAME, DPD_DELETE_UNUSED_FILES, 3);

            if (!driverRemoved)
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    "Could not remove ImagineTime printer driver. " +
                    string.Format(WIN32ERROR, Marshal.GetLastWin32Error().ToString()));

            return driverRemoved;
        }

        private bool AddPrinter()
        {
            var printerAdded = false;

            var printerInfo = new PRINTER_INFO_2
            {
                pServerName = null,
                pPrinterName = PRINTERNAME,
                pPortName = PORTNAME,
                pDriverName = DRIVERNAME,
                pPrintProcessor = PRINTPROCESOR,
                pDatatype = "RAW",
                Attributes = 0x00000040
            };

            var printerHandle = NativeMethods.AddPrinter(null, 2, ref printerInfo);
            if (printerHandle != 0)
            {
                // Added ok
                var closeCode = NativeMethods.ClosePrinter((IntPtr) printerHandle);
                printerAdded = true;
            }
            else
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    "Could not add ImagineTime virtual printer. " +
                    string.Format(WIN32ERROR, Marshal.GetLastWin32Error().ToString()));
            }

            return printerAdded;
        }

        private bool DeletePrinter()
        {
            var printerDeleted = false;

            var printerDefaults = new PRINTER_DEFAULTS
            {
                DesiredAccess = 0x000F000C, // All access
                pDatatype = null,
                pDevMode = IntPtr.Zero
            };

            var printerHandle = IntPtr.Zero;
            try
            {
                if (NativeMethods.OpenPrinter(PRINTERNAME, ref printerHandle, printerDefaults) != 0)
                {
                    if (NativeMethods.DeletePrinter(printerHandle))
                        printerDeleted = true;
                }
                else
                {
                    logEventSource.TraceEvent(TraceEventType.Error,
                        (int) TraceEventType.Error,
                        "Could not delete ImagineTime virtual printer. " +
                        string.Format(WIN32ERROR, Marshal.GetLastWin32Error().ToString()));
                }
            }
            finally
            {
                if (printerHandle != IntPtr.Zero) NativeMethods.ClosePrinter(printerHandle);
            }

            return printerDeleted;
        }

        public bool IsPrinterInstalled()
        {
            var isInstalled = false;

            var printerDefaults = new PRINTER_DEFAULTS
            {
                DesiredAccess = 0x00008, // Use access
                pDatatype = null,
                pDevMode = IntPtr.Zero
            };

            var printerHandle = IntPtr.Zero;
            if (NativeMethods.OpenPrinter(PRINTERNAME, ref printerHandle, printerDefaults) != 0)
            {
                isInstalled = true;
            }
            else
            {
                var errorCode = Marshal.GetLastWin32Error();
                if (errorCode == 0x5) isInstalled = true;
            }

            return isInstalled;
        }

        private bool ConfigureImagineTimePort()
        {
            return ConfigureImagineTimePort(string.Empty, string.Empty);
        }

        private bool ConfigureImagineTimePort(string commandValue,
            string argumentsValue)
        {
            var registryChangesMade = false;


            RegistryKey portConfiguration;

            try
            {
                portConfiguration = Registry.LocalMachine.CreateSubKey(
                    "SYSTEM\\CurrentControlSet\\Control\\Print\\Monitors\\" +
                    PORTMONITOR +
                    "\\Ports\\" + PORTNAME);
                portConfiguration.SetValue("Description", "ImagineTime", RegistryValueKind.String);
                portConfiguration.SetValue("Command", commandValue, RegistryValueKind.String);
                portConfiguration.SetValue("Arguments", argumentsValue, RegistryValueKind.String);
                portConfiguration.SetValue("Printer", PRINTERNAME, RegistryValueKind.String);
                portConfiguration.SetValue("Output", 0, RegistryValueKind.DWord);
                portConfiguration.SetValue("ShowWindow", 0, RegistryValueKind.DWord);
                portConfiguration.SetValue("RunUser", 1, RegistryValueKind.DWord);
                portConfiguration.SetValue("Delay", 300, RegistryValueKind.DWord);
                portConfiguration.SetValue("LogFileUse", 0, RegistryValueKind.DWord);
                portConfiguration.SetValue("LogFileName", "", RegistryValueKind.String);
                portConfiguration.SetValue("LogFileDebug", 0, RegistryValueKind.DWord);
                portConfiguration.SetValue("PrintError", 0, RegistryValueKind.DWord);
                registryChangesMade = true;
            }

            catch (UnauthorizedAccessException unauthorizedEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    string.Format(REGISTRYCONFIG_NOT_ADDED, unauthorizedEx.Message));
            }
            catch (SecurityException securityEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    string.Format(REGISTRYCONFIG_NOT_ADDED, securityEx.Message));
            }

            return registryChangesMade;
        }

        private bool RemovePortConfig()
        {
            var registryEntriesRemoved = false;

            try
            {
                Registry.LocalMachine.DeleteSubKey("SYSTEM\\CurrentControlSet\\Control\\Print\\Monitors\\" +
                                                   PORTMONITOR + "\\Ports\\" + PORTNAME, false);
                registryEntriesRemoved = true;
            }
            catch (UnauthorizedAccessException unauthorizedEx)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int) TraceEventType.Error,
                    string.Format(REGISTRYCONFIG_NOT_DELETED, unauthorizedEx.Message));
            }

            return registryEntriesRemoved;
        }

        private enum DriverFileIndex
        {
            Min = 0,
            DriverFile = Min,
            UIFile,
            HelpFile,
            DataFile,
            Max = DataFile
        }


        private delegate bool undoInstall();
    }
}